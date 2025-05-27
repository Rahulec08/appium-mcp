# MCP-Appium Claude Desktop Integration Guide

This guide explains how to use MCP-Appium with Claude Desktop to enable AI-powered mobile automation testing.

## Integration Methods

There are two ways to integrate MCP-Appium with Claude Desktop:

1. **HTTP Server Mode**: Run the MCP server as an HTTP endpoint that Claude Desktop connects to
2. **Stdio Server Mode**: Let Claude Desktop directly launch and communicate with the MCP server

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- Appium installed (`npm install -g appium`)
- Android or iOS device/emulator connected
- Claude Desktop application installed

### Installation Options

#### NPM Package Installation (Recommended)

Install the package globally for easy access from anywhere:

```bash
# Install the package globally
npm install -g mcp-appium-visual

# Verify installation
which mcp-claude
which mcp-claude-http
```

Or install it locally for a specific project:

```bash
# Install in current project
npm install mcp-appium-visual

# Run using npx
npx mcp-claude
```

### Configuration

#### Option 1: HTTP Server Mode

1. Start the HTTP server:

   ```bash
   # If installed globally
   mcp-claude-http

   # If installed locally
   npx mcp-claude-http

   # Or using the script in the repository
   ./start-claude-http.sh
   ```

2. In Claude Desktop, add the MCP server by:
   - Navigate to Settings → Developer
   - Click "Add MCP Server"
   - Select the `claude-desktop-config.json` file

The config file specifies:

- Server name and description
- Connection details (localhost:8080)
- Mobile automation capabilities

#### Option 2: Stdio Server Mode

1. If using the npm package, create a Claude Desktop config file that references the global binary:

   ```json
   {
     "mcpServers": {
       "mobile-automation": {
         "name": "Mobile Automation",
         "description": "Mobile testing tools for Android and iOS devices using Appium",
         "command": "mcp-claude",
         "args": ["--json"],
         "capabilities": {
           // ...capabilities here...
         }
       }
     }
   }
   ```

2. If using a local repository, ensure Claude Desktop is configured to use the `claude_desktop_config.json` file

3. Claude will automatically start the server using stdio communication when needed

## Testing the Integration

1. Run the validation script:

   ```bash
   ./validate-claude-integration.sh
   ```

2. Open Claude Desktop and try commands like:
   - "List connected Android devices"
   - "Take a screenshot of the device"
   - "Launch the Settings app"
   - "Tap on the Network option"

## Troubleshooting

### Common Issues

1. **Connection Errors**:

   - Verify the server is running
   - Check that the port (8080) is not in use by another application
   - Ensure your firewall allows local connections

2. **Device Not Found**:

   - Verify the device is connected with `adb devices`
   - Ensure USB debugging is enabled on Android devices

3. **Command Execution Fails**:
   - Check the server logs for detailed error information
   - Verify Appium is properly installed and accessible

### Advanced Configuration

For advanced use cases, you can modify the Claude Desktop configuration:

- Change the server port in `start-claude-http.sh` and `claude-desktop-config.json`
- Adjust capabilities in the configuration to match your testing requirements
- Add custom tools by modifying the server implementation

## Using with Claude Desktop

Here are some example prompts you can use with Claude Desktop once the MCP-Appium integration is set up:

### Basic Device Commands

- "List all connected mobile devices"
- "Take a screenshot of my Android phone"
- "Show me the current UI hierarchy on the device"
- "What apps are installed on the device?"

### Navigation Commands

- "Launch the Settings app on my Android device"
- "Open the Calculator app"
- "Go to the Network settings"
- "Navigate back to the home screen"

### Interaction Commands

- "Tap on the 'Wi-Fi' option"
- "Type 'testing' in the search box"
- "Swipe down to show notifications"
- "Long press on this element: [describe element]"

### Testing Commands

- "Create a test script that opens the Settings app and navigates to Display settings"
- "Write a test that verifies the Calculator app performs addition correctly"
- "Run a visual comparison of the current screen with the previous screenshot"

## Additional Resources

- [MCP-Appium Documentation](https://github.com/rahulec08/mcp-appium)
- [Model Context Protocol SDK](https://github.com/anthropics/model-context-protocol)
- [Appium Documentation](https://appium.io/docs/en/latest/)
- [NPM Package Setup Guide](./NPM_PACKAGE_SETUP.md)
