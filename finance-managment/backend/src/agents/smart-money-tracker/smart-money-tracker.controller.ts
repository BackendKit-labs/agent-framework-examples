import { Controller, Post, Body } from '@nestjs/common';
import { SmartMoneyTrackerAgent } from './smart-money-tracker.agent';

@Controller('agents/smart-money-tracker')
export class SmartMoneyTrackerController {
  constructor(private readonly agent: SmartMoneyTrackerAgent) {}

  @Post('generate-signal')
  async generateSignal(@Body() body: { symbol: string }) {
    if (!body.symbol) {
      return { status: 'error', message: 'Symbol is required' };
    }
    const signal = await this.agent.generateSmartMoneySignal(body.symbol.toUpperCase());
    return { status: 'success', signal };
  }
}
