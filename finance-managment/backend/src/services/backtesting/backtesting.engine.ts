import { Injectable } from '@nestjs/common';

export interface BacktestSignal {
  date: Date;
  symbol: string;
  action: 'buy' | 'sell' | 'hold';
  price: number;
  confidence: number;
  source: string; // 'news', 'smart_money', 'fusion', etc.
}

export interface BacktestTrade {
  entryDate: Date;
  exitDate: Date | null;
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  returnPercentage: number;
  signalSource: string;
  status: 'open' | 'closed';
}

export interface BacktestMetrics {
  totalReturn: number;
  benchmarkReturn: number;
  alpha: number;
  beta: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  averageHoldingPeriod: number; // days
  averageWinReturn: number;
  averageLossReturn: number;
  profitFactor: number;
}

export interface BacktestResult {
  strategy: string;
  period: { from: string; to: string };
  benchmark: string;
  initialCapital: number;
  finalCapital: number;
  totalReturn: number;
  benchmarkReturn: number;
  metrics: BacktestMetrics;
  trades: BacktestTrade[];
  equityCurve: Array<{ date: string; value: number; benchmark: number }>;
}

const RISK_FREE_RATE_ANNUAL = 0.05;
const TRADING_DAYS_PER_YEAR = 252;

@Injectable()
export class BacktestingEngine {
  async runBacktest(params: {
    strategy: string;
    signals: BacktestSignal[];
    initialCapital?: number;
    benchmark?: string;
    benchmarkPrices?: Array<{ date: string; price: number }>;
    maxPositionSize?: number;
  }): Promise<BacktestResult> {
    const initialCapital = params.initialCapital ?? 100000;
    const maxPositionSize = params.maxPositionSize ?? 0.20;
    const sortedSignals = [...params.signals].sort((a, b) => a.date.getTime() - b.date.getTime());

    if (sortedSignals.length === 0) {
      return this.emptyResult(params.strategy, params.benchmark, initialCapital);
    }

    const sortedBenchmark = [...(params.benchmarkPrices ?? [])].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    const benchmarkLookup = new Map<string, number>();
    for (const bp of sortedBenchmark) {
      benchmarkLookup.set(bp.date.split('T')[0], bp.price);
    }
    const initialBenchmarkPrice = sortedBenchmark[0]?.price ?? 0;
    let lastBenchmarkPrice = initialBenchmarkPrice;

    let cashReserve = initialCapital;
    const trades: BacktestTrade[] = [];
    const equityCurve: Array<{ date: string; value: number; benchmark: number }> = [];
    const openPositions = new Map<string, BacktestTrade>();
    // Tracks the most recent price seen for each symbol to value open positions correctly
    const lastPriceBySymbol = new Map<string, number>();

    for (const signal of sortedSignals) {
      lastPriceBySymbol.set(signal.symbol, signal.price);

      // Current capital = cash + mark-to-market of all open positions at their own prices
      const currentCapital =
        cashReserve +
        Array.from(openPositions.entries()).reduce(
          (sum, [sym, t]) => sum + t.quantity * (lastPriceBySymbol.get(sym) ?? t.entryPrice),
          0,
        );

      if (signal.action === 'buy' && !openPositions.has(signal.symbol)) {
        const positionSize = currentCapital * maxPositionSize;
        const quantity = Math.floor(positionSize / signal.price);
        const cost = quantity * signal.price;

        if (quantity > 0 && cost <= cashReserve) {
          openPositions.set(signal.symbol, {
            entryDate: signal.date,
            exitDate: null,
            symbol: signal.symbol,
            side: 'long',
            entryPrice: signal.price,
            exitPrice: null,
            quantity,
            returnPercentage: 0,
            signalSource: signal.source,
            status: 'open',
          });
          cashReserve -= cost;
        }
      } else if (signal.action === 'sell' && openPositions.has(signal.symbol)) {
        const trade = openPositions.get(signal.symbol)!;
        trade.exitDate = signal.date;
        trade.exitPrice = signal.price;
        trade.returnPercentage = (signal.price - trade.entryPrice) / trade.entryPrice;
        trade.status = 'closed';
        cashReserve += trade.quantity * signal.price;
        openPositions.delete(signal.symbol);
        trades.push(trade);
      }

      // Mark-to-market: each symbol at its own last known price
      const openValue = Array.from(openPositions.entries()).reduce(
        (sum, [sym, t]) => sum + t.quantity * (lastPriceBySymbol.get(sym) ?? t.entryPrice),
        0,
      );
      const portfolioValue = cashReserve + openValue;

      // Benchmark value: scale initial capital by benchmark return to date
      const dateKey = signal.date.toISOString().split('T')[0];
      if (benchmarkLookup.has(dateKey)) lastBenchmarkPrice = benchmarkLookup.get(dateKey)!;
      const benchmarkValue =
        initialBenchmarkPrice > 0
          ? Math.round((initialCapital * (lastBenchmarkPrice / initialBenchmarkPrice)) * 100) / 100
          : 0;

      equityCurve.push({
        date: signal.date.toISOString(),
        value: Math.round(portfolioValue * 100) / 100,
        benchmark: benchmarkValue,
      });
    }

    // Close any remaining open positions at each symbol's last known price
    const lastDate = sortedSignals[sortedSignals.length - 1].date;
    for (const [symbol, trade] of openPositions) {
      const closingPrice = lastPriceBySymbol.get(symbol) ?? trade.entryPrice;
      trade.exitDate = lastDate;
      trade.exitPrice = closingPrice;
      trade.returnPercentage = (closingPrice - trade.entryPrice) / trade.entryPrice;
      trade.status = 'closed';
      cashReserve += trade.quantity * closingPrice;
      trades.push(trade);
    }
    openPositions.clear();

    const finalCapital = cashReserve;
    const totalReturn = (finalCapital - initialCapital) / initialCapital;
    const benchmarkReturn = this.calcBenchmarkReturn(sortedBenchmark);

    const metrics = this.calculateMetrics(
      trades,
      totalReturn,
      benchmarkReturn,
      equityCurve,
      sortedBenchmark,
    );

    return {
      strategy: params.strategy,
      period: {
        from: sortedSignals[0].date.toISOString(),
        to: sortedSignals[sortedSignals.length - 1].date.toISOString(),
      },
      benchmark: params.benchmark ?? 'CUSTOM',
      initialCapital,
      finalCapital: Math.round(finalCapital * 100) / 100,
      totalReturn: Math.round(totalReturn * 10000) / 100,
      benchmarkReturn: Math.round(benchmarkReturn * 10000) / 100,
      metrics,
      trades,
      equityCurve,
    };
  }

