#!/usr/bin/env node
/**
 * Main entry point and exports for the MCP Appium Visual package
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { server, createServer, startServer } from "./server.js";
import { AppiumHelper } from "./lib/appium/appiumHelper.js";
import { AppiumError } from "./lib/appium/appiumError.js";
import { ImageProcessor, VisualRecovery } from "./lib/vision/imageProcessor.js";
import { deepMerge, getAbsolutePath } from "./lib/utils/configUtils.js";

// Export server and management functions
export { server, createServer, startServer } from "./server.js";

// Export Appium components
export { AppiumHelper } from "./lib/appium/appiumHelper.js";
export { AppiumError } from "./lib/appium/appiumError.js";

// Export types (these are compile-time only)
export type { AppiumCapabilities } from "./lib/appium/appiumTypes.js";

// Export Vision components
export { ImageProcessor, VisualRecovery } from "./lib/vision/imageProcessor.js";

// Export utilities
export { deepMerge, getAbsolutePath } from "./lib/utils/configUtils.js";

// Default export for CommonJS compatibility
const defaultExport = {
  server,
  createServer,
  startServer,
  AppiumHelper,
  AppiumError,
  // Types like AppiumCapabilities are only available at compile time, not runtime
  ImageProcessor,
  VisualRecovery,
  deepMerge,
  getAbsolutePath,
};

export default defaultExport;

/**
 * Main entry point when running as a standalone process
 */
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);

  // Default options
  let transport: "stdio" | "http" = "stdio";
  let port = 7000;
  let host = "localhost";
  let appiumUrl: string | undefined;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--transport":
        transport = args[++i] as "stdio" | "http";
        break;
      case "--port":
        port = parseInt(args[++i], 10);
        break;
      case "--host":
        host = args[++i];
        break;
      case "--appium-url":
        appiumUrl = args[++i];
        break;
      case "--help":
        console.log(`MCP-Appium Server
Usage: node index.js [options]

Options:
  --transport <type>       Transport type: 'stdio' or 'http' (default: stdio)
  --port <number>          HTTP port (default: 7000, only used with http transport)
  --host <string>          HTTP host (default: localhost, only used with http transport)
  --appium-url <url>       Appium server URL (e.g., http://localhost:4723)
  --help                   Show this help message

Examples:
  node index.js                                          # Start MCP server with stdio transport
  node index.js --appium-url http://localhost:4723       # Connect to external Appium server
  node index.js --transport http --port 8080             # Start MCP server with HTTP transport
`);
        process.exit(0);
        break;
    }
  }

  if (transport === "http") {
    // Use HTTP transport
    const { StreamableHTTPServerTransport } = await import(
      "@modelcontextprotocol/sdk/server/streamableHttp.js"
    );

    const httpTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    // Set environment variables that the SDK uses to determine port and host
    process.env.MCP_PORT = port.toString();
    process.env.MCP_HOST = host;

    // Create server with configuration
    const serverInstance = createServer({ appiumUrl });
    await serverInstance.connect(httpTransport);

    // Only log to stderr in HTTP mode since it doesn't interfere with communication
    console.error(`Mobile Automation MCP Server running on ${host}:${port}...`);
  } else {
    // Use stdio transport for communication
    const transport = new StdioServerTransport();

    // Create server with configuration
    const serverInstance = createServer({ appiumUrl });
    await serverInstance.connect(transport);

    // In stdio mode, avoid any output to stderr as it pollutes the JSON-RPC stream
    // The MCP client (Claude Desktop) will handle connection status
  }
}

// Execute main if this is the entry point (works with both node and ts-node)
// Using pathToFileURL for Node.js 18 compatibility instead of import.meta.resolve
import { pathToFileURL } from "url";

// More robust entry point detection for different Node.js versions
const isMainModule = () => {
  try {
    if (!process.argv[1]) return false;
    const currentFileUrl = import.meta.url;
    const argvFileUrl = pathToFileURL(process.argv[1]).href;
    return (
      currentFileUrl === argvFileUrl ||
      currentFileUrl === `file://${process.argv[1]}`
    );
  } catch (error) {
    // Fallback for older Node.js versions
    return process.argv[1] && import.meta.url.endsWith(process.argv[1]);
  }
};

if (isMainModule()) {
  main().catch(console.error);
}
