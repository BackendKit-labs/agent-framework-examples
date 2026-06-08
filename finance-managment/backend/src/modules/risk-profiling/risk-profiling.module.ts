import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRiskProfile } from './entities/user-risk-profile.entity';
import { RiskProfilingService } from './risk-profiling.service';
import { RiskProfilingController } from './risk-profiling.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserRiskProfile])],
  controllers: [RiskProfilingController],
  providers: [RiskProfilingService],
  exports: [RiskProfilingService],
})
export class RiskProfilingModule {}
