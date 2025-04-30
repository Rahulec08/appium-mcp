import {
  AppiumHelper,
  AppiumCapabilities,
} from "../src/lib/appium/appiumHelper.js";

async function testAppiumMCP() {
  const appium = new AppiumHelper("./test-screenshots");

  try {
    // Initialize Appium driver for Android
    const capabilities: AppiumCapabilities = {
      platformName: "Android",
      deviceName: "Pixel_4", // Change this to your device name
      automationName: "UiAutomator2",
      // If testing an APK
      // app: './path/to/your/app.apk',
      // Or if testing an installed app
      appPackage: "com.android.settings", // Using settings app as example
      appActivity: ".Settings",
      noReset: true,
    };

    console.log("Initializing Appium driver...");
    await appium.initializeDriver(capabilities);
    console.log("Driver initialized successfully");

    // Get device info
    console.log("Getting device information...");
    const currentPackage = await appium.getCurrentPackage();
    console.log("Current package:", currentPackage);

    const currentActivity = await appium.getCurrentActivity();
    console.log("Current activity:", currentActivity);

    const orientation = await appium.getOrientation();
    console.log("Device orientation:", orientation);

    // Take a screenshot
    console.log("Taking screenshot...");
    const screenshotPath = await appium.takeScreenshot("settings_home");
    console.log("Screenshot saved to:", screenshotPath);

    // Find and interact with elements
    console.log("Finding and interacting with elements...");

    // Try to find the search button in settings
    const searchExists = await appium.elementExists(
      '//android.widget.TextView[@text="Search settings"]'
    );
    if (searchExists) {
      console.log("Found search settings button");
      await appium.tapElement(
        '//android.widget.TextView[@text="Search settings"]'
      );

      // Type in search
      await appium.sendKeys("//android.widget.EditText", "wifi");

      // Take screenshot of search results
      await appium.takeScreenshot("search_results");

      // Hide keyboard
      await appium.hideKeyboard();
    }

    // Scroll test
    console.log("Testing scroll functionality...");
    const scrollResult = await appium.scrollToElement(
      '//android.widget.TextView[@text="About phone"]'
    );
    if (scrollResult) {
      console.log('Successfully scrolled to "About phone"');
      await appium.tapElement('//android.widget.TextView[@text="About phone"]');
      await appium.takeScreenshot("about_phone");
    }

    // Get battery info
    console.log("Getting battery information...");
    const batteryInfo = await appium.getBatteryInfo();
    console.log("Battery level:", batteryInfo.level);
    console.log("Battery state:", batteryInfo.state);
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    // Cleanup
    console.log("Cleaning up...");
    await appium.closeDriver();
    console.log("Test completed");
  }
}

// Run the test
testAppiumMCP().catch(console.error);
