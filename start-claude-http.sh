#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Change to the directory where the script is located
cd "$(dirname "$0")"

# Default port (can be overridden with the -p option)
PORT=8080

# Parse arguments
while getopts "p:" opt; do
  case $opt in
    p) PORT=$OPTARG ;;
    *) ;;
  esac
done

# Build the project with the new HTTP server
echo -e "${YELLOW}Building project...${NC}"
npm run build

# Ensure the required module is available
if ! grep -q "HttpServerTransport" node_modules/@modelcontextprotocol/sdk/server/http.js 2>/dev/null; then
  echo -e "${YELLOW}Installing required HTTP transport module...${NC}"
  npm install @modelcontextprotocol/sdk@latest
fi

# Create the HTTP server TypeScript file if it doesn't exist
if [ ! -f dist/http-server.js ]; then
  echo -e "${YELLOW}Compiling HTTP server...${NC}"
  npx tsc src/http-server.ts --esModuleInterop --outDir dist
fi

# Make directory for screenshots if it doesn't exist
mkdir -p test-screenshots

# Print server information
echo -e "${GREEN}Starting MCP-Appium HTTP Server for Claude Desktop integration${NC}"
echo -e "${CYAN}Port:${NC} $PORT"
echo -e "${CYAN}URL:${NC} http://localhost:$PORT"
echo -e "${CYAN}Connect with:${NC} Use claude-desktop-config.json in Claude Desktop settings"
echo ""

# Start the HTTP server
PORT=$PORT node dist/http-server.js --json
