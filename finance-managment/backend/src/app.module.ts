import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// Agents
import { AgentOrchestratorModule } from './agents/core/agent-orchestrator.module';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WalletsModule } from './modules/wallets/wallet.module';
import { AssetsModule } from './modules/assets/assets.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SmartMoneyModule } from './modules/smart-money/smart-money.module';
import { AlertsModule } from './modules/alerts/alerts.module';

// Services
import { SignalFusionModule } from './services/signal-fusion/signal-fusion.module';
import { RiskManagerModule } from './services/risk-manager/risk-manager.module';
import { TaxHarvestModule } from './services/tax-harvest/tax-harvest.module';
import { BacktestingModule } from './services/backtesting/backtesting.module';
import { PerformanceModule } from './services/performance/performance.module';
import { PortfolioOptimizerModule } from './services/portfolio-optimizer/portfolio-optimizer.module';

// MCP Gateway
import { McpGatewayModule } from './mcp-gateway/mcp-gateway.module';

// Shared
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    // Core
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USER', 'postgres'),
        password: config.get('DB_PASSWORD', 'postgres'),
        database: config.get('DB_NAME', 'finance_portfolio'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: config.get('NODE_ENV') === 'development',
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        extra: {
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        },
        poolErrorHandler: (err: any) => {
          console.error('PostgreSQL pool error:', err.message);
        },
      }),
    }),
    ScheduleModule.forRoot(),

    // Agents
    AgentOrchestratorModule,

    // Modules
    AuthModule,
    UsersModule,
    WalletsModule,
    AssetsModule,
    TransactionsModule,
    NotificationsModule,
    SmartMoneyModule,
    AlertsModule,

    // Services
    SignalFusionModule,
    RiskManagerModule,
    TaxHarvestModule,
    BacktestingModule,
    PerformanceModule,
    PortfolioOptimizerModule,

    // MCP Gateway
    McpGatewayModule,

    // Shared
    SharedModule,
  ],
})
export class AppModule {}
