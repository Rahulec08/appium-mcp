// filepath: /Users/rahulsharma/AILearning/mcp-appium/examples/mcp-visual-recovery-test.ts
import {
  McpClient,
  McpClientOptions,
} from "@modelcontextprotocol/sdk/client/mcp.js";

/**
 * This example demonstrates how to use the MCP-Appium tools with visual
 * detection and recovery features through the Model Context Protocol interface.
 *
 * It shows how AI agents can leverage resilient element detection methods by:
 * 1. Using standard element locators first
 * 2. Falling back to visual analysis and coordinate-based operations when needed
 * 3. Employing recovery strategies for better automation resilience
 */
async function testMcpAppiumWithVisualRecovery() {
  console.log("Starting MCP-Appium Visual Recovery Test...");

  // Configure MCP client
  const options: McpClientOptions = {
    serverUrl: "http://localhost:3000",
  };

  // Create MCP client
  const client = new McpClient(options);

  try {
    // Step 1: Initialize Appium session
    console.log("\n=== INITIALIZING APPIUM SESSION ===");
    const initResult = await client.callTool("initialize-appium", {
      platformName: "Android",
      deviceName: "Pixel_4", // Change this to your actual device name
      automationName: "UiAutomator2",
      appPackage: "com.android.settings",
      appActivity: ".Settings",
      noReset: true,
    });
    console.log("Appium session initialized:", initResult.content[0].text);

    // Step 2: Take initial screenshot to verify app state
    console.log("\n=== TAKING INITIAL SCREENSHOT ===");
    const screenshotResult = await client.callTool("appium-screenshot", {
      name: "initial_screen_mcp",
    });
    console.log("Screenshot captured:", screenshotResult.content[0].text);

    // Step 3: Test standard element tap
    console.log("\n=== TESTING STANDARD ELEMENT TAP ===");
    try {
      const tapResult = await client.callTool("tap-element", {
        selector: '//android.widget.TextView[contains(@text, "Network")]',
        strategy: "xpath",
      });
      console.log("Standard tap result:", tapResult.content[0].text);

      // Go back to main menu
      await client.callTool("send-key-event", { keyEvent: "BACK" });
    } catch (error) {
      console.error("Standard tap failed:", error);
    }

    // Step 4: Test visual element highlighting and action
    console.log("\n=== TESTING VISUAL ELEMENT ACTIONS ===");
    try {
      // Highlight element first
      const visualResult = await client.callTool("visual-element-action", {
        action: "tap",
        selector: '//android.widget.TextView[contains(@text, "Network")]',
        strategy: "xpath",
        highlightBefore: true,
        highlightColor: "green",
        useCoordinates: true,
      });
      console.log("Visual action result:", visualResult.content[0].text);

      // Go back to main menu
      await client.callTool("send-key-event", { keyEvent: "BACK" });
    } catch (error) {
      console.error("Visual element action failed:", error);
    }

    // Step 5: Test element recovery with fallback
    console.log("\n=== TESTING ELEMENT RECOVERY WITH FALLBACK ===");
    try {
      // First try with an invalid selector - should fall back to recovery
      const smartResult = await client.callTool("smart-action", {
        action: "tap",
        selector: '//android.widget.TextView[@text="NonExistentElement"]',
        strategy: "xpath",
        fallbackToScreenshot: true,
        text: "Display", // If sendKeys action, provide text
      });
      console.log("Smart action result:", smartResult.content[0].text);

      // Go back to main menu
      await client.callTool("send-key-event", { keyEvent: "BACK" });
    } catch (error) {
      console.error("Smart recovery action failed:", error);
    }

    // Step 6: Test coordinate-based tapping
    console.log("\n=== TESTING COORDINATE-BASED TAPPING ===");
    try {
      // First get the screen dimensions
      const pageSource = await client.callTool("get-page-source", {});
      console.log("Retrieved page source for analysis");

      // Analyze the screen (this would normally be done by the AI agent)
      console.log("Analyzing screen and tapping on coordinates...");

      // For this test, we'll tap at the center of the screen
      // In a real scenario, the AI would analyze the page source and determine coordinates
      const tapResult = await client.callTool("tap-coordinates", {
        x: 540, // These are example values
        y: 1000, // Adjust based on your device's screen size
      });
      console.log("Coordinate tap result:", tapResult.content[0].text);

      // Just in case we navigate somewhere, go back
      await client.callTool("send-key-event", { keyEvent: "BACK" });
    } catch (error) {
      console.error("Coordinate tap failed:", error);
    }

    // Step 7: Test tap recovery by identifying and examining element
    console.log("\n=== TESTING SMART TAP RECOVERY ===");
    try {
      // This demonstrates the inspect-and-tap pattern for resilient UI automation
      const inspectTapResult = await client.callTool("inspect-and-tap", {
        selector: "Display", // Look for this text
        strategy: "text",
        preferredOrder: ["id", "accessibilityId", "xpath"],
      });
      console.log("Inspect and tap result:", inspectTapResult.content[0].text);

      // Go back
      await client.callTool("send-key-event", { keyEvent: "BACK" });
    } catch (error) {
      console.error("Inspect and tap failed:", error);
    }

    // Step 8: Test element tree analysis
    console.log("\n=== ANALYZING ELEMENT TREE ===");
    try {
      const treeResult = await client.callTool("get-element-tree", {
        maxDepth: 3,
      });
      console.log("Element tree analysis completed");
      // Not logging the full tree as it would be large
    } catch (error) {
      console.error("Element tree analysis failed:", error);
    }

    // Step 9: Test W3C Actions API for advanced gestures
    console.log("\n=== TESTING W3C ADVANCED GESTURES ===");
    try {
      // First scroll to "About phone"
      await client.callTool("scroll-to-element", {
        selector: '//android.widget.TextView[@text="About phone"]',
        direction: "down",
        maxScrolls: 10,
      });

      // Take screenshot to verify scroll
      await client.callTool("appium-screenshot", {
        name: "scrolled_to_about_phone",
      });

      // Now perform W3C swipe gesture
      const swipeResult = await client.callTool("perform-w3c-gesture", {
        actionType: "swipe",
        startX: 500,
        startY: 1500,
        endX: 500,
        endY: 500,
        duration: 800,
      });
      console.log("W3C gesture performed");
    } catch (error) {
      console.error("W3C gesture failed:", error);
    }

    // Step 10: Close session
    console.log("\n=== CLOSING SESSION ===");
    const closeResult = await client.callTool("close-appium", {});
    console.log("Appium session closed:", closeResult.content[0].text);
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    console.log("\nMCP-Appium Visual Recovery Test completed");
  }
}

// Run the test
testMcpAppiumWithVisualRecovery().catch(console.error);
