# MCP-Appium Testing Guide

This document outlines how to test your MCP-Appium installation and validate that all components are working correctly.

## Prerequisites

Before running tests, ensure you have:

- Node.js (v16+) installed
- Appium installed globally (`npm install -g appium`)
- Appropriate Appium drivers installed:
  - For Android: `appium driver install uiautomator2`
  - For iOS: `appium driver install xcuitest`
- Android SDK with ADB installed (for Android testing)
- Xcode installed (for iOS testing)
- At least one device or emulator available

## Basic Validation Tests

### 1. Environment Check

First, validate your environment:

```bash
# Check Appium installation
appium --version

# Check ADB installation (for Android)
adb version

# Check connected devices
adb devices
```

### 2. Build the Project

Ensure the project builds correctly:

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

### 3. Start MCP-Appium Server

Start the combined Appium and MCP servers:

```bash
npm run launch
```

You should see output indicating both servers have started successfully.

## Testing MCP Tools Individually

You can test individual MCP tools using the provided test module:

```bash
npm test
```

This will run through a series of tool calls to verify functionality.

## Testing with a Real Device

### Android Device Test

1. Connect an Android device via USB
2. Enable USB debugging on the device
3. Run this test command:

```bash
# First check if the device is recognized
adb devices

# If visible, run a simple test
npx ts-node src/test/index.ts
```

### Testing Calculator App Example

For a specific example of testing the calculator app (as described in EXAMPLE.md):

1. Create a new file called `calculator-test.ts` with the content from the EXAMPLE.md
2. Run this test:

```bash
npx ts-node calculator-test.ts
```

## Verifying Individual Tool Functionality

### ADB Tools

You can verify the ADB tools with a connected Android device:

```bash
# Start the MCP server
npm start &

# In a separate terminal, use a Node.js script to call tools:
node -e "
const { McpClient } = require('@modelcontextprotocol/sdk/client/mcp');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio');
const { spawn } = require('child_process');

async function test() {
  const serverProcess = spawn('npm', ['start']);
  const transport = new StdioClientTransport({
    input: serverProcess.stdout,
    output: serverProcess.stdin,
  });

  const client = new McpClient(transport);
  await client.initialize();

  // Test list-devices tool
  const result = await client.callTool({
    name: 'list-devices',
    arguments: {}
  });

  console.log(result.content[0].text);
  serverProcess.kill();
}

test().catch(console.error);
"
```

### Appium Tools

To test Appium tools:

1. Start Appium server: `appium`
2. Use the test script to initialize a session and interact with an app:

```bash
# Navigate to the examples folder
cd examples

# Run the calculator example
npx ts-node calculator-test.ts
```

## Troubleshooting

### Common Issues and Solutions

1. **MCP server doesn't start**:

   - Check that the `@modelcontextprotocol/sdk` package is installed
   - Verify Node.js version is 16+

2. **Appium cannot find connected devices**:

   - Ensure USB debugging is enabled
   - Check ADB connection: `adb devices`
   - Restart ADB: `adb kill-server && adb start-server`

3. **Appium driver errors**:

   - Make sure you've installed the required drivers:
     - `appium driver install uiautomator2`
     - `appium driver install xcuitest`

4. **XPath selector doesn't work**:

   - Use the `get-page-source` and `extract-locators` tools to verify element paths
   - Try different selector strategies (id, accessibility id)

5. **Build errors**:
   - Check TypeScript version compatibility
   - Verify imports in your code

### Logging

To enable verbose logging for debugging:

```bash
# Start Appium with detailed logging
appium --log-level debug --log-timestamp

# Start MCP server with debugging
DEBUG=mcp* npm start
```

## Integration Testing with Claude Desktop

To test MCP-Appium with Claude Desktop:

1. Configure Claude Desktop with the provided `claude-desktop-config.sample.json` file
2. Rename to `claude_desktop_config.json` and update paths
3. Open Claude Desktop
4. Ask Claude to perform mobile automation tasks like:
   - "Show me connected Android devices"
   - "Take a screenshot of my Android device"
   - "Help me test a login flow in my app"

## Performance Testing

For larger automation workflows:

1. Create complex test scripts that perform multiple actions
2. Measure execution time for various operations
3. Monitor memory usage during extended test runs

## Creating Your Own Test Suite

To create a reusable test suite for your app:

1. Create a folder for your tests: `mkdir my-app-tests`
2. Create test scripts that use the MCP client to call tools
3. Organize tests by functionality or screen
4. Build a test runner that executes tests sequentially

Example test organization:

```
my-app-tests/
  login-tests.ts
  navigation-tests.ts
  checkout-tests.ts
  test-runner.ts
```
