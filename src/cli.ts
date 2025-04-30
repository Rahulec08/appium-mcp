#!/usr/bin/env node

import { spawn, ChildProcess } from "child_process";
import * as readline from "readline";
import * as path from "path";
import { fileURLToPath } from "url";
import { McpClient } from "@modelcontextprotocol/sdk";
import { StdioClientTransport } from "@modelcontextprotocol/sdk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Interactive CLI for MCP-Appium to quickly test mobile app automation
 * without writing any code
 */
class McpAppiumCli {
  private appiumProcess: ChildProcess | null = null;
  private mcpServerProcess: ChildProcess | null = null;
  private mcpClient: McpClient | null = null;
  private rl: readline.Interface;
  private deviceId: string | null = null;
  private appiumSessionActive: boolean = false;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  /**
   * Start the CLI
   */
  public async start(): Promise<void> {
    this.showWelcomeMessage();

    // Start processes
    await this.startProcesses();

    // Main menu
    await this.showMainMenu();
  }

  /**
   * Display welcome message
   */
  private showWelcomeMessage(): void {
    console.log("=================================================");
    console.log("|            MCP-Appium CLI Tool                |");
    console.log("|  Interactive Mobile App Automation Testing    |");
    console.log("=================================================");
    console.log("Starting servers...");
  }

  /**
   * Start Appium and MCP server processes
   */
  private async startProcesses(): Promise<void> {
    // Start Appium
    console.log("Starting Appium server...");
    this.appiumProcess = spawn("appium", [
      "--port",
      "4723",
      "--log-level",
      "error",
    ]);

    this.appiumProcess.stdout?.on("data", (data) => {
      if (
        data.toString().includes("Appium REST http interface listener started")
      ) {
        console.log("Appium server started successfully");
      }
    });

    this.appiumProcess.stderr?.on("data", (data) => {
      console.error(`Appium Error: ${data.toString()}`);
    });

    // Give Appium a moment to start
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Start MCP server
    console.log("Starting MCP-Appium server...");
    const serverPath = path.resolve(__dirname, "index.js");
    this.mcpServerProcess = spawn("node", [serverPath]);

    // Connect MCP client
    const transport = new StdioClientTransport({
      serverStdout: this.mcpServerProcess.stdout,
      serverStdin: this.mcpServerProcess.stdin,
    });

    this.mcpClient = new McpClient(transport);
    await this.mcpClient.initialize();
    console.log("MCP-Appium server started and connected");
  }

  /**
   * Show main menu
   */
  private async showMainMenu(): Promise<void> {
    console.log("\n================ MAIN MENU ================");
    console.log("1. List connected devices");
    console.log("2. Install an app (APK)");
    console.log("3. Launch and test an app");
    console.log("4. Take a screenshot");
    console.log("5. Execute custom ADB command");
    console.log("0. Exit");
    console.log("==========================================");

    const answer = await this.prompt("Choose an option: ");

    switch (answer) {
      case "1":
        await this.listDevices();
        break;
      case "2":
        await this.installApp();
        break;
      case "3":
        await this.launchApp();
        break;
      case "4":
        await this.takeScreenshot();
        break;
      case "5":
        await this.executeAdbCommand();
        break;
      case "0":
        this.cleanup();
        return;
      default:
        console.log("Invalid option, please try again");
    }

    // Return to main menu
    await this.showMainMenu();
  }

  /**
   * List connected devices
   */
  private async listDevices(): Promise<void> {
    if (!this.mcpClient) {
      console.error("MCP client not initialized");
      return;
    }

    try {
      const result = await this.mcpClient.callTool({
        name: "list-devices",
        arguments: {},
      });

      console.log("\n======== CONNECTED DEVICES ========");
      console.log(result.content[0].text);
      console.log("==================================");

      // Store first device ID for convenience
      const deviceMatch = result.content[0].text.match(
        /[\w\d-]+\b(?=\s*device)/
      );
      if (deviceMatch) {
        this.deviceId = deviceMatch[0];
        console.log(`Selected device: ${this.deviceId}`);
      }
    } catch (error) {
      console.error("Error listing devices:", error);
    }
  }

