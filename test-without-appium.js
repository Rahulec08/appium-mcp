#!/usr/bin/env node

// Test script to simulate Claude Desktop calling the MCP server without Appium running
const { spawn } = require("child_process");

console.log("Testing MCP server without Appium running...");

// Start the MCP server
const mcpServer = spawn("node", ["dist/index.js"], {
  stdio: ["pipe", "pipe", "pipe"],
});

// Send an initialize request
const initRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: {
      name: "test-client",
      version: "1.0.0",
    },
  },
};

// Send tools/list request to get available tools
const toolsListRequest = {
  jsonrpc: "2.0",
  id: 2,
  method: "tools/list",
};

// Send a test tool call to initialize-appium (this should handle no Appium gracefully)
const toolCallRequest = {
  jsonrpc: "2.0",
  id: 3,
  method: "tools/call",
  params: {
    name: "initialize-appium",
    arguments: {
      appiumUrl: "http://localhost:4723",
      capabilities: {
        platformName: "Android",
        deviceName: "Test Device",
      },
    },
  },
};

mcpServer.stdout.on("data", (data) => {
  const responses = data.toString().trim().split("\n");
  responses.forEach((response) => {
    if (response.trim()) {
      try {
        const parsed = JSON.parse(response);
        console.log("Server response:", JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log("Raw output:", response);
      }
    }
  });
});

mcpServer.stderr.on("data", (data) => {
  console.log("Server stderr:", data.toString());
});

// Send the requests
setTimeout(() => {
  console.log("\nSending initialize request...");
  mcpServer.stdin.write(JSON.stringify(initRequest) + "\n");
}, 100);

setTimeout(() => {
  console.log("\nSending tools/list request...");
  mcpServer.stdin.write(JSON.stringify(toolsListRequest) + "\n");
}, 500);

setTimeout(() => {
  console.log(
    "\nSending initialize-appium tool call (should handle no Appium gracefully)..."
  );
  mcpServer.stdin.write(JSON.stringify(toolCallRequest) + "\n");
}, 1000);

setTimeout(() => {
  console.log("\nTest completed. Killing server...");
  mcpServer.kill();
  process.exit(0);
}, 3000);
