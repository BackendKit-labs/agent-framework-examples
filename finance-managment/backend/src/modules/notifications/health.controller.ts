import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { createClient } from 'redis';

@Controller()
export class HealthController {
  private redisClient: ReturnType<typeof createClient> | null = null;

  constructor(
    @InjectDataSource() private dataSource: DataSource,
  ) {
    // Initialize Redis client once (not per request)
    try {
      this.redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
      this.redisClient.connect().catch(() => {});
    } catch {
      // Redis not available
    }
  }

  @Get('health')
  async check() {
    const checks: Record<string, string> = {};

    // Database check (lightweight)
    try {
      await this.dataSource.query('SELECT 1');
      checks.database = 'healthy';
    } catch {
      checks.database = 'unhealthy';
    }

    // Redis check (use existing connection)
    try {
      if (this.redisClient) {
        await this.redisClient.ping();
        checks.redis = 'healthy';
      } else {
        checks.redis = 'not_configured';
      }
    } catch {
      checks.redis = 'unhealthy';
    }

    const allHealthy = Object.values(checks).every(s => s === 'healthy');

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  @Get('metrics')
  async metrics() {
    // Basic metrics for Prometheus
    const dbResult = await this.dataSource.query(
      "SELECT count(*) as total FROM information_schema.tables WHERE table_schema = 'public'",
    );

    return {
      database_tables: parseInt(dbResult[0]?.total || '0'),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      node_version: process.version,
    };
  }
}
