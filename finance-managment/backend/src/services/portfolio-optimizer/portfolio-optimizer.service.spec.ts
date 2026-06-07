import { PortfolioOptimizerService, AssetHistoricalData } from './portfolio-optimizer.service';

describe('PortfolioOptimizerService', () => {
  let service: PortfolioOptimizerService;

  const generateReturns = (mean: number, std: number, count = 252): number[] => {
    const returns: number[] = [];
    for (let i = 0; i < count; i++) {
      // Box-Muller transform for normal distribution
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      returns.push(mean + z * std);
    }
    return returns;
  };

  const mockAssets: AssetHistoricalData[] = [
    { symbol: 'AAPL', returns: generateReturns(0.001, 0.02), currentPrice: 198 },
    { symbol: 'MSFT', returns: generateReturns(0.0008, 0.018), currentPrice: 425 },
    { symbol: 'BTC', returns: generateReturns(0.002, 0.05), currentPrice: 67500 },
    { symbol: 'SPY', returns: generateReturns(0.0005, 0.01), currentPrice: 520 },
  ];

  beforeEach(() => {
    service = new PortfolioOptimizerService();
  });

  describe('calculateEfficientFrontier', () => {
    it('should return optimization results', () => {
      const result = service.calculateEfficientFrontier(mockAssets);
      expect(result.efficientFrontier.length).toBeGreaterThan(0);
      expect(result.maxSharpePortfolio).toBeDefined();
      expect(result.minVolatilityPortfolio).toBeDefined();
    });

    it('should calculate correlation matrix', () => {
      const result = service.calculateEfficientFrontier(mockAssets);
      expect(result.correlationMatrix['AAPL']).toBeDefined();
      expect(result.correlationMatrix['AAPL']['MSFT']).toBeDefined();
    });

    it('should have valid allocations that sum to 100%', () => {
      const result = service.calculateEfficientFrontier(mockAssets);
      const alloc = result.maxSharpePortfolio.allocations;
      const total = Object.values(alloc).reduce((s, v) => s + v, 0);
      expect(total).toBeCloseTo(100, 0);
    });

    it('should handle single asset', () => {
      const singleAsset: AssetHistoricalData[] = [
        { symbol: 'AAPL', returns: generateReturns(0.001, 0.02), currentPrice: 198 },
      ];
      const result = service.calculateEfficientFrontier(singleAsset);
      expect(result.efficientFrontier.length).toBeGreaterThan(0);
    });
  });
});
