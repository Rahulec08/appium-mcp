/**
 * Simple test for the MCP-Appium server using CommonJS format
 * This avoids ESM-related issues
 */

const { spawn } = require("child_process");
const path = require("path");

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
 * Test the MCP-Appium server with config
 */
async function testMcpServer() {
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

  // Handle termination
  process.on("SIGINT", () => {
    console.log("Terminating MCP server...");
    mpcProcess.kill();
    process.exit(0);
  });
}

// Run the test
testMcpServer().catch((error) => {
  console.error("Error running test:", error);
  process.exit(1);
});
