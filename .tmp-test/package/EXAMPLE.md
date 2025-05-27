# MCP-Appium Example: Testing a Mobile App

This document provides a complete example of using MCP-Appium to automate testing for a mobile application.

## Example Scenario: Testing a Calculator App

In this example, we'll automate testing of a calculator app on an Android device:

1. Launch the calculator app
2. Perform a simple addition (5 + 7)
3. Verify the result (12)
4. Take a screenshot of the result

### Step 1: Setting Up the Environment

First, ensure you have:

- Appium server running (`appium`)
- Android device connected or emulator running
- MCP-Appium server built (`npm run build`)

### Step 2: Create a Test Script

Create a file called `calculator-test.ts` in your project:

```typescript
import { McpClient } from "@modelcontextprotocol/sdk/client/mcp.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";
import * as path from "path";

async function testCalculator() {
  console.log("Starting MCP-Appium test for calculator app...");

  // Start the MCP-Appium server as a child process
  const serverPath = path.resolve(process.cwd(), "dist", "index.js");
  const serverProcess = spawn("node", [serverPath]);

  // Log server output for debugging
  serverProcess.stderr.on("data", (data) => {
    console.error(`Server: ${data.toString()}`);
  });

  try {
    // Connect to the MCP server
    const transport = new StdioClientTransport({
      input: serverProcess.stdout,
      output: serverProcess.stdin,
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
    const deviceIdLine = devicesResult.content[0].text.split("\n")[1];
    if (!deviceIdLine || deviceIdLine.includes("No devices connected")) {
      throw new Error(
        "No devices found. Please connect a device or start an emulator."
      );
    }
    const deviceId = deviceIdLine.trim();
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

// Run the test
testCalculator().catch(console.error);
```

### Step 3: Run the Test

Compile and run the test script:

```bash
# Compile the script
npx tsc calculator-test.ts --esModuleInterop --target es2020 --module NodeNext

# Run the test
node calculator-test.js
```

## Alternative: Using MCP-Appium with Claude Desktop

You can also use the MCP-Appium server through Claude Desktop:

1. Configure Claude Desktop to use MCP-Appium (see README)
2. In Claude Desktop, ask questions like:
   - "Can you help me test a calculator app on my Android device?"
   - "I need to automate testing of this Android app with package name com.example.myapp"
   - "Show me all the installed apps on my connected Android device"

Claude will use the MCP-Appium tools to:

1. Check for connected devices
2. Provide insights about the app structure
3. Generate test scripts for you
4. Execute commands to interact with the app

## Using MCP-Appium for Real App Testing

For testing your own application:

1. **Find App Package and Activity**:
   ```bash
   adb shell dumpsys window | grep -E 'mCurrentFocus|mFocusedApp'
   ```
2. **Update the Appium Initialization**:

   ```typescript
   await client.callTool({
     name: "initialize-appium",
     arguments: {
       platformName: "Android",
       deviceName: deviceId,
       appPackage: "your.app.package",
       appActivity: "your.app.MainActivity",
       automationName: "UiAutomator2",
     },
   });
   ```

3. **Find Element Locators**:

   - Launch your app
   - Get the page source and extract locators:

   ```typescript
   const pageSource = await client.callTool({
     name: "get-page-source",
     arguments: {},
   });

   const extractResult = await client.callTool({
     name: "extract-locators",
     arguments: {
       xmlSource: pageSource.content[0].text,
       maxResults: 20,
     },
   });
   ```

4. **Create Interaction Sequences**:
   - Identify the elements you want to interact with
   - Create a sequence of tap, input, and wait operations
   - Verify results using screenshots and page source analysis

## Advanced: Testing UI Flows

For testing more complex UI flows, combine multiple actions:

