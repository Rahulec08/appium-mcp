#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default port
PORT=8080

# Function to display usage
show_usage() {
  echo -e "${YELLOW}MCP-Appium Claude Desktop CLI${NC}"
  echo -e "Usage: $0 [options] <command>"
  echo ""
  echo "Commands:"
  echo "  http       Start the HTTP server for Claude Desktop"
  echo "  stdio      Start the stdio server for Claude Desktop"
  echo "  validate   Validate Claude Desktop configuration"
  echo "  help       Show this help message"
  echo ""
  echo "Options:"
  echo "  -p, --port <port>    Set HTTP server port (default: 8080)"
  echo "  -j, --json           Enable JSON output format"
  echo "  -h, --help           Show this help message"
  echo ""
  echo "Examples:"
  echo "  $0 http             # Start HTTP server on port 8080"
  echo "  $0 -p 9000 http     # Start HTTP server on port 9000"
  echo "  $0 stdio            # Start stdio server"
  echo "  $0 validate         # Validate configuration"
}

# Parse options
JSON_FLAG=""
while [[ "$#" -gt 0 ]]; do
  case $1 in
    -p|--port)
      PORT="$2"; shift ;;
    -j|--json)
      JSON_FLAG="--json" ;;
    -h|--help)
      show_usage; exit 0 ;;
    http|stdio|validate|help)
      COMMAND="$1" ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}" >&2
      show_usage
      exit 1 ;;
  esac
  shift
done

# If no command specified, show usage
if [ -z "$COMMAND" ]; then
  show_usage
  exit 1
fi

# Execute the command
case $COMMAND in
  http)
    echo -e "${CYAN}Starting MCP-Appium HTTP server on port $PORT...${NC}"
    echo -e "${GREEN}Claude Desktop can connect to: http://localhost:$PORT${NC}"
    if [ -x "$(command -v mcp-claude-http)" ]; then
      # Use globally installed package
      PORT=$PORT mcp-claude-http $JSON_FLAG
    elif [ -f "dist/http-server.js" ]; then
      # Use local repository
      PORT=$PORT node dist/http-server.js $JSON_FLAG
    else
      echo -e "${RED}Error: MCP-Appium HTTP server not found${NC}"
      echo -e "Please install the package globally with: npm install -g mcp-appium-visual"
      echo -e "Or build the project with: npm run build"
      exit 1
    fi
    ;;
    
  stdio)
    echo -e "${CYAN}Starting MCP-Appium stdio server...${NC}"
    if [ -x "$(command -v mcp-claude)" ]; then
      # Use globally installed package
      mcp-claude $JSON_FLAG
    elif [ -f "dist/claude-desktop-server.js" ]; then
      # Use local repository
      node dist/claude-desktop-server.js $JSON_FLAG
    else
      echo -e "${RED}Error: MCP-Appium stdio server not found${NC}"
      echo -e "Please install the package globally with: npm install -g mcp-appium-visual"
      echo -e "Or build the project with: npm run build"
      exit 1
    fi
    ;;
    
  validate)
    echo -e "${CYAN}Validating Claude Desktop configuration...${NC}"
    if [ -f "validate-claude-integration.sh" ]; then
      ./validate-claude-integration.sh
    else
      echo -e "${YELLOW}Validation script not found, performing basic checks...${NC}"
      
      # Check for configuration files
      if [ -f "claude-desktop-config.json" ]; then
        echo -e "${GREEN}✓ Found claude-desktop-config.json${NC}"
      elif [ -f "claude_desktop_config.json" ]; then
        echo -e "${GREEN}✓ Found claude_desktop_config.json${NC}"
      else
        echo -e "${RED}× No Claude Desktop configuration file found${NC}"
      fi
      
      # Check for server implementation
      if [ -x "$(command -v mcp-claude)" ]; then
        echo -e "${GREEN}✓ MCP-Claude binary found in PATH${NC}"
      elif [ -f "dist/claude-desktop-server.js" ]; then
        echo -e "${GREEN}✓ Claude Desktop server implementation found${NC}"
      else
        echo -e "${RED}× Claude Desktop server implementation not found${NC}"
      fi
      
      # Check for HTTP server
      if [ -x "$(command -v mcp-claude-http)" ]; then
        echo -e "${GREEN}✓ MCP-Claude-HTTP binary found in PATH${NC}"
      elif [ -f "dist/http-server.js" ]; then
        echo -e "${GREEN}✓ HTTP server implementation found${NC}"
      else
        echo -e "${RED}× HTTP server implementation not found${NC}"
      fi
    fi
    ;;
    
  help)
    show_usage
    ;;
esac
