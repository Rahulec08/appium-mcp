/**
 * Claude integration with MCP-Appium
 *
 * This file demonstrates how to use Claude to interpret natural language commands
 * and execute them through the Model Context Protocol server.
 */
import { McpClient } from "@modelcontextprotocol/sdk";
import { StdioClientTransport } from "@modelcontextprotocol/sdk";
import { spawn, ChildProcess } from "child_process";
import * as path from "path";
import * as fs from "fs/promises";
import * as readline from "readline";
import { fileURLToPath } from "url";

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Claude-powered MCP Client
 * This class wraps the standard MCP client with natural language processing
 * capabilities using Claude
 */
class ClaudeMcpClient {
  private mcpClient: McpClient | null = null;
  private mcpProcess: ChildProcess | null = null;
  private sessionActive = false;
  private deviceId: string | null = null;
  private claudeContext: string[] = [];
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  /**
   * Initialize the MCP server and client
   */
  async initialize(): Promise<void> {
    console.log("Starting MCP-Appium server...");
    // Start the MCP-Appium server
    const serverPath = path.resolve(__dirname, "../dist/index.js");
    this.mcpProcess = spawn("node", [serverPath]);

    // Log server stderr output
    this.mcpProcess.stderr.on("data", (data) => {
      console.error(`[Server]: ${data.toString()}`);
    });

    // Create the MCP client with stdio transport
    const transport = new StdioClientTransport({
      serverStdout: this.mcpProcess.stdout,
      serverStdin: this.mcpProcess.stdin,
    });

    this.mcpClient = new McpClient(transport);
    await this.mcpClient.initialize();

    const capabilities = await this.mcpClient.getCapabilities();
    console.log("MCP-Appium server connected!");
    console.log(
      `Available tools: ${capabilities.tools
        .map((t: any) => t.name)
        .join(", ")}`
    );

    // Try to get connected devices
    await this.listDevices();
  }

  /**
   * List connected devices
   */
  async listDevices(): Promise<void> {
    if (!this.mcpClient) return;

    try {
      const result = await this.mcpClient.callTool({
        name: "list-devices",
        arguments: {},
      });

      console.log("\nConnected devices:");
      console.log(result.content[0].text);

      // Try to extract a device ID if available
      const deviceMatch = result.content[0].text.match(
        /([a-zA-Z0-9-]+)\s+device/
      );
      if (deviceMatch) {
        this.deviceId = deviceMatch[1];
        console.log(`\nAutomatically selected device: ${this.deviceId}`);
      } else {
        console.log("\nNo devices found. Please connect a device.");
      }
    } catch (error) {
      console.error("Error listing devices:", error);
    }
  }

