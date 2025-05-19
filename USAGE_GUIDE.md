# MCP-Appium Server Usage Guide

This guide provides instructions on how to install, configure, and use the MCP-Appium server as an npm package. The MCP-Appium server provides mobile automation capabilities through the Model Context Protocol (MCP).

## Table of Contents

1. [Installation](#installation)
2. [Basic Usage](#basic-usage)
3. [Configuration](#configuration)
4. [Available Tools](#available-tools)
5. [Example Scripts](#example-scripts)
6. [Troubleshooting](#troubleshooting)

## Installation

### Prerequisites

- Node.js (v16 or later)
- npm (v8 or later)
- Appium server (v2.0 or later)
- Android SDK/Tools for Android testing
- Xcode for iOS testing

### Installing the Package

You can install the MCP-Appium server as an npm package:

```bash
# Install globally
npm install -g mcp-appium

# Or install locally in your project
npm install --save mcp-appium
```

You can also install directly from the GitHub repository:

```bash
npm install -g github:username/mcp-appium
```

## Basic Usage

### Starting the Server

```bash
# Start the server with default settings
mcp-appium

# Or with specific options
mcp-appium --port 4723 --host 127.0.0.1
```

### Using as a Library

You can also use MCP-Appium as a library in your Node.js applications:

```javascript
// ESM import
import { McpServer } from "mcp-appium";

// CommonJS import
// const { McpServer } = require('mcp-appium');

// Create and start the server
const server = new McpServer();
server
  .start()
  .then(() => console.log("MCP-Appium server running"))
  .catch((error) => console.error("Failed to start server:", error));
```

## Configuration

### Server Configuration

Create a configuration file named `mcp-appium.config.js` in your project root:

```javascript
module.exports = {
  // Appium server configuration
  appium: {
    host: "127.0.0.1",
    port: 4723,
    // Adjust paths for your environment
    androidSdkPath: "/path/to/android-sdk",
    logLevel: "info", // 'debug', 'info', 'warn', or 'error'
  },

  // MCP server configuration
  mcp: {
    port: 8080, // Port for the MCP server
    enableConsoleLogging: true,
    screenshotDir: "./test-screenshots",
  },
};
```

### Environment Variables

You can also configure using environment variables:

```bash
# Set Appium server host and port
export APPIUM_HOST=127.0.0.1
export APPIUM_PORT=4723

# Set Android SDK path
export ANDROID_HOME=/path/to/android-sdk

# Start the server
mcp-appium
```

## Available Tools

The MCP-Appium server provides various tools for mobile automation. Here are the key categories:

### Mobile Automation Tools

These tools allow you to interact with mobile devices:

- **initialize-appium**: Initialize an Appium driver session
- **close-appium**: Close the Appium session
- **tap-element**: Tap on an element identified by a selector
- **send-keys**: Send text to an input element
- **take-screenshot**: Capture a screenshot of the device screen
- **find-element**: Find an element using various strategies
- **open-deeplink**: Open a deeplink URL on the device
- **open-android-deeplink**: Open Android-specific deeplinks with extras

### Visual Inspection Tools

Tools for visual analysis and OCR:

- **find-text-on-screen**: Locate text in the current screen
- **screen-contains-text**: Check if text exists on screen
- **visual-recovery**: Attempt to recover from unknown states using visual cues

### Device Tools

Tools for general device operations:

- **get-device-info**: Get device information
- **install-app**: Install an application
- **uninstall-app**: Uninstall an application
- **launch-app**: Launch an application
- **close-app**: Close an application

## Example Scripts

### Basic Appium Test

Here's a simple example of using the MCP-Appium client:

```javascript
import { McpClient } from "@modelcontextprotocol/sdk/client/mcp.js";
import { NodeClientTransport } from "@modelcontextprotocol/sdk/client/node.js";

async function runTest() {
  // Connect to the MCP server
  const transport = new NodeClientTransport({
    command: "npx",
    args: ["mcp-appium"],
  });
  const client = new McpClient();

  try {
    console.log("Connecting to MCP server...");
    await client.connect(transport);

    // Initialize Appium session
    const capabilities = {
      platformName: "Android",
      deviceName: "Android Device",
      automationName: "UiAutomator2",
      noReset: true,
    };

    await client.tools["initialize-appium"](capabilities);

    // Find and click an element
    await client.tools["tap-element"]({
      selector: "//*[@text='Settings']",
      strategy: "xpath",
    });

    // Take a screenshot
    const screenshotResult = await client.tools["take-screenshot"]({
      filename: "settings_screen",
    });
    console.log("Screenshot saved:", screenshotResult.content[0].text);
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    // Clean up
    await client.tools["close-appium"]({});
    await client.disconnect();
  }
}

runTest();
```

### Using Deeplinks

Here's how to use the deeplink functionality in your tests:

```javascript
import { McpClient } from "@modelcontextprotocol/sdk/client/mcp.js";
import { NodeClientTransport } from "@modelcontextprotocol/sdk/client/node.js";

async function testDeepLinks() {
  const transport = new NodeClientTransport({
    command: "npx",
    args: ["mcp-appium"],
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

    // Open a web URL
    await client.tools["open-deeplink"]({
      url: "https://www.example.com",
    });

    // Open a custom app URI
    await client.tools["open-deeplink"]({
      url: "youtube://",
    });

    // Open an Android-specific deeplink with extras
    await client.tools["open-android-deeplink"]({
      url: "geo:37.7749,-122.4194",
      extras: {
        zoom: "15",
        mode: "driving",
      },
    });
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    // Clean up
    await client.tools["close-appium"]({});
    await client.disconnect();
  }
}
```

## Troubleshooting

### Common Issues

1. **Connection Refused**

   - Ensure Appium server is running on the specified host and port
   - Check firewall settings

2. **Device Not Found**

   - Ensure your device is connected and recognized
   - For Android, run `adb devices` to check connection
   - For iOS, check device is unlocked and trusted

3. **Element Not Found**

   - Use the "inspect-element" tool to get better locators
   - Try different locator strategies (xpath, id, accessibility id)

4. **Session Not Created**
   - Verify your capabilities are correct for your device
   - Ensure required drivers are installed in Appium

### Logs and Debugging

Enable detailed logging for troubleshooting:

```bash
# Start with debug logs
mcp-appium --log-level debug

# Save logs to file
mcp-appium --log-file ./logs/mcp-appium.log
```

### Getting Help

If you encounter issues not covered in this guide:

1. Check the [GitHub issues](https://github.com/username/mcp-appium/issues)
2. Review Appium documentation for device-specific issues
3. Create a new issue with details about your environment, steps to reproduce, and any error messages

## Contributing

Contributions to improve the MCP-Appium server are welcome! Please see the [CONTRIBUTING.md](./CONTRIBUTING.md) file for guidelines on how to contribute.
