# GitHub Copilot Integration Guide for MCP-Appium

This guide explains how to integrate MCP-Appium with GitHub Copilot for mobile automation through natural language prompts.

## Prerequisites

- GitHub Copilot extension for VS Code
- Node.js 18 or later
- MCP-Appium-Visual installed
- Appium 2.0 or later
- Android SDK (for Android testing) or Xcode (for iOS testing)

## Setting Up Copilot Integration

### Step 1: Configure VS Code Settings

Create or edit `.vscode/settings.json` in your project root:

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

### Step 2: Start a Conversation with Copilot

With the configuration in place, you can now have conversations with GitHub Copilot about mobile testing:

1. Open a new or existing file in VS Code
2. Start GitHub Copilot Chat (/Copilot)
3. Ask questions or give tasks related to mobile automation

## Example Prompts

Here are some example prompts you can use with GitHub Copilot for mobile automation:

### Basic Mobile Testing

```
@copilot I want to test a login screen on my Android app. Can you create a script that:
1. Launches the app
2. Enters username and password
3. Clicks the login button
4. Verifies we're on the home screen
```

### Deep Link Testing

```
@copilot Create a test that verifies deep links work in my mobile app. Specifically, test opening the "youtube://" deeplink on Android and verify the app launches correctly.
```

### Visual Testing

```
@copilot I need to test that my app's UI appears correctly. Can you create a script that:
1. Opens the settings page
2. Takes a screenshot
3. Verifies certain text appears on the screen
```

### Cross-Platform Testing

```
@copilot I need to test both a mobile app and a web dashboard. Can you show me how to use both MCP-Appium and Playwright together to:
1. Login to the mobile app
2. Perform an action that should update the dashboard
3. Check the web dashboard to verify the update happened
```

## How It Works

When you talk to GitHub Copilot about mobile testing:

1. Copilot recognizes mobile-related tasks and uses the appropriate MCP server
2. It generates code utilizing the MCP-Appium tools
3. You can execute the generated scripts to perform the automation tasks

## Troubleshooting

### Copilot Not Using MCP-Appium

If Copilot isn't using the MCP-Appium server, ensure:

1. Your `.vscode/settings.json` file is correctly configured
2. You're mentioning mobile-specific concepts in your prompts
3. You've installed both GitHub Copilot and GitHub Copilot Chat extensions
4. The MCP-Appium server is installed and available via npx

### Connection Issues

If Copilot can't connect to the MCP-Appium server:

1. Try running `npx mcp-appium-visual` manually to check for errors
2. Ensure Appium is properly installed and configured
3. Check that your device/emulator is connected and recognized by Appium

## Resources

- [MCP-Appium Documentation](https://github.com/username/mcp-appium/README.md)
- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [Model Context Protocol](https://github.com/microsoft/modelcontextprotocol)
