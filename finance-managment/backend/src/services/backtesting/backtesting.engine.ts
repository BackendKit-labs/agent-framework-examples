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

@Injectable()
export class BacktestingEngine {
  /**
   * Ejecuta un backtest sobre señales históricas
   */
  async runBacktest(params: {
    strategy: string;
    signals: BacktestSignal[];
    initialCapital?: number;
    benchmark?: string;
    benchmarkPrices?: Array<{ date: string; price: number }>;
    maxPositionSize?: number; // % of capital per position
  }): Promise<BacktestResult> {
    const initialCapital = params.initialCapital || 100000;
    const maxPositionSize = params.maxPositionSize || 0.20;
    const sortedSignals = [...params.signals].sort((a, b) => a.date.getTime() - b.date.getTime());

    let capital = initialCapital;
    let cashReserve = initialCapital;
    const trades: BacktestTrade[] = [];
    const equityCurve: Array<{ date: string; value: number; benchmark: number }> = [];
    const openPositions: Map<string, BacktestTrade> = new Map();

    for (const signal of sortedSignals) {
      const positionSize = capital * maxPositionSize;
      const quantity = Math.floor(positionSize / signal.price);

      if (signal.action === 'buy' && !openPositions.has(signal.symbol)) {
        const cost = quantity * signal.price;
        if (cost <= cashReserve) {
          const trade: BacktestTrade = {
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
          };
          openPositions.set(signal.symbol, trade);
          cashReserve -= cost;
        }
      } else if (signal.action === 'sell' && openPositions.has(signal.symbol)) {
        const trade = openPositions.get(signal.symbol)!;
        trade.exitDate = signal.date;
        trade.exitPrice = signal.price;
        trade.returnPercentage = (signal.price - trade.entryPrice) / trade.entryPrice;
        trade.status = 'closed';

        const proceeds = trade.quantity * signal.price;
        cashReserve += proceeds;
        trades.push(trade);
        openPositions.delete(signal.symbol);
      }

      // Record equity curve
      const portfolioValue = cashReserve + Array.from(openPositions.values())
        .reduce((sum, t) => sum + t.quantity * signal.price, 0);
      equityCurve.push({
        date: signal.date.toISOString(),
        value: Math.round(portfolioValue * 100) / 100,
        benchmark: 0, // Will be calculated if benchmark data provided
      });
    }

    // Close remaining positions at last price
    for (const [, trade] of openPositions) {
      const lastSignal = sortedSignals[sortedSignals.length - 1];
      trade.exitDate = lastSignal.date;
      trade.exitPrice = lastSignal.price;
      trade.returnPercentage = (lastSignal.price - trade.entryPrice) / trade.entryPrice;
      trade.status = 'closed';
      trades.push(trade);
    }

    const finalCapital = cashReserve + Array.from(openPositions.values())
      .reduce((sum, t) => sum + t.quantity * (t.exitPrice || 0), 0);

    const totalReturn = (finalCapital - initialCapital) / initialCapital;
    const metrics = this.calculateMetrics(trades, totalReturn);

    return {
      strategy: params.strategy,
      period: {
        from: sortedSignals[0]?.date.toISOString() || '',
        to: sortedSignals[sortedSignals.length - 1]?.date.toISOString() || '',
      },
      benchmark: params.benchmark || 'CUSTOM',
      initialCapital,
      finalCapital: Math.round(finalCapital * 100) / 100,
      totalReturn: Math.round(totalReturn * 10000) / 100,
      benchmarkReturn: 0,
      metrics,
      trades,
      equityCurve,
    };
  }

  private calculateMetrics(trades: BacktestTrade[], totalReturn: number): BacktestMetrics {
    const closedTrades = trades.filter(t => t.status === 'closed');
    const winningTrades = closedTrades.filter(t => t.returnPercentage > 0);
    const losingTrades = closedTrades.filter(t => t.returnPercentage <= 0);

    const returns = closedTrades.map(t => t.returnPercentage);
    const avgReturn = returns.length > 0 ? returns.reduce((s, r) => s + r, 0) / returns.length : 0;
    const variance = returns.length > 0 ? returns.reduce((s, r) => s + (r - avgReturn) ** 2, 0) / returns.length : 0;
    const stdDev = Math.sqrt(variance);

    const avgHoldingPeriod = closedTrades.length > 0
      ? closedTrades.reduce((sum, t) => {
          if (!t.exitDate) return sum;
          return sum + (t.exitDate.getTime() - t.entryDate.getTime()) / 86400000;
        }, 0) / closedTrades.length
      : 0;

    const avgWinReturn = winningTrades.length > 0
      ? winningTrades.reduce((s, t) => s + t.returnPercentage, 0) / winningTrades.length
      : 0;

    const avgLossReturn = losingTrades.length > 0
      ? losingTrades.reduce((s, t) => s + t.returnPercentage, 0) / losingTrades.length
      : 0;

    const totalWins = winningTrades.reduce((s, t) => s + t.returnPercentage, 0);
    const totalLosses = Math.abs(losingTrades.reduce((s, t) => s + t.returnPercentage, 0));

    return {
      totalReturn: Math.round(totalReturn * 100) / 100,
      benchmarkReturn: 0,
      alpha: 0,
      beta: 0,
      sharpeRatio: stdDev > 0 ? Math.round((avgReturn / stdDev) * Math.sqrt(252) * 100) / 100 : 0,
      maxDrawdown: 0,
      winRate: closedTrades.length > 0 ? Math.round((winningTrades.length / closedTrades.length) * 10000) / 100 : 0,
      totalTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      averageHoldingPeriod: Math.round(avgHoldingPeriod * 100) / 100,
      averageWinReturn: Math.round(avgWinReturn * 10000) / 100,
      averageLossReturn: Math.round(avgLossReturn * 10000) / 100,
      profitFactor: totalLosses > 0 ? Math.round((totalWins / totalLosses) * 100) / 100 : totalWins > 0 ? Infinity : 0,
    };
  }
}
