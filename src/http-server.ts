#!/usr/bin/env node

/**
 * MCP-Appium HTTP Server for Claude Desktop
 *
 * This file starts an HTTP server that Claude Desktop can connect to,
 * implementing the Model Context Protocol over HTTP rather than stdin/stdout.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerMobileTools } from "./tools/mobileTools.js";
import { registerInspectorTools } from "./tools/inspectorTools.js";
import { registerAdbTools } from "./tools/adbTools.js";
import { registerRecoveryTools } from "./tools/recoveryTools.js";
import { randomUUID } from "crypto";

// Get port from environment variable or use default
const port = process.env.PORT || 8080;
const host = "0.0.0.0"; // Listen on all interfaces

// Check if JSON output is requested
const args = process.argv.slice(2);
const jsonOutput = args.includes("--json") || args.includes("-j");

async function startServer() {
  try {
    // Create an MCP server instance
    const server = new McpServer({
      name: "mobile-automation",
      version: "1.2.0",
      capabilities: {
        mobile: {
          version: "1.2.0",
          description:
            "Mobile automation testing with Appium and visual recovery",
          supportedDevices: ["Android", "iOS"],
        },
        automation: {
          features: [
            "screenshot",
            "tap",
            "swipe",
            "text-input",
            "visual-recovery",
          ],
        },
      },
    });

    // Register all tools with the server
    registerMobileTools(server);
    registerInspectorTools(server);
    registerAdbTools(server);
    registerRecoveryTools(server);

    // Use StreamableHTTPServerTransport for Claude Desktop HTTP connection
    // The StreamableHTTPServerTransport creates its own HTTP server internally
    // Set environment variables that the SDK uses to determine port and host
    process.env.MCP_PORT = port.toString();
    process.env.MCP_HOST = host;

    console.log(`HTTP server will listen on ${host}:${port}`);

    // Create the transport with the required options
    // Note: The transport internally reads MCP_PORT and MCP_HOST environment variables
    const httpTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      enableJsonResponse: true,
    });

    // Connect the server to the transport
    await server.connect(httpTransport);

    // Output server status
    if (jsonOutput) {
      console.error(
        JSON.stringify(
          {
            status: "running",
            service: "mcp-server",
            name: "mobile-automation",
            version: "1.2.0",
          },
          null,
          2
        )
      );
    } else {
      console.error("Mobile Automation MCP Server running...");
      console.error("Claude Desktop can now connect to this server");
    }

    // Handle termination signals
    process.on("SIGINT", () => {
      if (jsonOutput) {
        console.log(
          JSON.stringify(
            {
              status: "shutdown",
              service: "mcp-http-server",
              reason: "SIGINT",
            },
            null,
            2
          )
        );
      } else {
        console.log("Shutting down MCP-Appium HTTP Server...");
      }
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      if (jsonOutput) {
        console.log(
          JSON.stringify(
            {
              status: "shutdown",
              service: "mcp-http-server",
              reason: "SIGTERM",
            },
            null,
            2
          )
        );
      } else {
        console.log("Shutting down MCP-Appium HTTP Server...");
      }
      process.exit(0);
    });
  } catch (error) {
    if (jsonOutput) {
      console.error(
        JSON.stringify(
          {
            status: "error",
            service: "mcp-http-server",
            error: error instanceof Error ? error.message : String(error),
          },
          null,
          2
        )
      );
    } else {
      console.error("Error starting MCP-Appium HTTP Server:", error);
    }
    process.exit(1);
  }
}

// Start the server
startServer();
