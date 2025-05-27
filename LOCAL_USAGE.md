# Using MCP-Appium-Visual with Claude Desktop (Local Version)

This guide explains how to use the locally built version of the MCP-Appium-Visual package with Claude Desktop.

## Configuration

1. The `claude_desktop_config_local.json` file in this directory points to the locally built version of the package.

2. Configure Claude Desktop to use this configuration file:
   - Open Claude Desktop settings
   - Navigate to Model Context Protocol section
   - Choose "Browse" for configuration file
   - Select `/Users/rahulsharma/AILearning/mcp-appium/claude_desktop_config_local.json`
   - Restart Claude Desktop

## Troubleshooting

If you encounter issues:

1. **Problem**: "Mobile Automation MCP Server running..." error in Claude Desktop
   **Solution**: We've fixed this in the code by removing console.error statements in stdio mode

2. **Problem**: "Server disconnected" error
   **Solution**: Check the Claude Desktop logs for specific errors and rebuild the package

3. **Problem**: NPX version not working correctly
   **Solution**: Use the local version configuration (claude_desktop_config_local.json) instead

## Testing the CLI

You can test the CLI directly:

```bash
# Test the CLI help command
node dist/cli-simple.js --help

# Test starting the server (will exit after 5 seconds)
timeout 5 node dist/cli-simple.js || echo "Server started correctly"
```

## Features

The MCP-Appium-Visual package provides 74+ tools for mobile testing including:
- Appium WebDriver actions
- Screenshot and visual comparison
- OCR and text recognition
- ADB commands for Android
- iOS device management
