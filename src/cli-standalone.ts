#!/usr/bin/env node

/**
 * Standalone CLI Entry Point for MCP-Appium
 * This version doesn't import from our internal modules to avoid circular dependencies
 */

import { program } from "commander";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Read version from package.json - Node.js 18 compatible way
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packagePath = join(__dirname, "../package.json");
const packageJSON = JSON.parse(readFileSync(packagePath, "utf8"));

program
  .version(packageJSON.version)
  .name("mcp-appium-visual")
  .description("MCP Server for Appium mobile automation with visual recovery")
  .option(
    "--appium-url <url>",
    "Appium server URL (e.g., http://localhost:4723)"
  )
  .option("--transport <type>", "Transport type: stdio (default)")
  .action(async (options) => {
    const config = {
      appiumUrl: options.appiumUrl,
    };

    // Import modules here to avoid circular dependencies
    const { registerMobileTools } = await import("./tools/mobileTools.js");
    const { registerInspectorTools } = await import(
      "./tools/inspectorTools.js"
    );
    const { registerAdbTools } = await import("./tools/adbTools.js");

    // Create an MCP server instance
    const server = new McpServer({
      name: "mobile-automation",
      version: packageJSON.version,
      capabilities: {
        resources: {},
        tools: {},
      },
    });

    // Register all tools with the server, passing configuration
    registerMobileTools(server, config);
    registerInspectorTools(server);
    registerAdbTools(server);

    // Use stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);

    // Handle termination signals
    const handleExit = () => {
      process.exit(0);
    };

    process.on("SIGINT", handleExit);
    process.on("SIGTERM", handleExit);
  });

program.parse(process.argv);
