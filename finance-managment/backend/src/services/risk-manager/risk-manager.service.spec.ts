import { RiskManagerService, PortfolioHolding } from './risk-manager.service';

describe('RiskManagerService', () => {
  let service: RiskManagerService;

  const mockPortfolio: PortfolioHolding[] = [
    { symbol: 'AAPL', sector: 'Tech', value: 50000, allocation: 0.25, returnPercentage: 0.10, quantity: 100, averageBuyPrice: 150, currentPrice: 165 },
    { symbol: 'MSFT', sector: 'Tech', value: 40000, allocation: 0.20, returnPercentage: 0.08, quantity: 80, averageBuyPrice: 350, currentPrice: 378 },
    { symbol: 'GOOGL', sector: 'Tech', value: 30000, allocation: 0.15, returnPercentage: -0.05, quantity: 60, averageBuyPrice: 140, currentPrice: 133 },
    { symbol: 'BTC', sector: 'Crypto', value: 20000, allocation: 0.10, returnPercentage: 0.25, quantity: 0.3, averageBuyPrice: 50000, currentPrice: 62500 },
    { symbol: 'SPY', sector: 'ETF', value: 60000, allocation: 0.30, returnPercentage: 0.05, quantity: 115, averageBuyPrice: 500, currentPrice: 525 },
  ];

  beforeEach(() => {
    service = new RiskManagerService();
  });

  describe('getRules', () => {
    it('should return default rules', () => {
      const rules = service.getRules();
      expect(rules.maxSingleAssetAllocation).toBe(0.20);
      expect(rules.defaultStopLoss).toBe(-0.15);
    });

    it('should return user-specific rules if set', () => {
      service.updateRules('user-1', { maxSingleAssetAllocation: 0.30 });
      const rules = service.getRules('user-1');
      expect(rules.maxSingleAssetAllocation).toBe(0.30);
      expect(rules.defaultStopLoss).toBe(-0.15); // inherited from default
    });
  });

  describe('validateOrder', () => {
    it('should pass for a valid buy order', () => {
      const result = service.validateOrder(
        { symbol: 'BTC', side: 'buy', amount: 0.1, price: 60000 },
        mockPortfolio,
        50000,
        200000,
      );
      expect(result.passed).toBe(true);
    });

    it('should fail for buy exceeding max allocation', () => {
      const result = service.validateOrder(
        { symbol: 'AAPL', side: 'buy', amount: 1000, price: 170 },
        mockPortfolio,
        50000,
        200000,
      );
      expect(result.passed).toBe(false);
      expect(result.violations.some(v => v.rule === 'maxSingleAssetAllocation')).toBe(true);
    });

    it('should warn for sell at loss exceeding stop-loss', () => {
      const result = service.validateOrder(
        { symbol: 'GOOGL', side: 'sell', amount: 60, price: 100 },
        mockPortfolio,
        50000,
        200000,
      );
      expect(result.violations.some(v => v.rule === 'defaultStopLoss')).toBe(true);
    });
  });

  describe('evaluatePortfolioRisk', () => {
    it('should detect concentration risk', () => {
      const result = service.evaluatePortfolioRisk(mockPortfolio, 200000);
      expect(result.violations.some(v => v.rule === 'maxSingleAssetAllocation')).toBe(true);
    });

    it('should return VaR > 0 for a volatile portfolio', () => {
      // Portfolio with high variance triggers a non-zero VaR
      const volatile: PortfolioHolding[] = [
        { symbol: 'A', sector: 'Tech', value: 10000, allocation: 0.5, returnPercentage: 0.30, quantity: 10, averageBuyPrice: 100, currentPrice: 130 },
        { symbol: 'B', sector: 'Tech', value: 10000, allocation: 0.5, returnPercentage: -0.30, quantity: 10, averageBuyPrice: 100, currentPrice: 70 },
      ];
      // stdDev of [0.30, -0.30] = 0.30, mean = 0 → VaR = 0 + 1.645 * 0.30 ≈ 0.494
      const result = service.evaluatePortfolioRisk(volatile, 20000);
      expect(result.violations.some(v => v.rule === 'maxVar95')).toBe(true);
    });

    it('should not flag VaR for a stable all-positive portfolio', () => {
      const stable: PortfolioHolding[] = [
        { symbol: 'A', sector: 'ETF', value: 10000, allocation: 0.5, returnPercentage: 0.03, quantity: 10, averageBuyPrice: 100, currentPrice: 103 },
        { symbol: 'B', sector: 'ETF', value: 10000, allocation: 0.5, returnPercentage: 0.04, quantity: 10, averageBuyPrice: 100, currentPrice: 104 },
      ];
      // stdDev ≈ 0.005, mean = 0.035 → VaR = -0.035 + 1.645*0.005 ≈ -0.027 → clamped to 0
      const result = service.evaluatePortfolioRisk(stable, 20000);
      expect(result.violations.some(v => v.rule === 'maxVar95')).toBe(false);
    });
  });
});