```typescript
// Login flow example
async function testLoginFlow(client, username, password) {
  // Tap username field
  await client.callTool({
    name: "tap-element",
    arguments: {
      selector: '//android.widget.EditText[@resource-id="username_field"]',
      strategy: "xpath",
    },
  });

  // Enter username
  await client.callTool({
    name: "send-keys",
    arguments: {
      selector: '//android.widget.EditText[@resource-id="username_field"]',
      text: username,
      strategy: "xpath",
    },
  });

  // Tap password field
  await client.callTool({
    name: "tap-element",
    arguments: {
      selector: '//android.widget.EditText[@resource-id="password_field"]',
      strategy: "xpath",
    },
  });

  // Enter password
  await client.callTool({
    name: "send-keys",
    arguments: {
      selector: '//android.widget.EditText[@resource-id="password_field"]',
      text: password,
      strategy: "xpath",
    },
  });

  // Tap login button
  await client.callTool({
    name: "tap-element",
    arguments: {
      selector: '//android.widget.Button[@text="Login"]',
      strategy: "xpath",
    },
  });

  // Wait for home screen
  await client.callTool({
    name: "wait-for-element",
    arguments: {
      selector: '//android.widget.TextView[@text="Welcome"]',
      strategy: "xpath",
      timeoutMs: 10000,
    },
  });

  // Take screenshot of home screen
  await client.callTool({
    name: "appium-screenshot",
    arguments: { name: "home-screen" },
  });
}
```

## Tips for Effective Mobile Testing with MCP-Appium

1. **Dynamic Wait Strategies**: Always use `wait-for-element` before interacting with elements to ensure they're visible
2. **Error Handling**: Wrap each interaction in try/catch blocks for robust test scripts
3. **Screenshots**: Take screenshots at key points in your test flow for debugging
4. **Device Management**: Always check for connected devices before starting tests
5. **Element Location**: Use multiple strategies (ID, XPath, Accessibility ID) for reliable element location
6. **Test Organization**: Organize tests into small, reusable functions for different flows

# MCP-Appium Examples

This document provides practical examples of how to use MCP-Appium for mobile app testing and automation.

## Basic Setup with Claude

### Configuration Example

Add MCP-Appium to your Claude Desktop configuration file:

```json
{
  "servers": [
    {
      "name": "MCP-Appium",
      "transport": "stdio",
      "command": "mcp-appium"
    }
  ]
}
```

### Example Conversation with Claude

```
User: I want to test my Android app. Can you help me connect to my device and take a screenshot?

Claude: I'd be happy to help you test your Android app! Let's connect to your device and take a screenshot.

First, let's check what devices are connected:

[Claude uses list-devices tool to find connected Android devices]

Great! I found your connected device. Now let's initialize an Appium session and take a screenshot:

[Claude uses initialize-appium and appium-screenshot tools]

Here's your screenshot! The screenshot has been saved to: ./test-screenshots/screenshot_2025-05-14_12-34-56.png

Would you like me to help you interact with any specific elements on the screen?
```

## Command Line Interface Examples

### Starting the MCP-Appium Server

```bash
# Basic startup (starts both Appium and MCP server)
mcp-appium

# Show version information
mcp-appium version

# Show help
mcp-appium help
```

### Using the Interactive CLI

```bash
# Launch the interactive CLI
mcp-appium cli
```

In the CLI, you can:

1. List connected devices
2. Install APK files
3. Launch apps
4. Take screenshots
5. Find elements by text or XPath
6. Interact with UI elements
7. Extract element locators for automation

## Programmatic Usage Examples

### Basic Android Test

```typescript
import { AppiumHelper, AppiumCapabilities } from "mcp-appium";

async function testAndroidApp() {
  // Initialize AppiumHelper with screenshot directory
  const appiumHelper = new AppiumHelper("./screenshots");

  try {
    // Set up capabilities for Android
    const capabilities: AppiumCapabilities = {
      platformName: "Android",
      deviceName: "Android Device",
      automationName: "UiAutomator2",
      // For an installed app:
      appPackage: "com.example.app",
      appActivity: "com.example.app.MainActivity",
      noReset: true,
    };

    // Initialize driver
    const driver = await appiumHelper.initializeDriver(capabilities);
    console.log("Driver initialized successfully");

    // Take a screenshot
    const screenshotPath = await appiumHelper.takeScreenshot("initial_screen");
    console.log(`Screenshot taken: ${screenshotPath}`);

    // Find and tap an element
    await appiumHelper.tapElement(
      '//android.widget.Button[@text="Login"]',
      "xpath"
    );

    // Send keys to a text field
    await appiumHelper.sendKeys(
      '//android.widget.EditText[@resource-id="username"]',
      "testuser",
      "xpath"
    );
    await appiumHelper.sendKeys(
      '//android.widget.EditText[@resource-id="password"]',
      "password123",
      "xpath"
    );

    // Tap login button
    await appiumHelper.tapElement(
      '//android.widget.Button[@text="Submit"]',
      "xpath"
    );

    // Wait for the next screen to load
    await appiumHelper.waitForElement(
      '//android.widget.TextView[@text="Welcome"]',
      "xpath",
      5000
    );

    // Take another screenshot
    await appiumHelper.takeScreenshot("logged_in");
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    // Close the driver
    await appiumHelper.closeDriver();
  }
}

testAndroidApp().catch(console.error);
```

