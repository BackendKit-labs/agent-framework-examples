import { Injectable } from '@nestjs/common';

export interface AssetHistoricalData {
  symbol: string;
  returns: number[]; // Daily returns
  currentPrice: number;
}

export interface EfficientFrontierPoint {
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
  allocations: Record<string, number>;
}

export interface OptimizationResult {
  efficientFrontier: EfficientFrontierPoint[];
  maxSharpePortfolio: EfficientFrontierPoint;
  minVolatilityPortfolio: EfficientFrontierPoint;
  correlationMatrix: Record<string, Record<string, number>>;
}

@Injectable()
export class PortfolioOptimizerService {
  /**
   * Calcula la frontera eficiente de Markowitz
   */
  calculateEfficientFrontier(assets: AssetHistoricalData[], riskFreeRate = 0.05): OptimizationResult {
    const n = assets.length;
    const symbols = assets.map(a => a.symbol);

    // 1. Calculate expected returns (annualized)
    const expectedReturns = assets.map(a => {
      const avgDailyReturn = a.returns.reduce((s, r) => s + r, 0) / a.returns.length;
      return (1 + avgDailyReturn) ** 252 - 1; // Annualize
    });

    // 2. Calculate covariance matrix
    const covMatrix = this.calculateCovarianceMatrix(assets);

    // 3. Calculate correlation matrix
    const correlationMatrix = this.calculateCorrelationMatrix(assets);

    // 4. Generate efficient frontier
    const frontier: EfficientFrontierPoint[] = [];
    const steps = 50;

    for (let i = 0; i <= steps; i++) {
      const targetReturn = Math.min(...expectedReturns) + (Math.max(...expectedReturns) - Math.min(...expectedReturns)) * (i / steps);

      // Find optimal weights for this target return
      const weights = this.optimizeWeights(expectedReturns, covMatrix, targetReturn);
      if (!weights) continue;

      const portfolioReturn = expectedReturns.reduce((s, r, j) => s + r * weights[j], 0);
      const portfolioVariance = this.calculatePortfolioVariance(weights, covMatrix);
      const portfolioVol = Math.sqrt(portfolioVariance);
      const sharpeRatio = (portfolioReturn - riskFreeRate) / portfolioVol;

      const allocations: Record<string, number> = {};
      weights.forEach((w, j) => { allocations[symbols[j]] = Math.round(w * 10000) / 100; });

      frontier.push({
        expectedReturn: Math.round(portfolioReturn * 10000) / 100,
        volatility: Math.round(portfolioVol * 10000) / 100,
        sharpeRatio: Math.round(sharpeRatio * 1000) / 1000,
        allocations,
      });
    }

    // 5. Find key portfolios
    const maxSharpePortfolio = frontier.reduce((best, p) => p.sharpeRatio > best.sharpeRatio ? p : best, frontier[0]);
    const minVolatilityPortfolio = frontier.reduce((best, p) => p.volatility < best.volatility ? p : best, frontier[0]);

    return {
      efficientFrontier: frontier,
      maxSharpePortfolio,
      minVolatilityPortfolio,
      correlationMatrix,
    };
  }

  private calculateCovarianceMatrix(assets: AssetHistoricalData[]): number[][] {
    const n = assets.length;
    const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        matrix[i][j] = this.calculateCovariance(assets[i].returns, assets[j].returns);
      }
    }

    return matrix;
  }

  private calculateCovariance(returns1: number[], returns2: number[]): number {
    const n = Math.min(returns1.length, returns2.length);
    const mean1 = returns1.slice(0, n).reduce((s, r) => s + r, 0) / n;
    const mean2 = returns2.slice(0, n).reduce((s, r) => s + r, 0) / n;

    let cov = 0;
    for (let i = 0; i < n; i++) {
      cov += (returns1[i] - mean1) * (returns2[i] - mean2);
    }

    return cov / (n - 1);
  }

  private calculateCorrelationMatrix(assets: AssetHistoricalData[]): Record<string, Record<string, number>> {
    const n = assets.length;
    const symbols = assets.map(a => a.symbol);
    const matrix: Record<string, Record<string, number>> = {};

    for (let i = 0; i < n; i++) {
      matrix[symbols[i]] = {};
      for (let j = 0; j < n; j++) {
        const cov = this.calculateCovariance(assets[i].returns, assets[j].returns);
        const std1 = Math.sqrt(this.calculateVariance(assets[i].returns));
        const std2 = Math.sqrt(this.calculateVariance(assets[j].returns));
        matrix[symbols[i]][symbols[j]] = std1 * std2 > 0 ? Math.round((cov / (std1 * std2)) * 1000) / 1000 : 0;
      }
    }

    return matrix;
  }

  private calculateVariance(returns: number[]): number {
    const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
    return returns.reduce((s, r) => s + (r - mean) ** 2, 0) / (returns.length - 1);
  }

  private calculatePortfolioVariance(weights: number[], covMatrix: number[][]): number {
    let variance = 0;
    for (let i = 0; i < weights.length; i++) {
      for (let j = 0; j < weights.length; j++) {
        variance += weights[i] * weights[j] * covMatrix[i][j];
      }
    }
    return variance;
  }

  /**
   * Optimización de pesos para un retorno objetivo usando programación cuadrática simplificada
   */
  private optimizeWeights(
    expectedReturns: number[],
    covMatrix: number[][],
    targetReturn: number,
  ): number[] | null {
    const n = expectedReturns.length;
    let bestWeights: number[] | null = null;
    let bestVariance = Infinity;

    // Simple grid search for 2-5 assets (for larger portfolios, use proper QP solver)
    const steps = n <= 3 ? 20 : 10;

    const search = (weights: number[], idx: number, remaining: number) => {
      if (idx === n - 1) {
        weights[idx] = remaining;

        // Check constraints
        if (weights.some(w => w < 0 || w > 1)) return;
        if (Math.abs(weights.reduce((s, w) => s + w, 0) - 1) > 0.01) return;

        const portfolioReturn = expectedReturns.reduce((s, r, i) => s + r * weights[i], 0);
        if (Math.abs(portfolioReturn - targetReturn) > Math.abs(targetReturn) * 0.1) return;

        const variance = this.calculatePortfolioVariance(weights, covMatrix);
        if (variance < bestVariance) {
          bestVariance = variance;
          bestWeights = [...weights];
        }
        return;
      }

      for (let i = 0; i <= steps; i++) {
        const w = (remaining * i) / steps;
        weights[idx] = w;
        search(weights, idx + 1, remaining - w);
      }
    };

    search(new Array(n).fill(0), 0, 1);

    return bestWeights;
  }
}
