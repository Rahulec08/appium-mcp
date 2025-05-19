/**
 * Test script for MCP-Appium using the npx entry point with a configuration format
 * similar to the Playwright MCP server.
 *
 * This file is a JavaScript version that should work without TypeScript-specific configuration.
 */

import { McpClient } from "@modelcontextprotocol/sdk/client/mcp.js";
import { NodeClientTransport } from "@modelcontextprotocol/sdk/client/node.js";
import { spawn } from "child_process";
import * as path from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// MCP Server configuration
const mcpConfig = {
  mcpServers: {
    "mcp-appium": {
      command: "node",
      args: [path.join(__dirname, "../dist/npx-entry.js")],
      options: {
        appiumHost: "localhost",
        appiumPort: 4723,
        screenshotDir: "./test-screenshots",
        logLevel: "info",
      },
    },
  },
};

/**
 * Test function to verify MCP-Appium server works with a configuration format
 */
async function testMcpServerWithConfig() {
  console.log("Starting MCP-Appium server test with configuration...");

  // Create a child process for the MCP server and pipe the configuration
  const mpcProcess = spawn(
    mcpConfig.mcpServers["mcp-appium"].command,
    mcpConfig.mcpServers["mcp-appium"].args,
    { stdio: ["pipe", "inherit", "inherit"] }
  );

  // Write the config to stdin
  mpcProcess.stdin.write(
    JSON.stringify(mcpConfig.mcpServers["mcp-appium"].options || {})
  );
  mpcProcess.stdin.end();

  // Give the MCP server time to start
  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log("MCP server should now be running. Press Ctrl+C to exit.");
}

// Run the test
testMcpServerWithConfig().catch((error) => {
  console.error("Error running test:", error);
  process.exit(1);
});
