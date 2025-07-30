![Build](https://github.com/Rahulec08/appium-mcp/actions/workflows/ci.yml/badge.svg)
[![NPM Version](https://img.shields.io/npm/v/mcp-appium-visual.svg)](https://www.npmjs.com/package/mcp-appium-visual)
[![License](https://img.shields.io/github/license/Rahulec08/appium-mcp.svg)](LICENSE)
[![Issues](https://img.shields.io/github/issues/Rahulec08/appium-mcp.svg)](https://github.com/Rahulec08/appium-mcp/issues)
[![Last Commit](https://img.shields.io/github/last-commit/Rahulec08/appium-mcp.svg)](https://github.com/Rahulec08/appium-mcp/commits/main)

`mcp-appium-visual` is an AI-powered mobile automation platform with Model Context Protocol (MCP) integration. It enables seamless control of Android and iOS devices through Appium, featuring intelligent visual element detection and recovery.

## Features

- Integration with Appium for device control
- Visual element detection and recovery (AI-based)
- MCP support for advanced agent-driven testing workflows
- Supports Android and iOS platforms
- Designed for use with AI agents for intelligent automation

## Prerequisites

1. Node.js (v14 or higher)
2. Java Development Kit (JDK)
3. Android SDK (for Android testing)
4. Xcode (for iOS testing, macOS only)
5. Appium Server
6. Android device or emulator / iOS device or simulator

## Environment Setup

Before executing any commands, ensure your environment variables are properly set up:

1. Make sure your `.bash_profile`, `.zshrc` or other shell configuration file contains the necessary environment variables:

```bash
# Example environment variables in ~/.bash_profile
export JAVA_HOME=/path/to/your/java
export ANDROID_HOME=/path/to/your/android/sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

2. Source your environment file before running MCP-Appium:

```bash
source ~/.bash_profile  # For bash
# OR
source ~/.zshrc         # For zsh
```

> **Note**: The system will attempt to source your `.bash_profile` automatically when initializing the driver, but it's recommended to ensure proper environment setup manually before running tests in a new terminal session.

### Xcode Command Line Tools Configuration

For iOS testing, proper Xcode command line tools configuration is essential:

1. Install Xcode command line tools if not already installed:

```bash
xcode-select --install
```

2. Verify the installation and check the current Xcode path:

```bash
xcode-select -p
```

3. If needed, set the correct Xcode path (especially if you have multiple Xcode versions):

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

4. Accept Xcode license agreements:

```bash
sudo xcodebuild -license accept
```

5. For iOS real device testing, ensure your Apple Developer account is properly configured in Xcode:

   - Open Xcode
   - Go to Preferences > Accounts
   - Add your Apple ID if not already added
   - Download the necessary provisioning profiles

6. Set up environment variables for iOS development:

```bash
# Add these to your ~/.bash_profile or ~/.zshrc
export DEVELOPER_DIR="/Applications/Xcode.app/Contents/Developer"
export PATH="$DEVELOPER_DIR/usr/bin:$PATH"
```

7. Source your updated configuration:

```bash
source ~/.bash_profile  # For bash
# OR
source ~/.zshrc         # For zsh
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Install and start Appium server:

```bash
npm install -g appium
appium
```

3. Set up Android device/emulator:

   - Enable Developer Options on your Android device
   - Enable USB Debugging
   - Connect device via USB or start an emulator
   - Verify device is connected using `adb devices`

4. For iOS testing (macOS only):
   - Ensure Xcode command line tools are installed: `xcode-select --install`
   - Set up iOS simulator or connect a real device
   - Trust the development computer on the iOS device if using a real device

## Running Tests

1. Build the project:

```bash
npm run build
```

2. Start the MCP server:

```bash
npm run dev
```

3. In a new terminal, run the test:

```bash
npm test
```

## Test Configuration

### Android Configuration

The example test uses the Android Settings app as a demo. To test your own app:

1. Edit `examples/appium-test.ts`:

   - Update `deviceName` to match your device
   - Set `app` path to your APK file, or
   - Update `appPackage` and `appActivity` for an installed app

2. Common capabilities configuration:

```typescript
const capabilities: AppiumCapabilities = {
  platformName: "Android",
  deviceName: "YOUR_DEVICE_NAME",
  automationName: "UiAutomator2",
  // For installing and testing an APK:
  app: "./path/to/your/app.apk",
  // OR for testing an installed app:
  appPackage: "your.app.package",
  appActivity: ".MainActivity",
  noReset: true,
};
```

### iOS Configuration

For iOS testing using the new Xcode command line support:

1. Example configuration in `examples/xcode-appium-example.ts`:

```typescript
const capabilities: AppiumCapabilities = {
  platformName: "iOS",
  deviceName: "iPhone 13", // Your simulator or device name
  automationName: "XCUITest",
  udid: "DEVICE_UDID", // Get this from XcodeCommands.getIosSimulators()
  // For installing and testing an app:
  app: "./path/to/your/app.app",
  // OR for testing an installed app:
  bundleId: "com.your.app",
  noReset: true,
};
```

## Available Actions

The MCP server supports various Appium actions:

1. Element Interactions:

   - Find elements
   - Tap/click elements with W3C Actions API (See "W3C Standard Gestures" section)
   - Type text
   - Scroll to element with W3C Actions API
   - Long press

2. App Management:

   - Launch/close app
   - Reset app
   - Get current package/activity

3. Device Controls:

   - Screen orientation
   - Keyboard handling
   - Device lock/unlock
   - Screenshots
   - Battery info

4. Advanced Features:

   - Context switching (Native/WebView)
   - File operations
   - Notifications
   - Custom gestures

5. Xcode Command Line Tools (iOS only):
   - Manage iOS simulators (boot, shutdown)
   - Install/uninstall apps on simulators
   - Launch/terminate apps
   - Take screenshots
   - Record videos
   - Create/delete simulators
   - Get device types and runtimes

## W3C Standard Gestures

The MCP-Appium library now implements the W3C WebDriver Actions API for touch gestures, which is the modern standard for mobile automation.

### W3C Actions for Tap Elements

The `tapElement` method now uses the W3C Actions API with intelligent fallbacks:

```typescript
// The method will try in this order:
// 1. Standard WebdriverIO click()
// 2. W3C Actions API
// 3. Legacy TouchAction API (fallback for backward compatibility)
await appium.tapElement("//android.widget.Button[@text='OK']");
// or using the click alias
await appium.click("//android.widget.Button[@text='OK']");
```

### W3C Actions for Scrolling

The `scrollToElement` method now uses W3C Actions API:

```typescript
// Uses W3C Actions API for more reliable scrolling
await appium.scrollToElement(
  "//android.widget.TextView[@text='About phone']", // selector
  "down", // direction: "up", "down", "left", "right"
  "xpath", // strategy
  10 // maxScrolls
);
```

### Custom W3C Gestures

You can create your own custom W3C gestures using the `executeMobileCommand` method:

```typescript
// Create custom W3C Actions API gesture
const w3cActions = {
  actions: [
    {
      type: "pointer",
      id: "finger1",
      parameters: { pointerType: "touch" },
      actions: [
        // Move to start position
        { type: "pointerMove", duration: 0, x: startX, y: startY },
        // Press down
        { type: "pointerDown", button: 0 },
        // Move to end position over duration milliseconds
        {
          type: "pointerMove",
          duration: duration,
          origin: "viewport",
          x: endX,
          y: endY,
        },
        // Release
        { type: "pointerUp", button: 0 },
      ],
    },
  ],
};

// Execute the W3C Actions using executeScript
await appium.executeMobileCommand("performActions", [w3cActions.actions]);
```

See `examples/w3c-actions-swipe-demo.ts` for more examples of W3C standard gesture implementations.

## Using Xcode Command Line Tools

The new `XcodeCommands` class provides powerful tools for iOS testing:

```typescript
import { XcodeCommands } from "../src/lib/xcode/xcodeCommands.js";

// Check if Xcode CLI tools are installed
const isInstalled = await XcodeCommands.isXcodeCliInstalled();

// Get available simulators
const simulators = await XcodeCommands.getIosSimulators();

// Boot a simulator
await XcodeCommands.bootSimulator("SIMULATOR_UDID");

// Install an app
await XcodeCommands.installApp("SIMULATOR_UDID", "/path/to/app.app");

// Launch an app
await XcodeCommands.launchApp("SIMULATOR_UDID", "com.example.app");

// Take a screenshot
await XcodeCommands.takeScreenshot("SIMULATOR_UDID", "/path/to/output.png");

// Shutdown a simulator
await XcodeCommands.shutdownSimulator("SIMULATOR_UDID");
```

## Using the Click Function

The `click()` method provides a more intuitive alternative to `tapElement()`:

```typescript
// Using the click method
await appium.click("//android.widget.Button[@text='OK']");

// This is equivalent to:
await appium.tapElement("//android.widget.Button[@text='OK']");
```

## Troubleshooting

1. Device not found:

   - Check `adb devices` output
   - Verify USB debugging is enabled
   - Try reconnecting the device

2. App not installing:

   - Verify APK path is correct
   - Check device has enough storage
   - Ensure app is signed for debug

3. Elements not found:

   - Use Appium Inspector to verify selectors
   - Check if elements are visible on screen
   - Try different locator strategies

4. Connection issues:

   - Verify Appium server is running
   - Check port conflicts
   - Ensure correct capabilities are set

5. iOS Simulator issues:
   - Verify Xcode command line tools are installed: `xcode-select -p`
   - Check simulator UDID is correct using `xcrun simctl list devices`
   - Close and restart simulator if it becomes unresponsive

## Contributing

Feel free to submit issues and pull requests for additional features or bug fixes.

## License

MIT
