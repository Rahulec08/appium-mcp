# Quick Start Guide: MCP-Appium Server

This quick start guide will help you get started with the MCP-Appium server for mobile automation testing.

## Installation

### Option 1: Install from NPM

```bash
# Install globally
npm install -g mcp-appium-visual

# Or install locally in your project
npm install --save-dev mcp-appium-visual
```

### Option 2: Clone and Build from Source

```bash
# Clone the repository
git clone https://github.com/username/mcp-appium
cd mcp-appium

# Install dependencies
npm install

# Build the project
npm run build
```

## Prerequisites

- Node.js (v16 or later)
- Appium server (v2.0 or later)
- Android SDK (for Android testing)
- Xcode (for iOS testing)

Make sure Appium is installed and configured:

```bash
npm install -g appium
appium driver install uiautomator2  # For Android
appium driver install xcuitest      # For iOS
```

## Basic Usage

### Starting the MCP-Appium Server

```bash
# If installed globally
mcp-appium-visual

# If installed locally
npx mcp-appium-visual

# Or via the npm script in your project
npm run start
```

This starts the MCP server, which listens for client connections.

### Simple Client Example

Create a file named `test-example.js`:

```javascript
import { McpClient } from "@modelcontextprotocol/sdk/client/mcp.js";
import { NodeClientTransport } from "@modelcontextprotocol/sdk/client/node.js";

async function simpleTest() {
  // Create transport to connect to the MCP server
  const transport = new NodeClientTransport({
    command: "npx",
    args: ["mcp-appium-visual"],
  });

  // Create and connect MCP client
  const client = new McpClient();
  await client.connect(transport);

  try {
    // Initialize Appium driver
    const result = await client.tools["initialize-appium"]({
      platformName: "Android",
      deviceName: "Android Device",
      automationName: "UiAutomator2",
    });

    console.log("Appium initialized:", result.content[0].text);

    // Take a screenshot
    const screenshot = await client.tools["take-screenshot"]({
      filename: "home_screen",
    });

    console.log("Screenshot saved:", screenshot.content[0].text);

    // Try opening a deeplink
    await client.tools["open-deeplink"]({
      url: "https://www.example.com",
    });

    console.log("Deeplink opened successfully");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Clean up by closing the Appium session
    await client.tools["close-appium"]({});
    await client.disconnect();
  }
}

simpleTest().catch(console.error);
```

Run the example:

```bash
node test-example.js
```

## Key Features

The MCP-Appium server provides these main capabilities:

1. **Standard Mobile Automation**:

   - Element finding, tapping, swiping
   - Screenshots
   - Deep links
   - Device information

2. **Visual Intelligence**:

   - OCR for text recognition
   - Element recognition by visual appearance
   - Visual state recovery

3. **Cross-Platform Support**:
   - Works with both Android and iOS
   - Platform-specific capabilities when needed

## Next Steps

For more advanced usage and examples:

1. Check out the [Full Usage Guide](./USAGE_GUIDE.md)
2. Explore the [example scripts](./examples/) in the repo
3. Learn about [NPM Package Setup](./NPM_PACKAGE_SETUP.md) if you want to fork or modify this tool

## Getting Help

If you encounter issues:

1. Check the documentation
2. Look at the example scripts
3. File an issue on the GitHub repository

Happy testing!
