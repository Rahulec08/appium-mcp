#!/bin/bash

# Test if mcp-appium is working as an npm module
# This script tests both development and production environments

echo "=== MCP-Appium NPM Package Test ==="
echo

# Check for npx availability
if ! command -v npx &> /dev/null; then
  echo "❌ Error: npx is not installed. Please install Node.js and npm."
  exit 1
fi

# Create a temporary directory for testing
TEST_DIR=$(mktemp -d)
echo "Creating test directory: $TEST_DIR"
cd "$TEST_DIR" || exit 1

# Step 1: Initialize a new npm project
echo "1️⃣ Initializing npm project..."
npm init -y > /dev/null 2>&1

# Step 2: Install the MCP-Appium package
echo "2️⃣ Installing MCP-Appium..."

# Try local installation first (for development)
if [ -n "$1" ] && [ -f "$1" ]; then
  echo "📦 Using local tarball: $1"
  npm install --no-save "$1" > /dev/null 2>&1
  RESULT=$?
else
  # Try from npm
  echo "📦 Installing from npm registry..."
  npm install --no-save mcp-appium-visual > /dev/null 2>&1
  RESULT=$?
fi

if [ $RESULT -ne 0 ]; then
  echo "❌ Error: Failed to install MCP-Appium package"
  exit 1
fi

echo "✅ MCP-Appium installed successfully"

# Step 3: Create a test script
echo "3️⃣ Creating test script..."
cat > test-mcp.js << 'EOF'
const { spawn } = require('child_process');

console.log("Testing MCP-Appium as npm package...");

const config = {
  appiumHost: "localhost",
  appiumPort: 4723,
  screenshotDir: "./screenshots",
  logLevel: "info"
};

const process = spawn('npx', ['mcp-appium'], { stdio: ['pipe', 'inherit', 'inherit'] });

process.stdin.write(JSON.stringify(config));
process.stdin.end();

console.log("MCP-Appium server started successfully");
console.log("Press Ctrl+C to exit");

process.on('exit', (code) => {
  console.log(`MCP-Appium exited with code ${code}`);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  process.kill();
  process.exit(0);
});
EOF

echo "✅ Test script created"

# Step 4: Run the test
echo "4️⃣ Running test script..."
echo "Press Ctrl+C after a few seconds to exit the test"
node test-mcp.js

# Step 5: Clean up
echo -e "\n5️⃣ Cleaning up..."
cd - > /dev/null
rm -rf "$TEST_DIR"
echo "✅ Cleanup complete"

echo -e "\n🎉 Test completed successfully!"
