/**
 * Server management functions for mcp-appium-visual
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  StreamableHTTPServerTransport,
  StreamableHTTPServerTransportOptions,
} from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerMobileTools } from "./tools/mobileTools.js";
import { registerInspectorTools } from "./tools/inspectorTools.js";
import { registerAdbTools } from "./tools/adbTools.js";
// Import package version using fs for Node.js 18 compatibility
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(
  readFileSync(join(__dirname, "../package.json"), "utf8")
);
const { version } = pkg;

/**
 * Server configuration options
 */
export interface ServerConfig {
  appiumUrl?: string;
}

/**
 * Create a server instance
 * @param config Optional server configuration
 * @returns A new MCP server instance with all tools registered
 */
export function createServer(config?: ServerConfig) {
  // Create an MCP server instance
  const server = new McpServer({
    name: "mobile-automation",
    version: version || "1.2.0",
    capabilities: {
      resources: {},
      tools: {},
    },
  });

  // Register all tools with the server, passing configuration
  registerMobileTools(server, config);
  registerInspectorTools(server);
  registerAdbTools(server);

  // Try to register recovery tools if available
  try {
    // Dynamic import to avoid breaking if the module doesn't exist
    import("./tools/recoveryTools.js")
      .then((module) => {
        if (module && module.registerRecoveryTools) {
          module.registerRecoveryTools(server);
        }
      })
      .catch(() => {
        // Silent fail - recovery tools are optional
      });
  } catch (e) {
    // Recovery tools might not be available in all builds
  }

  return server;
}

/**
 * Shared server instance for compatibility with existing code
 */
export const server = createServer();

/**
 * Start the MCP-Appium server with the specified options
 *
 * @param options Server configuration options
 * @returns The running MCP server instance
 */
export async function startServer(options?: {
  port?: number;
  host?: string;
  appiumHost?: string;
  appiumPort?: number;
  logLevel?: "debug" | "info" | "warn" | "error";
  transportType?: "http" | "stdio";
}) {
  const useHttp = options?.transportType === "http";
  const port = options?.port || 7000;
  const host = options?.host || "localhost";

  console.log(
    `Starting MCP-Appium Visual server${
      useHttp ? ` on ${host}:${port}` : ""
    } ...`
  );

  let transport;

  if (useHttp) {
    // Use HTTP transport if requested
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // Use stateless mode
      enableJsonResponse: true,
    });
    console.log(
      `MCP-Appium Visual HTTP server will be available at: http://${host}:${port}`
    );
  } else {
    // Default to stdio transport for compatibility
    transport = new StdioServerTransport();
    console.log("MCP-Appium Visual using stdio transport");
  }

  // Connect the server to the transport
  await server.connect(transport);

  console.log("MCP-Appium Visual server running");
  return server;
}