### iOS Test Example

```typescript
import { AppiumHelper, AppiumCapabilities } from "mcp-appium";

async function testIosApp() {
  const appiumHelper = new AppiumHelper("./screenshots");

  try {
    // Set up capabilities for iOS
    const capabilities: AppiumCapabilities = {
      platformName: "iOS",
      deviceName: "iPhone",
      automationName: "XCUITest",
      // For an installed app:
      bundleId: "com.example.app",
      // Or to install and launch:
      // app: '/path/to/app.ipa',
      noReset: true,
    };

    // Initialize driver
    await appiumHelper.initializeDriver(capabilities);

    // Take initial screenshot
    await appiumHelper.takeScreenshot("ios_initial");

    // Find element using iOS predicate string
    const loginButton = await appiumHelper.findByIosPredicate(
      'type == "XCUIElementTypeButton" AND name == "Login"'
    );
    await loginButton.click();

    // Send keys to text fields
    await appiumHelper.sendKeys(
      '//XCUIElementTypeTextField[@name="username"]',
      "testuser",
      "xpath"
    );
    await appiumHelper.sendKeys(
      '//XCUIElementTypeSecureTextField[@name="password"]',
      "password123",
      "xpath"
    );

    // Tap login button using iOS class chain
    await appiumHelper
      .findByIosClassChain('**/XCUIElementTypeButton[`name == "Submit"`]')
      .then((el) => el.click());

    // Take final screenshot
    await appiumHelper.takeScreenshot("ios_logged_in");
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    // Close the driver
    await appiumHelper.closeDriver();
  }
}

testIosApp().catch(console.error);
```

### Deep Linking Example

```typescript
import { AppiumHelper, AppiumCapabilities } from "mcp-appium";

async function testDeepLinks() {
  const appiumHelper = new AppiumHelper("./screenshots");

  try {
    // Set up capabilities
    const capabilities: AppiumCapabilities = {
      platformName: "Android",
      deviceName: "Android Device",
      automationName: "UiAutomator2",
      noReset: true,
    };

    // Initialize driver
    await appiumHelper.initializeDriver(capabilities);

    // Open a deep link
    await appiumHelper.openDeepLink("myapp://products/1234");
    console.log("Opened deep link successfully");

    // Take a screenshot of the opened screen
    await appiumHelper.takeScreenshot("deep_link_screen");

    // For Android, you can also use the Android-specific method with extras
    if (capabilities.platformName === "Android") {
      await appiumHelper.openAndroidDeepLink("myapp://search", {
        query: "shoes",
        filter: "popular",
      });

      // Take another screenshot
      await appiumHelper.takeScreenshot("android_deep_link_with_extras");
    }
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    // Close the driver
    await appiumHelper.closeDriver();
  }
}

testDeepLinks().catch(console.error);
```

## Advanced Examples

### UI Recovery Example

When standard element locators fail, MCP-Appium can attempt recovery using UI analysis:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerRecoveryTools } from "mcp-appium";

// In your MCP server setup:
const server = new McpServer();
registerRecoveryTools(server);

// Now you can use tools like:
// - smart-action (with automatic recovery)
// - analyze-screen (to identify UI elements via screenshot analysis)
```

Usage example:

```
// Instead of this, which might fail if the element isn't found:
await appiumHelper.tapElement("//android.widget.Button[@text='Accept']");

// You can use the smart-action tool:
await mcpClient.callTool({
  name: "smart-action",
  arguments: {
    action: "tap",
    selector: "//android.widget.Button[@text='Accept']",
    strategy: "xpath",
    fallbackToScreenshot: true
  }
});
```

This example shows how MCP-Appium can automatically recover and find the element even when traditional selectors fail.

## More Examples

You can find more examples in the `examples` directory of the project:

- `appium-test.ts` - Basic Appium testing
- `deeplink-test.ts` - Mobile deep linking examples
- `visual-recovery-test.ts` - UI recovery examples
- `calculator-test.ts` - Simple calculator app testing
