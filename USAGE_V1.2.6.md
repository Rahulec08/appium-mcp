# MCP-Appium-Visual v1.2.6 Usage Guide

## Overview

Version 1.2.6 of mcp-appium-visual has been fixed to properly handle NPX integration with Claude Desktop. The package now correctly supports:

1. **MCP Server Only**: Run just the MCP server without starting Appium internally
2. **External Appium Server**: Connect to an existing Appium server via command line

## Usage Scenarios

### Scenario 1: MCP Server Only (Recommended)

This is the most flexible approach where you run only the MCP server and provide the Appium server URL when initializing Appium through the tools.

**Claude Desktop Configuration:**

```json
{
  "mcpServers": {
    "mcp-appium-visual": {
      "command": "npx",
      "args": ["mcp-appium-visual@1.2.6"],
      "env": {
        "NODE_OPTIONS": "--max-old-space-size=8192"
      }
    }
  }
}
```

**Usage:**

1. Start your Appium server separately (e.g., `appium server --port 4723`)
2. In Claude, use the `initialize-appium` tool and provide the `appiumUrl` parameter:
   ```
   Please initialize Appium for Android automation with:
   - Platform: Android
   - Device: MyDevice
   - Appium URL: http://localhost:4723
   ```

### Scenario 2: Pre-configured External Appium Server

If you always use the same Appium server URL, you can configure it in the Claude Desktop config:

**Claude Desktop Configuration:**

```json
{
  "mcpServers": {
    "mcp-appium-visual": {
      "command": "npx",
      "args": [
        "mcp-appium-visual@1.2.6",
        "--appium-url",
        "http://localhost:4723"
      ],
      "env": {
        "NODE_OPTIONS": "--max-old-space-size=8192"
      }
    }
  }
}
```

**Usage:**

1. Start your Appium server on port 4723
2. In Claude, use the `initialize-appium` tool without specifying the URL (it will use the pre-configured one)

## Command Line Options

When using NPX:

```bash
# Start MCP server only
npx mcp-appium-visual@1.2.6

# Start MCP server with pre-configured Appium URL
npx mcp-appium-visual@1.2.6 --appium-url http://localhost:4723

# Show help
npx mcp-appium-visual@1.2.6 --help
```

## Tool Usage

### Initialize Appium Tool

The `initialize-appium` tool now supports both approaches:

**With URL in tool call (Scenario 1):**

```json
{
  "tool": "initialize-appium",
  "parameters": {
    "platformName": "Android",
    "deviceName": "MyDevice",
    "appiumUrl": "http://localhost:4723"
  }
}
```

**Without URL (uses pre-configured URL from Scenario 2):**

```json
{
  "tool": "initialize-appium",
  "parameters": {
    "platformName": "Android",
    "deviceName": "MyDevice"
  }
}
```

## Benefits

1. **Flexibility**: You can use any Appium server (local, remote, cloud-based)
2. **No Port Conflicts**: MCP server doesn't try to start its own Appium instance
3. **Better Resource Management**: Appium server can be managed independently
4. **Multi-Device Support**: Connect to different Appium servers for different devices

## Troubleshooting

### Common Issues

1. **"Connection refused" errors**: Make sure your Appium server is running before initializing
2. **"Invalid URL" errors**: Ensure the Appium URL is accessible and properly formatted
3. **NPX not found**: Install Node.js and ensure NPX is available

### Validation

Test your setup:

```bash
# Test NPX command
npx mcp-appium-visual@1.2.6 --help

# Test with Appium URL
npx mcp-appium-visual@1.2.6 --appium-url http://localhost:4723
```

## Migration from Previous Versions

If you were using version 1.2.5 or earlier:

1. Update your Claude Desktop config to use version 1.2.6
2. No code changes needed - the tool interfaces remain the same
3. The main improvement is better NPX integration and configuration handling
