import { TaxHarvestService } from './tax-harvest.service';

describe('TaxHarvestService', () => {
  let service: TaxHarvestService;

  beforeEach(() => {
    service = new TaxHarvestService();
  });

  describe('recordPurchase', () => {
    it('should create a tax lot', () => {
      const lot = service.recordPurchase('AAPL', 100, 150);
      expect(lot.symbol).toBe('AAPL');
      expect(lot.quantity).toBe(100);
      expect(lot.purchasePrice).toBe(150);
    });
  });

  describe('recordSale', () => {
    it('should record a sale with FIFO method', () => {
      service.recordPurchase('AAPL', 100, 150);
      const gains = service.recordSale('AAPL', 50, 200);
      expect(gains).toHaveLength(1);
      expect(gains[0].gainLoss).toBe(2500); // (200 - 150) * 50
      expect(gains[0].isShortTerm).toBe(true);
    });

    it('should handle multiple lots with FIFO', () => {
      service.recordPurchase('AAPL', 50, 100);
      service.recordPurchase('AAPL', 50, 150);
      const gains = service.recordSale('AAPL', 75, 200);

      expect(gains).toHaveLength(2);
      expect(gains[0].gainLoss).toBe(5000); // (200 - 100) * 50
      expect(gains[1].gainLoss).toBe(1250); // (200 - 150) * 25
    });
  });

  describe('findHarvestOpportunities', () => {
    it('should find opportunities with unrealized losses', () => {
      service.recordPurchase('AAPL', 100, 200);
      service.recordPurchase('MSFT', 50, 500);
      service.updatePrices({ AAPL: 150, MSFT: 480 });

      const opportunities = service.findHarvestOpportunities(100);
      expect(opportunities.length).toBeGreaterThan(0);
      expect(opportunities[0].symbol).toBe('AAPL');
      expect(opportunities[0].unrealizedLoss).toBeLessThan(0);
    });

    it('should detect no wash-sale risk for old positions', () => {
      // Purchase was made more than 30 days ago
      const oldDate = new Date(Date.now() - 60 * 86400000);
      service.recordPurchase('AAPL', 100, 200, oldDate);
      service.updatePrices({ AAPL: 150 });

      const opportunities = service.findHarvestOpportunities(100);
      expect(opportunities[0].washSaleRisk).toBe(false);
    });
  });

  describe('getYearSummary', () => {
    it('should return summary of realized gains', () => {
      service.recordPurchase('AAPL', 100, 150);
      service.recordSale('AAPL', 100, 200);

      const summary = service.getYearSummary();
      expect(summary.shortTermGains).toBe(5000);
      expect(summary.totalTrades).toBe(1);
    });
  });
});
