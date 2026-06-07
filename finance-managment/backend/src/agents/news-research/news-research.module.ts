import { Module } from '@nestjs/common';
import { NewsResearchAgent } from './news-research.agent';

@Module({
  providers: [NewsResearchAgent],
  exports: [NewsResearchAgent],
})
export class NewsResearchModule {}