  private calcBenchmarkReturn(sorted: Array<{ price: number }>): number {
    if (sorted.length < 2) return 0;
    const first = sorted[0].price;
    const last = sorted[sorted.length - 1].price;
    return first > 0 ? (last - first) / first : 0;
  }

  private dailyReturns(curve: Array<{ value: number }>): number[] {
    const returns: number[] = [];
    for (let i = 1; i < curve.length; i++) {
      if (curve[i - 1].value > 0) {
        returns.push((curve[i].value - curve[i - 1].value) / curve[i - 1].value);
      }
    }
    return returns;
  }

  private calculateMaxDrawdown(equityCurve: Array<{ value: number }>): number {
    let peak = 0;
    let maxDD = 0;
    for (const point of equityCurve) {
      if (point.value > peak) peak = point.value;
      const dd = peak > 0 ? (peak - point.value) / peak : 0;
      if (dd > maxDD) maxDD = dd;
    }
    return Math.round(maxDD * 10000) / 100;
  }

  private calculateBetaAlpha(
    equityCurve: Array<{ date: string; value: number }>,
    benchmarkPrices: Array<{ date: string; price: number }>,
    totalReturn: number,
    benchmarkReturn: number,
  ): { beta: number; alpha: number } {
    const sorted = [...benchmarkPrices].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    if (sorted.length < 2 || equityCurve.length < 2) return { beta: 0, alpha: 0 };

    // Build date-keyed daily returns for benchmark
    const benchByDate = new Map<string, number>();
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1].price;
      if (prev > 0) benchByDate.set(sorted[i].date.split('T')[0], (sorted[i].price - prev) / prev);
    }

    // Build date-keyed daily returns for equity curve
    const stratByDate = new Map<string, number>();
    for (let i = 1; i < equityCurve.length; i++) {
      const prev = equityCurve[i - 1].value;
      if (prev > 0) {
        stratByDate.set(
          equityCurve[i].date.split('T')[0],
          (equityCurve[i].value - prev) / prev,
        );
      }
    }

    // Regress only on dates present in both series — avoids index-based misalignment
    const commonDates = [...stratByDate.keys()].filter(d => benchByDate.has(d));
    const n = commonDates.length;
    if (n < 2) return { beta: 0, alpha: 0 };

    const strat = commonDates.map(d => stratByDate.get(d)!);
    const bench = commonDates.map(d => benchByDate.get(d)!);

    const stratMean = strat.reduce((s, r) => s + r, 0) / n;
    const benchMean = bench.reduce((s, r) => s + r, 0) / n;

    let cov = 0;
    let benchVar = 0;
    for (let i = 0; i < n; i++) {
      cov += (strat[i] - stratMean) * (bench[i] - benchMean);
      benchVar += (bench[i] - benchMean) ** 2;
    }
    cov /= n;
    benchVar /= n;

    const beta = benchVar > 0 ? cov / benchVar : 0;

    // Annualize returns using compounding
    const annualizedStrat = (1 + totalReturn) ** (TRADING_DAYS_PER_YEAR / n) - 1;
    const annualizedBench = (1 + benchmarkReturn) ** (TRADING_DAYS_PER_YEAR / Math.max(sorted.length - 1, 1)) - 1;
    const alpha = annualizedStrat - RISK_FREE_RATE_ANNUAL - beta * (annualizedBench - RISK_FREE_RATE_ANNUAL);

    return {
      beta: Math.round(beta * 10000) / 10000,
      alpha: Math.round(alpha * 10000) / 100,
    };
  }

  private calculateMetrics(
    trades: BacktestTrade[],
    totalReturn: number,
    benchmarkReturn: number,
    equityCurve: Array<{ date: string; value: number }>,
    benchmarkPrices: Array<{ date: string; price: number }>,
  ): BacktestMetrics {
    const closedTrades = trades.filter(t => t.status === 'closed');
    const winningTrades = closedTrades.filter(t => t.returnPercentage > 0);
    const losingTrades = closedTrades.filter(t => t.returnPercentage <= 0);

    const avgHoldingPeriod =
      closedTrades.length > 0
        ? closedTrades.reduce((sum, t) => {
            if (!t.exitDate) return sum;
            return sum + (t.exitDate.getTime() - t.entryDate.getTime()) / 86400000;
          }, 0) / closedTrades.length
        : 0;

    const avgWinReturn =
      winningTrades.length > 0
        ? winningTrades.reduce((s, t) => s + t.returnPercentage, 0) / winningTrades.length
        : 0;
    const avgLossReturn =
      losingTrades.length > 0
        ? losingTrades.reduce((s, t) => s + t.returnPercentage, 0) / losingTrades.length
        : 0;

    const totalWins = winningTrades.reduce((s, t) => s + t.returnPercentage, 0);
    const totalLosses = Math.abs(losingTrades.reduce((s, t) => s + t.returnPercentage, 0));

    // Sharpe uses daily equity-curve returns (not per-trade returns)
    const daily = this.dailyReturns(equityCurve);
    const dailyMean = daily.length > 0 ? daily.reduce((s, r) => s + r, 0) / daily.length : 0;
    const dailyVar =
      daily.length > 0 ? daily.reduce((s, r) => s + (r - dailyMean) ** 2, 0) / daily.length : 0;
    const dailyStdDev = Math.sqrt(dailyVar);
    const dailyRiskFree = RISK_FREE_RATE_ANNUAL / TRADING_DAYS_PER_YEAR;
    const sharpeRatio =
      dailyStdDev > 0
        ? Math.round(((dailyMean - dailyRiskFree) / dailyStdDev) * Math.sqrt(TRADING_DAYS_PER_YEAR) * 100) / 100
        : 0;

    const maxDrawdown = this.calculateMaxDrawdown(equityCurve);
    const { beta, alpha } = this.calculateBetaAlpha(equityCurve, benchmarkPrices, totalReturn, benchmarkReturn);

    return {
      totalReturn: Math.round(totalReturn * 10000) / 100,
      benchmarkReturn: Math.round(benchmarkReturn * 10000) / 100,
      alpha,
      beta,
      sharpeRatio,
      maxDrawdown,
      winRate:
        closedTrades.length > 0
          ? Math.round((winningTrades.length / closedTrades.length) * 10000) / 100
          : 0,
      totalTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      averageHoldingPeriod: Math.round(avgHoldingPeriod * 100) / 100,
      averageWinReturn: Math.round(avgWinReturn * 10000) / 100,
      averageLossReturn: Math.round(avgLossReturn * 10000) / 100,
      profitFactor:
        totalLosses > 0 ? Math.round((totalWins / totalLosses) * 100) / 100 : totalWins > 0 ? Infinity : 0,
    };
  }

  private emptyResult(strategy: string, benchmark: string | undefined, initialCapital: number): BacktestResult {
    const empty: BacktestMetrics = {
      totalReturn: 0, benchmarkReturn: 0, alpha: 0, beta: 0, sharpeRatio: 0, maxDrawdown: 0,
      winRate: 0, totalTrades: 0, winningTrades: 0, losingTrades: 0,
      averageHoldingPeriod: 0, averageWinReturn: 0, averageLossReturn: 0, profitFactor: 0,
    };
    return {
      strategy,
      period: { from: '', to: '' },
      benchmark: benchmark ?? 'CUSTOM',
      initialCapital,
      finalCapital: initialCapital,
      totalReturn: 0,
      benchmarkReturn: 0,
      metrics: empty,
      trades: [],
      equityCurve: [],
    };
  }
}
