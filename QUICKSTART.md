# 🚀 Quick Start Guide - MCP-Appium

Get up and running with MCP-Appium in minutes! This guide will help you set up AI-powered mobile automation using the Model Context Protocol.

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** (v16 or higher)
- **Android Studio** (for Android automation)
- **Xcode** (for iOS automation on macOS)
- **Appium Server** (v2.0+)
- **Claude Desktop** or compatible MCP client

# Quickstart Guide: MCP Appium Visual

This guide will help you quickly set up and run the `mcp-appium-visual` server for your project.

## 1. Prerequisites
- [Node.js](https://nodejs.org/) installed (v14 or higher recommended)
- [npm](https://www.npmjs.com/) installed

## 2. Configuration
Add the following configuration to your project (e.g., in a config file or as part of your setup):

```json
{
  "mcpServers": {
    "mcp-appium-visual": {
      "command": "npx",
      "args": ["mcp-appium-visual@1.3.3"],
      "env": {
        "NODE_OPTIONS": "--max-old-space-size=4096"
      }
    }
  }
}
```

## 3. Start the MCP Appium Visual Server
You can start the server using the following command:

```sh
npx mcp-appium-visual@1.3.3
```

This will launch the server with increased memory allocation (4GB) as specified by the `NODE_OPTIONS` environment variable.

If you want to set the environment variable explicitly, you can run:

```sh
NODE_OPTIONS="--max-old-space-size=4096" npx mcp-appium-visual@1.3.3
```

## 4. Next Steps
- Refer to the project [README.md](./README.md) for more details and usage examples.
- For troubleshooting, see [TESTING.md](./TESTING.md).

---

If you have any issues, please open an issue or check the documentation for further help.


