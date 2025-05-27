# MCP Client Integration Guide

This guide explains how to integrate the `mcp-appium-visual` npm package with various MCP clients.

## Table of Contents

1. [Claude Desktop Integration](#claude-desktop-integration)
2. [VS Code Extension Integration](#vs-code-extension-integration)
3. [Custom MCP Client Integration](#custom-mcp-client-integration)
4. [Command Line Usage](#command-line-usage)

## Claude Desktop Integration

### Option 1: Direct NPX Integration

Update your Claude Desktop configuration file to use the `mcp-appium-visual` package directly:

```json
{
  "mcpServers": {
    "mobile-automation": {
      "name": "Mobile Automation",
      "description": "Mobile testing with Appium",
      "command": "npx",
      "args": [
        "-y",
        "mcp-appium-visual",
        "--port",
        "7000",
        "--transport",
        "http"
      ],
      "connectTo": {
        "host": "localhost",
        "port": 7000
      }
    }
  }
}
```

### Option 2: Local Install Integration

If you prefer a local installation:

1. Install the package:

   ```
   npm install --save mcp-appium-visual
   ```

2. Update your Claude Desktop configuration:
   ```json
   {
     "mcpServers": {
       "mobile-automation": {
         "name": "Mobile Automation",
         "description": "Mobile testing with Appium",
         "command": "node",
         "args": [
           "./node_modules/mcp-appium-visual/dist/launcher.js",
           "--port",
           "7000"
         ],
         "connectTo": {
           "host": "localhost",
           "port": 7000
         }
       }
     }
   }
   ```

## VS Code Extension Integration

To integrate with VS Code MCP extensions:

1. Create a `.vscode/mcp-config.json` file in your project:

   ```json
   {
     "mcpServers": {
       "mobile-automation": {
         "name": "Mobile Testing Tools",
         "command": "npx",
         "args": [
           "-y",
           "mcp-appium-visual",
           "--port",
           "7000",
           "--transport",
           "http"
         ],
         "connectTo": {
           "host": "localhost",
           "port": 7000
         }
       }
     }
   }
   ```

2. Launch VS Code and open the Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
3. Search for and run "MCP: Connect to Server" and select "Mobile Testing Tools"

## Custom MCP Client Integration

For custom MCP clients, provide the following connection details:

- **Protocol**: HTTP
- **Host**: localhost
- **Port**: 7000 (default, configurable)
- **Capabilities**:
  - `mobile`: Appium mobile automation
  - `vision`: Visual analysis and recovery

Example client connection:

```javascript
const mcpClient = new McpClient({
  serverUrl: "http://localhost:7000",
  connectTimeout: 5000,
});

// Connect to the server
await mcpClient.connect();

// Use the mobile automation capabilities
const result = await mcpClient.executeFunction("mobile.takeScreenshot", {
  deviceName: "My Device",
});
```

## Command Line Usage

Run the server directly from the command line:

```bash
# Start the server with default settings
npx mcp-appium-visual

# Start with custom port and transport
npx mcp-appium-visual --port 8000 --transport http

# Start with additional options
npx mcp-appium-visual --appium-port 4723 --log-level debug
```

Available options:

- `--port`: HTTP port for the MCP server (default: 7000)
- `--host`: HTTP host for the MCP server (default: localhost)
- `--transport`: Transport type (http or stdio, default: stdio)
- `--appium-port`: Port for the Appium server (default: 4723)
- `--appium-host`: Host for the Appium server (default: localhost)
- `--log-level`: Logging level (debug, info, warn, error, default: info)
