import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class PriceSimulatorService {
  private readonly logger = new Logger(PriceSimulatorService.name);

  // Precios simulados para assets del seed
  private prices: Record<string, { price: number; change: number }> = {
    AAPL: { price: 198.50, change: 0 },
    MSFT: { price: 425.30, change: 0 },
    GOOGL: { price: 175.80, change: 0 },
    AMZN: { price: 185.20, change: 0 },
    TSLA: { price: 245.60, change: 0 },
    BTC: { price: 67500.00, change: 0 },
    ETH: { price: 3450.00, change: 0 },
    SPY: { price: 520.40, change: 0 },
    QQQ: { price: 445.20, change: 0 },
    TLT: { price: 92.30, change: 0 },
  };

  constructor(private readonly gateway: NotificationsGateway) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  simulatePriceUpdates() {
    for (const [symbol, data] of Object.entries(this.prices)) {
      // Simular movimiento aleatorio de precio (±2%)
      const volatility = symbol === 'BTC' || symbol === 'ETH' ? 0.03 : 0.01;
      const movement = data.price * (Math.random() - 0.5) * 2 * volatility;
      const newPrice = Math.max(0.01, data.price + movement);
      const change = ((newPrice - data.price) / data.price) * 100;

      data.price = newPrice;
      data.change = change;

      this.gateway.broadcastPriceUpdate({
        symbol,
        price: Math.round(newPrice * 100) / 100,
        change: Math.round(change * 100) / 100,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
