import { Module } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { PriceSimulatorService } from './price-simulator.service';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
  providers: [NotificationsGateway, PriceSimulatorService],
  exports: [NotificationsGateway],
})
export class NotificationsModule {}
