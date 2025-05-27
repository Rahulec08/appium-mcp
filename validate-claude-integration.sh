#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== MCP-Appium Claude Desktop Integration Validator ===${NC}\n"

# Check for required files
echo -e "${CYAN}Checking required files...${NC}"

if [ ! -f "src/http-server.ts" ]; then
    echo -e "${RED}HTTP server implementation not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ HTTP server implementation found${NC}"

if [ ! -f "src/claude-desktop-server.ts" ]; then
    echo -e "${RED}Claude Desktop server implementation not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Claude Desktop server implementation found${NC}"

if [ ! -f "claude-desktop-config.json" ] && [ ! -f "claude_desktop_config.json" ]; then
    echo -e "${RED}Claude Desktop configuration not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Claude Desktop configuration found${NC}"

# Build the project
echo -e "\n${CYAN}Building project...${NC}"
npm run build

# Build the HTTP server
echo -e "\n${CYAN}Building HTTP server...${NC}"
npx tsc src/http-server.ts --esModuleInterop --outDir dist

# Build the Claude Desktop server
echo -e "\n${CYAN}Building Claude Desktop server...${NC}"
npx tsc src/claude-desktop-server.ts --esModuleInterop --outDir dist

# Set executable permissions
echo -e "\n${CYAN}Setting permissions...${NC}"
chmod +x dist/http-server.js dist/claude-desktop-server.js

# Validate the configuration
echo -e "\n${CYAN}Validating Claude Desktop configuration...${NC}"
CONFIG_FILE=""
if [ -f "claude-desktop-config.json" ]; then
    CONFIG_FILE="claude-desktop-config.json"
elif [ -f "claude_desktop_config.json" ]; then
    CONFIG_FILE="claude_desktop_config.json"
fi

if [ -n "$CONFIG_FILE" ]; then
    echo -e "Found configuration file: ${GREEN}$CONFIG_FILE${NC}"
    
    # Check JSON validity
    if ! node -e "JSON.parse(require('fs').readFileSync('$CONFIG_FILE'))" &> /dev/null; then
        echo -e "${RED}Invalid JSON format in $CONFIG_FILE${NC}"
    else
        echo -e "${GREEN}✓ Valid JSON format${NC}"
    fi
fi

# Display integration options
echo -e "\n${YELLOW}=== Claude Desktop Integration Options ===${NC}"
echo -e "1. ${CYAN}HTTP Server Mode${NC} - Start an HTTP server that Claude Desktop connects to"
echo -e "2. ${CYAN}Stdio Server Mode${NC} - Launch directly from Claude Desktop using stdio"

echo -e "\n${YELLOW}Would you like to test the HTTP server mode now? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo -e "\n${GREEN}Starting MCP HTTP server for Claude Desktop...${NC}"
    echo -e "${YELLOW}(Press Ctrl+C to stop)${NC}\n"
    PORT=8080 node dist/http-server.js --json
else
    echo -e "\n${GREEN}You can start the HTTP server anytime with:${NC}"
    echo -e "${CYAN}PORT=8080 node dist/http-server.js --json${NC}"
    
    echo -e "\n${YELLOW}Would you like to test the stdio server mode now? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo -e "\n${GREEN}Starting MCP stdio server for Claude Desktop...${NC}"
        echo -e "${YELLOW}(Press Ctrl+C to stop)${NC}\n"
        node dist/claude-desktop-server.js --json
    else
        echo -e "\n${GREEN}You can start the stdio server anytime with:${NC}"
        echo -e "${CYAN}node dist/claude-desktop-server.js --json${NC}"
    fi
fi

echo -e "\n${GREEN}Integration validation complete!${NC}"
echo -e "${YELLOW}To connect Claude Desktop, use the configuration file in Claude Desktop settings.${NC}"
