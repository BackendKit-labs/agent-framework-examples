import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentEngineService } from './agent-engine.service';
import { AgentController } from './agent.controller';
import { PortfolioManagerModule } from '../portfolio-manager/portfolio-manager.module';
import { RebalancingModule } from '../rebalancing/rebalancing.module';
import { MarketAnalyzerModule } from '../market-analyzer/market-analyzer.module';
import { TradeExecutorModule } from '../trade-executor/trade-executor.module';
import { NewsResearchModule } from '../news-research/news-research.module';
import { SmartMoneyTrackerModule } from '../smart-money-tracker/smart-money-tracker.module';
import { Wallet } from '../../modules/wallets/entities/wallet.entity';
import { Portfolio } from '../../modules/wallets/entities/portfolio.entity';
import { Holding } from '../../modules/wallets/entities/holding.entity';
import { Asset } from '../../modules/assets/asset.entity';
import { SmartMoneySignal } from '../../modules/smart-money/entities/smart-money-signal.entity';
import { TrackedInvestor } from '../../modules/smart-money/entities/tracked-investor.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, Portfolio, Holding, Asset, SmartMoneySignal, TrackedInvestor]),
    PortfolioManagerModule,
    RebalancingModule,
    MarketAnalyzerModule,
    TradeExecutorModule,
    NewsResearchModule,
    SmartMoneyTrackerModule,
  ],
  controllers: [AgentController],
  providers: [AgentEngineService],
  exports: [AgentEngineService],
})
export class AgentOrchestratorModule {}
