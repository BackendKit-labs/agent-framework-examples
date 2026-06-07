import { Injectable, OnModuleInit, Logger } from '@nestjs/common';

@Injectable()
export class McpServerGateway implements OnModuleInit {
  private readonly logger = new Logger(McpServerGateway.name);

  async onModuleInit() {
    // TODO: Initialize @backendkit-labs/mcp-server
    this.logger.log('MCP Gateway placeholder — will start on port 3100');
  }
}
