#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Validating Claude Desktop Configuration ===${NC}\n"

CONFIG_FILE="claude_desktop_config.json"

# Check if configuration file exists
echo -e "${CYAN}Checking Claude Desktop configuration file...${NC}"
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}Configuration file $CONFIG_FILE not found${NC}"
    exit 1
fi

# Validate the JSON format
echo -e "${CYAN}Validating JSON format...${NC}"
if ! jq . "$CONFIG_FILE" > /dev/null 2>&1; then
    echo -e "${RED}Invalid JSON format in $CONFIG_FILE${NC}"
    exit 1
fi
echo -e "${GREEN}✓ JSON format is valid${NC}"

# Check for required fields
echo -e "\n${CYAN}Checking required fields...${NC}"
if ! jq -e '.mcpServers."mobile-automation".command' "$CONFIG_FILE" > /dev/null 2>&1; then
    echo -e "${RED}Missing required field: command${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Required field 'command' is present${NC}"

if ! jq -e '.mcpServers."mobile-automation".args' "$CONFIG_FILE" > /dev/null 2>&1; then
    echo -e "${RED}Missing required field: args${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Required field 'args' is present${NC}"

# Display configuration summary
echo -e "\n${CYAN}Configuration Summary:${NC}"
echo -e "Server name: $(jq -r '.mcpServers."mobile-automation".name // "Mobile Automation"' "$CONFIG_FILE")"
echo -e "Command: $(jq -r '.mcpServers."mobile-automation".command' "$CONFIG_FILE")"
echo -e "Arguments: $(jq -r '.mcpServers."mobile-automation".args | join(" ")' "$CONFIG_FILE")"

# Check if connectTo field exists before trying to display it
if jq -e '.mcpServers."mobile-automation".connectTo' "$CONFIG_FILE" > /dev/null 2>&1; then
    echo -e "Connection: $(jq -r '.mcpServers."mobile-automation".connectTo.host' "$CONFIG_FILE"):$(jq -r '.mcpServers."mobile-automation".connectTo.port' "$CONFIG_FILE")"
fi

echo -e "\n${GREEN}✓ Claude Desktop configuration is valid${NC}"
echo -e "${YELLOW}You can now use this configuration in Claude Desktop:${NC}"
echo -e "1. Open Claude Desktop and go to Settings"
echo -e "2. Navigate to the Developer tab"
echo -e "3. Click 'Add MCP Server' and select $CONFIG_FILE"
echo -e "4. Start the HTTP server with: ./start-claude-http.sh"

# Offer to launch the server
echo -e "\n${CYAN}Would you like to start the HTTP server now? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo -e "${YELLOW}Starting HTTP server...${NC}"
    ./start-claude-http.sh
fi
