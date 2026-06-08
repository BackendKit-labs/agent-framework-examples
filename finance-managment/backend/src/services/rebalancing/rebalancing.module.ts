import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Portfolio } from '../../modules/wallets/entities/portfolio.entity';
import { RebalancingService } from './rebalancing.service';
import { RebalancingController } from './rebalancing.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Portfolio])],
  controllers: [RebalancingController],
  providers: [RebalancingService],
  exports: [RebalancingService],
})
export class RebalancingModule {}
