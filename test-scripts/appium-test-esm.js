// appium-test-esm.js - ES Module version of the Appium test
import { AppiumHelper } from "../src/lib/appium/appiumHelper.js";

/**
 * Tests all major AppiumHelper actions
 */
async function testAllAppiumActions() {
  console.log("Starting comprehensive AppiumHelper action test...");
  const appium = new AppiumHelper("./test-screenshots");

  try {
    // SECTION 1: SETUP AND INITIALIZATION
    console.log("\n=== DRIVER INITIALIZATION ===");
    const capabilities = {
      platformName: "Android",
      deviceName: "Pixel_4", // Change to your device name
      automationName: "UiAutomator2",
      appPackage: "com.android.settings",
      appActivity: ".Settings",
      noReset: true,
    };

    await appium.initializeDriver(capabilities);
    console.log("✅ Driver initialized successfully");

    // SECTION 2: DEVICE INFORMATION
    console.log("\n=== DEVICE INFORMATION ===");

    const currentPackage = await appium.getCurrentPackage();
    console.log(`Current package: ${currentPackage}`);

    const currentActivity = await appium.getCurrentActivity();
    console.log(`Current activity: ${currentActivity}`);

    const orientation = await appium.getOrientation();
    console.log(`Device orientation: ${orientation}`);

    try {
      const batteryInfo = await appium.getBatteryInfo();
      console.log(`Battery level: ${batteryInfo.level}`);
      console.log(`Battery state: ${batteryInfo.state}`);
    } catch (err) {
      console.log("Battery info not available:", err.message);
    }

    const screenshotPath = await appium.takeScreenshot("settings_home");
    console.log(`✅ Screenshot saved to: ${screenshotPath}`);

    // SECTION 3: ELEMENT OPERATIONS
    console.log("\n=== ELEMENT OPERATIONS ===");

    const networkExists = await appium.elementExists(
      '//android.widget.TextView[contains(@text, "Network")]'
    );
    console.log(`Network menu item exists: ${networkExists}`);

    try {
      const networkElement = await appium.findElement(
        '//android.widget.TextView[contains(@text, "Network")]'
      );
      console.log("✅ Element found successfully");

      // Get text using xpath directly
      const text = await appium.getText(
        '//android.widget.TextView[contains(@text, "Network")]'
      );
      console.log(`Element text: ${text}`);
    } catch (error) {
      console.error("❌ Could not find network element:", error);
    }

    // SECTION 4: GESTURE ACTIONS
    console.log("\n=== GESTURE ACTIONS ===");

    // Test tap element
    console.log("Testing tap element...");
    try {
      const tapResult = await appium.tapElement(
        '//android.widget.TextView[contains(@text, "Network")]',
        "xpath"
      );
      console.log(`✅ Tap result: ${tapResult}`);
      await appium.takeScreenshot("after_tap");

      // Wait 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Go back
      console.log("Going back to main screen...");
      // Use pressKeyCode instead of goBack
      await appium.pressKeyCode(4); // Android back key

      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.log("❌ Tap operation failed:", error);
    }

    // Test scroll to element
    console.log("Testing scrollToElement...");
    try {
      const scrollResult = await appium.scrollToElement(
        '//android.widget.TextView[@text="About phone"]'
      );
      await appium.takeScreenshot("after_scroll");
      console.log(`Scroll result: ${scrollResult}`);
    } catch (error) {
      console.log("❌ Scroll operation failed:", error);
    }

    // Test swipe
    console.log("Testing swipe...");
    try {
      const { width, height } = await appium.getWindowSize();
      await appium.swipe(
        width / 2, // Start X
        height * 0.8, // Start Y
        width / 2, // End X
        height * 0.2, // End Y
        800 // Duration
      );
      await appium.takeScreenshot("after_swipe");
      console.log("✅ Swipe tested successfully");
    } catch (error) {
      console.log("❌ Swipe operation failed:", error);
    }

    // Test longPress
    console.log("Testing longPress...");
    try {
      const longPressResult = await appium.longPress(
        '//android.widget.TextView[@text="About phone"]'
      );
      console.log(`Long press result: ${longPressResult}`);
      await appium.takeScreenshot("after_long_press");
    } catch (error) {
      console.log("❌ Long press failed:", error);
    }

    // SECTION 5: APP MANAGEMENT
    console.log("\n=== APP MANAGEMENT ===");

    // Test reset app instead of sendAppToBackground
    console.log("Testing app reset...");
    try {
      await appium.resetApp();
      console.log("✅ App reset successfully");
    } catch (error) {
      console.log("❌ App reset failed:", error);
    }

    // SECTION 6: CONTEXT HANDLING
    console.log("\n=== CONTEXT HANDLING ===");
    try {
      const contexts = await appium.getContexts();
      console.log("Available contexts:", contexts);

      const currentContext = await appium.getCurrentContext();
      console.log("Current context:", currentContext);
    } catch (error) {
      console.log(
        "❌ Context operations not supported in this app/environment:",
        error
      );
    }

    // SECTION 7: WAIT OPERATIONS
    console.log("\n=== WAIT OPERATIONS ===");
    console.log("Testing wait for element...");
    try {
      const waitResult = await appium.waitForElement(
        '//android.widget.TextView[@text="About phone"]',
        "xpath",
        5000
      );
      console.log(`Wait result: ${waitResult}`);
    } catch (error) {
      console.log("❌ Wait operation failed:", error);
    }

    // SECTION 8: ELEMENT ATTRIBUTES & INSPECTION
    console.log("\n=== ELEMENT INSPECTION ===");
    try {
      const element = '//android.widget.TextView[@text="About phone"]';
      if (await appium.elementExists(element)) {
        const attributes = await appium.getElementAttributes(element);
        console.log("Element attributes:", JSON.stringify(attributes, null, 2));

        const rect = await appium.getElementRect(element);
        console.log("Element rectangle:", rect);
      }
    } catch (error) {
      console.log("❌ Element inspection failed:", error);
    }

    // SECTION 9: CLEAN UP
    console.log("\n=== TEST COMPLETE ===");
    console.log("All tests completed successfully");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    // Cleanup
    console.log("Cleaning up resources...");
    await appium.closeDriver();
    console.log("Driver closed. Test suite completed.");
  }
}

// Run the test
testAllAppiumActions().catch(console.error);
