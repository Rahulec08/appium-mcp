#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting MCP-Appium server for Claude integration...${NC}"

# Ensure the project is built
echo -e "Building project..."
npm run build

# Make sure the temporary directory exists
mkdir -p test-screenshots

# Start the MCP server with JSON output enabled
echo -e "${GREEN}Starting MCP server with JSON output...${NC}"
node dist/npx-entry.js --json

# The script will stay in the foreground running the server
# Press Ctrl+C to stop
