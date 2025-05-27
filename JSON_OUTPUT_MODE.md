# JSON Output Mode

MCP-Appium provides a structured JSON output mode that can be used for programmatic interaction with the server. This is especially useful when integrating with other tools or automated workflows.

## Enabling JSON Output

To enable JSON output, add the `--json` or `-j` flag to any MCP-Appium command:

```bash
# Start the server with JSON output
mcp-appium --json

# Check version with JSON output
mcp-appium version --json

# Display help in JSON format
mcp-appium help --json
```

## JSON Response Structure

All JSON responses follow a consistent structure with these common fields:

- `status`: Current status of the operation (running, error, terminated, etc.)
- `service`: The service that generated the response (appium, mcp-server)

### Status Values

| Status       | Description                           |
| ------------ | ------------------------------------- |
| `running`    | Service is running successfully       |
| `starting`   | Service is in the process of starting |
| `error`      | An error has occurred                 |
| `terminated` | Service has terminated                |
| `shutdown`   | Service is shutting down              |

## Example Responses

### Server Running

```json
{
  "status": "running",
  "service": "mcp-server",
  "name": "mobile-automation",
  "version": "1.0.0"
}
```

### Error Response

```json
{
  "status": "error",
  "service": "mcp-server",
  "error": "Failed to start Appium server"
}
```

### Version Information

```json
{
  "version": "1.2.0"
}
```

### Help Information

```json
{
  "title": "MCP-Appium - Model Context Protocol server for Appium mobile automation",
  "version": "1.2.0",
  "usage": "mcp-appium [command] [options]",
  "commands": {
    "start": "Start the MCP-Appium server (default)",
    "cli": "Start the interactive CLI for mobile testing",
    "help": "Show this help message",
    "version": "Show version information"
  },
  "options": {
    "--json, -j": "Output responses in JSON format"
  },
  "examples": [
    "mcp-appium         Start the MCP-Appium server",
    "mcp-appium cli     Start the interactive CLI",
    "mcp-appium help    Show this help message",
    "mcp-appium --json  Start the server with JSON output"
  ]
}
```

## Usage with Node.js

You can use the JSON output mode to integrate MCP-Appium with your Node.js applications:

```javascript
const { spawn } = require("child_process");

// Start MCP-Appium with JSON output
const mcpProcess = spawn("npx", ["mcp-appium", "--json"], {
  stdio: ["pipe", "pipe", "pipe"],
});

// Parse JSON output
mcpProcess.stdout.on("data", (data) => {
  try {
    const response = JSON.parse(data);
    console.log("MCP-Appium status:", response.status);

    // Do something based on the response
    if (response.status === "running") {
      // Server is ready, continue with automation
    }
  } catch (e) {
    console.error("Error parsing JSON response:", e);
  }
});

// Handle errors
mcpProcess.stderr.on("data", (data) => {
  console.error("Error:", data.toString());
});

// Send configuration to stdin if needed
const config = {
  appiumHost: "localhost",
  appiumPort: 4723,
};
mcpProcess.stdin.write(JSON.stringify(config));
mcpProcess.stdin.end();
```

## Use with Claude and Other AI Assistants

The JSON output mode is particularly useful when integrating with Claude or other AI agents that benefit from structured data:

```python
import json
import subprocess

# Start MCP-Appium with JSON output
proc = subprocess.Popen(
    ['npx', 'mcp-appium', '--json'],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

# Send configuration
config = {
    "appiumHost": "localhost",
    "appiumPort": 4723
}
proc.stdin.write(json.dumps(config))
proc.stdin.close()

# Read output
for line in proc.stdout:
    try:
        response = json.loads(line)
        print(f"Status: {response.get('status')}")

        # Pass structured data to Claude
        if response.get('status') == 'running':
            # Claude can now work with structured data
            pass
    except json.JSONDecodeError:
        print(f"Non-JSON output: {line.strip()}")
```

With JSON output mode, you can create more robust integrations with Claude and other AI agents, as they can parse and understand the structured data more reliably than free-form text output.
