import { Module } from '@nestjs/common';
import { McpServerGateway } from './mcp-server.gateway';

@Module({
  providers: [McpServerGateway],
})
export class McpGatewayModule {}
