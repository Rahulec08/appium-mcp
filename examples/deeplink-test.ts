/**
 * Deep Link Test Example for MCP Appium
 *
 * This example demonstrates how to:
 * 1. Open deep links in mobile applications using Appium
 * 2. Handle platform-specific deep linking (Android vs iOS)
 * 3. Use the AppiumHelper class methods for deep linking
 *
 * Prerequisites:
 * - Appium server running on port 4723
 * - Android or iOS device/emulator connected
 * - Apps installed that can handle the deep links being tested
 */

import {
  AppiumHelper,
  AppiumCapabilities,
} from "../src/lib/appium/appiumHelper";
import path from "path";

// Test configuration
const TEST_URLS = {
  // Web URLs that will open in a browser or app that handles web URLs
  WEB: [
    "https://www.example.com",
    "https://www.google.com/search?q=appium+testing",
  ],
  // Custom URIs - replace these with URIs that work on your test device
  CUSTOM: [
    "youtube://", // YouTube app
    "tel:+1234567890", // Phone app
    "sms:+1234567890", // Messaging app
    "geo:37.7749,-122.4194", // Maps
    "market://details?id=com.android.chrome", // Play Store (Android)
  ],
  // App-specific deep links - replace with deep links for apps installed on your test device
  APP_SPECIFIC: [
    "twitter://timeline", // Twitter app
    "fb://profile", // Facebook app
    "instagram://user?username=instagram", // Instagram app
  ],
};

/**
 * Main test function to demonstrate deep linking
 */
async function testDeepLinks() {
  // Initialize AppiumHelper
  const appiumHelper = new AppiumHelper("./test-screenshots");
  let driver;

  try {
    // Set up capabilities for Android
    // Replace these values with the appropriate capabilities for your device
    const androidCapabilities: AppiumCapabilities = {
      platformName: "Android",
      deviceName: "Android Device",
      // Uncomment if using a physical device and specify your device ID
      // udid: 'YOUR_DEVICE_ID',
      automationName: "UiAutomator2",
      // No need for app capability as we're testing deep links to installed apps
      noReset: true,
    };

    // For iOS, use a configuration like this:
    /*
    const iosCapabilities: AppiumCapabilities = {
      platformName: 'iOS',
      deviceName: 'iPhone',
      // Specify your device UDID if using a real device
      // udid: 'YOUR_DEVICE_UDID',
      automationName: 'XCUITest',
      // No need for app capability as we're testing deep links to installed apps
      noReset: true,
    };
    */

    // Choose capabilities based on target platform
    const capabilities = androidCapabilities; // Change to iosCapabilities for iOS testing

    // Initialize the Appium driver
    console.log("Initializing Appium driver...");
    driver = await appiumHelper.initializeDriver(capabilities);
    console.log("Driver initialized successfully");

    // Wait a moment for the device to be fully initialized
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Test web URLs
    console.log("\n==== Testing Web URLs ====");
    for (const url of TEST_URLS.WEB) {
      await testDeepLink(appiumHelper, url);
      // Wait between tests to allow the previous app to settle
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    // Test custom URIs
    console.log("\n==== Testing Custom URIs ====");
    for (const url of TEST_URLS.CUSTOM) {
      await testDeepLink(appiumHelper, url);
      // Wait between tests to allow the previous app to settle
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    // Test app-specific deep links
    console.log("\n==== Testing App-Specific Deep Links ====");
    for (const url of TEST_URLS.APP_SPECIFIC) {
      await testDeepLink(appiumHelper, url);
      // Wait between tests to allow the previous app to settle
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    // Android-specific deep link with extras (Android only)
    if (capabilities.platformName === "Android") {
      console.log(
        "\n==== Testing Android-Specific Deep Links with Extras ===="
      );

      // Example: Open Google Maps with coordinates and zoom level
      const mapUrl = "geo:37.7749,-122.4194";
      const mapExtras = {
        zoom: "15",
        mode: "driving",
      };

      try {
        await appiumHelper.openAndroidDeepLink(mapUrl, mapExtras);
        console.log(
          `✅ Successfully opened Android deep link with extras: ${mapUrl}`
        );

        // Take a screenshot to verify
        const screenshotPath = await appiumHelper.takeScreenshot(
          "android_deeplink_extras"
        );
        console.log(`Screenshot saved to: ${screenshotPath}`);

        // Wait before moving on
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } catch (error) {
        console.error(
          `❌ Failed to open Android deep link with extras: ${mapUrl}`,
          error
        );
      }
    }
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    // Clean up: close the driver
    if (appiumHelper) {
      console.log("Closing Appium driver...");
      await appiumHelper.closeDriver();
      console.log("Driver closed successfully");
    }
  }
}

/**
 * Helper function to test a specific deep link
 */
async function testDeepLink(appiumHelper: AppiumHelper, url: string) {
  try {
    console.log(`\nTesting deep link: ${url}`);

    // First, take a screenshot of the current state
    const beforeScreenshotPath = await appiumHelper.takeScreenshot(
      `before_${url.replace(/[^a-zA-Z0-9]/g, "_")}`
    );
    console.log(`Before screenshot saved to: ${beforeScreenshotPath}`);

    // Open the deep link
    await appiumHelper.openDeepLink(url);
    console.log(`✅ Successfully opened deep link: ${url}`);

    // Wait for the app to fully load
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Take a screenshot to verify the result
    const afterScreenshotPath = await appiumHelper.takeScreenshot(
      `after_${url.replace(/[^a-zA-Z0-9]/g, "_")}`
    );
    console.log(`After screenshot saved to: ${afterScreenshotPath}`);

    // Optionally, we could verify that the deep link worked by checking for specific elements
    // e.g., await appiumHelper.elementExists('some_element_id', 'id');
  } catch (error) {
    console.error(`❌ Failed to open deep link: ${url}`, error);
  }
}

// Run the test
(async () => {
  console.log("Starting Deep Link Tests...");
  await testDeepLinks();
  console.log("Deep Link Tests Completed!");
})();
