/**
 * Test script for MCP-Appium using the npx entry point with a configuration format
 * similar to the Playwright MCP server.
 */
import { McpClient } from "@modelcontextprotocol/sdk";
import { NodeClientTransport } from "@modelcontextprotocol/sdk";
import { spawn, ChildProcess } from "child_process";
import * as path from "path";
import { fileURLToPath } from "url";

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

// Global reference to the MCP server process
let mpcProcess: ChildProcess | null = null;

/**
 * Start the MCP server process
 */
async function startMcpServer(): Promise<ChildProcess> {
  console.log("Starting MCP-Appium server with configuration...");

  const process = spawn(
    mcpConfig.mcpServers["mcp-appium"].command,
    mcpConfig.mcpServers["mcp-appium"].args,
    { stdio: ["pipe", "inherit", "inherit"] }
  );

  // Write the config to stdin
  process.stdin.write(
    JSON.stringify(mcpConfig.mcpServers["mcp-appium"].options || {})
  );
  process.stdin.end();

  // Give the MCP server time to start
  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log("MCP server started successfully");
  return process;
}

/**
 * Test the MCP client connection to the server
 */
async function testMcpClient(): Promise<boolean> {
  console.log("Testing MCP client connection to the server...");

  try {
    // Create a direct transport to the running process
    const transport = new NodeClientTransport({
      command: mcpConfig.mcpServers["mcp-appium"].command,
      args: mcpConfig.mcpServers["mcp-appium"].args,
    });

    const client = new McpClient();
    await client.connect(transport);

    console.log("Successfully connected to MCP server");

    // Try to get available tools
    const tools = await client.getTools();
    console.log(`Server has ${Object.keys(tools).length} available tools`);

    // Clean up
    await client.disconnect();
    return true;
  } catch (error) {
    console.error("Failed to connect to MCP server:", error);
    return false;
  }
}

/**
 * Clean up resources and terminate the MCP server
 */
function cleanup() {
  if (mpcProcess) {
    console.log("Terminating MCP server process...");
    mpcProcess.kill();
    mpcProcess = null;
    console.log("MCP server process terminated");
  }
}

/**
 * Main test function
 */
async function runTests() {
  try {
    // Setup cleanup handlers
    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);

    // Start the server
    mpcProcess = await startMcpServer();

    // Test the client connection
    const success = await testMcpClient();

    if (success) {
      console.log("\n✅ MCP-Appium server configuration test PASSED");
    } else {
      console.log("\n❌ MCP-Appium server configuration test FAILED");
      process.exit(1);
    }

    console.log("\nPress Ctrl+C to exit.");
  } catch (error) {
    console.error("Error during test execution:", error);
    cleanup();
    process.exit(1);
  }
}

// Run the test
runTests().catch((error) => {
  console.error("Unexpected error:", error);
  cleanup();
  process.exit(1);
});
