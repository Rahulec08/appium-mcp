#!/bin/bash

# Running MCP-Appium tests in various environments
# Tests ESM, CJS, TypeScript, and direct binary usage

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Create a temporary test directory
TEMP_DIR=$(mktemp -d)
echo -e "${YELLOW}Creating test directory: ${TEMP_DIR}${NC}"
cd "${TEMP_DIR}"

# Install test dependencies
echo -e "\n${YELLOW}Installing test dependencies...${NC}"
npm init -y > /dev/null 2>&1
npm install --no-save typescript ts-node @types/node > /dev/null 2>&1

# 1. Test local tarball installation if provided
if [ -n "$1" ] && [ -f "$1" ]; then
  echo -e "\n${YELLOW}Testing with local tarball: $1${NC}"
  npm install --no-save "$1" > /dev/null 2>&1

  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install local tarball${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ Local tarball installed successfully${NC}"
else
  # Install from npm registry
  echo -e "\n${YELLOW}Testing with npm registry package${NC}"
  npm install --no-save mcp-appium-visual > /dev/null 2>&1

  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install from npm registry${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ Package installed from npm registry successfully${NC}"
fi

# Create test files
echo -e "\n${YELLOW}Creating test files...${NC}"

# ESM test
cat > esm-test.js << 'EOF'
// ESM test file
import { spawn } from 'child_process';

console.log('ESM test: Starting MCP-Appium server...');

const config = {
  appiumHost: "localhost",
  appiumPort: 4723,
  screenshotDir: "./test-screenshots",
  logLevel: "info"
};

const serverProcess = spawn('npx', ['mcp-appium'], { stdio: ['pipe', 'inherit', 'inherit'] });
serverProcess.stdin.write(JSON.stringify(config));
serverProcess.stdin.end();

console.log('MCP server started with ESM. Press Ctrl+C to exit.');

process.on('SIGINT', () => {
  serverProcess.kill();
  process.exit(0);
});
EOF

# CommonJS test
cat > cjs-test.cjs << 'EOF'
// CommonJS test file
const { spawn } = require('child_process');

console.log('CommonJS test: Starting MCP-Appium server...');

const config = {
  appiumHost: "localhost",
  appiumPort: 4723,
  screenshotDir: "./test-screenshots",
  logLevel: "info"
};

const serverProcess = spawn('npx', ['mcp-appium-cjs'], { stdio: ['pipe', 'inherit', 'inherit'] });
serverProcess.stdin.write(JSON.stringify(config));
serverProcess.stdin.end();

console.log('MCP server started with CommonJS. Press Ctrl+C to exit.');

process.on('SIGINT', () => {
  serverProcess.kill();
  process.exit(0);
});
EOF

# TypeScript test
cat > ts-test.ts << 'EOF'
// TypeScript test file
import { spawn } from 'child_process';

console.log('TypeScript test: Starting MCP-Appium server...');

const config = {
  appiumHost: "localhost",
  appiumPort: 4723,
  screenshotDir: "./test-screenshots",
  logLevel: "info"
};

const serverProcess = spawn('npx', ['mcp-appium'], { stdio: ['pipe', 'inherit', 'inherit'] });
serverProcess.stdin.write(JSON.stringify(config));
serverProcess.stdin.end();

console.log('MCP server started with TypeScript. Press Ctrl+C to exit.');

process.on('SIGINT', () => {
  serverProcess.kill();
  process.exit(0);
});
EOF

# Create a TypeScript config file
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "strict": true,
    "skipLibCheck": true
  },
  "ts-node": {
    "esm": true
  }
}
EOF

# Update package.json for ESM
node -e 'const pkg=require("./package.json"); pkg.type="module"; require("fs").writeFileSync("./package.json", JSON.stringify(pkg, null, 2))'

echo -e "${GREEN}✓ Test files created successfully${NC}"

# Run tests
echo -e "\n${YELLOW}Running tests...${NC}"

echo -e "\n${YELLOW}1. Testing CommonJS version:${NC}"
echo -e "${YELLOW}Press Ctrl+C after a few seconds to continue${NC}"
node cjs-test.cjs

echo -e "\n${YELLOW}2. Testing ESM version:${NC}"
echo -e "${YELLOW}Press Ctrl+C after a few seconds to continue${NC}"
node esm-test.js

echo -e "\n${YELLOW}3. Testing TypeScript version:${NC}"
echo -e "${YELLOW}Press Ctrl+C after a few seconds to continue${NC}"
npx ts-node ts-test.ts

# Cleanup
echo -e "\n${YELLOW}Cleaning up...${NC}"
cd - > /dev/null
rm -rf "${TEMP_DIR}"

echo -e "\n${GREEN}✅ All tests completed!${NC}"
echo -e "${YELLOW}If all tests started the server successfully, your package is working correctly.${NC}"
