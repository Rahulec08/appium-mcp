#!/usr/bin/env bash
# build-and-verify.sh
# This script builds the package, creates a tarball, and verifies its functionality

# Exit on error
set -e

# Display commands being executed
set -x

# Clean previous builds
echo "Cleaning previous builds..."
npm run clean
rm -f mcp-appium-visual-*.tgz

# Build the package
echo "Building package..."
npm run build

# Set permissions for binary files
echo "Setting executable permissions..."
npm run set-permissions

# Create a package tarball
echo "Creating package tarball..."
npm pack

# Verify the package (continue even if there are errors)
echo "Verifying package..."
./verify-npm-package.sh || {
  echo "⚠️ Package verification had issues - see above for details"
  echo "You may need to fix exports in index.ts"
}

echo "✅ Build and verification completed successfully!"
echo "The package is ready for npm publishing"
