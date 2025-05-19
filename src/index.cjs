/**
 * Universal Module Definition for MCP-Appium
 *
 * This file provides a universal interface to use MCP-Appium with both CommonJS and ES modules.
 */

// Entry point for direct npm usage
exports = module.exports = {
  /**
   * Start the MCP-Appium server with the provided configuration
   * This is compatible with require() usage
   */
  startServer: function (config) {
    const { spawn } = require("child_process");
    const path = require("path");

    // Use local path when installed as a dependency
    const serverProcess = spawn(
      "node",
      [path.join(__dirname, "npx-entry.js")],
      {
        stdio: ["pipe", "inherit", "inherit"],
      }
    );

    // Write configuration to stdin
    if (config) {
      serverProcess.stdin.write(JSON.stringify(config));
    }
    serverProcess.stdin.end();

    return serverProcess;
  },

  /**
   * Create a child process with the appropriate command
   * This is useful when integrating with MCP clients
   */
  createMcpCommand: function () {
    return {
      command: "npx",
      args: ["mcp-appium"],
    };
  },

  /**
   * Helper to get default MCP server configuration
   */
  getDefaultConfig: function () {
    return {
      appiumHost: "localhost",
      appiumPort: 4723,
      screenshotDir: "./test-screenshots",
      logLevel: "info",
    };
  },
};
