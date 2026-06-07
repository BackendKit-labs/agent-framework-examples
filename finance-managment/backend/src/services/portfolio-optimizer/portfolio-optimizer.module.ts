import { Module } from '@nestjs/common';
import { PortfolioOptimizerService } from './portfolio-optimizer.service';

@Module({
  providers: [PortfolioOptimizerService],
  exports: [PortfolioOptimizerService],
})
export class PortfolioOptimizerModule {}
