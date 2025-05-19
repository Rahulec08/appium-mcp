/**
 * MCP Deeplink Test Example
 *
 * This example demonstrates how to:
 * 1. Initialize an Appium session through MCP
 * 2. Open deeplinks using the MCP tools
 *
 * Prerequisites:
 * - MCP-Appium server running
 * - Android or iOS device/emulator connected
 */

import { McpClient } from "@modelcontextprotocol/sdk/client/mcp.js";
import { NodeClientTransport } from "@modelcontextprotocol/sdk/client/node.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Test configuration - replace with apps that work on your device
const TEST_URLS = {
  // Web URLs that will open in a browser or app that handles web URLs
  WEB: [
    "https://www.example.com",
    "https://www.google.com/search?q=appium+testing",
  ],
  // Custom URIs - replace with URIs that work on your test device
  CUSTOM: [
    "youtube://", // YouTube app
    "tel:+1234567890", // Phone app
    "geo:37.7749,-122.4194", // Maps
  ],
  // App-specific deep links - replace with deep links that work on your device
  APP_SPECIFIC: [
    "twitter://timeline", // Twitter app
    "instagram://user?username=instagram", // Instagram app
  ],
};

// Android-specific test with extras
const ANDROID_TEST = {
  url: "geo:37.7749,-122.4194",
  extras: {
    zoom: "15",
    mode: "driving",
  },
};

/**
 * Main test function
 */
async function testDeepLinks() {
  // Create an MCP client
  const transport = new NodeClientTransport({
    command: "node",
    args: ["./dist-temp/src/index.js"],
  });
  const client = new McpClient();

  try {
    console.log("Connecting to MCP server...");
    await client.connect(transport);
    console.log("Connected to MCP server successfully");

    // Set up capabilities for Android
    const androidCapabilities = {
      platformName: "Android",
      deviceName: "Android Device",
      automationName: "UiAutomator2",
      noReset: true,
    };

    // Initialize the Appium driver
    console.log("Initializing Appium session...");
    const initResult = await client.tools["initialize-appium"](
      androidCapabilities
    );
    console.log("Initialization result:", initResult.content[0].text);

    // Wait for device to be ready
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Test web URLs
    console.log("\n==== Testing Web URLs ====");
    for (const url of TEST_URLS.WEB) {
      await testDeepLink(client, url);
      // Wait between tests
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    // Test custom URIs
    console.log("\n==== Testing Custom URIs ====");
    for (const url of TEST_URLS.CUSTOM) {
      await testDeepLink(client, url);
      // Wait between tests
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    // Test app-specific deep links
    console.log("\n==== Testing App-Specific Deep Links ====");
    for (const url of TEST_URLS.APP_SPECIFIC) {
      await testDeepLink(client, url);
      // Wait between tests
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    // Test Android-specific deep link with extras
    console.log("\n==== Testing Android-Specific Deep Link with Extras ====");
    try {
      const result = await client.tools["open-android-deeplink"]({
        url: ANDROID_TEST.url,
        extras: ANDROID_TEST.extras,
      });
      console.log(`✅ ${result.content[0].text}`);

      // Take a screenshot to verify
      const screenshotResult = await client.tools["take-screenshot"]({
        filename: "android_deeplink_extras",
      });
      console.log("Screenshot saved:", screenshotResult.content[0].text);

      // Wait before continuing
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (error) {
      console.error(`❌ Failed to open Android deep link with extras:`, error);
    }
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    // Clean up: disconnect client and close session
    try {
      await client.tools["close-appium"]({});
      console.log("Appium session closed successfully");
    } catch (e) {
      console.warn("Error closing Appium session:", e);
    }

    await client.disconnect();
    console.log("Disconnected from MCP server");
  }
}

/**
 * Helper function to test a specific deep link
 */
async function testDeepLink(client: McpClient, url: string) {
  try {
    console.log(`\nTesting deep link: ${url}`);

    // Take a screenshot before opening the deep link
    const beforeScreenshotName = `before_${url.replace(/[^a-zA-Z0-9]/g, "_")}`;
    const beforeResult = await client.tools["take-screenshot"]({
      filename: beforeScreenshotName,
    });
    console.log(`Before screenshot: ${beforeResult.content[0].text}`);

    // Open the deep link
    const result = await client.tools["open-deeplink"]({ url });
    console.log(`✅ ${result.content[0].text}`);

    // Wait for the app to load
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Take a screenshot after opening the deep link
    const afterScreenshotName = `after_${url.replace(/[^a-zA-Z0-9]/g, "_")}`;
    const afterResult = await client.tools["take-screenshot"]({
      filename: afterScreenshotName,
    });
    console.log(`After screenshot: ${afterResult.content[0].text}`);
  } catch (error) {
    console.error(`❌ Failed to open deep link: ${url}`, error);
  }
}

// Run the test
console.log("Starting MCP Deep Link Tests...");
testDeepLinks()
  .then(() => {
    console.log("MCP Deep Link Tests Completed!");
  })
  .catch((error) => {
    console.error("Error in test execution:", error);
    process.exit(1);
  });
