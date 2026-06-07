import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmartMoneyTrackerAgent } from './smart-money-tracker.agent';
import { SmartMoneyTrackerController } from './smart-money-tracker.controller';
import { SmartMoneySignal } from '../../modules/smart-money/entities/smart-money-signal.entity';
import { TrackedInvestor } from '../../modules/smart-money/entities/tracked-investor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SmartMoneySignal, TrackedInvestor])],
  controllers: [SmartMoneyTrackerController],
  providers: [SmartMoneyTrackerAgent],
  exports: [SmartMoneyTrackerAgent],
})
export class SmartMoneyTrackerModule {}
