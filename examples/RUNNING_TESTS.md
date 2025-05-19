# Running MCP-Appium Tests

This guide explains how to run the test scripts for the MCP-Appium server, including workarounds for common issues with TypeScript and ES modules.

## Test Script Options

There are several ways to test the MCP-Appium server:

### Option 1: Using the JavaScript Version

The simplest way to run the tests is to use the JavaScript version:

```bash
node examples/test-npx-config.js
```

### Option 2: Using ts-node with Specific Flags

If you want to run the TypeScript version directly:

```bash
# Use the --experimental-specifier-resolution flag
NODE_OPTIONS="--experimental-specifier-resolution=node" npx ts-node --esm examples/test-npx-config.ts
```

### Option 3: Using the Examples Package Scripts

We've added a package.json in the examples directory to make running tests easier:

```bash
# Change to the examples directory
cd examples

# Run the TypeScript test
npm run test-config

# Or run the JavaScript test
npm run test-config-js
```

### Option 4: Using CommonJS Format Test

For environments where ESM support is problematic:

```bash
node examples/simple-test.cjs
```

## Compile TypeScript First (Alternative Method)

You can also compile the TypeScript code first and then run it:

```bash
# Compile the specific test file
npx tsc examples/test-npx-config.ts --outDir ./dist-temp/examples

# Run the compiled JavaScript
node ./dist-temp/examples/test-npx-config.js
```

## Troubleshooting

### ERR_UNKNOWN_FILE_EXTENSION Error

If you see `TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".ts"`, this means Node.js doesn't know how to handle TypeScript files as ES modules. Solutions:

1. Use the JavaScript version instead
2. Use CommonJS format (.cjs extension)
3. Add the required flags as shown in Option 2
4. Compile TypeScript to JavaScript first

### Module Not Found Errors

If you encounter module not found errors, check:

1. That the package.json has `"type": "module"` for ES modules
2. That import paths include file extensions (e.g., `.js`)
3. That Node.js is version 14 or later for ES module support

## MCP-Appium Configuration Format

The test scripts demonstrate how to use the MCP-Appium server with a configuration similar to Playwright's MCP server:

```javascript
const mcpConfig = {
  mcpServers: {
    "mcp-appium": {
      command: "node",
      args: [path.join(__dirname, "../dist/npx-entry.js")],
      options: {
        appiumHost: "localhost",
        appiumPort: 4723,
        screenshotDir: "./test-screenshots",
        logLevel: "info",
      },
    },
  },
};
```

This format allows for easy integration with other MCP servers like Playwright.
