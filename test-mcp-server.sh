#!/bin/bash

echo "Testing MCP-Appium-Visual server..."

# Test 1: Check if the package can be run
echo "Test 1: Running help command"
npx -y mcp-appium-visual help

echo ""
echo "Test 2: Testing MCP server with initialize message"

# Create a test MCP message
cat << 'EOF' | npx -y mcp-appium-visual &
{"jsonrpc": "2.0", "method": "initialize", "params": {"protocolVersion": "2024-11-05", "capabilities": {"roots": {"listChanged": true}}, "clientInfo": {"name": "test", "version": "1.0.0"}}, "id": 1}
EOF

# Wait a bit and then kill the process
sleep 3
pkill -f "mcp-appium-visual"

echo ""
echo "Test completed."
