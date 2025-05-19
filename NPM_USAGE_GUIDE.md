# Using MCP-Appium as an NPM Package

This guide provides step-by-step instructions on how to use the MCP-Appium server via npm, either as a dependency in your project or as a global tool.

## Table of Contents

1. [Installation](#installation)
2. [Basic Configuration](#basic-configuration)
3. [Starting the Server](#starting-the-server)
4. [Writing Client Code](#writing-client-code)
5. [Using Deeplinks](#using-deeplinks)
6. [Troubleshooting](#troubleshooting)

## Installation

You can install MCP-Appium either globally or as a project dependency.

### Global Installation

```bash
# Install globally to use as a command-line tool
npm install -g mcp-appium-visual
```

### Project Installation

```bash
# Install as a project dependency
npm install --save-dev mcp-appium-visual
```

### Prerequisites

Make sure you have the following installed:

1. Node.js (v16 or later)
2. Appium (v2.0 or later)
3. Android SDK (for Android testing)
4. Xcode (for iOS testing)

```bash
# Install Appium and required drivers
npm install -g appium
appium driver install uiautomator2  # For Android
appium driver install xcuitest      # For iOS
```

## Basic Configuration

### Environment Configuration

Create a `.env` file in your project root (optional):

```
# Appium server settings
APPIUM_HOST=127.0.0.1
APPIUM_PORT=4723

# Android SDK path (if not in PATH)
ANDROID_HOME=/path/to/android/sdk

# Screenshot directory
SCREENSHOT_DIR=./test-screenshots
```

### Project Configuration

For TypeScript projects, ensure you have proper types:

```bash
# Install MCP SDK types
npm install --save-dev @modelcontextprotocol/sdk
```

Update your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

## Starting the Server

### Using CLI

If installed globally:

```bash
# Start with default settings
mcp-appium-visual

# Start with custom options
mcp-appium-visual --port 4723 --log-level debug
```

If installed as a project dependency:

```bash
# Using npx
npx mcp-appium-visual

# Or add to package.json scripts
```

Add to your `package.json`:

```json
"scripts": {
  "start-mcp": "mcp-appium-visual",
  "start-mcp-debug": "mcp-appium-visual --log-level debug"
}
```

Then run:

```bash
npm run start-mcp
```

### Server Options

Available CLI options:

| Option             | Description                          | Default            |
| ------------------ | ------------------------------------ | ------------------ |
| `--port`           | Appium server port                   | 4723               |
| `--host`           | Appium server host                   | 127.0.0.1          |
| `--log-level`      | Log level (debug, info, warn, error) | info               |
| `--screenshot-dir` | Directory for screenshots            | ./test-screenshots |

## Writing Client Code

### Basic Client Setup

Create a new file (e.g., `test-mcp.js`) with the following content:

```javascript
import { McpClient } from "@modelcontextprotocol/sdk/client/mcp.js";
import { NodeClientTransport } from "@modelcontextprotocol/sdk/client/node.js";

async function runTest() {
  // Create transport to connect to the MCP server
  const transport = new NodeClientTransport({
    command: "npx",
    args: ["mcp-appium-visual"],
  });

  // Create and connect MCP client
  const client = new McpClient();

  try {
    console.log("Connecting to MCP server...");
    await client.connect(transport);
    console.log("Connected successfully");

    // Initialize Appium session
    const initResult = await client.tools["initialize-appium"]({
      platformName: "Android",
      deviceName: "Android Device",
      automationName: "UiAutomator2",
      noReset: true,
    });

    console.log("Session initialized:", initResult.content[0].text);

    // Do your testing here...
    // For example, take a screenshot:
    const screenshot = await client.tools["take-screenshot"]({
      filename: "test_screen",
    });

    console.log("Screenshot saved:", screenshot.content[0].text);
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    // Clean up: close the session
    try {
      await client.tools["close-appium"]({});
      console.log("Session closed");
    } catch (e) {
      console.warn("Error closing session:", e);
    }

    await client.disconnect();
    console.log("Disconnected from MCP server");
  }
}

// Run the test
runTest().catch(console.error);
```

Run your test:

```bash
# For ESM modules
node test-mcp.js

# For TypeScript
npx ts-node test-mcp.ts
```

## Using Deeplinks

Deeplinks are a powerful feature for testing app-to-app interactions. MCP-Appium provides two tools for this:

- `open-deeplink`: Works on both Android and iOS
- `open-android-deeplink`: Android-specific with extras support

### Example: Opening Deeplinks

```javascript
// Open a website in the browser
await client.tools["open-deeplink"]({
  url: "https://www.example.com",
});

// Open a specific app using a custom scheme
await client.tools["open-deeplink"]({
  url: "youtube://",
});

// Open Google Maps with coordinates (Android-specific with extras)
await client.tools["open-android-deeplink"]({
  url: "geo:37.7749,-122.4194",
  extras: {
    zoom: "15",
    mode: "driving",
  },
});
```

### Complete Deeplink Example

Here's a complete example demonstrating deeplink functionality:

```javascript
import { McpClient } from "@modelcontextprotocol/sdk/client/mcp.js";
import { NodeClientTransport } from "@modelcontextprotocol/sdk/client/node.js";

async function testDeepLinks() {
  // Create transport and client
  const transport = new NodeClientTransport({
    command: "npx",
    args: ["mcp-appium-visual"],
  });
  const client = new McpClient();

  try {
    await client.connect(transport);

    // Initialize Appium session
    await client.tools["initialize-appium"]({
      platformName: "Android",
      deviceName: "Android Device",
      automationName: "UiAutomator2",
      noReset: true,
    });

    // Test URLs to try
    const urls = [
      "https://www.example.com", // Web URL
      "youtube://", // App scheme
      "tel:+1234567890", // Phone app
      "geo:37.7749,-122.4194", // Maps
    ];

    for (const url of urls) {
      console.log(`\nTesting deeplink: ${url}`);

      // Take before screenshot
      const beforeScreenshot = await client.tools["take-screenshot"]({
        filename: `before_${url.replace(/[^a-zA-Z0-9]/g, "_")}`,
      });

      // Open the deeplink
      const result = await client.tools["open-deeplink"]({ url });
      console.log(result.content[0].text);

      // Wait for app to load
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Take after screenshot
      const afterScreenshot = await client.tools["take-screenshot"]({
        filename: `after_${url.replace(/[^a-zA-Z0-9]/g, "_")}`,
      });

      console.log(
        `Screenshots saved to ${beforeScreenshot.content[0].text} and ${afterScreenshot.content[0].text}`
      );
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Clean up
    await client.tools["close-appium"]({});
    await client.disconnect();
  }
}

// Run the test
testDeepLinks();
```

## Troubleshooting

### Common Issues and Solutions

1. **Connection Refused**

   - Make sure Appium server is running
   - Check the port configuration
   - Solution: `appium --port 4723`

2. **Device Not Found**

   - Ensure device is connected and recognized
   - For Android: `adb devices` should list your device
   - For iOS: Device should be unlocked and trusted

3. **Tool Not Found**

   - Check if tool name is spelled correctly
   - Verify MCP server version supports the tool
   - Solution: Update to latest version

4. **Appium Session Creation Failed**
   - Verify your capabilities
   - Check Appium logs for detailed errors
   - Solution: Update capabilities as needed

### Debug Mode

Enable debug logging for more information:

```bash
# Start with debug logging
mcp-appium-visual --log-level debug
```

You can also enable Appium's verbose logging:

```bash
appium --log-level debug
```

### Getting Help

If you're still having issues:

1. Check the project's GitHub issues
2. Review logs for error messages
3. Verify your environment configuration

### Updating

Keep your MCP-Appium installation updated:

```bash
# Update global installation
npm update -g mcp-appium-visual

# Update project dependency
npm update mcp-appium-visual
```

---

For more advanced usage and examples, see the full [USAGE_GUIDE.md](./USAGE_GUIDE.md) or explore the example scripts in the `examples/` directory.
