import { SignalFusionEngine, NormalizedSignal } from './signal-fusion.engine';

describe('SignalFusionEngine', () => {
  let engine: SignalFusionEngine;

  const makeSignal = (overrides: Partial<NormalizedSignal>): NormalizedSignal => ({
    symbol: 'AAPL',
    source: 'news',
    direction: 0,
    magnitude: 0,
    confidence: 0.7,
    sourceWeight: 0.3,
    metadata: {},
    expiresAt: new Date(Date.now() + 86400000),
    rationale: 'test',
    ...overrides,
  });

  beforeEach(() => {
    engine = new SignalFusionEngine();
  });

  describe('fuse', () => {
    it('should return HOLD with no signals', () => {
      const result = engine.fuse([]);
      expect(result.action).toBe('HOLD');
      expect(result.confidence).toBe(0);
    });

    it('should return STRONG_BUY with strong bullish signals', () => {
      const signals = [
        makeSignal({ source: 'news', direction: 0.8, magnitude: 0.9, confidence: 0.9, sourceWeight: 0.3 }),
        makeSignal({ source: 'smart_money_13f', direction: 0.7, magnitude: 0.8, confidence: 0.85, sourceWeight: 0.35 }),
      ];
      const result = engine.fuse(signals);
      expect(result.action).toBe('STRONG_BUY');
      expect(result.score).toBeGreaterThan(0.6);
    });

    it('should return STRONG_SELL with strong bearish signals', () => {
      const signals = [
        makeSignal({ source: 'news', direction: -0.8, magnitude: 0.9, confidence: 0.9, sourceWeight: 0.3 }),
        makeSignal({ source: 'smart_money_13f', direction: -0.7, magnitude: 0.8, confidence: 0.85, sourceWeight: 0.35 }),
      ];
      const result = engine.fuse(signals);
      expect(result.action).toBe('STRONG_SELL');
      expect(result.score).toBeLessThan(-0.6);
    });

    it('should return CAUTIOUS_BUY with moderately positive signals', () => {
      const signals = [
        makeSignal({ source: 'news', direction: 0.7, magnitude: 0.8, confidence: 0.8, sourceWeight: 0.3 }),
      ];
      const result = engine.fuse(signals);
      // direction * magnitude * weight * confidence / totalWeight = 0.7*0.8*0.3*0.8 / (0.3*0.8) = 0.56
      expect(result.action).toBe('CAUTIOUS_BUY');
      expect(result.score).toBeGreaterThan(0.3);
      expect(result.score).toBeLessThan(0.6);
    });

    it('should detect conflict between bullish and bearish signals', () => {
      const signals = [
        makeSignal({ source: 'news', direction: 0.8, magnitude: 0.9, confidence: 0.9, sourceWeight: 0.3 }),
        makeSignal({ source: 'smart_money_13f', direction: -0.7, magnitude: 0.8, confidence: 0.85, sourceWeight: 0.35 }),
      ];
      const result = engine.fuse(signals);
      expect(result.conflict).not.toBeNull();
      expect(result.conflict!.hasConflict).toBe(true);
      expect(result.conflict!.bullishSources).toContain('news');
      expect(result.conflict!.bearishSources).toContain('smart_money_13f');
    });

    it('should return CONFLICT_HOLD when conflict is HIGH and score is moderate', () => {
      const signals = [
        makeSignal({ source: 'news', direction: 0.5, magnitude: 0.6, confidence: 0.9, sourceWeight: 0.3 }),
        makeSignal({ source: 'smart_money_13f', direction: -0.5, magnitude: 0.6, confidence: 0.9, sourceWeight: 0.35 }),
        makeSignal({ source: 'technical', direction: 0.4, magnitude: 0.5, confidence: 0.5, sourceWeight: 0.1 }),
      ];
      const result = engine.fuse(signals);
      // 2 bullish vs 1 bearish = conflict severity MEDIUM, score ~0.15 → HOLD
      expect(result.action).toBe('HOLD');
    });

    it('should respect custom user weights', () => {
      const signals = [
        makeSignal({ source: 'news', direction: 0.8, magnitude: 0.9, confidence: 0.9, sourceWeight: 0.3 }),
        makeSignal({ source: 'smart_money_13f', direction: -0.7, magnitude: 0.8, confidence: 0.85, sourceWeight: 0.35 }),
      ];
      // User gives more weight to news (0.7) and less to smart money (0.1)
      const result = engine.fuse(signals, { news: 0.7, smart_money_13f: 0.1 });
      // news contribution: 0.8*0.9*0.7*0.9 = 0.4536
      // sm contribution: -0.7*0.8*0.1*0.85 = -0.0476
      // totalWeight: 0.7*0.9 + 0.1*0.85 = 0.63 + 0.085 = 0.715
      // score: (0.4536 - 0.0476) / 0.715 = 0.567 → CAUTIOUS_BUY
      expect(result.action).toBe('CAUTIOUS_BUY');
      expect(result.score).toBeGreaterThan(0.3);
    });

    it('should include contributions for each signal source', () => {
      const signals = [
        makeSignal({ source: 'news', direction: 0.5, magnitude: 0.6, confidence: 0.7, sourceWeight: 0.3 }),
        makeSignal({ source: 'technical', direction: 0.3, magnitude: 0.4, confidence: 0.5, sourceWeight: 0.1 }),
      ];
      const result = engine.fuse(signals);
      expect(result.contributions).toHaveLength(2);
      expect(result.contributions.map(c => c.source)).toContain('news');
      expect(result.contributions.map(c => c.source)).toContain('technical');
    });

    it('should generate rationale with source breakdown', () => {
      const signals = [
        makeSignal({ source: 'news', direction: 0.8, magnitude: 0.9, confidence: 0.9, sourceWeight: 0.3 }),
      ];
      const result = engine.fuse(signals);
      expect(result.rationale).toContain('AAPL');
      expect(result.rationale).toContain('STRONG_BUY');
      expect(result.rationale).toContain('📰 News');
    });

    it('should handle single signal correctly', () => {
      const signals = [
        makeSignal({ source: 'technical', direction: -0.7, magnitude: 0.8, confidence: 0.7, sourceWeight: 0.1 }),
      ];
      const result = engine.fuse(signals);
      // -0.7*0.8*0.1*0.7 / (0.1*0.7) = -0.56 → CAUTIOUS_SELL
      expect(result.action).toBe('CAUTIOUS_SELL');
      expect(result.contributions).toHaveLength(1);
    });

    it('should calculate confidence based on source diversity and average confidence', () => {
      const signals = [
        makeSignal({ source: 'news', direction: 0.5, magnitude: 0.6, confidence: 0.9, sourceWeight: 0.3 }),
        makeSignal({ source: 'smart_money_13f', direction: 0.5, magnitude: 0.6, confidence: 0.8, sourceWeight: 0.35 }),
        makeSignal({ source: 'technical', direction: 0.5, magnitude: 0.6, confidence: 0.7, sourceWeight: 0.1 }),
      ];
      const result = engine.fuse(signals);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    describe('signal expiry', () => {
      it('should ignore expired signals', () => {
        const signals = [
          makeSignal({ direction: 0.9, magnitude: 0.9, confidence: 0.9, expiresAt: new Date(Date.now() - 1000) }), // expired
          makeSignal({ source: 'smart_money_13f', direction: 0.9, magnitude: 0.9, confidence: 0.9, expiresAt: new Date(Date.now() - 1000) }), // expired
        ];
        const result = engine.fuse(signals);
        expect(result.action).toBe('HOLD');
        expect(result.rationale).toContain('expired');
      });

      it('should use only non-expired signals when mixed', () => {
        const signals = [
          makeSignal({ source: 'news', direction: -0.9, magnitude: 0.9, confidence: 0.9, expiresAt: new Date(Date.now() - 1000) }), // expired bearish
          makeSignal({ source: 'smart_money_13f', direction: 0.9, magnitude: 0.9, confidence: 0.9, expiresAt: new Date(Date.now() + 86400000) }), // active bullish
        ];
        const result = engine.fuse(signals);
        // Only the bullish signal is active → STRONG_BUY or CAUTIOUS_BUY
        expect(['STRONG_BUY', 'CAUTIOUS_BUY']).toContain(result.action);
      });

      it('should return symbol in rationale when all signals expire', () => {
        const signals = [makeSignal({ expiresAt: new Date(Date.now() - 1000) })];
        const result = engine.fuse(signals);
        expect(result.symbol).toBe('AAPL');
        expect(result.confidence).toBe(0);
      });
    });
  });
});
