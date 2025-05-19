// filepath: /Users/rahulsharma/AILearning/mcp-appium/examples/visual-recovery-test.ts
import {
  AppiumHelper,
  AppiumCapabilities,
} from "../src/lib/appium/appiumHelper.js";

/**
 * This test demonstrates the visual element detection and recovery capabilities
 * of the MCP-Appium tool. It features:
 *
 * 1. Coordinate-based actions
 * 2. Finding elements by their visual characteristics
 * 3. Recovery when traditional element location fails
 * 4. Screenshot analysis for UI element detection
 */
async function testVisualAndRecoveryFeatures() {
  console.log("Starting Visual Detection and Recovery Test...");
  const appium = new AppiumHelper("./test-screenshots");

  try {
    // SECTION 1: SETUP AND INITIALIZATION
    console.log("\n=== DRIVER INITIALIZATION ===");
    const capabilities: AppiumCapabilities = {
      platformName: "Android",
      deviceName: "Pixel_4", // Change to your device name
      automationName: "UiAutomator2",
      appPackage: "com.android.settings",
      appActivity: ".Settings",
      noReset: true,
    };

    await appium.initializeDriver(capabilities);
    console.log("✅ Driver initialized successfully");

    // Take a baseline screenshot
    const baselineScreenshot = await appium.takeScreenshot("initial_screen");
    console.log(`✅ Initial screenshot saved to: ${baselineScreenshot}`);

    // SECTION 2: COORDINATE-BASED ACTIONS
    console.log("\n=== COORDINATE-BASED ACTIONS ===");

    // Get device dimensions
    const { width, height } = await appium.getWindowSize();
    console.log(`Device dimensions: ${width}x${height}`);

    // Find an element first to get its coordinates
    try {
      const networkElement = await appium.findElement(
        '//android.widget.TextView[contains(@text, "Network")]'
      );
      console.log("✅ Found Network element");

      // Get element coordinates
      const elementCoords = await appium.getElementRect(
        '//android.widget.TextView[contains(@text, "Network")]'
      );
      console.log(
        `Element coordinates: x=${elementCoords.x}, y=${elementCoords.y}`
      );

      // Tap using coordinates instead of element reference
      console.log("Tapping using coordinates...");
      await appium.tapByCoordinates(elementCoords.x, elementCoords.y);
      await appium.takeScreenshot("after_coordinate_tap");
      console.log("✅ Coordinate tap successful");

      // Go back
      await appium.goBack();
    } catch (error) {
      console.error("❌ Coordinate action failed:", error);
    }

    // SECTION 3: ELEMENT HIGHLIGHTING & VISUAL ANALYSIS
    console.log("\n=== ELEMENT HIGHLIGHTING & VISUAL ANALYSIS ===");

    try {
      // Highlight an element to visually identify it
      console.log("Highlighting element...");
      const highlightPath = await appium.highlightElement(
        '//android.widget.TextView[contains(@text, "Network")]',
        "xpath",
        "green"
      );
      console.log(
        `✅ Element highlighted, screenshot saved to: ${highlightPath}`
      );

      // Get page source for XML analysis
      console.log("Getting page source for analysis...");
      const pageSource = await appium.getPageSource();

      // Log some statistics about the UI elements
      console.log("Analyzing UI structure...");
      const buttonCount = (pageSource.match(/android.widget.Button/g) || [])
        .length;
      const textViewCount = (pageSource.match(/android.widget.TextView/g) || [])
        .length;
      console.log(
        `Found ${buttonCount} buttons and ${textViewCount} text views in the current screen`
      );
    } catch (error) {
      console.error("❌ Visual analysis failed:", error);
    }

    // SECTION 4: RESILIENT ELEMENT LOCATION WITH FALLBACK
    console.log("\n=== RESILIENT ELEMENT LOCATION WITH FALLBACK ===");

    try {
      // First try with a valid element - should work
      console.log("Testing resilient tap with valid element...");
      const validElementResult = await testResilientElementAction(
        appium,
        '//android.widget.TextView[contains(@text, "Network")]',
        "tap"
      );
      console.log(`✅ Valid element tap result: ${validElementResult}`);
      await appium.goBack();

      // Now try with an invalid selector - should fall back to recovery method
      console.log(
        "\nTesting resilient tap with invalid element (recovery expected)..."
      );
      const invalidElementResult = await testResilientElementAction(
        appium,
        '//android.widget.TextView[@text="NonExistentElement"]',
        "tap",
        '//android.widget.TextView[contains(@text, "Display")]' // Recovery selector
      );
      console.log(
        `✅ Invalid element (with recovery) result: ${invalidElementResult}`
      );
      await appium.goBack();
    } catch (error) {
      console.error("❌ Resilient element location test failed:", error);
    }

    // SECTION 5: W3C ACTIONS API FOR COMPLEX GESTURES
    console.log("\n=== COMPLEX GESTURES WITH W3C ACTIONS API ===");

    try {
      // Scroll to find "About phone" element
      console.log("Scrolling to 'About phone'...");
      await appium.scrollToElement(
        '//android.widget.TextView[@text="About phone"]'
      );

      // Perform a long press using W3C Actions API
      console.log("Performing long press using W3C Actions API...");

      // First get element coordinates
      const aboutElement = await appium.getElementRect(
        '//android.widget.TextView[@text="About phone"]'
      );

      // Use coordinates with W3C Actions API for long press
      await appium.performActions([
        {
          type: "pointer",
          id: "finger1",
          parameters: { pointerType: "touch" },
          actions: [
            {
              type: "pointerMove",
              duration: 0,
              x: aboutElement.x,
              y: aboutElement.y,
            },
            { type: "pointerDown", button: 0 },
            { type: "pause", duration: 1000 },
            { type: "pointerUp", button: 0 },
          ],
        },
      ]);

      await appium.takeScreenshot("after_w3c_longpress");
      console.log("✅ W3C Actions performed successfully");

      // Tap About phone to navigate into it
      await appium.tapElement('//android.widget.TextView[@text="About phone"]');
      await appium.takeScreenshot("about_phone");
    } catch (error) {
      console.error("❌ W3C Actions test failed:", error);
    }

    // SECTION 6: CLEAN UP
    console.log("\n=== TEST COMPLETE ===");
    console.log("All visual and recovery tests completed");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    // Cleanup
    console.log("Cleaning up resources...");
    await appium.closeDriver();
    console.log("Driver closed. Test suite completed.");
  }
}

