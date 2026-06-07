import { Module, OnModuleInit } from '@nestjs/common';
import { MarketAnalyzerAgent } from './market-analyzer.agent';

@Module({
  providers: [MarketAnalyzerAgent],
  exports: [MarketAnalyzerAgent],
})
export class MarketAnalyzerModule implements OnModuleInit {
  constructor(private readonly agent: MarketAnalyzerAgent) {}
  async onModuleInit() {
    await this.agent.onModuleInit();
  }
}
