#!/usr/bin/env node

/**
 * MCP-Appium HTTP Server for Claude Desktop
 *
 * This file implements a simple HTTP server compatible with Claude Desktop
 * using the Model Context Protocol over HTTP.
 */

import express from "express";
import { randomUUID } from "crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerMobileTools } from "./tools/mobileTools.js";
import { registerInspectorTools } from "./tools/inspectorTools.js";
import { registerAdbTools } from "./tools/adbTools.js";

// Get port from environment variable or use default
const port = process.env.PORT || 8080;

// Check if JSON output is requested
const args = process.argv.slice(2);
const jsonOutput = args.includes("--json") || args.includes("-j");

/**
 * Start the MCP server using stdio transport
 * This is the simplest approach that will work with Claude Desktop
 */
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

    // Use stdio transport for communication - this is what Claude Desktop expects
    const transport = new StdioServerTransport();

    // Connect the server to the transport
    await server.connect(transport);

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
    }

    // Handle termination signals
    process.on("SIGINT", () => {
      if (jsonOutput) {
        console.error(
          JSON.stringify(
            {
              status: "shutdown",
              service: "mcp-server",
              reason: "SIGINT",
            },
            null,
            2
          )
        );
      } else {
        console.error("Received SIGINT signal. Shutting down MCP server...");
      }
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      if (jsonOutput) {
        console.error(
          JSON.stringify(
            {
              status: "shutdown",
              service: "mcp-server",
              reason: "SIGTERM",
            },
            null,
            2
          )
        );
      } else {
        console.error("Received SIGTERM signal. Shutting down MCP server...");
      }
      process.exit(0);
    });
  } catch (error) {
    if (jsonOutput) {
      console.error(
        JSON.stringify(
          {
            status: "error",
            service: "mcp-server",
            error: error instanceof Error ? error.message : String(error),
          },
          null,
          2
        )
      );
    } else {
      console.error("Error starting MCP server:", error);
    }
    process.exit(1);
  }
}

// Start the server
startServer();
