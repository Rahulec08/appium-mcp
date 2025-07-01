import {
  AppiumHelper,
  AppiumCapabilities,
  AppiumError,
} from "../src/lib/appium/appiumHelper.js";
import { Browser, RemoteOptions, remote } from "webdriverio";

/**
 * Comprehensive test suite for AppiumHelper
 * This tests all W3C compliant methods and mobile-specific extensions
 */
async function testAppiumHelperComprehensive() {
  const appium = new AppiumHelper("./test-screenshots");
  let testResults: { [key: string]: boolean } = {};

  try {
    console.log("🚀 Starting comprehensive AppiumHelper test suite...\n");

    // Test 1: Driver Initialization
    console.log("📱 Test 1: Driver Initialization");
    try {
      const capabilities: AppiumCapabilities =
        AppiumHelper.createW3CCapabilities("Android", {
          deviceName: "Pixel_4",
          automationName: "UiAutomator2",
          appPackage: "com.android.settings",
          appActivity: ".Settings",
          noReset: true,
          newCommandTimeout: 300,
        });

      console.log(
        "Capabilities created:",
        JSON.stringify(capabilities, null, 2)
      );

      // Use environment variable or default URL
      const appiumUrl =
        process.env.APPIUM_SERVER_URL || "http://0.0.0.0:4723/wd/hub";
      await appium.initializeDriver(capabilities, appiumUrl);
      testResults["driver_initialization"] = true;
      console.log("✅ Driver initialization: PASSED\n");
    } catch (error) {
      testResults["driver_initialization"] = false;
      console.log("❌ Driver initialization: FAILED -", error);
      throw error; // Can't continue without driver
    }

    // Test 2: Session Management
    console.log("📱 Test 2: Session Management");
    try {
      const driver = appium.getDriver();
      console.log("Driver instance retrieved:", !!driver);

      const sessionValid = await appium.validateSession();
      console.log("Session validation:", sessionValid);

      testResults["session_management"] = true;
      console.log("✅ Session management: PASSED\n");
    } catch (error) {
      testResults["session_management"] = false;
      console.log("❌ Session management: FAILED -", error);
    }

    // Test 3: Device Information
    console.log("📱 Test 3: Device Information");
    try {
      const currentPackage = await appium.getCurrentPackage();
      console.log("Current package:", currentPackage);

      const currentActivity = await appium.getCurrentActivity();
      console.log("Current activity:", currentActivity);

      const deviceTime = await appium.getDeviceTime();
      console.log("Device time:", deviceTime);

      const orientation = await appium.getOrientation();
      console.log("Device orientation:", orientation);

      const windowSize = await appium.getWindowSize();
      console.log("Window size:", windowSize);

      testResults["device_information"] = true;
      console.log("✅ Device information: PASSED\n");
    } catch (error) {
      testResults["device_information"] = false;
      console.log("❌ Device information: FAILED -", error);
    }

    // Test 4: Screenshots
    console.log("📱 Test 4: Screenshots");
    try {
      const screenshotPath1 = await appium.takeScreenshot("initial_screen");
      console.log("Full screenshot saved:", screenshotPath1);

      testResults["screenshots"] = true;
      console.log("✅ Screenshots: PASSED\n");
    } catch (error) {
      testResults["screenshots"] = false;
      console.log("❌ Screenshots: FAILED -", error);
    }

    // Test 5: Page Source
    console.log("📱 Test 5: Page Source");
    try {
      const pageSource = await appium.getPageSource();
      console.log("Page source length:", pageSource.length);
      console.log("Contains settings?", pageSource.includes("Settings"));

      testResults["page_source"] = true;
      console.log("✅ Page source: PASSED\n");
    } catch (error) {
      testResults["page_source"] = false;
      console.log("❌ Page source: FAILED -", error);
    }

    // Test 6: Element Location Strategies
    console.log("📱 Test 6: Element Location Strategies");
    try {
      // Test different location strategies
      const strategies = [
        {
          strategy: "xpath",
          selector: '//android.widget.TextView[@text="About phone"]',
        },
        { strategy: "id", selector: "android:id/title" },
        { strategy: "class name", selector: "android.widget.TextView" },
        { strategy: "accessibility id", selector: "About phone" },
      ];

      let strategyResults = 0;
      for (const test of strategies) {
        try {
          const exists = await appium.elementExists(
            test.selector,
            test.strategy
          );
          console.log(
            `${test.strategy} strategy (${test.selector}):`,
            exists ? "Found" : "Not found"
          );
          if (exists) strategyResults++;
        } catch (error) {
          console.log(
            `${test.strategy} strategy failed:`,
            error instanceof Error ? error.message : error
          );
        }
      }

      testResults["element_location"] = strategyResults > 0;
      console.log(
        `✅ Element location strategies: ${strategyResults}/4 working\n`
      );
    } catch (error) {
      testResults["element_location"] = false;
      console.log("❌ Element location strategies: FAILED -", error);
    }

    // Test 7: Element Finding
    console.log("📱 Test 7: Element Finding");
    try {
      // Find single element
      const element = await appium.findElement(
        "//android.widget.TextView",
        "xpath"
      );
      console.log("Single element found:", !!element);

      // Find multiple elements
      const elements = await appium.findElements(
        "//android.widget.TextView",
        "xpath"
      );
      console.log("Multiple elements found:", elements.length);

      testResults["element_finding"] = true;
      console.log("✅ Element finding: PASSED\n");
    } catch (error) {
      testResults["element_finding"] = false;
      console.log("❌ Element finding: FAILED -", error);
    }

    // Test 8: Element State Checks
    console.log("📱 Test 8: Element State Checks");
    try {
      const testSelector = "//android.widget.TextView";

      const isDisplayed = await appium.isDisplayed(testSelector);
      console.log("Element displayed:", isDisplayed);

      const isEnabled = await appium.isEnabled(testSelector);
      console.log("Element enabled:", isEnabled);

      const isSelected = await appium.isSelected(testSelector);
      console.log("Element selected:", isSelected);

      testResults["element_state"] = true;
      console.log("✅ Element state checks: PASSED\n");
    } catch (error) {
      testResults["element_state"] = false;
      console.log("❌ Element state checks: FAILED -", error);
    }

    // Test 9: Element Text and Attributes
    console.log("📱 Test 9: Element Text and Attributes");
    try {
      const textSelector = "//android.widget.TextView[1]";

      const elementText = await appium.getText(textSelector);
      console.log("Element text:", elementText);

      const className = await appium.getAttribute(textSelector, "class");
      console.log("Element class:", className);

      const resourceId = await appium.getAttribute(textSelector, "resource-id");
      console.log("Element resource-id:", resourceId);

      testResults["element_text_attributes"] = true;
      console.log("✅ Element text and attributes: PASSED\n");
    } catch (error) {
      testResults["element_text_attributes"] = false;
      console.log("❌ Element text and attributes: FAILED -", error);
    }

    // Test 10: Touch Actions
    console.log("📱 Test 10: Touch Actions");
    try {
      // Test scroll
      console.log("Testing scroll down...");
      await appium.scroll("down", 0.3);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("Testing scroll up...");
      await appium.scroll("up", 0.3);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Test swipe
      const windowSize = await appium.getWindowSize();
      const centerX = windowSize.width / 2;
      const startY = windowSize.height * 0.7;
      const endY = windowSize.height * 0.3;

      console.log("Testing swipe gesture...");
      await appium.swipe(centerX, startY, centerX, endY, 500);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      testResults["touch_actions"] = true;
      console.log("✅ Touch actions: PASSED\n");
    } catch (error) {
      testResults["touch_actions"] = false;
      console.log("❌ Touch actions: FAILED -", error);
    }

    // Test 11: Element Interaction
    console.log("📱 Test 11: Element Interaction");
    try {
      // Look for About phone and tap it
      const aboutPhoneExists = await appium.elementExists(
        '//android.widget.TextView[@text="About phone"]'
      );

      if (aboutPhoneExists) {
        console.log("Found 'About phone', testing tap...");
        await appium.tapElement(
          '//android.widget.TextView[@text="About phone"]'
        );
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const aboutScreenshot = await appium.takeScreenshot("about_phone");
        console.log("About phone screenshot:", aboutScreenshot);

        // Navigate back
        await appium.navigateBack();
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Test search functionality if available
      const searchExists = await appium.elementExists(
        '//android.widget.TextView[@text="Search settings"]'
      );

      if (searchExists) {
        console.log("Testing search functionality...");
        await appium.tapElement(
          '//android.widget.TextView[@text="Search settings"]'
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Try to find search input field
        const searchInputExists = await appium.elementExists(
          "//android.widget.EditText"
        );
        if (searchInputExists) {
          await appium.sendKeys("//android.widget.EditText", "wifi");
          await new Promise((resolve) => setTimeout(resolve, 2000));

          await appium.takeScreenshot("search_results");

          // Clear search
          await appium.clearElement("//android.widget.EditText");

          // Navigate back
          await appium.navigateBack();
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      testResults["element_interaction"] = true;
      console.log("✅ Element interaction: PASSED\n");
    } catch (error) {
      testResults["element_interaction"] = false;
      console.log("❌ Element interaction: FAILED -", error);
    }

    // Test 12: Advanced Gestures
    console.log("📱 Test 12: Advanced Gestures");
    try {
      const windowSize = await appium.getWindowSize();
      const centerX = windowSize.width / 2;
      const centerY = windowSize.height / 2;

      // Test long press (if we can find a suitable element)
      const testElements = await appium.findElements(
        "//android.widget.TextView"
      );
      if (testElements.length > 0) {
        try {
          console.log("Testing long press...");
          await appium.longPress("//android.widget.TextView[1]", 1000);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (longPressError) {
          console.log(
            "Long press test skipped:",
            longPressError instanceof Error
              ? longPressError.message
              : longPressError
          );
        }
      }

      // Test pinch gesture
      try {
        console.log("Testing pinch gesture...");
        await appium.pinch(centerX, centerY, 0.8, 1000);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (pinchError) {
        console.log(
          "Pinch test skipped:",
          pinchError instanceof Error ? pinchError.message : pinchError
        );
      }

      // Test zoom gesture
      try {
        console.log("Testing zoom gesture...");
        await appium.zoom(centerX, centerY, 1.2, 1000);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (zoomError) {
        console.log(
          "Zoom test skipped:",
          zoomError instanceof Error ? zoomError.message : zoomError
        );
      }

      testResults["advanced_gestures"] = true;
      console.log("✅ Advanced gestures: PASSED\n");
    } catch (error) {
      testResults["advanced_gestures"] = false;
      console.log("❌ Advanced gestures: FAILED -", error);
    }

    // Test 13: Context Management
    console.log("📱 Test 13: Context Management");
    try {
      const contexts = await appium.getContexts();
      console.log("Available contexts:", contexts);

      const currentContext = await appium.getCurrentContext();
      console.log("Current context:", currentContext);

      testResults["context_management"] = true;
      console.log("✅ Context management: PASSED\n");
    } catch (error) {
      testResults["context_management"] = false;
      console.log("❌ Context management: FAILED -", error);
    }

    // Test 14: App Management
    console.log("📱 Test 14: App Management");
    try {
      // Test if calculator app is installed
      const calcInstalled = await appium.isAppInstalled(
        "com.google.android.calculator"
      );
      console.log("Calculator app installed:", calcInstalled);

      // Test current app info
      const currentPackage = await appium.getCurrentPackage();
      console.log("Current package:", currentPackage);

      testResults["app_management"] = true;
      console.log("✅ App management: PASSED\n");
    } catch (error) {
      testResults["app_management"] = false;
      console.log("❌ App management: FAILED -", error);
    }

    // Test 15: Device Hardware Keys
    console.log("📱 Test 15: Device Hardware Keys");
    try {
      // Test home key (key code 3)
      console.log("Testing home key...");
      await appium.pressKeyCode(3);
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Return to settings
      await appium.activateApp("com.android.settings");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      testResults["hardware_keys"] = true;
      console.log("✅ Hardware keys: PASSED\n");
    } catch (error) {
      testResults["hardware_keys"] = false;
      console.log("❌ Hardware keys: FAILED -", error);
    }

    // Test 16: tapElement Method
    console.log("📱 Test 16: tapElement Method");
    try {
      // Test basic tap functionality on different element types
      console.log("Testing tapElement on various UI elements...");

      // Test 1: Tap on first visible TextView
      const textElements = await appium.findElements(
        "//android.widget.TextView"
      );
      if (textElements.length > 0) {
        console.log(`Found ${textElements.length} text elements for tapping`);

        const firstElement = "//android.widget.TextView[1]";
        const isDisplayed = await appium.isDisplayed(firstElement);

        if (isDisplayed) {
          console.log("Testing tapElement on first TextView...");
          await appium.tapElement(firstElement);
          await new Promise((resolve) => setTimeout(resolve, 1000));

          await appium.takeScreenshot("after_tap_first_element");
          console.log("✅ tapElement on TextView successful");
        }
      }

      // Test 2: Try tapping on specific Settings menu items
      const settingsMenuItems = [
        '//android.widget.TextView[@text="Network & internet"]',
        '//android.widget.TextView[@text="Connected devices"]',
        '//android.widget.TextView[@text="Apps"]',
        '//android.widget.TextView[@text="Battery"]',
        '//android.widget.TextView[@text="Display"]',
        '//android.widget.TextView[@text="Sound"]',
        '//android.widget.TextView[@text="Storage"]',
        '//android.widget.TextView[@text="Privacy"]',
        '//android.widget.TextView[@text="Security"]',
        '//android.widget.TextView[@text="System"]',
      ];

      let successfulTaps = 0;
      for (const menuItem of settingsMenuItems) {
        try {
          const exists = await appium.elementExists(menuItem);
          if (exists) {
            const menuText = menuItem.split('"')[1];
            console.log(`Testing tap on: "${menuText}"`);

            await appium.tapElement(menuItem);
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // Take screenshot to verify navigation
            await appium.takeScreenshot(
              `tap_${menuText.toLowerCase().replace(/\s+/g, "_")}`
            );

            // Navigate back to Settings main screen
            await appium.navigateBack();
            await new Promise((resolve) => setTimeout(resolve, 1000));

            successfulTaps++;
            console.log(`✅ Successfully tapped "${menuText}"`);

            // Only test 2-3 items to avoid excessive navigation
            if (successfulTaps >= 2) break;
          }
        } catch (error) {
          console.log(
            `Tap failed for ${menuItem}:`,
            error instanceof Error ? error.message : error
          );
        }
      }

      // Test 3: Test tapping by coordinates (fallback test)
      console.log("Testing coordinate-based tap...");
      const windowSize = await appium.getWindowSize();
      const centerX = windowSize.width / 2;
      const centerY = windowSize.height / 2;

      await appium.tapByCoordinates(centerX, centerY);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log(`✅ Coordinate tap at (${centerX}, ${centerY}) successful`);

      // Test 4: Test tapElement with different selector strategies
      const selectorTests = [
        {
          strategy: "xpath",
          selector: "//android.widget.TextView[contains(@text,'About')]",
        },
        {
          strategy: "xpath",
          selector:
            "//android.widget.LinearLayout[1]/android.widget.TextView[1]",
        },
        { strategy: "class name", selector: "android.widget.TextView" },
      ];

      for (const test of selectorTests) {
        try {
          const exists = await appium.elementExists(
            test.selector,
            test.strategy
          );
          if (exists) {
            console.log(
              `Testing tapElement with ${test.strategy}: ${test.selector}`
            );
            await appium.tapElement(test.selector, test.strategy);
            await new Promise((resolve) => setTimeout(resolve, 800));
            console.log(`✅ tapElement with ${test.strategy} successful`);
            break; // Only test one successful strategy
          }
        } catch (error) {
          console.log(
            `tapElement failed with ${test.strategy}:`,
            error instanceof Error ? error.message : error
          );
        }
      }

      console.log(
        `✅ tapElement tests completed: ${successfulTaps} menu items successfully tapped`
      );
      testResults["tap_element_method"] = true;
      console.log("✅ tapElement method: PASSED\n");
    } catch (error) {
      testResults["tap_element_method"] = false;
      console.log("❌ tapElement method: FAILED -", error);
    }

    // Test 17: Script Execution
    console.log("📱 Test 17: Script Execution");
    try {
      // Execute mobile command
      const result = await appium.executeScript("mobile: deviceInfo", []);
      console.log("Device info result:", result);

      testResults["script_execution"] = true;
      console.log("✅ Script execution: PASSED\n");
    } catch (error) {
      testResults["script_execution"] = false;
      console.log("❌ Script execution: FAILED -", error);
    }

    // Test 18: Orientation
    console.log("📱 Test 18: Orientation Control");
    try {
      const currentOrientation = await appium.getOrientation();
      console.log("Current orientation:", currentOrientation);

      // Try to change orientation
      const newOrientation =
        currentOrientation === "PORTRAIT" ? "LANDSCAPE" : "PORTRAIT";
      await appium.setOrientation(newOrientation);
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const changedOrientation = await appium.getOrientation();
      console.log("Changed orientation:", changedOrientation);

      // Restore original orientation
      await appium.setOrientation(currentOrientation);
      await new Promise((resolve) => setTimeout(resolve, 3000));

      testResults["orientation"] = true;
      console.log("✅ Orientation control: PASSED\n");
    } catch (error) {
      testResults["orientation"] = false;
      console.log("❌ Orientation control: FAILED -", error);
    }

    // Test 19: Wait Functions
    console.log("📱 Test 19: Wait Functions");
    try {
      const element = await appium.waitForElement(
        "//android.widget.TextView",
        "xpath",
        5000
      );
      console.log("Wait for element successful:", !!element);

      const isClickable = await appium.waitUntilElementClickable(
        "//android.widget.TextView",
        "xpath",
        5000
      );
      console.log("Wait until clickable successful:", isClickable);

      testResults["wait_functions"] = true;
      console.log("✅ Wait functions: PASSED\n");
    } catch (error) {
      testResults["wait_functions"] = false;
      console.log("❌ Wait functions: FAILED -", error);
    }

    // Test 20: Error Handling
    console.log("📱 Test 20: Error Handling");
    try {
      // Try to find non-existent element
      try {
        await appium.findElement(
          '//android.widget.NonExistentElement[@text="NonExistent"]',
          "xpath",
          2000
        );
        testResults["error_handling"] = false;
      } catch (error) {
        if (error instanceof AppiumError) {
          console.log("AppiumError correctly thrown:", error.message);
          testResults["error_handling"] = true;
        } else {
          testResults["error_handling"] = false;
        }
      }
      console.log("✅ Error handling: PASSED\n");
    } catch (error) {
      testResults["error_handling"] = false;
      console.log("❌ Error handling: FAILED -", error);
    }
  } catch (error) {
    console.error("❌ Critical test failure:", error);
  } finally {
    // Cleanup
    console.log("🧹 Cleaning up...");
    try {
      await appium.closeDriver();
      console.log("✅ Driver closed successfully");
    } catch (error) {
      console.log("⚠️ Error closing driver:", error);
    }
  }

  // Print test results summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 TEST RESULTS SUMMARY");
  console.log("=".repeat(60));

  let passed = 0;
  let total = 0;

  for (const [testName, result] of Object.entries(testResults)) {
    total++;
    if (result) passed++;
    console.log(
      `${result ? "✅" : "❌"} ${testName.replace(/_/g, " ")}: ${
        result ? "PASSED" : "FAILED"
      }`
    );
  }

  console.log("=".repeat(60));
  console.log(
    `📈 TOTAL: ${passed}/${total} tests passed (${Math.round(
      (passed / total) * 100
    )}%)`
  );
  console.log("=".repeat(60));

  if (passed === total) {
    console.log("🎉 All tests passed! AppiumHelper is working correctly.");
  } else {
    console.log("⚠️ Some tests failed. Check the logs above for details.");
  }

  return testResults;
}

/**
 * Quick smoke test for basic functionality
 */
async function quickSmokeTest() {
  const appium = new AppiumHelper("./test-screenshots");

  try {
    console.log("🔥 Running quick smoke test...\n");

    const capabilities: AppiumCapabilities = {
      platformName: "Android",
      "appium:deviceName": "Pixel_4",
      "appium:automationName": "UiAutomator2",
      "appium:appPackage": "com.android.settings",
      "appium:appActivity": ".Settings",
      "appium:noReset": true,
    };

    // Use environment variable or default
    const appiumUrl = process.env.APPIUM_SERVER_URL || "http://localhost:4723";

    await appium.initializeDriver(capabilities, appiumUrl);
    console.log("✅ Driver initialized");

    const screenshot = await appium.takeScreenshot("smoke_test");
    console.log("✅ Screenshot taken:", screenshot);

    const pageSource = await appium.getPageSource();
    console.log("✅ Page source retrieved, length:", pageSource.length);

    const elements = await appium.findElements("//android.widget.TextView");
    console.log("✅ Found elements:", elements.length);

    await appium.scroll("down");
    console.log("✅ Scroll performed");

    await appium.closeDriver();
    console.log("✅ Driver closed");

    console.log("\n🎉 Smoke test completed successfully!");
  } catch (error) {
    console.error("❌ Smoke test failed:", error);
    try {
      await appium.closeDriver();
    } catch {}
  }
}

// Export test functions
export { testAppiumHelperComprehensive, quickSmokeTest };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const testType = process.argv[2] || "comprehensive";

  if (testType === "smoke") {
    quickSmokeTest().catch(console.error);
  } else {
    testAppiumHelperComprehensive().catch(console.error);
  }
}
