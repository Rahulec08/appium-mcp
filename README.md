# MCP-Appium-Visual

Model Context Protocol (MCP) Server for Appium mobile automation with visual recovery capabilities. This package provides a bridge between AI assistants (like Claude, GitHub Copilot) and mobile app testing using Appium, with advanced visual analysis for UI recovery.

The server integrates seamlessly with the Model Context Protocol ecosystem, allowing it to work alongside other MCP servers like Playwright for comprehensive testing solutions.

## Features

- 🚀 Control mobile devices through natural language using AI assistants
- 📱 Support for both Android and iOS device automation
- 🔍 Advanced element finding and UI interactions
- 🌐 Deep linking and app navigation
- 📸 Screenshot and UI analysis capabilities
- 🔄 Visual recovery for handling UI changes and element locator failures
- 🛠️ Interactive CLI mode for quick testing
- ⚡ NPX support for easy integration with other MCP servers

## Installation

You can install MCP-Appium-Visual using multiple methods:

### Using npm (Recommended)

```bash
# Install globally
npm install -g mcp-appium-visual

# Or install for the current project only
npm install mcp-appium-visual
```

### Using npx (No Installation Required)

```bash
# Run directly using npx
npx mcp-appium-visual
```

### Using mcp-get

```bash
npx @michaellatman/mcp-get@latest install mcp-appium-visual
```

### Using Smithery

To install MCP-Appium-Visual for Claude Desktop automatically via Smithery:

```bash
npx @smithery/cli install mcp-appium-visual --client claude
```

### Installation in VS Code

Install the MCP-Appium-Visual server in VS Code using the VS Code CLI:

```bash
# For VS Code
code --add-mcp '{"name":"mcp-appium-visual","command":"npx","args":["mcp-appium-visual"]}'

# For VS Code Insiders
code-insiders --add-mcp '{"name":"mcp-appium-visual","command":"npx","args":["mcp-appium-visual"]}'
```

After installation, the MCP-Appium-Visual server will be available for use with AI assistants in VS Code.

### Requirements

- Node.js 18 or later
- Appium 2.0 or later
- Android SDK (for Android testing)
- Xcode (for iOS testing)

## Configuration to use MCP-Appium-Visual Server

Here's the Claude Desktop configuration to use the MCP-Appium-Visual server:

```json
{
  "mcpServers": {
    "mobile-automation": {
      "command": "npx",
      "args": ["-y", "mcp-appium-visual"]
    },
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

Alternative configuration using stdio transport:

```json
{
  "servers": [
    {
      "name": "MCP-Appium-Visual",
      "transport": "stdio",
      "command": "mcp-appium-visual"
    }
  ]
}
```

## Usage

### Starting the Server

To start the MCP-Appium-Visual server for use with AI assistants:

```bash
mcp-appium-visual
```

This will start both the Appium server and the MCP protocol handler.

### Interactive CLI Mode

For quick testing and interactive mobile automation without coding:

```bash
mcp-appium-visual cli
```

This launches an interactive CLI where you can:

- Connect to devices
- Install apps
- Take screenshots
- Execute UI automation commands
- Extract element locators
- Use visual recovery for flaky tests
- And much more

### Command Line Options

```bash
mcp-appium-visual [command]
```

Available commands:

- `start` - Start the MCP-Appium-Visual server (default)
- `cli` - Start the interactive CLI for mobile testing
- `help` - Show help information
- `version` - Show version information

## Integration with Claude

MCP-Appium works with Claude Desktop and other AI assistants supporting the Model Context Protocol:

1. Start the MCP-Appium server:

   ```bash
   mcp-appium
   ```

2. Add the server to your Claude Desktop configuration (as shown in the Configuration section).

3. Restart Claude Desktop.

4. Talk to Claude about mobile testing and let it control your devices through the MCP-Appium server.

## Agent Integration Features

### What's New in Version 1.1.0

This version enhances support for integration with various AI agent environments:

- **Claude Desktop Integration**: Improved configuration for seamless use with Claude Desktop
- **VS Code Integration**: Enhanced support for VS Code extensions using the Model Context Protocol
- **Universal Agent Support**: Standardized interfaces for any MCP-compatible agent
- **Automatic Tool Discovery**: Agents can automatically discover available mobile automation capabilities

### Supported Agent Environments

MCP-Appium can be used with:

- **Claude Desktop**: For desktop AI assistant interaction
- **VS Code extensions**: For in-editor mobile app development and testing
- **Smithery**: Managed AI environment with built-in tool support
- **Custom MCP clients**: Any environment implementing the Model Context Protocol

### Integration Instructions

For detailed integration instructions for different agent environments, see [examples/CLAUDE-INTEGRATION.md](./examples/CLAUDE-INTEGRATION.md).

## Testing

The project includes several test examples that demonstrate how to use MCP-Appium for mobile testing:

```bash
# Run the basic Appium test
npm run test

# Run specific test examples
ts-node examples/deeplink-test.ts
ts-node examples/calculator-test.ts
ts-node examples/visual-recovery-test.ts
```

Test examples are located in the `examples/` directory and can be used as reference implementations.

## Examples

See the [EXAMPLE.md](./EXAMPLE.md) file for detailed examples of:

- Setting up Appium sessions
- Finding and interacting with UI elements
- Taking screenshots and analyzing UI
- Using deep links
- Handling advanced gestures

## Development

To develop or contribute to MCP-Appium:

```bash
# Clone the repository
git clone https://github.com/yourusername/mcp-appium.git
cd mcp-appium

# Install dependencies
npm install

# Build the project
npm run build

# Start in development mode
npm run dev
```

## License

ISC

## Support

For issues, questions, or feature requests, please open an issue on the GitHub repository.
