import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { BacktestingEngine, BacktestSignal } from './backtesting.engine';

@Controller('backtesting')
export class BacktestingController {
  private readonly logger = new Logger(BacktestingController.name);

  constructor(private readonly engine: BacktestingEngine) {}

  @Get('strategies')
  async getStrategies() {
    return {
      strategies: [
        { id: 'fusion-default', name: 'Signal Fusion Default', description: 'Follow fused signals from all agents with default weights' },
        { id: 'follow-ark', name: 'Follow ARK Invest', description: 'Mirror ARK Invest 13F filings' },
        { id: 'follow-berkshire', name: 'Follow Berkshire Hathaway', description: 'Mirror Berkshire Hathaway 13F filings' },
        { id: 'value-investor', name: 'Value Investor', description: 'Heavy weight on 13F data, low weight on news' },
        { id: 'crypto-trader', name: 'Crypto Trader', description: 'Heavy weight on whale transactions and technical analysis' },
      ],
    };
  }

  @Post('run')
  async runBacktest(@Body() params: {
    strategy: string;
    symbol: string;
    initialCapital: number;
    from?: string;
    to?: string;
  }) {
    const symbol = params.symbol.toUpperCase();
    this.logger.log(`Running backtest for ${symbol}...`);

    // 1. Fetch real historical prices from Yahoo Finance
    const prices = await this.fetchHistoricalPrices(symbol);
    
    if (!prices || prices.length < 20) {
      this.logger.warn(`Not enough data for ${symbol}, using simulated data`);
      return this.runSimulatedBacktest(params);
    }

    this.logger.log(`Fetched ${prices.length} days of historical data for ${symbol}`);

    // 2. Generate signals based on real price movements
    const signals: BacktestSignal[] = [];
    for (let i = 20; i < prices.length; i++) {
      const price = prices[i];
      const prevPrice = prices[i - 1];
      const change = (price - prevPrice) / prevPrice;

      // Simple strategy: buy on 5% drop, sell on 5% rise
      if (change < -0.05 && Math.random() < 0.3) {
        signals.push({
          date: new Date(),
          symbol,
          action: 'buy',
          price,
          confidence: 0.6 + Math.random() * 0.3,
          source: params.strategy,
        });
      } else if (change > 0.05 && Math.random() < 0.3) {
        signals.push({
          date: new Date(),
          symbol,
          action: 'sell',
          price,
          confidence: 0.6 + Math.random() * 0.3,
          source: params.strategy,
        });
      }
    }

    // 3. Run backtest with real prices
    const result = await this.engine.runBacktest({
      strategy: params.strategy,
      signals,
      initialCapital: params.initialCapital || 100000,
    });

    // Get current price and price range
    const currentPrice = prices.length > 0 ? prices[prices.length - 1] : 0;
    const highPrice = prices.length > 0 ? Math.max(...prices) : 0;
    const lowPrice = prices.length > 0 ? Math.min(...prices) : 0;

    return {
      ...result,
      currentPrice,
      highPrice,
      lowPrice,
      priceCount: prices.length,
      _dataSource: 'Yahoo Finance (real historical prices)',
      _note: 'Prices are real, but trading signals are simulated for demo purposes',
    };
  }

  /**
   * Fetch historical prices from Yahoo Finance (public, no API key)
   */
  private async fetchHistoricalPrices(symbol: string): Promise<number[]> {
    try {
      const endDate = Math.floor(Date.now() / 1000);
      const startDate = endDate - 365 * 86400; // 1 year ago

      const response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startDate}&period2=${endDate}&interval=1d`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } },
      );

      if (!response.ok) {
        this.logger.warn(`Yahoo Finance returned ${response.status} for ${symbol}`);
        return [];
      }

      const data: any = await response.json();
      const quotes = data?.chart?.result?.[0]?.indicators?.quote?.[0];
      
      if (!quotes?.close) return [];

      // Filter out null values and return closing prices
      return quotes.close.filter((p: number | null) => p !== null) as number[];
    } catch (error) {
      this.logger.error(`Failed to fetch prices for ${symbol}:`, (error as Error).message);
      return [];
    }
  }

  /**
   * Fallback: simulated backtest when no real data available
   */
  private async runSimulatedBacktest(params: any) {
    const signals: BacktestSignal[] = [];
    const baseDate = new Date(Date.now() - 365 * 86400000);
    const endDate = new Date();

    let price = 100 + Math.random() * 200;
    for (let d = new Date(baseDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      if (d.getDay() === 0 || d.getDay() === 6) continue;

      price *= (1 + (Math.random() - 0.48) * 0.03);

      if (Math.random() < 0.05) {
        signals.push({
          date: new Date(d),
          symbol: params.symbol,
          action: Math.random() > 0.5 ? 'buy' : 'sell',
          price: Math.round(price * 100) / 100,
          confidence: 0.5 + Math.random() * 0.4,
          source: params.strategy,
        });
      }
    }

    const result = await this.engine.runBacktest({
      strategy: params.strategy,
      signals,
      initialCapital: params.initialCapital || 100000,
    });

    return {
      ...result,
      currentPrice: 0,
      _dataSource: 'Simulated data (Yahoo Finance unavailable)',
      _note: 'Connect to Yahoo Finance for real backtesting',
    };
  }
}
