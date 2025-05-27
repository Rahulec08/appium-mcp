# MCP-Appium Examples

This directory contains example scripts that demonstrate how to use the MCP-Appium server for mobile automation testing.

## Calculator Test Example

The `calculator-test.ts` script demonstrates testing the Google Calculator app on an Android device. It:

1. Connects to an Android device
2. Launches the calculator app
3. Performs a simple calculation (5 + 7 = 12)
4. Takes screenshots before and after
5. Extracts information about UI elements

### Running the Calculator Example

First, ensure you have:

- An Android device connected via USB with USB debugging enabled
- Google Calculator app installed (comes pre-installed on many devices)
- Appium server installed (`npm install -g appium`)
- Appium UiAutomator2 driver installed (`appium driver install uiautomator2`)

Then run:

```bash
# From the examples directory
npx ts-node calculator-test.ts
```

## Creating Your Own Examples

You can use these examples as templates for testing your own apps:

1. Copy an existing example and modify it
2. Update the `appPackage` and `appActivity` values for your app
3. Update the selectors to match your app's UI elements

### Finding Package and Activity Names

For Android apps, you can find the package and main activity name by:

```bash
# Show current app in foreground
adb shell dumpsys window | grep -E 'mCurrentFocus|mFocusedApp'
```

### Creating Tests for iOS Apps

To test an iOS app, modify the example to:

```typescript
await client.callTool({
  name: "initialize-appium",
  arguments: {
    platformName: "iOS",
    deviceName: "iPhone", // or actual device name/ID
    bundleId: "com.example.myapp",
    automationName: "XCUITest",
  },
});
```

## Using MCP-Appium with Claude Desktop

These examples can be adapted to work with Claude Desktop by configuring the MCP-Appium server in your Claude Desktop configuration. See the main README for details.
