#!/usr/bin/env node

/**
 * MCP-Appium NPX Entry Point
 *
 * This file serves as the main entry point for the MCP-Appium server when used through npx.
 * It parses command line arguments and starts the MCP server with the appropriate settings.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerMobileTools } from "./tools/mobileTools.js";
import { registerInspectorTools } from "./tools/inspectorTools.js";
import { registerAdbTools } from "./tools/adbTools.js";
import { pathToFileURL } from "url";

/**
 * Main entry point when running as NPX command
 */
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);

  // Default options
  let appiumUrl: string | undefined;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--appium-url":
        appiumUrl = args[++i];
        break;
      case "--help":
        console.log(`MCP-Appium Server (NPX)
Usage: npx mcp-appium-visual [options]

Options:
  --appium-url <url>       Appium server URL (e.g., http://localhost:4723)
  --help                   Show this help message

Examples:
  npx mcp-appium-visual                                    # Start MCP server (will start Appium internally)
  npx mcp-appium-visual --appium-url http://localhost:4723 # Connect to external Appium server
`);
        process.exit(0);
        break;
    }
  }

  await startServer({ appiumUrl });
}

/**
 * Start the MCP server with the given configuration
 */
export async function startServer(config: { appiumUrl?: string } = {}) {
  // Create an MCP server instance
  const server = new McpServer({
    name: "mobile-automation",
    version: "1.0.0",
    capabilities: {
      resources: {},
      tools: {},
    },
  });

  // Register all tools with the server, passing configuration
  registerMobileTools(server, config);
  registerInspectorTools(server);
  registerAdbTools(server);

  try {
    // Use stdio transport for communication
    const transport = new StdioServerTransport();

    // Connect the server to the transport
    await server.connect(transport);

    // In stdio mode, avoid any output to stderr as it pollutes the JSON-RPC stream
    // The MCP client (Claude Desktop) will handle connection status

    // Handle termination signals
    process.on("SIGINT", () => {
      console.error("Received SIGINT signal. Shutting down MCP server...");
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      console.error("Received SIGTERM signal. Shutting down MCP server...");
      process.exit(0);
    });
  } catch (error) {
    console.error("Fatal error starting MCP server:", error);
    process.exit(1);
  }
}

// Export default function for ES modules
export default startServer;

// Execute main if this is the entry point
// Using pathToFileURL for Node.js 18 compatibility instead of import.meta.resolve
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
