import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortfolioManagerAgent } from './portfolio-manager.agent';
import { Portfolio } from '../../modules/wallets/entities/portfolio.entity';
import { Holding } from '../../modules/wallets/entities/holding.entity';
import { RiskManagerModule } from '../../services/risk-manager/risk-manager.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Portfolio, Holding]),
    RiskManagerModule,
    // SignalFusionModule is @Global — no explicit import needed
  ],
  providers: [PortfolioManagerAgent],
  exports: [PortfolioManagerAgent],
})
export class PortfolioManagerModule {}
