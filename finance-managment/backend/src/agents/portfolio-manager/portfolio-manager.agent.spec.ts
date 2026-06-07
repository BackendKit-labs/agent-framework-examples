import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PortfolioManagerAgent, PortfolioPosition } from './portfolio-manager.agent';
import { Portfolio } from '../../modules/wallets/entities/portfolio.entity';
import { Holding } from '../../modules/wallets/entities/holding.entity';
import { SignalFusionEngine, FusedSignal } from '../../services/signal-fusion/signal-fusion.engine';
import { RiskManagerService } from '../../services/risk-manager/risk-manager.service';

const makeFused = (overrides: Partial<FusedSignal> = {}): FusedSignal => ({
  symbol: 'AAPL',
  action: 'HOLD',
  score: 0.1,
  confidence: 0.6,
  contributions: [],
  conflict: null,
  rationale: 'test rationale',
  timestamp: new Date().toISOString(),
  ...overrides,
});

const makePosition = (overrides: Partial<PortfolioPosition> = {}): PortfolioPosition => ({
  symbol: 'AAPL',
  value: 10000,
  allocation: 0.10,
  returnPercentage: 0,
  quantity: 50,
  averageBuyPrice: 200,
  currentPrice: 200,
  ...overrides,
});

describe('PortfolioManagerAgent', () => {
  let agent: PortfolioManagerAgent;
  let riskManager: RiskManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioManagerAgent,
        RiskManagerService,
        SignalFusionEngine,
        { provide: getRepositoryToken(Portfolio), useValue: { findOne: jest.fn() } },
        { provide: getRepositoryToken(Holding), useValue: {} },
      ],
    }).compile();

    agent = module.get(PortfolioManagerAgent);
    riskManager = module.get(RiskManagerService);
  });

  describe('getContextualRecommendation', () => {
    it('should keep HOLD when no position and score is neutral', () => {
      const result = agent.getContextualRecommendation(makeFused({ action: 'HOLD' }), null);
      expect(result.finalAction).toBe('HOLD');
      expect(result.overrides).toHaveLength(0);
    });

    it('should override HOLD to CAUTIOUS_SELL when stop-loss is triggered', () => {
      const result = agent.getContextualRecommendation(
        makeFused({ action: 'HOLD' }),
        makePosition({ returnPercentage: -0.20 }), // -20%, limit is -15%
      );
      expect(result.finalAction).toBe('CAUTIOUS_SELL');
      expect(result.overrides[0]).toContain('Stop-loss triggered');
    });

    it('should override CONFLICT_HOLD to CAUTIOUS_SELL when stop-loss is triggered', () => {
      const result = agent.getContextualRecommendation(
        makeFused({ action: 'CONFLICT_HOLD' }),
        makePosition({ returnPercentage: -0.18 }),
      );
      expect(result.finalAction).toBe('CAUTIOUS_SELL');
    });

    it('should not override HOLD when position is within acceptable loss', () => {
      const result = agent.getContextualRecommendation(
        makeFused({ action: 'HOLD' }),
        makePosition({ returnPercentage: -0.10 }), // -10%, within -15% limit
      );
      expect(result.finalAction).toBe('HOLD');
    });

    it('should add take-profit note without changing action', () => {
      const result = agent.getContextualRecommendation(
        makeFused({ action: 'HOLD' }),
        makePosition({ returnPercentage: 0.35 }), // +35%, above 30% target
      );
      expect(result.finalAction).toBe('HOLD');
      expect(result.overrides.some(o => o.includes('Take-profit'))).toBe(true);
    });

    it('should not override a STRONG_BUY signal even with a losing position', () => {
      const result = agent.getContextualRecommendation(
        makeFused({ action: 'STRONG_BUY', score: 0.8 }),
        makePosition({ returnPercentage: -0.20 }),
      );
      // Stop-loss only overrides HOLD / CONFLICT_HOLD — not directional signals
      expect(result.finalAction).toBe('STRONG_BUY');
    });

    it('should preserve fusedAction alongside finalAction', () => {
      const result = agent.getContextualRecommendation(
        makeFused({ action: 'HOLD' }),
        makePosition({ returnPercentage: -0.20 }),
      );
      expect(result.fusedAction).toBe('HOLD');
      expect(result.finalAction).toBe('CAUTIOUS_SELL');
    });

    it('should respect custom user stop-loss rules', () => {
      riskManager.updateRules('user-tight', { defaultStopLoss: -0.05 });
      const result = agent.getContextualRecommendation(
        makeFused({ action: 'HOLD' }),
        makePosition({ returnPercentage: -0.08 }), // -8%, above default -15% but below custom -5%
        'user-tight',
      );
      expect(result.finalAction).toBe('CAUTIOUS_SELL');
      expect(result.overrides[0]).toContain('-5%');
    });
  });
});
