# MCP-Appium-Visual v1.2.7 Usage Guide

## Summary

✅ **FIXED**: NPX integration now works correctly with Claude Desktop  
✅ **FIXED**: No console output pollution in stdio mode  
✅ **FIXED**: Node.js 18 compatibility  
✅ **READY**: Can be used without Appium server running

## Quick Start

### 1. Claude Desktop Integration

Add this to your Claude Desktop configuration file (`~/.claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "mcp-appium-visual": {
      "command": "npx",
      "args": ["mcp-appium-visual@1.2.7"]
    }
  }
}
```

### 2. Optional: External Appium Server

If you want to connect to an existing Appium server:

```json
{
  "mcpServers": {
    "mcp-appium-visual": {
      "command": "npx",
      "args": [
        "mcp-appium-visual@1.2.7",
        "--appium-url",
        "http://localhost:4723"
      ]
    }
  }
}
```

## How It Works

1. **Default Behavior**: The MCP server starts successfully without requiring Appium to be running
2. **Tool Availability**: All 74 mobile automation tools are available immediately
3. **Lazy Connection**: Appium connection is only attempted when you actually use a tool that requires it
4. **Default URL**: Uses `http://localhost:4723` when no `--appium-url` is specified
5. **Clean Communication**: No stderr pollution that could interfere with Claude Desktop

## Available Tools

The server provides tools for:

- 📱 Mobile device automation (Android/iOS)
- 🔍 Element inspection and interaction
- 📸 Screenshot capture and visual recovery
- 🛠️ ADB operations for Android
- 🧪 Test automation workflows

## Appium Setup (Optional)

If you want to use the mobile automation features, start Appium separately:

```bash
# Install Appium globally
npm install -g appium

# Install drivers
appium driver install uiautomator2
appium driver install xcuitest

# Start Appium server
appium --port 4723
```

## Testing

Test the integration:

```bash
# Test help
npx mcp-appium-visual@1.2.7 --help

# Test with Claude Desktop config
# (Add the config above to Claude Desktop and restart)
```

## Version 1.2.7 Fixes

- ✅ Removed console.error output pollution in stdio mode
- ✅ Fixed Node.js 18 compatibility with JSON imports
- ✅ Clean JSON-RPC communication for Claude Desktop
- ✅ Server runs successfully without Appium dependency
- ✅ Proper error handling when Appium is not available
