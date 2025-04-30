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
