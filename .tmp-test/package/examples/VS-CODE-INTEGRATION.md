# Using MCP-Appium-Visual with VS Code

This guide explains how to integrate the MCP-Appium-Visual server with VS Code for mobile testing and automation within your development environment.

## Prerequisites

- Visual Studio Code (latest version recommended)
- Node.js 18 or later
- MCP-Appium-Visual 1.1.0 or later installed
- Appium 2.0 or later
- Android SDK (for Android testing) or Xcode (for iOS testing)

## Setup VS Code Integration

### Method 1: GitHub Copilot Configuration (Recommended)

If you're using GitHub Copilot, you can configure it to use the MCP-Appium server alongside other MCP servers like Playwright:

1. Create or edit `.vscode/settings.json` in your project:

```json
{
  "github.copilot.advanced": {
    "mcpServers": {
      "mobile": {
        "command": "npx",
        "args": ["mcp-appium-visual"]
      },
      "playwright": {
        "command": "npx",
        "args": ["@playwright/mcp@latest"]
      }
    }
  }
}
```

2. Now GitHub Copilot can use both the MCP-Appium server for mobile testing and the Playwright MCP server for web testing in the same project.

3. When talking to Copilot about mobile automation tasks, it will automatically use the MCP-Appium server.

### Method 2: Using VS Code CLI

Another way to add MCP-Appium-Visual to VS Code is using the VS Code CLI:

```bash
# For VS Code
code --add-mcp '{"name":"mcp-appium-visual","command":"npx","args":["mcp-appium-visual-server"]}'

# For VS Code Insiders
code-insiders --add-mcp '{"name":"mcp-appium-visual","command":"npx","args":["mcp-appium-visual-server"]}'
```

### Method 2: Manual Configuration

You can also manually register the MCP-Appium-Visual server with VS Code:

1. Open VS Code settings (File > Preferences > Settings)
2. Search for "MCP: Registered Servers"
3. Click "Edit in settings.json"
4. Add the following configuration:

```json
"mcp.registeredServers": [
  {
    "name": "mcp-appium-visual",
    "command": "npx",
    "args": ["mcp-appium-visual-server"],
    "documentationUrl": "https://github.com/yourusername/mcp-appium-visual"
  }
]
```

## Using with VS Code Extensions

Once configured, the MCP-Appium-Visual server can be used with VS Code extensions that support the Model Context Protocol (MCP).

### AI-Based Testing Extensions

When using AI-based testing extensions:

1. The AI assistant will automatically discover available mobile testing capabilities
2. You can ask the AI assistant to:
   - Control mobile devices and emulators
   - Take screenshots
   - Interact with UI elements
   - Run automation tests
   - Debug mobile applications

### Development Workflow Example

Here's a typical workflow using MCP-Appium-Visual with VS Code:

1. Start your mobile app project in VS Code
2. Launch a device emulator or connect a physical device
3. Use the AI assistant to help:
   - Generate UI test cases
   - Execute tests on connected devices
   - Debug UI issues
   - Validate app behavior across multiple devices

## Troubleshooting

If the MCP-Appium-Visual server doesn't appear to be available to VS Code extensions:

1. Verify MCP-Appium-Visual is properly installed:

   ```bash
   npm list -g mcp-appium-visual
   ```

2. Check if the MCP server is running:

   ```bash
   ps aux | grep mcp-appium-visual
   ```

3. Restart VS Code after adding or changing MCP server configurations

4. Check the VS Code Developer Tools console (Help > Toggle Developer Tools) for any errors related to MCP server connections

## Advanced Configuration

For more advanced VS Code integration, you can create a VS Code extension that uses MCP-Appium-Visual as a dependency:

```json
// package.json in your VS Code extension
{
  "dependencies": {
    "mcp-appium-visual": "^1.1.0"
  },
  "contributes": {
    "mcpServers": [
      {
        "name": "Mobile Automation",
        "command": "${extensionPath}/node_modules/.bin/mcp-appium-visual-server",
        "description": "Mobile testing and automation through MCP"
      }
    ]
  }
}
```

This approach allows your extension to bundle and manage the MCP-Appium-Visual server directly.

## Example: Use with Dev Containers

MCP-Appium-Visual also works with VS Code Dev Containers:

1. Add the following to your `.devcontainer/devcontainer.json`:

```json
{
  "features": {
    "ghcr.io/devcontainers/features/node:1": {
      "version": "lts"
    }
  },
  "postCreateCommand": "npm install -g mcp-appium-visual",
  "customizations": {
    "vscode": {
      "settings": {
        "mcp.registeredServers": [
          {
            "name": "mcp-appium-visual",
            "command": "mcp-appium-visual-server"
          }
        ]
      }
    }
  }
}
```

2. This will automatically install and configure MCP-Appium-Visual when the dev container is built

## Additional Resources

- [VS Code MCP API Documentation](https://code.visualstudio.com/api/extension-guides/mcp)
- [Model Context Protocol Specification](https://github.com/anthropics/model-context-protocol)
- [MCP-Appium-Visual GitHub Repository](https://github.com/yourusername/mcp-appium-visual)
