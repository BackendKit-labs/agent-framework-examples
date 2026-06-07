import { Global, Module } from '@nestjs/common';
import { SignalFusionEngine } from './signal-fusion.engine';
import { SignalFusionController } from './signal-fusion.controller';

@Global()
@Module({
  controllers: [SignalFusionController],
  providers: [SignalFusionEngine],
  exports: [SignalFusionEngine],
})
export class SignalFusionModule {}
