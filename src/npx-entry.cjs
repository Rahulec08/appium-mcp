#!/usr/bin/env node

/**
 * MCP-Appium NPX Entry Point (CommonJS version)
 *
 * This file serves as the CommonJS entry point for the MCP-Appium server.
 * It loads the ESM module using dynamic import for maximum compatibility.
 */

// Capture stdin data
const inputChunks = [];

if (!process.stdin.isTTY) {
  process.stdin.on("data", (chunk) => {
    inputChunks.push(chunk);
  });

  process.stdin.on("end", () => {
    const input = Buffer.concat(inputChunks).toString("utf8");
    let config = {};
    try {
      config = JSON.parse(input);
    } catch (error) {
      console.error("Failed to parse configuration:", error);
    }

    // Load the ESM module dynamically
    import("./npx-entry.js")
      .then((module) => {
        // Pass the config to the ESM module
        if (typeof module.default === "function") {
          module.default(config);
        } else if (typeof module.startServer === "function") {
          module.startServer(config);
        } else {
          console.error("No valid start function found in ESM module");
          process.exit(1);
        }
      })
      .catch((err) => {
        console.error("Failed to load ESM module:", err);
        process.exit(1);
      });
  });
} else {
  // No stdin data, load module with empty config
  import("./npx-entry.js")
    .then((module) => {
      if (typeof module.default === "function") {
        module.default({});
      } else if (typeof module.startServer === "function") {
        module.startServer({});
      } else {
        console.error("No valid start function found in ESM module");
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error("Failed to load ESM module:", err);
      process.exit(1);
    });
}