  /**
   * Install app (APK)
   */
  private async installApp(): Promise<void> {
    if (!this.mcpClient) {
      console.error("MCP client not initialized");
      return;
    }

    // List devices if no device is selected
    if (!this.deviceId) {
      await this.listDevices();
      if (!this.deviceId) {
        console.log("No device selected. Please connect a device first.");
        return;
      }
    }

    const apkPath = await this.prompt("Enter path to APK file: ");

    try {
      const result = await this.mcpClient.callTool({
        name: "install-app",
        arguments: {
          deviceId: this.deviceId,
          apkPath,
        },
      });

      console.log("\n======== INSTALLATION RESULT ========");
      console.log(result.content[0].text);
      console.log("====================================");
    } catch (error) {
      console.error("Error installing app:", error);
    }
  }

  /**
   * Launch and test an app
   */
  private async launchApp(): Promise<void> {
    if (!this.mcpClient) {
      console.error("MCP client not initialized");
      return;
    }

    // List devices if no device is selected
    if (!this.deviceId) {
      await this.listDevices();
      if (!this.deviceId) {
        console.log("No device selected. Please connect a device first.");
        return;
      }
    }

    // Close existing Appium session if active
    if (this.appiumSessionActive) {
      await this.closeMobileAppiumSession();
    }

    const packageName = await this.prompt(
      "Enter app package name (e.g., com.example.app): "
    );
    const activityName = await this.prompt(
      "Enter main activity name (optional): "
    );

    try {
      // First, launch the app with ADB
      await this.mcpClient.callTool({
        name: "launch-app",
        arguments: {
          deviceId: this.deviceId,
          packageName,
          activityName: activityName || undefined,
        },
      });

      // Then initialize Appium session
      console.log("Initializing Appium session...");
      await this.mcpClient.callTool({
        name: "initialize-appium",
        arguments: {
          platformName: "Android",
          deviceName: this.deviceId,
          appPackage: packageName,
          appActivity: activityName || undefined,
          automationName: "UiAutomator2",
        },
      });

      this.appiumSessionActive = true;
      console.log("Appium session started successfully");

      // Show app testing menu
      await this.showAppTestingMenu();
    } catch (error) {
      console.error("Error launching app:", error);
    }
  }

  /**
   * Show app testing menu
   */
  private async showAppTestingMenu(): Promise<void> {
    console.log("\n========== APP TESTING MENU ==========");
    console.log("1. Get UI hierarchy (XML)");
    console.log("2. Find element by text");
    console.log("3. Tap element by XPath");
    console.log("4. Send text to element");
    console.log("5. Take screenshot");
    console.log("6. Extract element locators");
    console.log("7. Perform swipe gesture");
    console.log("0. Close app and return to main menu");
    console.log("======================================");

    const answer = await this.prompt("Choose an option: ");

    try {
      switch (answer) {
        case "1":
          await this.getUiHierarchy();
          break;
        case "2":
          await this.findElementByText();
          break;
        case "3":
          await this.tapElement();
          break;
        case "4":
          await this.sendTextToElement();
          break;
        case "5":
          await this.takeAppiumScreenshot();
          break;
        case "6":
          await this.extractElementLocators();
          break;
        case "7":
          await this.performSwipe();
          break;
        case "0":
          await this.closeMobileAppiumSession();
          return;
        default:
          console.log("Invalid option, please try again");
      }
    } catch (error) {
      console.error("Error performing action:", error);
    }

    // Return to app testing menu
    await this.showAppTestingMenu();
  }

