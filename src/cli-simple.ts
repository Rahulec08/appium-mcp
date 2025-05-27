#!/usr/bin/env node

/**
 * Simple CLI Entry Point for MCP-Appium
 * Based on Playwright MCP implementation pattern
 */

import { program } from "commander";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

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

    // Create server with configuration
    const serverInstance = createServer(config);

    // Use stdio transport
    const transport = new StdioServerTransport();
    await serverInstance.connect(transport);

    // Handle termination signals
    const handleExit = () => {
      process.exit(0);
    };

    process.on("SIGINT", handleExit);
    process.on("SIGTERM", handleExit);
  });

program.parse(process.argv);
