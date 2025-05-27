// Simple script to check the StreamableHTTPServerTransport API
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { inspect } from "util";

// Print the constructor parameters
console.log("StreamableHTTPServerTransport constructor parameters:");
try {
  // Check what options are available by inspecting the constructor
  const prototype = Object.getPrototypeOf(StreamableHTTPServerTransport);
  console.log(inspect(prototype, { depth: 3 }));

  // Create an instance with default options to see what's accepted
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => "test-session",
  });
  console.log("Successfully created transport with options:", transport);

  // Check if the transport has any properties we can use
  console.log("Transport properties:", Object.keys(transport));
} catch (error) {
  console.error("Error:", error);
}
