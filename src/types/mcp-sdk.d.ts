declare module '@modelcontextprotocol/sdk' {
  export class McpClient {
    constructor(transport: any);
    initialize(): Promise<void>;
    getCapabilities(): Promise<any>;
    callTool(params: { name: string; arguments: any }): Promise<any>;
  }

  export class StdioClientTransport {
    constructor(options: { serverStdout: any; serverStdin: any });
  }

  export class McpServer {
    constructor(options: { tools: ToolDefinitions });
    listen(stdin: any, stdout: any): void;
    tool(
      name: string,
      description: string,
      schema: any,
      handler: (args: any) => Promise<any>
    ): void;
  }

  export interface MutableToolDefinitions {
    [key: string]: any;
  }

  export interface ToolDefinitions {
    [key: string]: any;
  }

  export interface CreateServerOptions {
    tools: ToolDefinitions;
  }
} 