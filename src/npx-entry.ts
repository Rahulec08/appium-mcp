#!/usr/bin/env node

/**
 * MCP-Appium NPX Entry Point
 *
 * This file serves as the main entry point for the MCP-Appium server when used through npx.
 * It parses configuration from stdin (if any) and starts the MCP server with the appropriate settings.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerMobileTools } from "./tools/mobileTools.js";
import { registerInspectorTools } from "./tools/inspectorTools.js";
import { registerAdbTools } from "./tools/adbTools.js";

// Process configuration if provided via stdin
let config = {};
if (!process.stdin.isTTY) {
  // Read configuration from stdin
  const inputChunks: Buffer[] = [];

  process.stdin.on("data", (chunk: Buffer) => {
    inputChunks.push(chunk);
  });

  process.stdin.on("end", () => {
    const input = Buffer.concat(inputChunks).toString("utf8");
    try {
      config = JSON.parse(input);
      startServer(config);
    } catch (error) {
      console.error("Failed to parse configuration:", error);
      process.exit(1);
    }
  });
} else {
  // No config provided, start with defaults
  startServer(config);
}

/**
 * Start the MCP server with the given configuration
 */
export async function startServer(config = {}) {
  // Create an MCP server instance
  const server = new McpServer({
    name: "mobile-automation",
    version: "1.0.0",
    capabilities: {
      resources: {},
      tools: {},
    },
  });

  // Register all tools with the server
  registerMobileTools(server);
  registerInspectorTools(server);
  registerAdbTools(server);

  try {
    // Use stdio transport for communication
    const transport = new StdioServerTransport();

    // Connect the server to the transport
    await server.connect(transport);

    console.error("Mobile Automation MCP Server running...");

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
