import { Controller, Get, Param, Patch, Body } from '@nestjs/common';
import { SignalFusionEngine, NormalizedSignal } from './signal-fusion.engine';

@Controller('fusion')
export class SignalFusionController {
  constructor(private readonly engine: SignalFusionEngine) {}

  @Get('portfolio/:portfolioId')
  async getPortfolioFusion(@Param('portfolioId') portfolioId: string) {
    // Simulated signals for demo — in production, these come from agents
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'BTC', 'ETH', 'SPY'];
    
    const signals = symbols.map(symbol => {
      const newsScore = (Math.random() - 0.5) * 2;
      const smScore = (Math.random() - 0.5) * 2;
      
      return this.engine.fuse([
        {
          symbol,
          source: 'news',
          direction: newsScore,
          magnitude: Math.abs(newsScore),
          confidence: 0.5 + Math.random() * 0.4,
          sourceWeight: 0.3,
          metadata: {},
          expiresAt: new Date(Date.now() + 86400000),
          rationale: `News sentiment for ${symbol}`,
        },
        {
          symbol,
          source: 'smart_money_13f',
          direction: smScore,
          magnitude: Math.abs(smScore),
          confidence: 0.6 + Math.random() * 0.3,
          sourceWeight: 0.35,
          metadata: {},
          expiresAt: new Date(Date.now() + 86400000 * 90),
          rationale: `Smart money signal for ${symbol}`,
        },
        {
          symbol,
          source: 'technical',
          direction: (Math.random() - 0.5) * 1.5,
          magnitude: 0.3 + Math.random() * 0.5,
          confidence: 0.4 + Math.random() * 0.3,
          sourceWeight: 0.1,
          metadata: {},
          expiresAt: new Date(Date.now() + 3600000 * 6),
          rationale: `Technical analysis for ${symbol}`,
        },
      ] as NormalizedSignal[]);
    });

    const summary = {
      totalAssets: signals.length,
      strongBuy: signals.filter(s => s.action === 'STRONG_BUY').length,
      cautiousBuy: signals.filter(s => s.action === 'CAUTIOUS_BUY').length,
      hold: signals.filter(s => s.action === 'HOLD').length,
      cautiousSell: signals.filter(s => s.action === 'CAUTIOUS_SELL').length,
      strongSell: signals.filter(s => s.action === 'STRONG_SELL').length,
      conflictHold: signals.filter(s => s.action === 'CONFLICT_HOLD').length,
      overallConfidence: signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length,
    };

    return { portfolioId, signals, summary };
  }

  @Get('asset/:symbol')
  async getAssetFusion(@Param('symbol') symbol: string, @Body('portfolioId') portfolioId?: string) {
    const newsScore = (Math.random() - 0.5) * 2;
    const smScore = (Math.random() - 0.5) * 2;

    return this.engine.fuse([
      {
        symbol,
        source: 'news',
        direction: newsScore,
        magnitude: Math.abs(newsScore),
        confidence: 0.5 + Math.random() * 0.4,
        sourceWeight: 0.3,
        metadata: {},
        expiresAt: new Date(Date.now() + 86400000),
        rationale: `News sentiment for ${symbol}`,
      },
      {
        symbol,
        source: 'smart_money_13f',
        direction: smScore,
        magnitude: Math.abs(smScore),
        confidence: 0.6 + Math.random() * 0.3,
        sourceWeight: 0.35,
        metadata: {},
        expiresAt: new Date(Date.now() + 86400000 * 90),
        rationale: `Smart money signal for ${symbol}`,
      },
    ] as NormalizedSignal[]);
  }

  @Get('profiles')
  async getProfiles() {
    return {
      profiles: [
        { id: 'value_investor', name: 'Value Investor', weights: { news: 0.20, smart_money_13f: 0.50, smart_money_form4: 0.15, smart_money_whale: 0.05, technical: 0.10 } },
        { id: 'growth_investor', name: 'Growth Investor', weights: { news: 0.35, smart_money_13f: 0.30, smart_money_form4: 0.10, smart_money_whale: 0.05, technical: 0.20 } },
        { id: 'crypto_trader', name: 'Crypto Trader', weights: { news: 0.20, smart_money_13f: 0.05, smart_money_form4: 0.05, smart_money_whale: 0.50, technical: 0.20 } },
        { id: 'conservative', name: 'Conservative', weights: { news: 0.25, smart_money_13f: 0.45, smart_money_form4: 0.15, smart_money_whale: 0.05, technical: 0.10 } },
      ],
    };
  }

  @Patch('weights')
  async updateWeights(@Body() weights: Record<string, number>) {
    return { status: 'updated', weights };
  }
}
