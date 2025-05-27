# Using MCP-Appium with NPX

This guide explains how to use the MCP-Appium server with NPX and a configuration file, similar to how other MCP servers like Playwright's are used.

## Basic Usage

You can run the MCP-Appium server directly using npx without installing it globally:

```bash
npx mcp-appium-visual
```

## Using with Configuration Files

The MCP-Appium server can be configured using a JSON configuration file and piped to the server through stdin:

```bash
cat config.json | npx mcp-appium-visual
```

Or more commonly, in a JavaScript or TypeScript file:

```javascript
import { McpClient } from "@modelcontextprotocol/sdk/client/mcp.js";
import { NodeClientTransport } from "@modelcontextprotocol/sdk/client/node.js";

// Configuration for all MCP servers
const config = {
  mcpServers: {
    "mcp-appium": {
      command: "npx",
      args: ["mcp-appium-visual"],
    },
    playwright: {
      command: "npx",
      args: ["@playwright/mcp@latest"],
    },
  },
};

// Initialize an MCP client with the mcp-appium server
async function runTest() {
  const transport = new NodeClientTransport({
    command: config.mcpServers["mcp-appium"].command,
    args: config.mcpServers["mcp-appium"].args,
  });

  const client = new McpClient();
  await client.connect(transport);

  // Now you can use all MCP-Appium tools
  // For example, initialize an Appium session
  const result = await client.tools["initialize-appium"]({
    platformName: "Android",
    deviceName: "Android Device",
    automationName: "UiAutomator2",
  });

  console.log(result.content[0].text);

  // Clean up
  await client.tools["close-appium"]({});
  await client.disconnect();
}

runTest().catch(console.error);
```

## Configuration in VS Code Extensions

To use MCP-Appium in VS Code extensions alongside other MCP servers like Playwright, you can define them in your extension's configuration:

```javascript
// Define all the MCP servers in your extension's configuration
const mcpServers = {
  "mcp-appium": {
    command: "npx",
    args: ["mcp-appium-visual"],
  },
  playwright: {
    command: "npx",
    args: ["@playwright/mcp@latest"],
  },
};

// Create a client for the MCP-Appium server
const appiumTransport = vscode.workspace.createMcpTransport(
  mcpServers["mcp-appium"]
);
const appiumClient = new McpClient();
await appiumClient.connect(appiumTransport);

// Create a client for the Playwright MCP server
const playwrightTransport = vscode.workspace.createMcpTransport(
  mcpServers["playwright"]
);
const playwrightClient = new McpClient();
await playwrightClient.connect(playwrightTransport);
```

## Using Multiple MCP Servers Together

You can use multiple MCP servers together in the same script:

```javascript
import { McpClient } from "@modelcontextprotocol/sdk/client/mcp.js";
import { NodeClientTransport } from "@modelcontextprotocol/sdk/client/node.js";

// Configuration for MCP servers
const config = {
  mcpServers: {
    "mcp-appium": {
      command: "npx",
      args: ["mcp-appium-visual"],
    },
    playwright: {
      command: "npx",
      args: ["@playwright/mcp@latest"],
    },
  },
};

async function runTest() {
  // Initialize the Appium MCP client
  const appiumTransport = new NodeClientTransport(
    config.mcpServers["mcp-appium"]
  );
  const appiumClient = new McpClient();
  await appiumClient.connect(appiumTransport);

  // Initialize the Playwright MCP client
  const playwrightTransport = new NodeClientTransport(
    config.mcpServers["playwright"]
  );
  const playwrightClient = new McpClient();
  await playwrightClient.connect(playwrightTransport);

  // Use both clients in the same test
  // Start mobile automation with Appium
  await appiumClient.tools["initialize-appium"]({
    platformName: "Android",
    deviceName: "Android Device",
    automationName: "UiAutomator2",
  });

  // Launch browser with Playwright
  await playwrightClient.tools["openBrowser"]({
    browser: "chromium",
    url: "https://example.com",
  });

  // Clean up
  await appiumClient.tools["close-appium"]({});
  await playwrightClient.tools["closeBrowser"]({});

  await appiumClient.disconnect();
  await playwrightClient.disconnect();
}

runTest().catch(console.error);
```

## GitHub Copilot/LLM Integration

MCP servers are commonly used with AI assistants like GitHub Copilot. Here's a configuration example:

```json
{
  "mcpServers": {
    "mcp-appium": {
      "command": "npx",
      "args": ["mcp-appium-visual"]
    },
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

With this configuration, AI assistants can choose the appropriate MCP server based on the task at hand, using mobile automation tools from MCP-Appium or web automation tools from Playwright as needed.

### Using with GitHub Copilot

To use MCP-Appium with GitHub Copilot in VS Code:

1. Install the GitHub Copilot extension in VS Code.

2. Create a `.vscode/settings.json` file in your project with the following configuration:

```json
{
  "github.copilot.advanced": {
    "mcpServers": {
      "mobile": {
        "command": "npx",
        "args": ["mcp-appium-visual"]
      }
    }
  }
}
```

3. Now GitHub Copilot can use both the MCP-Appium server for mobile testing and the Playwright MCP server for web testing in the same project.

4. When talking to Copilot about mobile automation tasks, it will automatically use the MCP-Appium server.

## Configuring Advanced Options

You can pass additional configuration to the MCP-Appium server through the JSON configuration:

```json
{
  "mcpServers": {
    "mcp-appium": {
      "command": "npx",
      "args": ["mcp-appium-visual"],
      "options": {
        "appiumHost": "localhost",
        "appiumPort": 4723,
        "screenshotDir": "./screenshots",
        "logLevel": "info"
      }
    }
  }
}
```

The server will read this configuration from stdin when started.

## Publishing as an NPM Package

To make your MCP-Appium server easy to use with npx, ensure your package.json is properly configured:

```json
{
  "name": "mcp-appium-visual",
  "version": "1.1.0",
  "bin": {
    "mcp-appium": "./dist/npx-entry.js"
  },
  "files": ["dist"],
  "publishConfig": {
    "access": "public"
  }
}
```
