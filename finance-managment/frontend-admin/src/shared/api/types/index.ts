// Auth
export interface LoginRequest { email: string; password: string; }
export interface RegisterRequest { email: string; password: string; name: string; }
export interface AuthResponse { user: { id: string; email: string; name: string; role: string }; accessToken: string; refreshToken: string; }

// Wallets
export interface Wallet {
  id: string;
  name: string;
  description: string | null;
  totalValue: number;
  totalReturn: number;
  portfolios?: Portfolio[]; // backend returns full array via TypeORM relation
  portfolioCount?: number;  // kept for optional manual overrides
  createdAt: string;
}
export interface Portfolio { id: string; name: string; strategy: string | null; totalValue: number; targetAllocations: Record<string, number> | null; holdings: Holding[]; }
export interface Holding { id: string; asset: { symbol: string; name: string; type: string; currentPrice?: number; dailyChange?: number }; quantity: number; averageBuyPrice: number; currentValue: number; returnPercentage: number; }

// Fusion
export type FusedAction = 'STRONG_BUY' | 'CAUTIOUS_BUY' | 'HOLD' | 'CAUTIOUS_SELL' | 'STRONG_SELL' | 'CONFLICT_HOLD';
export interface FusedSignal { symbol: string; action: FusedAction; score: number; confidence: number; contributions: Array<{ source: string; score: number; weight: number }>; conflict: any; rationale: string; timestamp: string; }

// Smart Money
export type SmartMoneySignalSource = 'FORM_4' | 'WHALE' | 'ETF_FLOW';
export interface SmartMoneySignal { id: string; symbol: string; signalType: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; conviction: number; source: SmartMoneySignalSource; netFlow: number; investorCount: number; backingInvestors: Array<{ name: string; fundType: string; positionChange: number }>; detectedAt: string; }
export interface TrackedInvestor { id: string; name: string; fundType: string; cik: string | null; description: string | null; knownStrategy: string[]; historicalAccuracy: number | null; }

// Backtesting — mirrors BacktestResult + BacktestMetrics from backtesting.engine.ts
export interface BacktestResult {
  strategy: string;
  period: { from: string; to: string };
  benchmark: string;
  initialCapital: number;
  finalCapital: number;
  totalReturn: number;
  benchmarkReturn: number;
  // Extra fields appended by BacktestingController (real price data from Yahoo Finance)
  currentPrice?: number;
  highPrice?: number;
  lowPrice?: number;
  priceCount?: number;
  _dataSource?: string;
  _note?: string;
  metrics: {
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
    averageHoldingPeriod: number;
    averageWinReturn: number;
    averageLossReturn: number;
    profitFactor: number;
  };
  trades?: Array<{
    entryDate: string;
    exitDate?: string | null;
    symbol: string;
    side: string;
    entryPrice: number;
    exitPrice?: number | null;
    quantity: number;
    returnPercentage: number;
    signalSource: string;
    status: string;
  }>;
  equityCurve?: Array<{ date: string; value: number; benchmark: number }>;
}

// Risk
export interface RiskRules { maxSingleAssetAllocation: number; maxSectorAllocation: number; defaultStopLoss: number; defaultTakeProfit: number; maxDrawdown: number; maxVar95: number; minCashReserve: number; }

// Performance
export interface AttributionReport { period: { from: string; to: string }; totalReturn: number; attribution: { marketMovement: number; assetAllocation: number; securitySelection: number; tradingActivity: number; taxImpact: number; }; agentPerformance: Array<{ agentName: string; tradesFollowed: number; returnWhenFollowed: number; accuracy: number; }>; }

// Fusion profiles
export interface FusionProfile { id: string; name: string; weights: Record<string, number>; }

// Co-investment
export interface CoInvestmentCluster { direction: string; investorCount: number; totalCapital: number; topInvestors: string[]; averageConviction: number; signalStrength: string; }