  /**
   * Get UI hierarchy
   */
  private async getUiHierarchy(): Promise<void> {
    if (!this.mcpClient || !this.appiumSessionActive) {
      console.error("No active Appium session");
      return;
    }

    try {
      const result = await this.mcpClient.callTool({
        name: "get-page-source",
        arguments: {},
      });

      // Save UI hierarchy to file
      const filename = `ui_hierarchy_${Date.now()}.xml`;
      await this.mcpClient.callTool({
        name: "save-ui-hierarchy",
        arguments: {
          xmlSource: result.content[0].text,
          filePath: filename,
        },
      });

      console.log(`UI hierarchy saved to ${filename}`);
    } catch (error) {
      console.error("Error getting UI hierarchy:", error);
    }
  }

  /**
   * Find element by text
   */
  private async findElementByText(): Promise<void> {
    if (!this.mcpClient || !this.appiumSessionActive) {
      console.error("No active Appium session");
      return;
    }

    const text = await this.prompt("Enter text to search for: ");
    const exactMatch =
      (await this.prompt("Exact match? (y/n): ")).toLowerCase() === "y";
    const elementType = await this.prompt(
      "Element type (optional, e.g., android.widget.Button): "
    );

    try {
      const result = await this.mcpClient.callTool({
        name: "find-by-text",
        arguments: {
          text,
          platformName: "Android",
          exactMatch,
          elementType: elementType || undefined,
        },
      });

      console.log("\n======== ELEMENT XPATH ========");
      console.log(result.content[0].text);
      console.log("==============================");
    } catch (error) {
      console.error("Error finding element:", error);
    }
  }

  /**
   * Tap element by XPath
   */
  private async tapElement(): Promise<void> {
    if (!this.mcpClient || !this.appiumSessionActive) {
      console.error("No active Appium session");
      return;
    }

    const selector = await this.prompt("Enter element XPath: ");

    try {
      const result = await this.mcpClient.callTool({
        name: "tap-element",
        arguments: {
          selector,
          strategy: "xpath",
        },
      });

      console.log("\n======== TAP RESULT ========");
      console.log(result.content[0].text);
      console.log("=========================");
    } catch (error) {
      console.error("Error tapping element:", error);
    }
  }

  /**
   * Send text to element
   */
  private async sendTextToElement(): Promise<void> {
    if (!this.mcpClient || !this.appiumSessionActive) {
      console.error("No active Appium session");
      return;
    }

    const selector = await this.prompt("Enter element XPath: ");
    const text = await this.prompt("Enter text to send: ");

    try {
      const result = await this.mcpClient.callTool({
        name: "send-keys",
        arguments: {
          selector,
          text,
          strategy: "xpath",
        },
      });

      console.log("\n======== TEXT INPUT RESULT ========");
      console.log(result.content[0].text);
      console.log("================================");
    } catch (error) {
      console.error("Error sending text:", error);
    }
  }

  /**
   * Take screenshot using Appium
   */
  private async takeAppiumScreenshot(): Promise<void> {
    if (!this.mcpClient || !this.appiumSessionActive) {
      console.error("No active Appium session");
      return;
    }

    const name = await this.prompt("Enter screenshot name: ");

    try {
      const result = await this.mcpClient.callTool({
        name: "appium-screenshot",
        arguments: { name },
      });

      console.log("\n======== SCREENSHOT RESULT ========");
      console.log(result.content[0].text);
      console.log("================================");
    } catch (error) {
      console.error("Error taking screenshot:", error);
    }
  }

  /**
   * Extract element locators
   */
  private async extractElementLocators(): Promise<void> {
    if (!this.mcpClient || !this.appiumSessionActive) {
      console.error("No active Appium session");
      return;
    }

    // First get page source
    try {
      const pageSource = await this.mcpClient.callTool({
        name: "get-page-source",
        arguments: {},
      });

      const elementType = await this.prompt(
        "Element type (optional, e.g., android.widget.Button): "
      );
      const maxResults = parseInt(
        (await this.prompt("Maximum results to show (default: 5): ")) || "5"
      );

      const result = await this.mcpClient.callTool({
        name: "extract-locators",
        arguments: {
          xmlSource: pageSource.content[0].text,
          elementType: elementType || undefined,
          maxResults,
        },
      });

      console.log("\n======== ELEMENT LOCATORS ========");
      console.log(result.content[0].text);
      console.log("================================");
    } catch (error) {
      console.error("Error extracting locators:", error);
    }
  }

