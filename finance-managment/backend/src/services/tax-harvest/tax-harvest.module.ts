import { Module } from '@nestjs/common';
import { TaxHarvestService } from './tax-harvest.service';

@Module({
  providers: [TaxHarvestService],
  exports: [TaxHarvestService],
})
export class TaxHarvestModule {}
