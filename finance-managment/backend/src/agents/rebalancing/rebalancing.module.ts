import { Module } from '@nestjs/common';
import { RebalancingAgent } from './rebalancing.agent';

@Module({
  providers: [RebalancingAgent],
  exports: [RebalancingAgent],
})
export class RebalancingModule {}
