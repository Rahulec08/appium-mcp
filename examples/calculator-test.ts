import { McpClient } from "@modelcontextprotocol/sdk/client/mcp.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";
import * as path from "path";
import * as fs from "fs";

/**
 * Example test script for testing a calculator app using MCP-Appium
 */
async function testCalculator() {
  console.log("Starting MCP-Appium test for calculator app...");

  // Start the MCP-Appium server as a child process
  const serverPath = findMcpServerPath();
  console.log(`Using MCP server at: ${serverPath}`);

  const serverProcess = spawn("node", [serverPath]);

  // Log server output for debugging
  serverProcess.stderr.on("data", (data) => {
    console.error(`Server: ${data.toString()}`);
  });

  try {
    // Connect to the MCP server
    const transport = new StdioClientTransport({
      serverStdout: serverProcess.stdout,
      serverStdin: serverProcess.stdin,
    });

    const client = new McpClient(transport);
    await client.initialize();
    console.log("Connected to MCP-Appium server");

    // Step 1: List connected devices
    const devicesResult = await client.callTool({
      name: "list-devices",
      arguments: {},
    });

    console.log("Available devices:");
    console.log(devicesResult.content[0].text);

    // Get the first device ID (you may want to select a specific one)
    const deviceIdMatch = devicesResult.content[0].text.match(
      /[\w\d-]+\b(?=\s*device)/
    );
    if (!deviceIdMatch) {
      throw new Error(
        "No devices found. Please connect a device or start an emulator."
      );
    }
    const deviceId = deviceIdMatch[0];
    console.log(`Using device: ${deviceId}`);

    // Step 2: Initialize Appium session for the calculator app
    console.log("Starting Appium session for calculator app...");
    await client.callTool({
      name: "initialize-appium",
      arguments: {
        platformName: "Android",
        deviceName: deviceId,
        appPackage: "com.google.android.calculator", // Package name for Google Calculator
        appActivity: "com.android.calculator2.Calculator", // Main activity
        automationName: "UiAutomator2",
      },
    });

    // Step 3: Take a screenshot of initial state
    console.log("Taking initial screenshot...");
    const initialScreenshot = await client.callTool({
      name: "appium-screenshot",
      arguments: { name: "calculator-initial" },
    });
    console.log(initialScreenshot.content[0].text);

    // Step 4: Perform calculation (5 + 7 = 12)
    console.log("Performing calculation: 5 + 7...");

    // Tap on '5'
    await client.callTool({
      name: "tap-element",
      arguments: {
        selector: '//android.widget.Button[@text="5"]',
        strategy: "xpath",
      },
    });

    // Tap on '+'
    await client.callTool({
      name: "tap-element",
      arguments: {
        selector: '//android.widget.Button[@content-desc="plus"]',
        strategy: "xpath",
      },
    });

    // Tap on '7'
    await client.callTool({
      name: "tap-element",
      arguments: {
        selector: '//android.widget.Button[@text="7"]',
        strategy: "xpath",
      },
    });

    // Tap on '='
    await client.callTool({
      name: "tap-element",
      arguments: {
        selector: '//android.widget.Button[@content-desc="equals"]',
        strategy: "xpath",
      },
    });

    // Step 5: Wait for result and verify
    console.log("Waiting for result...");
    await client.callTool({
      name: "wait-for-element",
      arguments: {
        selector:
          '//android.widget.TextView[@resource-id="com.google.android.calculator:id/result"]',
        strategy: "xpath",
        timeoutMs: 5000,
      },
    });

    // Step 6: Get page source to analyze result
    const pageSource = await client.callTool({
      name: "get-page-source",
      arguments: {},
    });

    // Step 7: Take a screenshot of the result
    console.log("Taking result screenshot...");
    const resultScreenshot = await client.callTool({
      name: "appium-screenshot",
      arguments: { name: "calculator-result" },
    });
    console.log(resultScreenshot.content[0].text);

    // Step 8: Extract locators from the page source to find the result element
    const extractResult = await client.callTool({
      name: "extract-locators",
      arguments: {
        xmlSource: pageSource.content[0].text,
        elementType: "android.widget.TextView",
        maxResults: 5,
      },
    });

    console.log("Found elements:");
    console.log(extractResult.content[0].text);

    // Step 9: Close the Appium session
    console.log("Closing Appium session...");
    await client.callTool({
      name: "close-appium",
      arguments: {},
    });

    console.log("Test completed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    // Kill the server process
    serverProcess.kill();
  }
}

/**
 * Find the MCP server path - tries to locate the server script in a few common locations
 * relative to this example script
 */
function findMcpServerPath(): string {
  const possiblePaths = [
    // If running from installed package
    path.resolve(
      process.cwd(),
      "node_modules",
      "mcp-appium",
      "dist",
      "index.js"
    ),
    // If running from the project root examples folder
    path.resolve(process.cwd(), "..", "dist", "index.js"),
    // If running from the examples folder in the installed package
    path.resolve(process.cwd(), "..", "..", "dist", "index.js"),
  ];

  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      return testPath;
    }
  }

  // Default fallback
  return path.resolve(process.cwd(), "..", "dist", "index.js");
}

// Run the test
testCalculator().catch(console.error);
