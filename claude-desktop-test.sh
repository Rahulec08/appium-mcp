#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Claude Desktop MCP-Appium Integration Test ===${NC}\n"

# Check if Appium is installed
echo -e "${CYAN}Checking Appium installation...${NC}"
if ! command -v appium &> /dev/null; then
    echo -e "${YELLOW}Appium is not installed. Please install it with:${NC}"
    echo "npm install -g appium"
    exit 1
fi
echo -e "${GREEN}✓ Appium is installed${NC}"

# Check for connected devices
echo -e "\n${CYAN}Checking for connected Android devices...${NC}"
DEVICES=$(adb devices | grep -v "List" | grep "device" | wc -l)
if [ "$DEVICES" -eq 0 ]; then
    echo -e "${YELLOW}No Android devices detected. Please connect a device or start an emulator.${NC}"
    echo "You can start an emulator with Android Studio or use:"
    echo "emulator -avd <emulator_name>"
else
    echo -e "${GREEN}✓ Found $DEVICES connected Android device(s)${NC}"
    adb devices | grep -v "List"
fi

# Build the project 
echo -e "\n${CYAN}Building MCP-Appium project...${NC}"
npm run build
echo -e "${GREEN}✓ Project built successfully${NC}"

# Prepare the Claude integration test script
echo -e "\n${CYAN}Building Claude integration test script...${NC}"
mkdir -p dist/examples
npx tsc examples/claude-mcp-test.ts --outDir dist/examples --esModuleInterop
echo -e "${GREEN}✓ Claude test script built successfully${NC}"

# Display instructions for Claude Desktop
echo -e "\n${YELLOW}=== Claude Desktop Integration Instructions ===${NC}"
echo -e "1. Open Claude Desktop app"
echo -e "2. Go to Settings > Developer"
echo -e "3. Click 'Add MCP Server'"
echo -e "4. Select this file: ${CYAN}$(pwd)/claude-desktop-config.json${NC}"
echo -e "5. In a chat with Claude, try commands like:"
echo -e "   - ${GREEN}List connected mobile devices${NC}"
echo -e "   - ${GREEN}Take a screenshot of my Android device${NC}"
echo -e "   - ${GREEN}Launch the Settings app${NC}"
echo -e "   - ${GREEN}Show the UI hierarchy${NC}"
echo -e "\n${YELLOW}Would you like to start the MCP server now? (y/n)${NC}"
read -r RESPONSE
if [[ "$RESPONSE" =~ ^[Yy]$ ]]; then
    echo -e "\n${GREEN}Starting MCP server with JSON output...${NC}"
    echo -e "${YELLOW}(Press Ctrl+C to stop)${NC}\n"
    node dist/npx-entry.js --json
else
    echo -e "\n${GREEN}You can start the server anytime with:${NC}"
    echo -e "${CYAN}node dist/npx-entry.js --json${NC}"
    echo -e "or use the start script:"
    echo -e "${CYAN}./start-claude-mcp.sh${NC}"
fi
