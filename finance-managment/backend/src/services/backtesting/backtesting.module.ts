import { Module } from '@nestjs/common';
import { BacktestingEngine } from './backtesting.engine';
import { BacktestingController } from './backtesting.controller';

@Module({
  controllers: [BacktestingController],
  providers: [BacktestingEngine],
  exports: [BacktestingEngine],
})
export class BacktestingModule {}
