#!/usr/bin/env node

/**
 * Command line interface for mcp-appium
 * This file provides a simplified interface when the package is installed globally
 */

import { fileURLToPath } from "url";
import * as path from "path";
import * as fs from "fs";
import { spawn } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Command options
const commands = {
  start: "Start the MCP-Appium server only (default)",
  "start-with-appium": "Start both Appium and MCP-Appium servers",
  cli: "Start the interactive CLI for mobile testing",
  help: "Show this help message",
  version: "Show version information",
};

// Parse command line arguments
const args = process.argv.slice(2);
const command = args.length > 0 ? args[0].toLowerCase() : "start";
const additionalArgs = args.slice(1); // Get all arguments after the command

// Get package version
const packageJsonPath = path.resolve(__dirname, "../package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const version = packageJson.version;

/**
 * Show help information
 */
function showHelp() {
  console.log(
    `MCP-Appium - Model Context Protocol server for Appium mobile automation`
  );
  console.log(`Version: ${version}\n`);
  console.log("Usage: mcp-appium [command] [options]\n");
  console.log("Commands:");

  Object.entries(commands).forEach(([cmd, description]) => {
    console.log(`  ${cmd.padEnd(18)} ${description}`);
  });

  console.log("\nOptions:");
  console.log(
    "  --port <number>       Set the MCP server port (default: 7000 for HTTP, stdio for stdio)"
  );
  console.log(
    "  --transport <type>    Set transport type: 'stdio' or 'http' (default: stdio)"
  );
  console.log(
    "  --host <string>       Set the MCP server host (default: localhost)"
  );
  console.log(
    "  --appium-port <num>   Set the Appium server port (default: 4723)"
  );
  console.log(
    "  --log-level <level>   Set log level: debug, info, warn, error (default: info)"
  );

  console.log("\nExamples:");
  console.log(
    "  mcp-appium                          Start MCP server with stdio transport"
  );
  console.log(
    "  mcp-appium --transport http --port 7000  Start MCP server with HTTP transport"
  );
  console.log(
    "  mcp-appium start-with-appium        Start both Appium and MCP servers"
  );
  console.log(
    "  mcp-appium cli                      Start the interactive CLI"
  );
  console.log("  mcp-appium help                     Show this help message");
}

/**
 * Show version information
 */
function showVersion() {
  console.log(`MCP-Appium v${version}`);
}

/**
 * Execute a child process with the specified file
 */
function executeProcess(filePath: string, args: string[] = []) {
  const childProcess = spawn("node", [filePath, ...args], {
    stdio: "inherit",
    detached: false,
  });

  childProcess.on("error", (err) => {
    console.error(`Error executing command: ${err.message}`);
    process.exit(1);
  });

  // Forward signals to child process
  process.on("SIGINT", () => {
    childProcess.kill("SIGINT");
  });

  process.on("SIGTERM", () => {
    childProcess.kill("SIGTERM");
  });

  childProcess.on("exit", (code) => {
    process.exit(code || 0);
  });
}

// Execute the appropriate command
switch (command) {
  case "start":
    executeProcess(path.resolve(__dirname, "index.js"), additionalArgs);
    break;

  case "start-with-appium":
    executeProcess(path.resolve(__dirname, "launcher.js"), additionalArgs);
    break;

  case "cli":
    executeProcess(path.resolve(__dirname, "cli.js"), additionalArgs);
    break;

  case "help":
    showHelp();
    break;

  case "version":
  case "--version":
  case "-v":
    showVersion();
    break;

  default:
    // If the command starts with a dash, it's probably an argument for the default command
    if (command.startsWith("-")) {
      executeProcess(path.resolve(__dirname, "index.js"), args);
    } else {
      console.error(`Unknown command: ${command}`);
      showHelp();
      process.exit(1);
    }
}
