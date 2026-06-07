import { Injectable } from '@nestjs/common';

export interface RiskRules {
  maxSingleAssetAllocation: number;   // 20% por defecto
  maxSectorAllocation: number;        // 40% por sector
  defaultStopLoss: number;            // -15%
  defaultTakeProfit: number;          // +30%
  trailingStop: number;               // 10%
  maxDrawdown: number;                // -25%
  maxVar95: number;                   // 5%
  minCashReserve: number;             // 5%
  maxCorrelationExposure: number;     // 50%
}

export interface RiskCheckResult {
  passed: boolean;
  violations: Array<{
    rule: string;
    severity: 'CRITICAL' | 'WARNING' | 'INFO';
    message: string;
    currentValue: number;
    limitValue: number;
  }>;
}

export interface PortfolioHolding {
  symbol: string;
  sector?: string;
  value: number;
  allocation: number;
  returnPercentage: number;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
}

@Injectable()
export class RiskManagerService {
  private readonly DEFAULT_RULES: RiskRules = {
    maxSingleAssetAllocation: 0.20,
    maxSectorAllocation: 0.40,
    defaultStopLoss: -0.15,
    defaultTakeProfit: 0.30,
    trailingStop: 0.10,
    maxDrawdown: -0.25,
    maxVar95: 0.05,
    minCashReserve: 0.05,
    maxCorrelationExposure: 0.50,
  };

  private userRules: Map<string, Partial<RiskRules>> = new Map();

  getRules(userId?: string): RiskRules {
    return { ...this.DEFAULT_RULES, ...(userId ? this.userRules.get(userId) : {}) };
  }

  updateRules(userId: string, rules: Partial<RiskRules>): RiskRules {
    const existing = this.userRules.get(userId) || {};
    this.userRules.set(userId, { ...existing, ...rules });
    return this.getRules(userId);
  }

  /**
   * Valida una orden contra las reglas de riesgo antes de ejecutarla
   */
  validateOrder(
    order: { symbol: string; side: 'buy' | 'sell'; amount: number; price: number },
    portfolio: PortfolioHolding[],
    cashReserve: number,
    totalValue: number,
    userId?: string,
  ): RiskCheckResult {
    const rules = this.getRules(userId);
    const violations: RiskCheckResult['violations'] = [];

    if (order.side === 'buy') {
      // 1. Max single asset allocation
      const existingHolding = portfolio.find(h => h.symbol === order.symbol);
      const currentAllocation = existingHolding ? existingHolding.allocation : 0;
      const newAllocation = (currentAllocation * totalValue + order.amount * order.price) / totalValue;

      if (newAllocation > rules.maxSingleAssetAllocation) {
        violations.push({
          rule: 'maxSingleAssetAllocation',
          severity: 'CRITICAL',
          message: `Buying ${order.symbol} would result in ${(newAllocation * 100).toFixed(1)}% allocation (limit: ${(rules.maxSingleAssetAllocation * 100).toFixed(0)}%)`,
          currentValue: newAllocation,
          limitValue: rules.maxSingleAssetAllocation,
        });
      }

      // 2. Cash reserve
      const cost = order.amount * order.price;
      if (cashReserve - cost < totalValue * rules.minCashReserve) {
        violations.push({
          rule: 'minCashReserve',
          severity: 'WARNING',
          message: `Buy would reduce cash reserve below ${(rules.minCashReserve * 100).toFixed(0)}% minimum`,
          currentValue: (cashReserve - cost) / totalValue,
          limitValue: rules.minCashReserve,
        });
      }
    }

    if (order.side === 'sell') {
      // 3. Stop-loss check
      const holding = portfolio.find(h => h.symbol === order.symbol);
      if (holding) {
        const loss = (order.price - holding.averageBuyPrice) / holding.averageBuyPrice;
        if (loss < rules.defaultStopLoss) {
          violations.push({
            rule: 'defaultStopLoss',
            severity: 'WARNING',
            message: `Selling ${order.symbol} at ${(loss * 100).toFixed(1)}% loss exceeds stop-loss threshold of ${(rules.defaultStopLoss * 100).toFixed(0)}%`,
            currentValue: loss,
            limitValue: rules.defaultStopLoss,
          });
        }
      }
    }

    // 4. Max drawdown check (portfolio level)
    const portfolioReturn = portfolio.reduce((sum, h) => sum + h.returnPercentage * h.allocation, 0);
    if (portfolioReturn < rules.maxDrawdown) {
      violations.push({
        rule: 'maxDrawdown',
        severity: 'CRITICAL',
        message: `Portfolio drawdown of ${(portfolioReturn * 100).toFixed(1)}% exceeds limit of ${(rules.maxDrawdown * 100).toFixed(0)}%`,
        currentValue: portfolioReturn,
        limitValue: rules.maxDrawdown,
      });
    }

    return {
      passed: violations.filter(v => v.severity === 'CRITICAL').length === 0,
      violations,
    };
  }

  /**
   * Evalúa el riesgo general del portafolio
   */
  evaluatePortfolioRisk(portfolio: PortfolioHolding[], totalValue: number, userId?: string): RiskCheckResult {
    const rules = this.getRules(userId);
    const violations: RiskCheckResult['violations'] = [];

    // 1. Concentración por activo
    for (const holding of portfolio) {
      if (holding.allocation > rules.maxSingleAssetAllocation) {
        violations.push({
          rule: 'maxSingleAssetAllocation',
          severity: 'WARNING',
          message: `${holding.symbol} has ${(holding.allocation * 100).toFixed(1)}% allocation (limit: ${(rules.maxSingleAssetAllocation * 100).toFixed(0)}%)`,
          currentValue: holding.allocation,
          limitValue: rules.maxSingleAssetAllocation,
        });
      }
    }

    // 2. VaR simplificado (95% confidence)
    const var95 = this.calculateVaR(portfolio);
    if (var95 > rules.maxVar95) {
      violations.push({
        rule: 'maxVar95',
        severity: 'WARNING',
        message: `Portfolio VaR(95%) is ${(var95 * 100).toFixed(1)}% (limit: ${(rules.maxVar95 * 100).toFixed(0)}%)`,
        currentValue: var95,
        limitValue: rules.maxVar95,
      });
    }

    return {
      passed: violations.filter(v => v.severity === 'CRITICAL').length === 0,
      violations,
    };
  }

  /**
   * Calcula Value at Risk simplificado (95% confidence)
   * Usa desviación estándar de retornos como proxy
   */
  private calculateVaR(portfolio: PortfolioHolding[]): number {
    if (portfolio.length === 0) return 0;

    const returns = portfolio.map(h => h.returnPercentage);
    const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
    const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    // VaR(95%) = -1.645 * stdDev (simplificado)
    return Math.max(0, -1.645 * stdDev);
  }
}
