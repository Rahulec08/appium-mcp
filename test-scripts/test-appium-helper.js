// test-appium-helper.js
// Simple test script to verify AppiumHelper functionality

import {
  AppiumHelper,
  AppiumCapabilities,
} from "../src/lib/appium/appiumHelper.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a screenshot directory in the test-scripts folder
const screenshotDir = join(__dirname, "screenshots");

/**
 * Main test function to verify AppiumHelper functionality
 */
async function testAppiumHelper() {
  console.log("=== APPIUM HELPER TEST ===");
  console.log(
    "This test will verify all key methods of the AppiumHelper class"
  );

  // Create an AppiumHelper instance
  console.log("\n> Creating AppiumHelper instance");
  const appiumHelper = new AppiumHelper(screenshotDir);

  // Print out all available methods on the AppiumHelper instance
  console.log("\n> Available methods on AppiumHelper:");
  const methods = Object.getOwnPropertyNames(
    Object.getPrototypeOf(appiumHelper)
  ).filter(
    (name) => name !== "constructor" && typeof appiumHelper[name] === "function"
  );

  console.log(methods.join("\n"));
  console.log(`Total methods: ${methods.length}`);

  // Check if key methods exist
  console.log("\n> Checking for essential methods:");
  const essentialMethods = [
    "initializeDriver",
    "findElement",
    "tapElement",
    "click", // Alias for tapElement
    "sendKeys",
    "takeScreenshot",
    "swipe",
    "scrollToElement",
    "getPageSource",
    "waitForElement",
    "getElementRect",
  ];

  let allMethodsExist = true;
  for (const method of essentialMethods) {
    const exists = typeof appiumHelper[method] === "function";
    console.log(`${method}: ${exists ? "✓" : "✗"}`);
    if (!exists) allMethodsExist = false;
  }

  if (allMethodsExist) {
    console.log("\n✅ All essential methods exist in AppiumHelper");
  } else {
    console.log("\n❌ Some essential methods are missing from AppiumHelper");
  }

  // No need to initialize a real driver for this test
  console.log("\n> Testing complete. No actual Appium session was created.");
  console.log(
    "> To test with a real device, you would need to create capabilities and initialize the driver."
  );
}

// Run the test
testAppiumHelper().catch((error) => {
  console.error("Error during test:", error);
});
