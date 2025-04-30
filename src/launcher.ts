#!/usr/bin/env node

import { spawn, ChildProcess } from "child_process";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Launcher for MCP-Appium that handles starting both the Appium server and the MCP server
 */
class McpAppiumLauncher {
  private appiumProcess: ChildProcess | null = null;
  private mcpServerProcess: ChildProcess | null = null;
  private appiumPort: number = 4723;
  private isAppiumRunning: boolean = false;

  /**
   * Start the Appium server
   */
  public startAppium(): void {
    console.log("Starting Appium server...");

    this.appiumProcess = spawn("appium", [
      "--port",
      this.appiumPort.toString(),
      "--log-level",
      "info",
      "--log-timestamp",
    ]);

    this.appiumProcess.stdout?.on("data", (data) => {
      const output = data.toString();
      console.log(`[Appium] ${output}`);

      if (output.includes("Appium REST http interface listener started")) {
        this.isAppiumRunning = true;
        console.log(
          `Appium server started successfully on port ${this.appiumPort}`
        );
        this.startMcpServer();
      }
    });

    this.appiumProcess.stderr?.on("data", (data) => {
      console.error(`[Appium Error] ${data.toString()}`);
    });

    this.appiumProcess.on("close", (code) => {
      console.log(`Appium server exited with code ${code}`);
      this.isAppiumRunning = false;
      this.cleanup();
    });
  }

  /**
   * Start the MCP server
   */
  private startMcpServer(): void {
    console.log("Starting MCP-Appium server...");

    const serverPath = path.resolve(__dirname, "index.js");
    this.mcpServerProcess = spawn("node", [serverPath]);

    this.mcpServerProcess.stdout?.on("data", (data) => {
      // MCP server uses stdout for communication, so we don't log it
    });

    this.mcpServerProcess.stderr?.on("data", (data) => {
      console.log(`[MCP-Appium] ${data.toString()}`);
    });

    this.mcpServerProcess.on("close", (code) => {
      console.log(`MCP-Appium server exited with code ${code}`);
      this.cleanup();
    });

    console.log("MCP-Appium server started and ready to accept connections");
    console.log("");
    console.log("To use with Claude Desktop:");
    console.log(
      "1. Update your claude_desktop_config.json to include this server"
    );
    console.log("2. Restart Claude Desktop");
    console.log("");
    console.log("Press Ctrl+C to stop both servers");
  }

  /**
   * Clean up processes when shutting down
   */
  private cleanup(): void {
    if (this.appiumProcess && !this.appiumProcess.killed) {
      this.appiumProcess.kill();
      this.appiumProcess = null;
    }

    if (this.mcpServerProcess && !this.mcpServerProcess.killed) {
      this.mcpServerProcess.kill();
      this.mcpServerProcess = null;
    }

    process.exit();
  }

  /**
   * Start the launcher
   */
  public start(): void {
    // Handle process termination
    process.on("SIGINT", () => {
      console.log("Shutting down...");
      this.cleanup();
    });

    process.on("SIGTERM", () => {
      console.log("Shutting down...");
      this.cleanup();
    });

    // Start servers
    this.startAppium();
  }
}

// Create and start the launcher
const launcher = new McpAppiumLauncher();
launcher.start();
