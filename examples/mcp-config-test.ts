/**
 * MCP Client Example with Configuration Format
 *
 * This example shows how to use the MCP-Appium server with a configuration format
 * similar to other MCP servers like Playwright.
 */

import { McpClient } from "@modelcontextprotocol/sdk/client/mcp.js";
import { NodeClientTransport } from "@modelcontextprotocol/sdk/client/node.js";
import * as path from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define the MCP servers configuration
const mcpServersConfig = {
  mcpServers: {
    "mcp-appium": {
      command: "npx",
      args: ["mcp-appium-visual"],
    },
  },
};

/**
 * Main function to run the MCP client test
 */
async function runMcpTest() {
  console.log("Starting MCP client test with configuration format...");

  // Create the transport for the MCP-Appium server
  const transport = new NodeClientTransport({
    command: mcpServersConfig.mcpServers["mcp-appium"].command,
    args: mcpServersConfig.mcpServers["mcp-appium"].args,
  });

  // Create and connect the MCP client
  const client = new McpClient();

  try {
    console.log("Connecting to MCP-Appium server...");
    await client.connect(transport);
    console.log("Connected to MCP-Appium server successfully");

    // Initialize Appium session
    console.log("Initializing Appium session...");
    const initResult = await client.tools["initialize-appium"]({
      platformName: "Android",
      deviceName: "Android Device",
      automationName: "UiAutomator2",
      noReset: true,
    });

    console.log("Appium initialization result:", initResult.content[0].text);

    // Take a screenshot to verify the connection works
    console.log("Taking screenshot...");
    const screenshotResult = await client.tools["take-screenshot"]({
      filename: "config_test_screenshot",
    });

    console.log("Screenshot result:", screenshotResult.content[0].text);

    // Test the deeplink functionality
    console.log("Testing deeplink functionality...");
    const deeplinkResult = await client.tools["open-deeplink"]({
      url: "https://www.example.com",
    });

    console.log("Deeplink result:", deeplinkResult.content[0].text);

    // Clean up
    console.log("Cleaning up...");
    await client.tools["close-appium"]({});
    console.log("Appium session closed");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.disconnect();
    console.log("Disconnected from MCP server");
  }
}

// Run the test
console.log("Starting MCP Configuration Test");
runMcpTest()
  .then(() => console.log("Test completed successfully"))
  .catch((error) => {
    console.error("Test failed:", error);
    process.exit(1);
  });