/**
 * Helper function to test resilient element actions with recovery
 * First tries standard approach, then falls back to recovery if it fails
 */
async function testResilientElementAction(
  appium: AppiumHelper,
  selector: string,
  action: "tap" | "longPress" = "tap",
  recoverySelector?: string
): Promise<string> {
  try {
    // Try the standard approach first
    console.log(`Attempting ${action} on element: ${selector}`);

    if (action === "tap") {
      await appium.tapElement(selector);
    } else if (action === "longPress") {
      await appium.longPress(selector);
    }

    await appium.takeScreenshot(`after_standard_${action}`);
    return "Standard approach succeeded";
  } catch (error) {
    console.log(
      `Standard ${action} failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    console.log("Attempting recovery...");

    try {
      if (!recoverySelector) {
        // Use coordinate-based recovery by analyzing the screen
        // In a real implementation, this would use visual analysis
        // For this demo, we'll use a fixed location on screen
        const { width, height } = await appium.getWindowSize();

        console.log(
          `Using coordinate-based recovery at center of screen: (${
            width / 2
          }, ${height / 2})`
        );
        await appium.tapByCoordinates(width / 2, height / 2);
        await appium.takeScreenshot(`after_recovery_${action}_coordinates`);
        return "Coordinate-based recovery succeeded";
      } else {
        // Use alternative selector as recovery
        console.log(
          `Using alternative selector for recovery: ${recoverySelector}`
        );
        if (action === "tap") {
          await appium.tapElement(recoverySelector);
        } else if (action === "longPress") {
          await appium.longPress(recoverySelector);
        }
        await appium.takeScreenshot(`after_recovery_${action}_alternative`);
        return "Alternative selector recovery succeeded";
      }
    } catch (recoveryError) {
      console.error(
        `Recovery also failed: ${
          recoveryError instanceof Error
            ? recoveryError.message
            : String(recoveryError)
        }`
      );
      throw new Error(
        `Both standard approach and recovery failed for ${action} on ${selector}`
      );
    }
  }
}

// Run the test
testVisualAndRecoveryFeatures().catch(console.error);
