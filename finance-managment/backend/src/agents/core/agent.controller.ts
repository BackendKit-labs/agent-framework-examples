import { Controller, Post, Get, Body } from '@nestjs/common';
import { AgentEngineService } from './agent-engine.service';

@Controller('agents')
export class AgentController {
  constructor(private readonly agentEngine: AgentEngineService) {}

  @Get('status')
  async status() {
    return {
      status: 'running',
      engine: 'deepseek-chat',
      agents: ['orchestrator', 'market-analyzer', 'smart-money-tracker', 'portfolio-manager'],
      tools: ['get_stock_price', 'get_portfolio_summary', 'get_news_sentiment', 'get_smart_money_signal'],
    };
  }

  @Post('analyze')
  async analyze(@Body() body: { request: string }) {
    if (!body.request) {
      return { status: 'error', message: 'Request is required' };
    }
    
    const startTime = Date.now();
    const { result, steps } = await this.agentEngine.analyze(body.request);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    return {
      status: 'success',
      request: body.request,
      result,
      steps,
      duration: `${duration}s`,
      timestamp: new Date().toISOString(),
    };
  }
}