  /**
   * Perform swipe gesture
   */
  private async performSwipe(): Promise<void> {
    if (!this.mcpClient || !this.appiumSessionActive) {
      console.error("No active Appium session");
      return;
    }

    console.log("Enter swipe coordinates:");
    const startX = parseInt(await this.prompt("Start X: "));
    const startY = parseInt(await this.prompt("Start Y: "));
    const endX = parseInt(await this.prompt("End X: "));
    const endY = parseInt(await this.prompt("End Y: "));
    const duration = parseInt(
      (await this.prompt("Duration (ms, default: 800): ")) || "800"
    );

    try {
      const result = await this.mcpClient.callTool({
        name: "swipe",
        arguments: {
          startX,
          startY,
          endX,
          endY,
          duration,
        },
      });

      console.log("\n======== SWIPE RESULT ========");
      console.log(result.content[0].text);
      console.log("============================");
    } catch (error) {
      console.error("Error performing swipe:", error);
    }
  }

  /**
   * Close mobile Appium session
   */
  private async closeMobileAppiumSession(): Promise<void> {
    if (!this.mcpClient || !this.appiumSessionActive) {
      return;
    }

    try {
      await this.mcpClient.callTool({
        name: "close-appium",
        arguments: {},
      });

      this.appiumSessionActive = false;
      console.log("Appium session closed");
    } catch (error) {
      console.error("Error closing Appium session:", error);
    }
  }

  /**
   * Take a screenshot using ADB
   */
  private async takeScreenshot(): Promise<void> {
    if (!this.mcpClient) {
      console.error("MCP client not initialized");
      return;
    }

    // List devices if no device is selected
    if (!this.deviceId) {
      await this.listDevices();
      if (!this.deviceId) {
        console.log("No device selected. Please connect a device first.");
        return;
      }
    }

    const outputPath =
      (await this.prompt("Enter output path for screenshot: ")) ||
      `screenshot_${Date.now()}.png`;

    try {
      const result = await this.mcpClient.callTool({
        name: "take-screenshot",
        arguments: {
          deviceId: this.deviceId,
          outputPath,
        },
      });

      console.log("\n======== SCREENSHOT RESULT ========");
      console.log(result.content[0].text);
      console.log("================================");
    } catch (error) {
      console.error("Error taking screenshot:", error);
    }
  }

  /**
   * Execute custom ADB command
   */
  private async executeAdbCommand(): Promise<void> {
    if (!this.mcpClient) {
      console.error("MCP client not initialized");
      return;
    }

    const command = await this.prompt(
      'Enter ADB command (without "adb" prefix): '
    );

    try {
      const result = await this.mcpClient.callTool({
        name: "execute-adb-command",
        arguments: { command },
      });

      console.log("\n======== COMMAND RESULT ========");
      console.log(result.content[0].text);
      console.log("==============================");
    } catch (error) {
      console.error("Error executing command:", error);
    }
  }

  /**
   * Prompt for user input
   */
  private prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  }

  /**
   * Clean up processes when shutting down
   */
  private cleanup(): void {
    console.log("Shutting down...");

    // Close Appium session if active
    if (this.appiumSessionActive && this.mcpClient) {
      try {
        this.mcpClient
          .callTool({
            name: "close-appium",
            arguments: {},
          })
          .catch(console.error);
      } catch (error) {
        // Ignore error on shutdown
      }
    }

    // Close readline interface
    this.rl.close();

    // Kill processes
    if (this.appiumProcess && !this.appiumProcess.killed) {
      this.appiumProcess.kill();
    }

    if (this.mcpServerProcess && !this.mcpServerProcess.killed) {
      this.mcpServerProcess.kill();
    }

    console.log("Goodbye!");
    process.exit(0);
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

// Create and start the CLI
const cli = new McpAppiumCli();
cli.start().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
