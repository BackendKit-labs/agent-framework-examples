import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from './entities/wallet.entity';
import { Portfolio } from './entities/portfolio.entity';
import { Holding } from './entities/holding.entity';
import { PortfolioSnapshot } from './entities/portfolio-snapshot.entity';
import { WalletController } from './wallet.controller';
import { PortfolioController } from './portfolio.controller';
import { HoldingsController } from './holdings.controller';
import { WalletService } from './wallet.service';
import { PortfolioService } from './portfolio.service';

@Module({
  imports: [TypeOrmModule.forFeature([Wallet, Portfolio, Holding, PortfolioSnapshot])],
  controllers: [WalletController, PortfolioController, HoldingsController],
  providers: [WalletService, PortfolioService],
  exports: [TypeOrmModule],
})
export class WalletsModule {}
