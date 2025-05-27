#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting MCP-Appium Server for Claude Desktop...${NC}"

# Build the specific Claude Desktop server
echo -e "${CYAN}Building Claude Desktop server...${NC}"
npx tsc src/claude-desktop-server.ts --esModuleInterop --outDir dist/

# Set executable permissions
chmod +x dist/claude-desktop-server.js

echo -e "${GREEN}Server ready for Claude Desktop${NC}"
echo -e "${CYAN}You can now use this server with Claude Desktop${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}\n"

# Start the server with JSON output
node dist/claude-desktop-server.js --json
