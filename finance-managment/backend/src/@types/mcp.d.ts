declare module '@modelcontextprotocol/sdk/client/index.js' {
  export class Client {
    constructor(params: { name: string; version: string });
    connect(transport: any): Promise<void>;
    callTool(params: { name: string; arguments: any }): Promise<any>;
  }
}

declare module '@modelcontextprotocol/sdk/client/stdio.js' {
  export class StdioClientTransport {
    constructor(params: { command: string; args: string[] });
  }
}
