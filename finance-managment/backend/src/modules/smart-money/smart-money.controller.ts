import { Controller, Get, Param, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmartMoneySignal } from './entities/smart-money-signal.entity';
import { TrackedInvestor } from './entities/tracked-investor.entity';

@Controller('smart-money')
export class SmartMoneyController {
  constructor(
    @InjectRepository(SmartMoneySignal) private signalRepo: Repository<SmartMoneySignal>,
    @InjectRepository(TrackedInvestor) private investorRepo: Repository<TrackedInvestor>,
  ) {}

  @Get('signals')
  async getSignals(
    @Query('symbol') symbol?: string,
    @Query('type') type?: string,
    @Query('minConviction') minConviction?: number,
  ) {
    const where: any = {};
    if (symbol) where.symbol = symbol.toUpperCase();
    if (type) where.signalType = type;
    if (minConviction) where.conviction = MoreThan(minConviction / 100);

    const [signals, total] = await this.signalRepo.findAndCount({
      where,
      order: { detectedAt: 'DESC' },
      take: 50,
    });

    return { signals, total };
  }

  @Get('investors')
  async getInvestors() {
    return this.investorRepo.find({ where: { isActive: true } });
  }

  @Get('investors/:name')
  async getInvestor(@Param('name') name: string) {
    return this.investorRepo.findOneBy({ name: decodeURIComponent(name) });
  }

  @Get('co-investments')
  async getCoInvestments(
    @Query('minInvestors') minInvestors = 3,
    @Query('minCapital') minCapital = 1000000,
    @Query('direction') direction?: string,
  ) {
    // Simulated co-investment clusters
    const investors = await this.investorRepo.find({ where: { isActive: true } });
    return {
      clusters: [
        {
          symbol: 'AAPL',
          direction: 'accumulating',
          investorCount: 4,
          totalCapital: 2500000000,
          topInvestors: ['Berkshire Hathaway', 'Bridgewater Associates', 'BlackRock', 'Vanguard'],
          averageConviction: 0.72,
          signalStrength: 'MODERATE',
        },
        {
          symbol: 'TSLA',
          direction: 'accumulating',
          investorCount: 3,
          totalCapital: 1800000000,
          topInvestors: ['ARK Invest', 'Tiger Global', 'Third Point'],
          averageConviction: 0.68,
          signalStrength: 'MODERATE',
        },
        {
          symbol: 'BTC',
          direction: 'distributing',
          investorCount: 3,
          totalCapital: 3200000000,
          topInvestors: ['Renaissance Technologies', 'Bridgewater Associates', 'Scion Asset Management'],
          averageConviction: 0.55,
          signalStrength: 'WEAK',
        },
      ],
      totalInvestors: investors.length,
    };
  }

  @Get('portfolio-impact/:portfolioId')
  async getPortfolioImpact(@Param('portfolioId') portfolioId: string) {
    const signals = await this.signalRepo.find({ order: { detectedAt: 'DESC' }, take: 10 });
    return {
      portfolioId,
      totalSignals: signals.length,
      actionableSignals: signals.filter(s => s.conviction > 0.5).length,
      signals,
    };
  }
}

// Needed for the query builder
import { MoreThan } from 'typeorm';
