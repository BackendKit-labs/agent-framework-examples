import { BacktestingEngine, BacktestSignal } from './backtesting.engine';

describe('BacktestingEngine', () => {
  let engine: BacktestingEngine;

  const generateSignals = (): BacktestSignal[] => {
    const signals: BacktestSignal[] = [];
    const baseDate = new Date('2025-01-01');

    for (let i = 0; i < 252; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);

      // Simulate buy/sell signals
      if (i % 20 === 0) {
        signals.push({
          date,
          symbol: 'AAPL',
          action: 'buy',
          price: 150 + Math.random() * 50,
          confidence: 0.7 + Math.random() * 0.3,
          source: 'fusion',
        });
      }
      if (i % 20 === 10) {
        signals.push({
          date,
          symbol: 'AAPL',
          action: 'sell',
          price: 160 + Math.random() * 50,
          confidence: 0.6 + Math.random() * 0.3,
          source: 'fusion',
        });
      }
    }

    return signals;
  };

  beforeEach(() => {
    engine = new BacktestingEngine();
  });

  describe('runBacktest', () => {
    it('should run a backtest with signals', async () => {
      const signals = generateSignals();
      const result = await engine.runBacktest({
        strategy: 'fusion-default',
        signals,
        initialCapital: 100000,
      });

      expect(result.strategy).toBe('fusion-default');
      expect(result.initialCapital).toBe(100000);
      expect(result.trades.length).toBeGreaterThan(0);
      expect(result.metrics.totalTrades).toBeGreaterThan(0);
    });

    it('should calculate win rate', async () => {
      const signals = generateSignals();
      const result = await engine.runBacktest({
        strategy: 'test',
        signals,
        initialCapital: 100000,
      });

      expect(result.metrics.winRate).toBeGreaterThanOrEqual(0);
      expect(result.metrics.winRate).toBeLessThanOrEqual(100);
    });

    it('should generate equity curve', async () => {
      const signals = generateSignals();
      const result = await engine.runBacktest({
        strategy: 'test',
        signals,
        initialCapital: 100000,
      });

      expect(result.equityCurve.length).toBeGreaterThan(0);
      expect(result.equityCurve[0].value).toBeDefined();
    });

    it('should handle empty signals', async () => {
      const result = await engine.runBacktest({
        strategy: 'empty',
        signals: [],
        initialCapital: 100000,
      });

      expect(result.trades).toHaveLength(0);
      expect(result.finalCapital).toBe(100000);
      expect(result.totalReturn).toBe(0);
    });
  });
});
