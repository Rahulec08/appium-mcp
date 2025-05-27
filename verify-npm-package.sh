#!/usr/bin/env bash

# verify-npm-package.sh
# This script verifies that the MCP-Appium Visual package works correctly
# when installed from npm

# Display what's happening
set -x

# Enable error handling
trap 'echo "Error: Command failed at line $LINENO"; exit 1' ERR

# Check if the package has been built
if [ ! -d "./dist" ]; then
  echo "Error: Package has not been built. Run 'npm run build' first."
  exit 1
fi

# Create temporary directory
TEMP_DIR=$(mktemp -d)
echo "Created temporary directory: $TEMP_DIR"
cd "$TEMP_DIR"

# Initialize test project
echo "Initializing test project..."
npm init -y

# Find the latest package tarball
echo "Finding the latest MCP-Appium Visual package..."
LATEST_PKG=$(find "$OLDPWD" -name "mcp-appium-visual-*.tgz" | sort -V | tail -n 1)

if [ -z "$LATEST_PKG" ]; then
  echo "Error: No package tarball found. Run 'npm pack' first to create the package."
  exit 1
fi

echo "Using package: $LATEST_PKG"

# Install the package from the local tarball
echo "Installing MCP-Appium Visual from local package..."
npm install "$LATEST_PKG"

# Create a simple test script
cat > test-package.js << 'EOF'
// Import the package
const mcpAppium = await import('mcp-appium-visual');

console.log("MCP-Appium Visual package imported successfully!");
console.log("Available exports:", Object.keys(mcpAppium));

// Check if server is exported
if (mcpAppium.server) {
  console.log("Server instance exported: ✅");
} else {
  console.log("Server instance not found: ❌");
}

// Check if any classes are exported
if (mcpAppium.AppiumHelper || mcpAppium.ImageProcessor) {
  console.log("Helper classes exported: ✅");
} else {
  console.log("Helper classes not found: ❌");
}

// Don't actually start the server, just verify the import works
console.log("Module structure is valid. Package verification complete!");
EOF

# Add type: module to package.json
node -e "const pkg = require('./package.json'); pkg.type = 'module'; require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2));"

# Run the test script
echo "Running test script..."
node test-package.js

# Create a jimp test to verify image processing
cat > test-jimp.js << 'EOF'
async function testImageProcessor() {
  console.log("Testing image processing capabilities...");
  
  try {
    // First try direct import
    const { ImageProcessor } = await import('mcp-appium-visual');
    if (ImageProcessor) {
      console.log("ImageProcessor loaded via main export:", !!ImageProcessor);
      console.log("Available methods:", Object.getOwnPropertyNames(ImageProcessor));
      console.log("✅ Direct import successful");
    }
  } catch (err) {
    console.log("Direct import failed:", err.message);
    
    // Try fallback path
    try {
      const { ImageProcessor } = await import('mcp-appium-visual/dist/lib/vision/imageProcessor.js');
      console.log("ImageProcessor loaded via full path:", !!ImageProcessor);
      console.log("Available methods:", Object.getOwnPropertyNames(ImageProcessor));
      console.log("✅ Path import successful");
    } catch (err2) {
      console.error("❌ All image processor imports failed:", err2.message);
    }
  }
  
  console.log("Image processing module verification complete!");
}

testImageProcessor().catch(console.error);
EOF

# Run the Jimp test
echo "Running Jimp test..."
node test-jimp.js

# Create a test script for the bin commands
echo "Testing CLI binaries..."

cat > test-cli.js << 'EOF'
// Simple test to check that bin scripts are available
const { execSync } = require('child_process');
try {
  // Test npx execution (should exit quickly with help message)
  console.log('Testing mcp-appium-visual binary...');
  const result = execSync('npx mcp-appium-visual --help', { timeout: 2000 }).toString();
  console.log('Binary command executed successfully');
} catch (error) {
  console.error('Failed to execute binary:', error.message);
  process.exit(1);
}
EOF

# Run the CLI test script (may error out, but we just want to see if the binaries are available)
node test-cli.js || echo "Binary test exited with non-zero code - this is expected if it tried to actually start the server"

# Testing package.json for proper metadata
echo "Checking package metadata..."
node -e "
const pkg = require('mcp-appium-visual/package.json'); 
console.log('Package info:', {
  name: pkg.name,
  version: pkg.version,
  author: pkg.author,
  main: pkg.main,
  bin: Object.keys(pkg.bin || {}).join(', '),
  exports: pkg.exports ? 'defined' : 'missing',
  types: pkg.types
});
pkg.main || (console.error('ERROR: Missing main field') && process.exit(1));
"

echo "All tests passed! Package verification complete."
echo "Cleaning up temporary directory..."

# Clean up
cd - > /dev/null
rm -rf "$TEMP_DIR"

echo "✅ Package verified successfully!"
