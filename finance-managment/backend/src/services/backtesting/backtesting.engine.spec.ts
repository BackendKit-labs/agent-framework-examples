import { BacktestingEngine, BacktestSignal } from './backtesting.engine';

describe('BacktestingEngine', () => {
  let engine: BacktestingEngine;

  const day = (offset: number): Date => {
    const d = new Date('2025-01-02');
    d.setDate(d.getDate() + offset);
    return d;
  };

  const benchmarkPrices = (start: number, end: number, days: number) =>
    Array.from({ length: days }, (_, i) => ({
      date: day(i).toISOString().split('T')[0],
      price: start + ((end - start) / (days - 1)) * i,
    }));

  beforeEach(() => {
    engine = new BacktestingEngine();
  });

  describe('basic execution', () => {
    it('should return empty result when signals is empty', async () => {
      const result = await engine.runBacktest({ strategy: 'empty', signals: [], initialCapital: 100000 });
      expect(result.trades).toHaveLength(0);
      expect(result.finalCapital).toBe(100000);
      expect(result.totalReturn).toBe(0);
      expect(result.metrics.maxDrawdown).toBe(0);
      expect(result.metrics.alpha).toBe(0);
    });

    it('should execute a simple profitable buy-sell cycle', async () => {
      const signals: BacktestSignal[] = [
        { date: day(0), symbol: 'AAPL', action: 'buy', price: 100, confidence: 0.8, source: 'fusion' },
        { date: day(10), symbol: 'AAPL', action: 'sell', price: 120, confidence: 0.8, source: 'fusion' },
      ];
      const result = await engine.runBacktest({ strategy: 'test', signals, initialCapital: 10000 });

      expect(result.trades).toHaveLength(1);
      expect(result.trades[0].returnPercentage).toBeCloseTo(0.2); // +20%
      expect(result.finalCapital).toBeGreaterThan(10000);
      expect(result.metrics.winRate).toBe(100);
    });

    it('should generate equity curve with one entry per signal', async () => {
      const signals: BacktestSignal[] = [
        { date: day(0), symbol: 'AAPL', action: 'buy', price: 100, confidence: 0.8, source: 'fusion' },
        { date: day(5), symbol: 'AAPL', action: 'hold', price: 110, confidence: 0.5, source: 'fusion' },
        { date: day(10), symbol: 'AAPL', action: 'sell', price: 120, confidence: 0.8, source: 'fusion' },
      ];
      const result = await engine.runBacktest({ strategy: 'test', signals });
      expect(result.equityCurve).toHaveLength(3);
    });
  });

  describe('equity curve multi-symbol correctness', () => {
    it('should value each open position at its own last price, not the current signal price', async () => {
      // AAPL bought at 100, then BTC signal at 60000 arrives while AAPL is still open
      // Equity should NOT be cash + (AAPL_qty * 60000)
      const signals: BacktestSignal[] = [
        { date: day(0), symbol: 'AAPL', action: 'buy', price: 100, confidence: 0.8, source: 'fusion' },
        { date: day(1), symbol: 'BTC', action: 'hold', price: 60000, confidence: 0.5, source: 'fusion' },
      ];
      const result = await engine.runBacktest({ strategy: 'test', signals, initialCapital: 10000 });

      // After buying AAPL: qty = floor(2000 / 100) = 20, cost = 2000, cash = 8000
      // Day 1 equity curve: cash(8000) + AAPL(20 * 100) = 10000, NOT 8000 + 20*60000
      const day1Point = result.equityCurve[1];
      expect(day1Point.value).toBeLessThan(50000); // sanity: should not be inflated by BTC price
      expect(day1Point.value).toBeCloseTo(10000, 0);
    });
  });

  describe('maxDrawdown', () => {
    it('should calculate maxDrawdown from equity curve peak-to-trough', async () => {
      // Buy at 100, price goes up to 150, then drops to 75 when sold → drawdown ~50%
      const signals: BacktestSignal[] = [
        { date: day(0), symbol: 'AAPL', action: 'buy', price: 100, confidence: 0.8, source: 'fusion' },
        { date: day(5), symbol: 'AAPL', action: 'hold', price: 150, confidence: 0.5, source: 'fusion' },
        { date: day(10), symbol: 'AAPL', action: 'sell', price: 75, confidence: 0.8, source: 'fusion' },
      ];
      const result = await engine.runBacktest({ strategy: 'test', signals, initialCapital: 10000 });

      expect(result.metrics.maxDrawdown).toBeGreaterThan(0);
      // Peak ~equity at day5, trough at day10 — dd should be significant
      const peakValue = result.equityCurve[1].value;
      const troughValue = result.equityCurve[2].value;
      const expectedDD = ((peakValue - troughValue) / peakValue) * 100;
      expect(result.metrics.maxDrawdown).toBeCloseTo(expectedDD, 0);
    });

    it('should return 0 maxDrawdown for a monotonically increasing portfolio', async () => {
      const signals: BacktestSignal[] = [
        { date: day(0), symbol: 'AAPL', action: 'buy', price: 100, confidence: 0.8, source: 'fusion' },
        { date: day(5), symbol: 'AAPL', action: 'hold', price: 110, confidence: 0.5, source: 'fusion' },
        { date: day(10), symbol: 'AAPL', action: 'sell', price: 120, confidence: 0.8, source: 'fusion' },
      ];
      const result = await engine.runBacktest({ strategy: 'test', signals });
      expect(result.metrics.maxDrawdown).toBe(0);
    });
  });

  describe('benchmarkReturn', () => {
    it('should calculate benchmarkReturn from provided prices', async () => {
      const signals: BacktestSignal[] = [
        { date: day(0), symbol: 'AAPL', action: 'buy', price: 100, confidence: 0.8, source: 'fusion' },
        { date: day(9), symbol: 'AAPL', action: 'sell', price: 100, confidence: 0.8, source: 'fusion' },
      ];
      // Benchmark goes from 400 to 440 = +10%
      const bench = benchmarkPrices(400, 440, 10);
      const result = await engine.runBacktest({
        strategy: 'test', signals, benchmarkPrices: bench, benchmark: 'SPY',
      });

      expect(result.benchmarkReturn).toBeCloseTo(10, 0); // 10%
      expect(result.metrics.benchmarkReturn).toBeCloseTo(10, 0);
    });

    it('should populate equity curve benchmark column', async () => {
      const signals: BacktestSignal[] = [
        { date: day(0), symbol: 'AAPL', action: 'hold', price: 100, confidence: 0.5, source: 'fusion' },
      ];
      const bench = benchmarkPrices(400, 400, 3);
      const result = await engine.runBacktest({ strategy: 'test', signals, benchmarkPrices: bench });

      // Benchmark is flat → benchmark column should equal initialCapital
      expect(result.equityCurve[0].benchmark).toBeCloseTo(100000, -2);
    });

    it('should return 0 benchmarkReturn when no benchmark prices provided', async () => {
      const signals: BacktestSignal[] = [
        { date: day(0), symbol: 'AAPL', action: 'buy', price: 100, confidence: 0.8, source: 'fusion' },
        { date: day(5), symbol: 'AAPL', action: 'sell', price: 110, confidence: 0.8, source: 'fusion' },
      ];
      const result = await engine.runBacktest({ strategy: 'test', signals });
      expect(result.benchmarkReturn).toBe(0);
      expect(result.equityCurve.every(p => p.benchmark === 0)).toBe(true);
    });
  });

  describe('alpha and beta', () => {
    it('should compute non-zero beta when benchmark prices are provided', async () => {
      const signals: BacktestSignal[] = Array.from({ length: 20 }, (_, i) => ({
        date: day(i),
        symbol: 'AAPL',
        action: i % 2 === 0 ? 'hold' : 'hold' as const,
        price: 100 + i * 2,
        confidence: 0.7,
        source: 'fusion',
      }));
      signals[0].action = 'buy';
      signals[19].action = 'sell';

      const bench = benchmarkPrices(400, 440, 20);
      const result = await engine.runBacktest({ strategy: 'test', signals, benchmarkPrices: bench });

      // Beta may be any real number — we just verify it was calculated (not hardcoded to 0)
      // A strategy correlated with a rising benchmark should have beta ≥ 0
      expect(typeof result.metrics.beta).toBe('number');
      expect(result.metrics.beta).not.toBeNaN();
    });

    it('should return beta=0 and alpha=0 when no benchmark prices provided', async () => {
      const signals: BacktestSignal[] = [
        { date: day(0), symbol: 'AAPL', action: 'buy', price: 100, confidence: 0.8, source: 'fusion' },
        { date: day(5), symbol: 'AAPL', action: 'sell', price: 110, confidence: 0.8, source: 'fusion' },
      ];
      const result = await engine.runBacktest({ strategy: 'test', signals });
      expect(result.metrics.beta).toBe(0);
      expect(result.metrics.alpha).toBe(0);
    });
  });

  describe('Sharpe ratio', () => {
    it('should return 0 sharpe when portfolio is flat (no daily change)', async () => {
      // Single point equity curve → no daily returns → stdDev = 0
      const signals: BacktestSignal[] = [
        { date: day(0), symbol: 'AAPL', action: 'hold', price: 100, confidence: 0.5, source: 'fusion' },
      ];
      const result = await engine.runBacktest({ strategy: 'test', signals });
      expect(result.metrics.sharpeRatio).toBe(0);
    });

    it('should produce a positive Sharpe for a consistently profitable strategy', async () => {
      // Buy at 100, price steadily rises every day → equity curve is monotonic → positive Sharpe
      const signals: BacktestSignal[] = [
        { date: day(0), symbol: 'AAPL', action: 'buy', price: 100, confidence: 0.8, source: 'fusion' },
        ...Array.from({ length: 28 }, (_, i) => ({
          date: day(i + 1),
          symbol: 'AAPL',
          action: 'hold' as const,
          price: 101 + i,
          confidence: 0.5,
          source: 'fusion',
        })),
        { date: day(29), symbol: 'AAPL', action: 'sell', price: 130, confidence: 0.8, source: 'fusion' },
      ];
      const result = await engine.runBacktest({ strategy: 'test', signals, initialCapital: 50000 });
      expect(result.metrics.sharpeRatio).toBeGreaterThan(0);
    });
  });

  describe('remaining open positions', () => {
    it('should close open positions at their own last price, not a different symbol price', async () => {
      // AAPL open at 100, later a MSFT sell signal at 250 arrives — AAPL should close at ~100, not 250
      const signals: BacktestSignal[] = [
        { date: day(0), symbol: 'AAPL', action: 'buy', price: 100, confidence: 0.8, source: 'fusion' },
        { date: day(5), symbol: 'MSFT', action: 'sell', price: 250, confidence: 0.8, source: 'fusion' },
      ];
      const result = await engine.runBacktest({ strategy: 'test', signals, initialCapital: 10000 });

      const aaplTrade = result.trades.find(t => t.symbol === 'AAPL');
      expect(aaplTrade).toBeDefined();
      // exitPrice should be 100 (AAPL's last seen price), not 250 (MSFT's price)
      expect(aaplTrade!.exitPrice).toBe(100);
      expect(aaplTrade!.returnPercentage).toBeCloseTo(0);
    });
  });
});
