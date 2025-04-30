# MCP Appium Server

A Model Context Protocol (MCP) server implementation for mobile app automation using Appium.

<a href="https://glama.ai/mcp/servers/@Rsec08/appium-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@Rsec08/appium-mcp/badge" alt="Appium Server MCP server" />
</a>

## Prerequisites

1. Node.js (v14 or higher)
2. Java Development Kit (JDK)
3. Android SDK (for Android testing)
4. Xcode (for iOS testing, macOS only)
5. Appium Server
6. Android device or emulator / iOS device or simulator

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

The example test uses the Android Settings app as a demo. To test your own app:

1. Edit `examples/appium-test.ts`:
   - Update `deviceName` to match your device
   - Set `app` path to your APK file, or
   - Update `appPackage` and `appActivity` for an installed app

2. Common capabilities configuration:
```typescript
const capabilities: AppiumCapabilities = {
    platformName: 'Android',
    deviceName: 'YOUR_DEVICE_NAME',
    automationName: 'UiAutomator2',
    // For installing and testing an APK:
    app: './path/to/your/app.apk',
    // OR for testing an installed app:
    appPackage: 'your.app.package',
    appActivity: '.MainActivity',
    noReset: true
};
```

## Available Actions

The MCP server supports various Appium actions:

1. Element Interactions:
   - Find elements
   - Tap/click
   - Type text
   - Scroll to element
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

## Contributing

Feel free to submit issues and pull requests for additional features or bug fixes.

## License

MIT