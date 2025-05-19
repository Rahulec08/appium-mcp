/**
 * MCP Tools Test Script
 * This script tests all implemented MCP tools in the server
 *
 * Usage:
 * 1. Start the MCP server with: npm run launch
 * 2. Run this script with: npx ts-node test-scripts/test-mcp-tools.ts
 */

import axios from "axios";
import * as path from "path";
import * as fs from "fs";

const MCP_SERVER_URL = "http://localhost:3000";

// Tools to test - add all your tools here
const TOOLS_TO_TEST = [
  {
    name: "initialize-appium",
    params: {
      platformName: "Android",
      deviceName: "emulator-5554", // Change this to match your device/emulator
      automationName: "UiAutomator2",
    },
  },
  {
    name: "smart-action",
    params: {
      action: "tap",
      selector: "//android.widget.TextView[@text='Settings']",
      strategy: "xpath",
      visualStrategy: "ocr",
      fallbackToScreenshot: true,
    },
  },
  {
    name: "analyze-screen",
    params: {
      targetText: "Settings",
      elementType: "text",
      useEnhancedVision: true,
    },
  },
  {
    name: "visual-element-recovery",
    params: {
      elementType: "button",
      nearText: "Settings",
    },
  },
  {
    name: "appium-screenshot",
    params: {
      name: "test-screenshot",
    },
  },
  {
    name: "compare-screens",
    params: {
      // These will be set dynamically during test
    },
  },
  {
    name: "close-appium",
    params: {},
  },
];

// Utility function to call an MCP tool
async function callMcpTool(toolName: string, params: any): Promise<any> {
  try {
    console.log(`\nCalling MCP tool: ${toolName}`);
    console.log("Parameters:", JSON.stringify(params, null, 2));

    const response = await axios.post(
      `${MCP_SERVER_URL}/api/tools/${toolName}`,
      params
    );

    if (response.status === 200) {
      console.log("Tool call successful!");
      return response.data;
    } else {
      console.error(`Tool call failed with status: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error(`Error calling tool ${toolName}:`, error.message);
    return null;
  }
}

// Run all tests
async function testAllMcpTools() {
  console.log("Starting MCP Tools Test...");
  console.log(`Connecting to MCP server at: ${MCP_SERVER_URL}`);

  let screenshotPaths: string[] = [];

  // Test each tool sequentially
  for (const tool of TOOLS_TO_TEST) {
    // Special handling for compare-screens which needs two screenshots
    if (tool.name === "compare-screens" && screenshotPaths.length >= 2) {
      tool.params = {
        image1Path: screenshotPaths[0],
        image2Path: screenshotPaths[1],
        threshold: 0.1,
      };
    }

    console.log(`\n----------------------------------------`);
    console.log(`Testing MCP tool: ${tool.name}`);
    console.log(`----------------------------------------`);

    const result = await callMcpTool(tool.name, tool.params);

    // Process results
    if (result) {
      console.log("Result:", JSON.stringify(result, null, 2));

      // Handle screenshot paths for later use in compare-screens
      if (
        tool.name === "appium-screenshot" &&
        result.content &&
        result.content[0]
      ) {
        const text = result.content[0].text;
        const match = text.match(/Screenshot: (.+\.png)/);
        if (match && match[1]) {
          screenshotPaths.push(match[1]);
          console.log(`Saved screenshot path: ${match[1]}`);
        }
      }

      // If analyzing screen, let's wait a bit so we can see the result
      if (
        tool.name === "analyze-screen" ||
        tool.name === "visual-element-recovery"
      ) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } else {
      console.error(`❌ Tool ${tool.name} failed or returned no data`);
    }

    // Pause between tests
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("\nAll MCP tool tests completed!");
}

// Run the tests
testAllMcpTools().catch(console.error);
