import { Module } from '@nestjs/common';
import { PortfolioManagerAgent } from './portfolio-manager.agent';

@Module({
  providers: [PortfolioManagerAgent],
  exports: [PortfolioManagerAgent],
})
export class PortfolioManagerModule {}
