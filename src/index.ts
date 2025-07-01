import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerMobileTools } from "./tools/mobileTools.js";
import { registerInspectorTools } from "./tools/inspectorTools.js";
import { registerAdbTools } from "./tools/adbTools.js";
import { registerXcodeTools } from "./tools/xcodeTools.js";

// Create an MCP server instance
const server = new McpServer({
  name: "mobile-automation",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Register all tools with the server
registerMobileTools(server);
registerInspectorTools(server);
registerAdbTools(server);
registerXcodeTools(server); // Add Xcode tools registration

async function main() {
  // Use stdio transport for communication
  const transport = new StdioServerTransport();

  // Connect the server to the transport
  await server.connect(transport);

  console.error(
    "Mobile Automation MCP Server running with iOS Simulator support..."
  );
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
