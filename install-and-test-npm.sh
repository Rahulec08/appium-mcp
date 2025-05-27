#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== MCP-Appium NPM Package Installer and Tester ===${NC}\n"

# Check if we're installing globally or locally
GLOBAL=""
if [[ "$1" == "-g" || "$1" == "--global" ]]; then
    GLOBAL="-g"
    echo -e "${CYAN}Installing package globally...${NC}"
else
    echo -e "${CYAN}Installing package locally...${NC}"
fi

# Build the project
echo -e "\n${CYAN}Building the project...${NC}"
npm run build

# Verify and pack the package
echo -e "\n${CYAN}Packing the npm package...${NC}"
npm pack

# Install the locally packaged version
PACKAGE_FILE=$(ls mcp-appium-visual-*.tgz | sort -V | tail -n 1)
if [ -z "$PACKAGE_FILE" ]; then
    echo -e "${RED}Failed to find packaged file${NC}"
    exit 1
fi

echo -e "\n${CYAN}Installing the package ${PACKAGE_FILE}...${NC}"
npm install $GLOBAL ./$PACKAGE_FILE

# Test the binaries
echo -e "\n${YELLOW}=== Testing Installed Binaries ===${NC}"

if [ "$GLOBAL" == "-g" ]; then
    # Test global installation
    echo -e "\n${CYAN}Testing mcp-appium binary...${NC}"
    which mcp-appium
    if [ $? -ne 0 ]; then
        echo -e "${RED}mcp-appium binary not found in PATH${NC}"
    else
        echo -e "${GREEN}✓ mcp-appium binary installed properly${NC}"
    fi
    
    echo -e "\n${CYAN}Testing mcp-claude binary...${NC}"
    which mcp-claude
    if [ $? -ne 0 ]; then
        echo -e "${RED}mcp-claude binary not found in PATH${NC}"
    else
        echo -e "${GREEN}✓ mcp-claude binary installed properly${NC}"
    fi
    
    echo -e "\n${CYAN}Testing mcp-claude-http binary...${NC}"
    which mcp-claude-http
    if [ $? -ne 0 ]; then
        echo -e "${RED}mcp-claude-http binary not found in PATH${NC}"
    else
        echo -e "${GREEN}✓ mcp-claude-http binary installed properly${NC}"
    fi
else
    # Test local installation
    echo -e "\n${CYAN}Testing local binaries in node_modules/.bin...${NC}"
    ls -la node_modules/.bin/mcp*
    if [ $? -ne 0 ]; then
        echo -e "${RED}No mcp binaries found in node_modules/.bin${NC}"
    else
        echo -e "${GREEN}✓ Local binaries installed properly${NC}"
    fi
fi

echo -e "\n${YELLOW}=== Claude Desktop Integration ===${NC}"
echo -e "1. For Stdio Mode: Use the claude-desktop-config.sample.json file"
echo -e "2. For HTTP Mode: Use the claude-desktop-http-config.sample.json file"
echo -e "\n${CYAN}Would you like to test the Claude Desktop integration? (y/n)${NC}"
read -r RESPONSE
if [[ "$RESPONSE" =~ ^[Yy]$ ]]; then
    echo -e "\n${CYAN}Do you want to test the HTTP server (h) or Stdio server (s)?${NC}"
    read -r SERVER_TYPE
    if [[ "$SERVER_TYPE" =~ ^[Hh]$ ]]; then
        echo -e "\n${GREEN}Starting HTTP server...${NC}"
        if [ "$GLOBAL" == "-g" ]; then
            mcp-claude-http
        else
            node_modules/.bin/mcp-claude-http
        fi
    else
        echo -e "\n${GREEN}Starting Stdio server...${NC}"
        if [ "$GLOBAL" == "-g" ]; then
            mcp-claude
        else
            node_modules/.bin/mcp-claude
        fi
    fi
else
    echo -e "\n${GREEN}Installation and testing complete!${NC}"
    echo -e "You can now use the MCP-Appium package with Claude Desktop."
fi
