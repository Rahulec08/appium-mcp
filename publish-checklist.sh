#!/bin/bash

# NPM Publishing Checklist Script
# This script guides you through the process of publishing to NPM

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}     MCP-APPIUM PUBLISHING CHECKLIST     ${NC}"
echo -e "${BLUE}=========================================${NC}"

# Check if package.json exists
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ package.json not found!${NC}"
  exit 1
fi

# Get current version
VERSION=$(jq -r .version package.json)
PACKAGE_NAME=$(jq -r .name package.json)
echo -e "${YELLOW}Package:${NC} $PACKAGE_NAME"
echo -e "${YELLOW}Current version:${NC} $VERSION"

# Get latest version from npm
LATEST_VERSION=$(npm view $PACKAGE_NAME version 2>/dev/null || echo "Not published yet")
echo -e "${YELLOW}Latest published version:${NC} $LATEST_VERSION"

# Check if current version is greater than latest
if [ "$LATEST_VERSION" != "Not published yet" ]; then
  if [[ "$LATEST_VERSION" == "$VERSION" ]]; then
    echo -e "${RED}❌ Version $VERSION already exists on npm. Please update version in package.json.${NC}"
    echo -e "   You can use: npm version patch|minor|major"
    exit 1
  fi
fi

echo

# Checklist
echo -e "${BLUE}================ CHECKLIST ================${NC}"
echo

# Clean and build
echo -e "${YELLOW}Step 1: Clean and build the package${NC}"
read -p "Run 'npm run clean && npm run build'? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  npm run clean && npm run build
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ Build successful${NC}"
else
  echo -e "${YELLOW}⚠️ Build step skipped${NC}"
fi
echo

# Set permissions
echo -e "${YELLOW}Step 2: Set executable permissions${NC}"
read -p "Run 'npm run set-permissions'? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  npm run set-permissions
  echo -e "${GREEN}✓ Permissions set${NC}"
else
  echo -e "${YELLOW}⚠️ Permissions step skipped${NC}"
fi
echo

# Package creation
echo -e "${YELLOW}Step 3: Create test package${NC}"
read -p "Run 'npm pack'? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  npm pack
  PACKAGE_FILE=$(ls ${PACKAGE_NAME}-*.tgz 2>/dev/null | sort -V | tail -n1)
  if [ -z "$PACKAGE_FILE" ]; then
    echo -e "${RED}❌ Package creation failed!${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ Package created: $PACKAGE_FILE${NC}"
else
  echo -e "${YELLOW}⚠️ Package creation skipped${NC}"
  PACKAGE_FILE=$(ls ${PACKAGE_NAME}-*.tgz 2>/dev/null | sort -V | tail -n1)
fi
echo

# Test package
if [ -n "$PACKAGE_FILE" ]; then
  echo -e "${YELLOW}Step 4: Test the package installation${NC}"
  read -p "Run './test-all-environments.sh ./$PACKAGE_FILE'? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -x "./test-all-environments.sh" ]; then
      ./test-all-environments.sh "./$PACKAGE_FILE" || true
    else
      echo -e "${RED}❌ test-all-environments.sh not found or not executable${NC}"
    fi
  else
    echo -e "${YELLOW}⚠️ Testing skipped${NC}"
  fi
  echo
fi

# Login to npm
echo -e "${YELLOW}Step 5: Log in to npm${NC}"
read -p "Run 'npm login'? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  npm login
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ npm login failed!${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ Logged in to npm${NC}"
else
  echo -e "${YELLOW}⚠️ Login skipped${NC}"
fi
echo

# Verify npm account
echo -e "${YELLOW}Step 6: Verify npm account${NC}"
read -p "Run 'npm whoami'? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  NPM_USER=$(npm whoami 2>/dev/null)
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Not logged in to npm!${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ Logged in as: $NPM_USER${NC}"
else
  echo -e "${YELLOW}⚠️ Verification skipped${NC}"
fi
echo

# Publish
echo -e "${YELLOW}Step 7: Publish to npm${NC}"
echo -e "You are about to publish ${BLUE}$PACKAGE_NAME@$VERSION${NC} to npm."
read -p "Continue with 'npm publish'? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  npm publish
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Publishing failed!${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ Package published successfully!${NC}"
else
  echo -e "${YELLOW}⚠️ Publishing skipped${NC}"
fi
echo

# Final steps
echo -e "${BLUE}================ FINAL STEPS ================${NC}"
echo -e "Don't forget to:"
echo -e "1. Create a Git tag for version $VERSION"
echo -e "2. Update release notes/changelog"
echo -e "3. Update documentation"
echo

echo -e "${GREEN}✅ Publishing process completed!${NC}"