  /**
   * Process a natural language command with Claude (simulated in this example)
   * In a real integration, this would call the Claude API
   */
  async processCommand(userCommand: string): Promise<void> {
    if (!this.mcpClient) return;

    // Add user command to context
    this.claudeContext.push(`User: ${userCommand}`);

    try {
      // This is where you'd call Claude API in a real integration
      // For this example, we'll use a simple keyword-based approach

      const command = userCommand.toLowerCase();

      // Log what we're about to do
      console.log(`\nProcessing command: "${userCommand}"`);

      if (
        command.includes("list devices") ||
        command.includes("show devices")
      ) {
        await this.listDevices();
      } else if (
        command.includes("take screenshot") ||
        command.includes("capture screen")
      ) {
        const filename = `screenshot_${Date.now()}.png`;
        await this.takeScreenshot(filename);
      } else if (
        (command.includes("start") || command.includes("launch")) &&
        (command.includes("app") || command.includes("application"))
      ) {
        // Extract app package name using a very basic regex
        // In a real Claude integration, Claude would extract this more intelligently
        const packageMatch = command.match(/package\s+([a-zA-Z0-9.]+)/);
        const packageName = packageMatch
          ? packageMatch[1]
          : "com.android.settings";

        await this.startApp(packageName);
      } else if (
        command.includes("ui hierarchy") ||
        command.includes("page source")
      ) {
        await this.getPageSource();
      } else if (command.includes("tap") || command.includes("click")) {
        // Extract text to tap on using a simple regex
        // In a real Claude integration, Claude would extract this more intelligently
        const textMatch = command.match(/"([^"]+)"/);
        const text = textMatch ? textMatch[1] : "";

        if (text) {
          await this.tapElementWithText(text);
        } else {
          console.log(
            "Could not determine which element to tap on. Please specify the text in quotes."
          );
        }
      } else if (command.includes("type") || command.includes("enter text")) {
        // Very basic extraction of field and text
        // In a real Claude integration, Claude would understand this much better
        const matches = command.match(/"([^"]+)".*"([^"]+)"/);

        if (matches && matches.length >= 3) {
          const field = matches[1];
          const text = matches[2];
          await this.typeText(field, text);
        } else {
          console.log(
            'Could not determine field and text. Format: type "Field name" with "text to type"'
          );
        }
      } else if (command.includes("help")) {
        this.showHelp();
      } else if (command.includes("exit") || command.includes("quit")) {
        await this.cleanup();
        process.exit(0);
      } else {
        console.log(
          "I'm not sure how to process that command. Try 'help' to see available commands."
        );
      }
    } catch (error) {
      console.error("Error processing command:", error);
    }
  }

  /**
   * Take a screenshot of the device
   */
  async takeScreenshot(filename: string): Promise<void> {
    if (!this.mcpClient || !this.deviceId) {
      console.log("No device selected. Please connect a device first.");
      return;
    }

    try {
      const result = await this.mcpClient.callTool({
        name: "take-screenshot",
        arguments: {
          deviceId: this.deviceId,
          outputPath: filename,
        },
      });

      console.log("Screenshot taken:");
      console.log(result.content[0].text);
    } catch (error) {
      console.error("Error taking screenshot:", error);
    }
  }

  /**
   * Start an app on the device
   */
  async startApp(packageName: string): Promise<void> {
    if (!this.mcpClient || !this.deviceId) {
      console.log("No device selected. Please connect a device first.");
      return;
    }
    
    try {
      // Launch the app with ADB
      const launchResult = await this.mcpClient.callTool({
        name: "launch-app",
        arguments: {
          deviceId: this.deviceId,
          packageName,
        },
      });
      
      console.log("App launch result:");
      console.log(launchResult.content[0].text);
      
      // Initialize Appium session for further automation
      console.log("Initializing Appium session...");
      
      // The AppiumHelper will add the "appium:" prefix internally to non-standard capabilities
      await this.mcpClient.callTool({
        name: "initialize-appium",
        arguments: {
          platformName: "Android",  // Standard W3C capability, no prefix needed
          deviceName: this.deviceId,
          appPackage: packageName,
          automationName: "UiAutomator2",
          noReset: true,
        },
      });
      
      this.sessionActive = true;
      console.log("Appium session started successfully");
    } catch (error) {
      console.error("Error starting app:", error);
    }
  }

  /**
   * Get UI hierarchy/page source
   */
  async getPageSource(): Promise<void> {
    if (!this.mcpClient || !this.sessionActive) {
      console.log("No active Appium session. Please start an app first.");
      return;
    }

    try {
      const result = await this.mcpClient.callTool({
        name: "get-page-source",
        arguments: {},
      });

      // Save UI hierarchy to file
      const filename = `ui_hierarchy_${Date.now()}.xml`;
      await fs.writeFile(filename, result.content[0].text);

      console.log(`UI hierarchy saved to ${filename}`);

      // Also analyze the page source for available elements
      const analyzeResult = await this.mcpClient.callTool({
        name: "extract-locators",
        arguments: {
          xmlSource: result.content[0].text,
          maxResults: 5,
        },
      });

      console.log("\nInteractable elements found:");
      console.log(analyzeResult.content[0].text);
    } catch (error) {
      console.error("Error getting page source:", error);
    }
  }

  /**
   * Tap on an element with specific text
   */
  async tapElementWithText(text: string): Promise<void> {
    if (!this.mcpClient || !this.sessionActive) {
      console.log("No active Appium session. Please start an app first.");
      return;
    }

    try {
      // Generate XPath for text
      const findResult = await this.mcpClient.callTool({
        name: "find-by-text",
        arguments: {
          text,
          platformName: "Android",
          exactMatch: false,
        },
      });

      const selector = findResult.content[0].text.trim();
      console.log(`Found element with selector: ${selector}`);

      // Tap the element
      const tapResult = await this.mcpClient.callTool({
        name: "tap-element",
        arguments: {
          selector,
          strategy: "xpath",
        },
      });

      console.log("Tap result:");
      console.log(tapResult.content[0].text);
    } catch (error) {
      console.error(`Error tapping element with text "${text}":`, error);
    }
  }

  /**
   * Type text into a field
   */
  async typeText(fieldText: string, textToType: string): Promise<void> {
    if (!this.mcpClient || !this.sessionActive) {
      console.log("No active Appium session. Please start an app first.");
      return;
    }

    try {
      // Find the element by text
      const findResult = await this.mcpClient.callTool({
        name: "find-by-text",
        arguments: {
          text: fieldText,
          platformName: "Android",
          exactMatch: false,
        },
      });

      const selector = findResult.content[0].text.trim();
      console.log(`Found input field with selector: ${selector}`);

      // Send keys to the element
      const sendResult = await this.mcpClient.callTool({
        name: "send-keys",
        arguments: {
          selector,
          text: textToType,
          strategy: "xpath",
        },
      });

      console.log("Text input result:");
      console.log(sendResult.content[0].text);
    } catch (error) {
      console.error(`Error typing text into field "${fieldText}":`, error);
    }
  }

  /**
   * Display available commands
   */
  showHelp(): void {
    console.log(`
Available commands:
- "List connected devices"
- "Take a screenshot"
- "Launch app package com.example.app"
- "Show UI hierarchy"
- "Tap on \"Text\""
- "Type \"Field name\" with \"text to enter\""
- "Exit" or "Quit"

For a real Claude integration, you would send these commands to Claude,
which would understand them and convert them to the appropriate MCP tool calls.
`);
  }

  /**
   * Start interactive mode to accept commands
   */
  async startInteractive(): Promise<void> {
    console.log("\n=== Claude MCP-Appium Interactive Mode ===");
    console.log(
      "Enter natural language commands to control your mobile device."
    );
    console.log('Type "help" to see available commands or "exit" to quit.');

    const askQuestion = async () => {
      this.rl.question("\nEnter command: ", async (command) => {
        if (
          command.toLowerCase() === "exit" ||
          command.toLowerCase() === "quit"
        ) {
          await this.cleanup();
          process.exit(0);
        } else {
          await this.processCommand(command);
          // Continue asking for commands
          askQuestion();
        }
      });
    };

    await askQuestion();
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    console.log("Cleaning up...");

    // Close Appium session if active
    if (this.sessionActive && this.mcpClient) {
      try {
        await this.mcpClient.callTool({
          name: "close-appium",
          arguments: {},
        });
        console.log("Appium session closed");
      } catch (error) {
        console.error("Error closing Appium session:", error);
      }
    }

    // Close readline interface
    this.rl.close();

    // Kill MCP server process
    if (this.mcpProcess && !this.mcpProcess.killed) {
      this.mcpProcess.kill();
      console.log("MCP-Appium server stopped");
    }
  }
}

/**
 * Main function to run the Claude MCP client
 */
async function main() {
  const claudeMcp = new ClaudeMcpClient();

  try {
    // Initialize the MCP client
    await claudeMcp.initialize();

    // Start interactive mode
    await claudeMcp.startInteractive();
  } catch (error) {
    console.error("Fatal error:", error);
    await claudeMcp.cleanup();
    process.exit(1);
  }
}

// Handle process termination
process.on("SIGINT", () => {
  console.log("\nReceived SIGINT signal");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\nReceived SIGTERM signal");
  process.exit(0);
});

// Run the main function
main().catch(console.error);
