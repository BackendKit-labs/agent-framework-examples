import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TradeExecutorAgent } from './trade-executor.agent';
import { Transaction } from '../../modules/transactions/transaction.entity';
import { Holding } from '../../modules/wallets/entities/holding.entity';
import { Asset } from '../../modules/assets/asset.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Holding, Asset])],
  providers: [TradeExecutorAgent],
  exports: [TradeExecutorAgent],
})
export class TradeExecutorModule {}
