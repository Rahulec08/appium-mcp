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

# Ensure the project is built
echo -e "${YELLOW}Building project...${NC}"
npm run build > /dev/null

# Make sure the test screenshots directory exists
mkdir -p test-screenshots

# Print server information
echo -e "${GREEN}Starting MCP-Appium server for Claude Desktop integration${NC}"
echo -e "${CYAN}Port:${NC} $PORT"
echo -e "${CYAN}Connect with:${NC} Use claude-desktop-config.json in Claude Desktop settings"
echo ""

# Start the server with JSON output, binding to all interfaces with a specific port
PORT=$PORT node dist/npx-entry.js --json
