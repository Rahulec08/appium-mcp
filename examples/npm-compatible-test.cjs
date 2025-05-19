/**
 * Simple CommonJS test for MCP-Appium when installed as an npm package
 * This file uses CommonJS syntax for maximum compatibility
 */

const { spawn } = require("child_process");
const path = require("path");

// Local path for development testing
const LOCAL_ENTRY_PATH = path.join(__dirname, "../dist/npx-entry.js");

// MCP Server configuration
const mcpConfig = {
  options: {
    appiumHost: "localhost",
    appiumPort: 4723,
    screenshotDir: "./test-screenshots",
    logLevel: "info",
  },
};

/**
 * Get the appropriate command for the environment
 * In a production environment, use 'npx mcp-appium'
 * In development, use the local path
 */
function getMcpCommand() {
  // Check if running in development or as installed package
  const isDevEnvironment = require("fs").existsSync(LOCAL_ENTRY_PATH);

  if (isDevEnvironment) {
    console.log("Development environment detected, using local path");
    return {
      command: "node",
      args: [LOCAL_ENTRY_PATH],
    };
  } else {
    console.log("Production environment detected, using npx");
    return {
      command: "npx",
      args: ["mcp-appium"],
    };
  }
}

/**
 * Test the MCP-Appium server with config
 */
function testMcpServer() {
  console.log("Starting MCP-Appium server test with configuration...");

  const mcpCmd = getMcpCommand();

  // Create a child process for the MCP server
  const serverProcess = spawn(mcpCmd.command, mcpCmd.args, {
    stdio: ["pipe", "inherit", "inherit"],
  });

  // Write the config to stdin
  serverProcess.stdin.write(JSON.stringify(mcpConfig.options || {}));
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
try {
  testMcpServer();
} catch (error) {
  console.error("Error running test:", error);
  process.exit(1);
}
