import { Module } from '@nestjs/common';
import { PerformanceAttributionService } from './performance.attribution';

@Module({
  providers: [PerformanceAttributionService],
  exports: [PerformanceAttributionService],
})
export class PerformanceModule {}
