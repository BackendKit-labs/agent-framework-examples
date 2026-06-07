import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NewsResearchAgent {
  public readonly name = 'news-research';
  public readonly description = 'Conecta al servidor MCP externo de noticias para análisis de sentimiento';
  private readonly logger = new Logger(NewsResearchAgent.name);

  constructor() {
    this.logger.log('NewsResearchAgent initialized');
  }

  async getNewsSentiment(_ticker: string) {
    // TODO: Connect to news-research-mcp via stdio MCP client
    return { ticker: _ticker, sentiment: 0, sources: [] as any[], timestamp: new Date().toISOString() };
  }
}
