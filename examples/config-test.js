/**
 * Simple JavaScript test for MCP-Appium when installed as an npm package
 * This file uses ES modules syntax and is designed to be compatible with Node.js directly
 */

import { spawn } from "child_process";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Get the directory name using ESM-compatible approach
const __dirname = dirname(fileURLToPath(import.meta.url));

// MCP Server configuration - this mimics how it would be used when installed via npm
const mcpConfig = {
  mcpServers: {
    "mcp-appium": {
      command: "npx",
      args: ["mcp-appium"], // This would call the globally installed package when used via npm
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
 * For local testing, we need to use the local path
 */
function getMcpCommand() {
  // For local development testing
  return {
    command: "node",
    args: [path.join(__dirname, "../dist/npx-entry.js")],
  };
}

/**
 * Test the MCP-Appium server with config
 */
async function testMcpServer() {
  console.log("Starting MCP-Appium server test with configuration...");

  // Use local paths for testing
  const mcpCmd = getMcpCommand();

  // Create a child process for the MCP server
  const serverProcess = spawn(mcpCmd.command, mcpCmd.args, {
    stdio: ["pipe", "inherit", "inherit"],
  });

  // Write the config to stdin
  serverProcess.stdin.write(
    JSON.stringify(mcpConfig.mcpServers["mcp-appium"].options || {})
  );
  serverProcess.stdin.end();

  console.log("MCP server started successfully with configuration");
  console.log("Press Ctrl+C to terminate the server");

  // Handle termination
  process.on("SIGINT", () => {
    console.log("Terminating MCP server...");
    serverProcess.kill();
    process.exit(0);
  });
}

// Run the test
testMcpServer().catch((error) => {
  console.error("Error running test:", error);
  process.exit(1);
});
