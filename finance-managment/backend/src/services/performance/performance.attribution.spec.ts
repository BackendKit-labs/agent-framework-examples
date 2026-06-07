import { PerformanceAttributionService, TradeRecord, HoldingSnapshot } from './performance.attribution';

describe('PerformanceAttributionService', () => {
  let service: PerformanceAttributionService;

  const mockTrades: TradeRecord[] = [
    { date: new Date('2025-01-15'), symbol: 'AAPL', side: 'buy', price: 150, quantity: 100, returnPercentage: 0.15, signalSource: 'fusion' },
    { date: new Date('2025-02-15'), symbol: 'AAPL', side: 'sell', price: 172, quantity: 100, returnPercentage: 0.15, signalSource: 'fusion' },
    { date: new Date('2025-03-01'), symbol: 'MSFT', side: 'buy', price: 350, quantity: 50, returnPercentage: 0.08, signalSource: 'news' },
    { date: new Date('2025-04-01'), symbol: 'MSFT', side: 'sell', price: 378, quantity: 50, returnPercentage: 0.08, signalSource: 'news' },
    { date: new Date('2025-03-15'), symbol: 'TSLA', side: 'buy', price: 240, quantity: 30, returnPercentage: -0.05, signalSource: 'smart_money' },
    { date: new Date('2025-05-01'), symbol: 'TSLA', side: 'sell', price: 228, quantity: 30, returnPercentage: -0.05, signalSource: 'smart_money' },
  ];

  const mockHoldings: HoldingSnapshot[] = [
    { date: new Date('2025-06-01'), symbol: 'AAPL', allocation: 0.30, returnPercentage: 0.12, contribution: 0.036 },
    { date: new Date('2025-06-01'), symbol: 'MSFT', allocation: 0.25, returnPercentage: 0.08, contribution: 0.020 },
    { date: new Date('2025-06-01'), symbol: 'TSLA', allocation: 0.15, returnPercentage: -0.05, contribution: -0.008 },
    { date: new Date('2025-06-01'), symbol: 'SPY', allocation: 0.30, returnPercentage: 0.05, contribution: 0.015 },
  ];

  beforeEach(() => {
    service = new PerformanceAttributionService();
  });

  describe('generateReport', () => {
    it('should generate a complete attribution report', () => {
      const result = service.generateReport({
        from: new Date('2025-01-01'),
        to: new Date('2025-06-01'),
        trades: mockTrades,
        holdings: mockHoldings,
        benchmarkReturns: [0.01, 0.02, -0.01, 0.015, 0.01],
        initialValue: 100000,
        finalValue: 110000,
      });

      expect(result.totalReturn).toBe(10);
      expect(result.attribution).toBeDefined();
      expect(result.agentPerformance.length).toBeGreaterThan(0);
      expect(result.assetBreakdown.length).toBe(4);
    });

    it('should calculate agent performance correctly', () => {
      const result = service.generateReport({
        from: new Date('2025-01-01'),
        to: new Date('2025-06-01'),
        trades: mockTrades,
        holdings: mockHoldings,
        benchmarkReturns: [0.01, 0.02, -0.01, 0.015, 0.01],
        initialValue: 100000,
        finalValue: 110000,
      });

      const fusionAgent = result.agentPerformance.find(a => a.agentName === 'fusion');
      expect(fusionAgent).toBeDefined();
      expect(fusionAgent!.tradesFollowed).toBe(2);
      expect(fusionAgent!.returnWhenFollowed).toBeGreaterThan(0);
    });

    it('should handle empty trades', () => {
      const result = service.generateReport({
        from: new Date('2025-01-01'),
        to: new Date('2025-06-01'),
        trades: [],
        holdings: mockHoldings,
        benchmarkReturns: [0.01],
        initialValue: 100000,
        finalValue: 100000,
      });

      expect(result.totalReturn).toBe(0);
      expect(result.agentPerformance).toHaveLength(0);
    });

    it('should handle empty holdings', () => {
      const result = service.generateReport({
        from: new Date('2025-01-01'),
        to: new Date('2025-06-01'),
        trades: mockTrades,
        holdings: [],
        benchmarkReturns: [0.01],
        initialValue: 100000,
        finalValue: 110000,
      });

      expect(result.assetBreakdown).toHaveLength(0);
    });
  });
});
