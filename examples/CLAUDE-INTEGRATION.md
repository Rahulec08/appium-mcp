# Testing MCP-Appium with Claude

This guide explains how to use Claude to control your MCP-Appium server for mobile test automation using natural language.

## Setup and Requirements

1. Make sure your `@modelcontextprotocol/sdk` dependencies are installed
2. Ensure Appium is installed and properly configured
3. Have a mobile device or emulator connected
4. Compile the Claude integration script: 
   ```
   npx tsc examples/claude-mcp-test.ts --outDir dist/examples --esModuleInterop
   ```

## Running the Demo Client

The demo client provides a command-line interface to simulate how Claude would interact with your MCP-Appium server:

```
node dist/examples/claude-mcp-test.js
```

This will start:
- The MCP-Appium server in the background
- An interactive CLI that processes natural language commands

## Available Commands

The demo supports these natural language commands:

- **"List connected devices"** - Shows all available Android devices
- **"Take a screenshot"** - Captures the current device screen
- **"Launch app package com.example.app"** - Opens an app with the specified package name
- **"Show UI hierarchy"** - Gets XML representation of the current UI
- **"Tap on \"Text\""** - Taps an element containing the specified text
- **"Type \"Field name\" with \"text to enter\""** - Enters text into a field
- **"Help"** - Shows available commands
- **"Exit"** or **"Quit"** - Closes the session

## How It Works

1. When you enter a natural language command, the demo client parses it using simple keyword matching
2. In a real Claude integration, Claude would intelligently parse commands and extract parameters
3. The client calls the appropriate MCP tool with the extracted parameters
4. The MCP server executes the corresponding actions on the mobile device

## Integrating with Real Claude API

For a production implementation, you would:

1. Send user commands to Claude along with context about:
   - Available mobile automation tools
   - Device information
   - Current screen state

2. Have Claude generate structured outputs that:
   - Identify the appropriate MCP tool to use
   - Extract parameters from the natural language command
   - Return a JSON object with the tool name and arguments

3. Call the MCP tool with Claude's output

## Debugging Tips

- If you encounter Appium session initialization errors, check that:
  - Your device is properly connected and recognized
  - You have the correct Appium capabilities with required `appium:` prefixes
  - Appium server is running and accessible at the default port

- If element interactions fail:
  - Use the "Show UI hierarchy" command to verify the element exists
  - Try using different identifying attributes (text, id, etc.)
  - Check if the element is visible and not obscured by other elements

## Example Script for Claude Integration

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { McpClient } from "@modelcontextprotocol/sdk";

// In your real implementation:
const anthropic = new Anthropic({
  apiKey: 'your-api-key',
});

// Example of sending a command to Claude
async function processWithClaude(command, context) {
  const response = await anthropic.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: `
        You are an AI assistant helping with mobile app automation.
        
        Available MCP tools: list-devices, take-screenshot, launch-app, 
        get-page-source, find-by-text, tap-element, send-keys.
        
        Current context:
        ${context}
        
        User command: ${command}
        
        Return a JSON object with:
        1. toolName: the MCP tool to call
        2. arguments: the parameters to pass to the tool
        `
      }
    ]
  });
  
  return JSON.parse(response.content[0].text);
}
```

## Further Improvements

- Add support for more complex operations like swipes and multi-touch gestures
- Implement error recovery strategies when elements can't be found
- Create a persistent context that remembers previous commands and results
- Add image recognition capabilities to identify UI elements from screenshots
