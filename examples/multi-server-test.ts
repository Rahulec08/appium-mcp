/**
 * Multi-Server MCP Test Example
 * 
 * Thi  // Initialize the Appium MCP client
  console.log("Initializing MCP-Appium client...");
  const appiumTransport = new NodeClientTransport(
    mcpConfig.mcpServers["mcp-appium"]
  );
  const appiumClient = new McpClient();
  await appiumClient.connect(appiumTransport);

  // Initialize the Playwright MCP client
  console.log("Initializing Playwright MCP client...");
  const playwrightTransport = new NodeClientTransport(
    mcpConfig.mcpServers["playwright"]
  );
  const playwrightClient = new McpClient();nstrates how to use multiple MCP servers together:
 * 1. MCP-Appium for mobile testing
 * 2. Playwright MCP for web testing
 * 
 * This approach allows coordinated testing across platforms in a single script.
 * For example, testing a mobile app action and verifying its effect on a web dashboard.
 */

import { McpClient } from "@modelcontextprotocol/sdk/client/mcp.js";
import { NodeClientTransport } from "@modelcontextprotocol/sdk/client/node.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// MCP Server configuration - this format matches what GitHub Copilot and other LLM tools expect
const mcpConfig = {
  mcpServers: {
    "mcp-appium": {
      command: "npx",
      args: ["mcp-appium-visual"],
      options: {
        appiumHost: "localhost",
        appiumPort: 4723,
        screenshotDir: "./test-screenshots",
        logLevel: "info",
      },
    },
    playwright: {
      command: "npx",
      args: ["@playwright/mcp@latest"],
    },
  },
};

/**
 * Main test function
 */
async function runMultiServerTest() {
  console.log("Starting Multi-Server MCP Test...");

  // Initialize the Appium MCP client
  console.log("Initializing MCP-Appium client...");
  const appiumTransport = new NodeClientTransport(
    config.mcpServers["mcp-appium"]
  );
  const appiumClient = new McpClient();
  await appiumClient.connect(appiumTransport);

  // Initialize the Playwright MCP client (if needed)
  console.log("Initializing Playwright MCP client...");
  const playwrightTransport = new NodeClientTransport(
    config.mcpServers["playwright"]
  );
  const playwrightClient = new McpClient();
  await playwrightClient.connect(playwrightTransport);

  try {
    // Start mobile automation with Appium
    console.log("Initializing Appium session...");
    const appiumResult = await appiumClient.tools["initialize-appium"]({
      platformName: "Android",
      deviceName: "Android Device",
      automationName: "UiAutomator2",
      noReset: true,
    });

    console.log("Appium initialization result:", appiumResult.content[0].text);

    // Open a deeplink in the mobile device
    console.log("Opening deeplink on mobile device...");
    const deeplinkResult = await appiumClient.tools["open-deeplink"]({
      url: "https://www.example.com",
    });

    console.log("Deeplink result:", deeplinkResult.content[0].text);

    // Take a screenshot of the mobile device
    console.log("Taking a screenshot of the mobile device...");
    const screenshotResult = await appiumClient.tools["take-screenshot"]({
      filename: "mobile_screenshot",
    });

    console.log("Screenshot saved:", screenshotResult.content[0].text);

    // Launch browser with Playwright
    console.log("Opening browser with Playwright...");
    const browserResult = await playwrightClient.tools["openBrowser"]({
      browser: "chromium",
      url: "https://www.example.com",
    });

    console.log("Browser opened:", browserResult.content[0].text);

    // Take a screenshot with Playwright
    console.log("Taking screenshot with Playwright...");
    const playwrightScreenshot = await playwrightClient.tools["screenshot"]({
      path: "web_screenshot.png",
    });

    console.log("Web screenshot saved:", playwrightScreenshot.content[0].text);

    // Demonstrate coordination between tools
    console.log("Demonstrating coordination between mobile and web testing...");

    // Use mobile to scan a QR code (simulated)
    console.log("Simulating QR code scan on mobile...");
    const qrData = "https://example.com/auth-token-12345";

    // Use the QR data in the web browser
    console.log("Using scanned data in web browser...");
    const navigateResult = await playwrightClient.tools["navigate"]({
      url: qrData,
    });

    console.log("Navigation result:", navigateResult.content[0].text);
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    // Clean up: close sessions and disconnect clients
    console.log("Cleaning up...");

    try {
      await appiumClient.tools["close-appium"]({});
      console.log("Appium session closed successfully");
    } catch (e) {
      console.warn("Error closing Appium session:", e);
    }

    try {
      await playwrightClient.tools["closeBrowser"]({});
      console.log("Browser closed successfully");
    } catch (e) {
      console.warn("Error closing browser:", e);
    }

    await appiumClient.disconnect();
    await playwrightClient.disconnect();

    console.log("All MCP clients disconnected");
  }
}

// Run the test
console.log("Starting Multi-Server MCP Integration Test...");

runMultiServerTest()
  .then(() => {
    console.log("Test completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error in test execution:", error);
    process.exit(1);
  });
