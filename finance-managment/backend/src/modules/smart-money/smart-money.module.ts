import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmartMoneySignal } from './entities/smart-money-signal.entity';
import { TrackedInvestor } from './entities/tracked-investor.entity';
import { SmartMoneyController } from './smart-money.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SmartMoneySignal, TrackedInvestor])],
  controllers: [SmartMoneyController],
  exports: [TypeOrmModule],
})
export class SmartMoneyModule {}
