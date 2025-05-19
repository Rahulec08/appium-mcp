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
  start: "Start the MCP-Appium server (default)",
  cli: "Start the interactive CLI for mobile testing",
  help: "Show this help message",
  version: "Show version information",
};

// Parse command line arguments
const args = process.argv.slice(2);
const command = args.length > 0 ? args[0].toLowerCase() : "start";

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
  console.log("Usage: mcp-appium [command]\n");
  console.log("Commands:");

  Object.entries(commands).forEach(([cmd, description]) => {
    console.log(`  ${cmd.padEnd(10)} ${description}`);
  });

  console.log("\nExamples:");
  console.log("  mcp-appium         Start the MCP-Appium server");
  console.log("  mcp-appium cli     Start the interactive CLI");
  console.log("  mcp-appium help    Show this help message");
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
    executeProcess(path.resolve(__dirname, "launcher.js"));
    break;

  case "cli":
    executeProcess(path.resolve(__dirname, "cli.js"));
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
    console.error(`Unknown command: ${command}`);
    showHelp();
    process.exit(1);
}
