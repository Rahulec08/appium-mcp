import { McpClient } from "@modelcontextprotocol/sdk";
import { StdioClientTransport } from "@modelcontextprotocol/sdk";
import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import * as path from "path";

/**
 * Example test script for the MCP-Appium server
 * This demonstrates how to use the MCP-Appium tools for mobile app automation
 */
async function main() {
  // Start the MCP-Appium server as a child process
  console.log("Starting MCP-Appium server...");
  const serverProcess = startMcpServer();

  try {
    // Create an MCP client with stdio transport
    console.log("Connecting to MCP-Appium server...");
    const transport = new StdioClientTransport({
      serverStdout: serverProcess.stdout,
      serverStdin: serverProcess.stdin,
    });

    const client = new McpClient(transport);

    // Connect to the server
    await client.initialize();
    console.log("Connected to MCP-Appium server!");

    // List available tools
    const tools = await client.getCapabilities();
    console.log(
      `Available tools: ${tools.tools.map((tool: any) => tool.name).join(", ")}`
    );

    // Test ADB tools
    console.log("\n=== Testing ADB Tools ===");

    // List connected devices
    console.log("\nListing connected devices:");
    try {
      const devicesResult = await client.callTool({
        name: "list-devices",
        arguments: {},
      });

      console.log(devicesResult.content[0].text);

      // Check if any devices were found
      if (!devicesResult.content[0].text.includes("No devices connected")) {
        // If a device is connected, we can proceed with more tests
        await testMoreAdbTools(client);
      }
    } catch (error) {
      console.error("Error listing devices:", error);
    }

    // Test Appium inspector tools (demonstration only, requires Appium server and device)
    console.log("\n=== Testing Inspector Tools (Example) ===");
    await testInspectorTools(client);

    // Demonstrate generating a test script
    console.log("\n=== Generating Test Script ===");
    await generateTestScript(client);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Kill the server process
    console.log("\nShutting down MCP-Appium server...");
    serverProcess.kill();
  }
}

/**
 * Start the MCP-Appium server as a child process
 */
function startMcpServer(): ChildProcessWithoutNullStreams {
  const serverPath = path.resolve(__dirname, "..", "index.js");
  const nodeProcess = spawn("node", [serverPath]);

  nodeProcess.stderr.on("data", (data) => {
    console.error(`Server: ${data.toString()}`);
  });

  // Give the server a moment to start
  return nodeProcess;
}

/**
 * Test additional ADB tools (only if a device is connected)
 */
async function testMoreAdbTools(client: McpClient) {
  // For demonstration purposes, we'll just show some tool calls without actual execution
  console.log("\nExample ADB tool calls:");

  console.log(`
  // List installed packages on device
  await client.callTool({
    name: 'list-installed-packages',
    arguments: {
      deviceId: 'DEVICE_ID_HERE'
    }
  });
  
  // Install an app
  await client.callTool({
    name: 'install-app',
    arguments: {
      deviceId: 'DEVICE_ID_HERE',
      apkPath: '/path/to/app.apk'
    }
  });
  
  // Launch an app
  await client.callTool({
    name: 'launch-app',
    arguments: {
      deviceId: 'DEVICE_ID_HERE',
      packageName: 'com.example.app'
    }
  });
  `);
}

/**
 * Test inspector tools (demonstration only)
 */
async function testInspectorTools(client: McpClient) {
  // Show example of how to use the inspector tools
  console.log("\nExample inspector tool usage:");

  console.log(`
  // Example: Extract locators from page source
  const pageSource = await client.callTool({
    name: 'get-page-source',
    arguments: {}
  });
  
  // Find all buttons
  await client.callTool({
    name: 'extract-locators',
    arguments: {
      xmlSource: pageSource.content[0].text,
      elementType: 'android.widget.Button',
      maxResults: 5
    }
  });
  
  // Generate XPath for element with text
  await client.callTool({
    name: 'find-by-text',
    arguments: {
      text: 'Login',
      platformName: 'Android'
    }
  });
  `);
}

/**
 * Generate a sample test script using the MCP tools
 */
async function generateTestScript(client: McpClient) {
  try {
    // Example script generation for a login flow
    const scriptResult = await client.callTool({
      name: "generate-test-script",
      arguments: {
        platformName: "Android",
        appPackage: "com.example.myapp",
        actions: [
          {
            type: "tap",
            selector: '//android.widget.EditText[@text="Username"]',
            strategy: "xpath",
          },
          {
            type: "input",
            selector: '//android.widget.EditText[@text="Username"]',
            strategy: "xpath",
            text: "testuser",
          },
          {
            type: "tap",
            selector: '//android.widget.EditText[@text="Password"]',
            strategy: "xpath",
          },
          {
            type: "input",
            selector: '//android.widget.EditText[@text="Password"]',
            strategy: "xpath",
            text: "password123",
          },
          {
            type: "tap",
            selector: '//android.widget.Button[@text="Login"]',
            strategy: "xpath",
          },
          {
            type: "wait",
            selector: '//android.widget.TextView[@text="Welcome"]',
            strategy: "xpath",
            timeoutMs: 5000,
          },
        ],
      },
    });

    console.log(scriptResult.content[0].text);
  } catch (error) {
    console.error("Error generating test script:", error);
  }
}

// Run the main function
main().catch(console.error);
