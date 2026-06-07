import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { SmartMoneySignal, SignalType, SignalSource } from '../../modules/smart-money/entities/smart-money-signal.entity';
import { TrackedInvestor } from '../../modules/smart-money/entities/tracked-investor.entity';

export interface CoInvestmentCluster {
  direction: 'accumulating' | 'distributing';
  investorCount: number;
  totalCapital: number;
  topInvestors: string[];
  averageConviction: number;
  signalStrength: 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY_STRONG';
}

export interface SmartMoneyResult {
  symbol: string;
  signalType: SignalType;
  conviction: number;
  source: SignalSource;
  backingInvestors: Array<{
    name: string;
    fundType: string;
    positionChange: number;
    currentValue: number;
    conviction: number;
  }>;
  netFlow: number;
  investorCount: number;
  coInvestmentCluster: CoInvestmentCluster | null;
  filingPeriod: string;
  detectedAt: string;
  expiresAt: string;
}

@Injectable()
export class SmartMoneyTrackerAgent {
  public readonly name = 'smart-money-tracker';
  public readonly description = 'Monitorea movimientos de inversores institucionales y ballenas';
  private readonly logger = new Logger(SmartMoneyTrackerAgent.name);

  constructor(
    @InjectRepository(SmartMoneySignal) private signalRepo: Repository<SmartMoneySignal>,
    @InjectRepository(TrackedInvestor) private investorRepo: Repository<TrackedInvestor>,
  ) {
    this.logger.log('SmartMoneyTrackerAgent initialized');
  }

  async generateSmartMoneySignal(symbol: string): Promise<SmartMoneyResult> {
    this.logger.log(`Generating smart money signal for ${symbol}...`);
    
    // 1. Get all tracked investors
    const investors = await this.investorRepo.find({ where: { isActive: true } });
    this.logger.log(`Found ${investors.length} tracked investors`);

    // 2. Simulate 13F data for each investor (in production, fetch from smart-money-mcp)
    const backingInvestors = investors.slice(0, 3 + Math.floor(Math.random() * 5)).map(inv => ({
      name: inv.name,
      fundType: inv.fundType,
      positionChange: (Math.random() - 0.5) * 0.4, // -20% to +20%
      currentValue: Math.round(Math.random() * 100000000 * 100) / 100,
      conviction: inv.historicalAccuracy || 0.5 + Math.random() * 0.3,
    }));

    // 3. Calculate conviction score
    const conviction = this.calculateConviction(backingInvestors);

    // 4. Detect co-investment cluster (simplified — uses backing investors count)
    const cluster = this.classifySignalStrength(
      backingInvestors.length,
      backingInvestors.reduce((sum, inv) => sum + inv.currentValue, 0),
    );
    const coInvestmentCluster: CoInvestmentCluster | null = backingInvestors.length >= 3 ? {
      direction: backingInvestors.filter(i => i.positionChange > 0).length > backingInvestors.length / 2 ? 'accumulating' : 'distributing',
      investorCount: backingInvestors.length,
      totalCapital: backingInvestors.reduce((sum, inv) => sum + inv.currentValue, 0),
      topInvestors: backingInvestors.slice(0, 5).map(i => i.name),
      averageConviction: backingInvestors.reduce((sum, i) => sum + i.conviction, 0) / backingInvestors.length,
      signalStrength: cluster,
    } : null;

    // 5. Determine signal type
    const signalType = conviction > 0.3 ? SignalType.BULLISH : conviction < -0.3 ? SignalType.BEARISH : SignalType.NEUTRAL;

    // 6. Calculate net flow
    const netFlow = backingInvestors.reduce((sum, inv) => sum + inv.positionChange * inv.currentValue, 0);

    const result: SmartMoneyResult = {
      symbol,
      signalType,
      conviction: Math.abs(conviction),
      source: SignalSource.FORM_4,
      backingInvestors,
      netFlow: Math.round(netFlow * 100) / 100,
      investorCount: backingInvestors.length,
      coInvestmentCluster,
      filingPeriod: this.currentFilingPeriod(),
      detectedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 90 * 86400000).toISOString(),
    };

    // 7. Persist signal
    try {
      const signal = this.signalRepo.create({
        symbol,
        signalType,
        conviction: Math.abs(conviction),
        source: SignalSource.FORM_4,
        backingInvestors,
        netFlow: Math.round(netFlow * 100) / 100,
        investorCount: backingInvestors.length,
        coInvestmentCluster: cluster,
        filingPeriod: this.currentFilingPeriod(),
        detectedAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 86400000),
      });
      await this.signalRepo.save(signal);
    } catch (error) {
      this.logger.error(`Failed to persist signal for ${symbol}:`, (error as Error).message);
    }

    return result;
  }

  async getInvestorFilings(investorName: string): Promise<{ investor: string; holdings: any[]; totalValue: number }> {
    const investor = await this.investorRepo.findOneBy({ name: investorName });
    if (!investor) throw new Error(`Investor ${investorName} not found`);

    // Simulated holdings
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
    const holdings = symbols.slice(0, 3 + Math.floor(Math.random() * 3)).map(symbol => ({
      symbol,
      name: `${symbol} Inc.`,
      value: Math.round(Math.random() * 50000000 * 100) / 100,
      positionChange: (Math.random() - 0.5) * 0.3,
      allocation: Math.random() * 0.3,
    }));

    return {
      investor: investorName,
      holdings,
      totalValue: holdings.reduce((sum, h) => sum + h.value, 0),
    };
  }

  async detectCoInvestment(symbol: string, minInvestors = 3): Promise<CoInvestmentCluster | null> {
    const investors = await this.investorRepo.find({ where: { isActive: true } });
    if (investors.length < minInvestors) return null;

    // Simulate: some investors are accumulating, some distributing
    const accumulating = Math.floor(investors.length * (0.3 + Math.random() * 0.4));
    const totalCapital = Math.round(Math.random() * 1000000000 * 100) / 100;

    const strength = this.classifySignalStrength(Math.max(accumulating, investors.length - accumulating), totalCapital);

    return {
      direction: accumulating > investors.length / 2 ? 'accumulating' : 'distributing',
      investorCount: Math.max(accumulating, investors.length - accumulating),
      totalCapital,
      topInvestors: investors.slice(0, 5).map(i => i.name),
      averageConviction: 0.5 + Math.random() * 0.3,
      signalStrength: strength,
    };
  }

  private calculateConviction(investors: Array<{ positionChange: number; conviction: number }>): number {
    if (investors.length === 0) return 0;

    let score = 0;
    let totalConviction = 0;

    for (const inv of investors) {
      score += inv.positionChange * inv.conviction;
      totalConviction += inv.conviction;
    }

    return totalConviction > 0 ? score / totalConviction : 0;
  }

  private classifySignalStrength(investorCount: number, totalCapital: number): CoInvestmentCluster['signalStrength'] {
    if (investorCount >= 15 && totalCapital > 5_000_000_000) return 'VERY_STRONG';
    if (investorCount >= 8 && totalCapital > 500_000_000) return 'STRONG';
    if (investorCount >= 4 && totalCapital > 50_000_000) return 'MODERATE';
    return 'WEAK';
  }

  private currentFilingPeriod(): string {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3) + 1;
    return `${now.getFullYear()}-Q${quarter}`;
  }
}
