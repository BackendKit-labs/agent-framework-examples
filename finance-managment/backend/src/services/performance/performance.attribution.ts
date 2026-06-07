import { Injectable } from '@nestjs/common';

export interface TradeRecord {
  date: Date;
  symbol: string;
  side: 'buy' | 'sell';
  price: number;
  quantity: number;
  returnPercentage: number;
  signalSource: string; // 'manual', 'fusion', 'news', 'smart_money', etc.
}

export interface HoldingSnapshot {
  date: Date;
  symbol: string;
  allocation: number;
  returnPercentage: number;
  contribution: number;
}

export interface AgentPerformance {
  agentName: string;
  tradesFollowed: number;
  tradesAgainst: number;
  returnWhenFollowed: number;
  returnWhenIgnored: number;
  accuracy: number;
  totalSignalCount: number;
}

export interface AttributionBreakdown {
  marketMovement: number;
  assetAllocation: number;
  securitySelection: number;
  tradingActivity: number;
  taxImpact: number;
}

export interface AttributionReport {
  period: { from: string; to: string };
  totalReturn: number;
  benchmarkReturn: number;
  attribution: AttributionBreakdown;
  agentPerformance: AgentPerformance[];
  assetBreakdown: HoldingSnapshot[];
}

@Injectable()
export class PerformanceAttributionService {
  /**
   * Genera un reporte de atribución de rendimiento para un período
   */
  generateReport(params: {
    from: Date;
    to: Date;
    trades: TradeRecord[];
    holdings: HoldingSnapshot[];
    benchmarkReturns: number[];
    initialValue: number;
    finalValue: number;
  }): AttributionReport {
    const totalReturn = (params.finalValue - params.initialValue) / params.initialValue;
    const benchmarkReturn = params.benchmarkReturns.length > 0
      ? params.benchmarkReturns.reduce((s, r) => (1 + s) * (1 + r) - 1, 0)
      : 0;

    // 1. Market movement attribution
    const marketMovement = this.calculateMarketAttribution(params.holdings, params.benchmarkReturns);

    // 2. Asset allocation attribution
    const assetAllocation = this.calculateAllocationAttribution(params.holdings, params.benchmarkReturns);

    // 3. Security selection attribution
    const securitySelection = this.calculateSelectionAttribution(params.holdings, params.benchmarkReturns);

    // 4. Trading activity attribution
    const tradingActivity = this.calculateTradingAttribution(params.trades);

    // 5. Tax impact
    const taxImpact = this.calculateTaxImpact(params.trades);

    // 6. Agent performance
    const agentPerformance = this.calculateAgentPerformance(params.trades);

    return {
      period: {
        from: params.from.toISOString(),
        to: params.to.toISOString(),
      },
      totalReturn: Math.round(totalReturn * 10000) / 100,
      benchmarkReturn: Math.round(benchmarkReturn * 10000) / 100,
      attribution: {
        marketMovement: Math.round(marketMovement * 10000) / 100,
        assetAllocation: Math.round(assetAllocation * 10000) / 100,
        securitySelection: Math.round(securitySelection * 10000) / 100,
        tradingActivity: Math.round(tradingActivity * 10000) / 100,
        taxImpact: Math.round(taxImpact * 10000) / 100,
      },
      agentPerformance,
      assetBreakdown: params.holdings,
    };
  }

  /**
   * Atribución de movimiento de mercado: cuanto del retorno se explica por el mercado general
   */
  private calculateMarketAttribution(
    holdings: HoldingSnapshot[],
    benchmarkReturns: number[],
  ): number {
    if (holdings.length === 0 || benchmarkReturns.length === 0) return 0;

    const avgBenchmarkReturn = benchmarkReturns.reduce((s, r) => s + r, 0) / benchmarkReturns.length;
    const avgAllocation = holdings.reduce((s, h) => s + h.allocation, 0) / holdings.length;

    return avgAllocation * avgBenchmarkReturn;
  }

  /**
   * Atribución de asignación de activos: desviación del benchmark por sobre/Sub peso
   */
  private calculateAllocationAttribution(
    holdings: HoldingSnapshot[],
    benchmarkReturns: number[],
  ): number {
    if (holdings.length === 0) return 0;

    const avgBenchmarkReturn = benchmarkReturns.length > 0
      ? benchmarkReturns.reduce((s, r) => s + r, 0) / benchmarkReturns.length
      : 0;

    return holdings.reduce((sum, h) => {
      const allocationDeviation = h.allocation - (1 / holdings.length);
      return sum + allocationDeviation * (h.returnPercentage - avgBenchmarkReturn);
    }, 0);
  }

  /**
   * Atribución de selección de activos: retorno por encima del benchmark por activo
   */
  private calculateSelectionAttribution(
    holdings: HoldingSnapshot[],
    benchmarkReturns: number[],
  ): number {
    if (holdings.length === 0) return 0;

    const avgBenchmarkReturn = benchmarkReturns.length > 0
      ? benchmarkReturns.reduce((s, r) => s + r, 0) / benchmarkReturns.length
      : 0;

    return holdings.reduce((sum, h) => {
      const excessReturn = h.returnPercentage - avgBenchmarkReturn;
      return sum + h.allocation * excessReturn;
    }, 0);
  }

  /**
   * Atribución de actividad de trading: impacto de comisiones y timing
   */
  private calculateTradingAttribution(trades: TradeRecord[]): number {
    if (trades.length === 0) return 0;

    // Simplified: trading cost = 0.1% per trade (commission + slippage)
    const tradingCost = trades.length * 0.001;

    // Timing impact: difference between trade return and average return
    const avgReturn = trades.reduce((s, t) => s + t.returnPercentage, 0) / trades.length;
    const timingImpact = trades.reduce((sum, t) => sum + (t.returnPercentage - avgReturn), 0) / trades.length;

    return -(tradingCost + Math.abs(timingImpact));
  }

  /**
   * Impacto fiscal estimado
   */
  private calculateTaxImpact(trades: TradeRecord[]): number {
    if (trades.length === 0) return 0;

    // Simplified: 20% tax on short-term gains (< 1 year)
    const shortTermGains = trades
      .filter(t => t.side === 'sell' && t.returnPercentage > 0)
      .reduce((sum, t) => sum + t.returnPercentage * 0.20, 0);

    return -shortTermGains;
  }

  /**
   * Calcula rendimiento por agente
   */
  private calculateAgentPerformance(trades: TradeRecord[]): AgentPerformance[] {
    const agentGroups = new Map<string, TradeRecord[]>();

    for (const trade of trades) {
      const source = trade.signalSource || 'manual';
      if (!agentGroups.has(source)) agentGroups.set(source, []);
      agentGroups.get(source)!.push(trade);
    }

    const performances: AgentPerformance[] = [];

    for (const [agentName, agentTrades] of agentGroups) {
      const winningTrades = agentTrades.filter(t => t.returnPercentage > 0);
      const losingTrades = agentTrades.filter(t => t.returnPercentage <= 0);

      const returnWhenFollowed = agentTrades.reduce((s, t) => s + t.returnPercentage, 0) / agentTrades.length;
      const accuracy = agentTrades.length > 0 ? winningTrades.length / agentTrades.length : 0;

      performances.push({
        agentName,
        tradesFollowed: agentTrades.length,
        tradesAgainst: 0,
        returnWhenFollowed: Math.round(returnWhenFollowed * 10000) / 100,
        returnWhenIgnored: 0,
        accuracy: Math.round(accuracy * 10000) / 100,
        totalSignalCount: agentTrades.length,
      });
    }

    return performances.sort((a, b) => b.accuracy - a.accuracy);
  }
}
