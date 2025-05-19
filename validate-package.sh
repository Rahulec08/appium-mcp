#!/bin/bash

# Pre-publish validation script for MCP-Appium
# This script verifies the package is ready for publishing

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Validating package for publishing...${NC}\n"

# Check package.json
echo -e "${YELLOW}Checking package.json...${NC}"
if ! jq . package.json > /dev/null 2>&1; then
  echo -e "${RED}❌ package.json is not valid JSON${NC}"
  exit 1
fi
echo -e "${GREEN}✓ package.json is valid${NC}"

# Check required fields
echo -e "${YELLOW}Checking required fields...${NC}"
MISSING_FIELDS=()

# Required fields
REQUIRED_FIELDS=("name" "version" "description" "main" "type")

for field in "${REQUIRED_FIELDS[@]}"; do
  if ! jq -e ".$field" package.json > /dev/null 2>&1; then
    MISSING_FIELDS+=("$field")
  fi
done

if [ ${#MISSING_FIELDS[@]} -gt 0 ]; then
  echo -e "${RED}❌ Missing required fields in package.json: ${MISSING_FIELDS[*]}${NC}"
  exit 1
fi
echo -e "${GREEN}✓ All required fields present${NC}"

# Check bin entries
echo -e "${YELLOW}Checking bin entries...${NC}"
if ! jq -e ".bin[\"mcp-appium\"]" package.json > /dev/null 2>&1; then
  echo -e "${RED}❌ Missing bin entry for mcp-appium${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Bin entries are valid${NC}"

# Verify build
echo -e "\n${YELLOW}Building package...${NC}"
npm run clean > /dev/null 2>&1
npm run build > /dev/null 2>&1

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Build failed${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Build successful${NC}"

# Verify bin files are executable
echo -e "\n${YELLOW}Checking executable permissions...${NC}"
BIN_FILES=($(jq -r '.bin | to_entries | .[] | .value' package.json | sed 's/^\.\///' ))

for bin_file in "${BIN_FILES[@]}"; do
  if [ ! -x "$bin_file" ]; then
    echo -e "${RED}❌ $bin_file is not executable${NC}"
    exit 1
  fi
done
echo -e "${GREEN}✓ All bin files are executable${NC}"

# Create npm pack
echo -e "\n${YELLOW}Creating npm package...${NC}"
npm pack > /dev/null

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Failed to create package${NC}"
  exit 1
fi

PACKAGE_FILE=$(ls mcp-appium-visual*.tgz 2>/dev/null | sort -V | tail -n1)
echo -e "${GREEN}✓ Package created: $PACKAGE_FILE${NC}"

# Verify package contents
echo -e "\n${YELLOW}Verifying package contents...${NC}"
MISSING_FILES=()

# Extract and check essential files
mkdir -p .tmp-package-test
tar -xzf "$PACKAGE_FILE" -C .tmp-package-test

ESSENTIAL_FILES=(
  "package.json"
  "dist/npx-entry.js"
  "dist/npx-entry.cjs"
  "dist/index.js"
  "dist/index.cjs"
)

for file in "${ESSENTIAL_FILES[@]}"; do
  if [ ! -f ".tmp-package-test/package/$file" ]; then
    MISSING_FILES+=("$file")
  fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
  echo -e "${RED}❌ Missing essential files in package: ${MISSING_FILES[*]}${NC}"
  rm -rf .tmp-package-test
  exit 1
fi
echo -e "${GREEN}✓ All essential files present${NC}"

# Clean up
rm -rf .tmp-package-test

# Run the environment tests
echo -e "\n${YELLOW}Running environment tests with the package...${NC}"
echo -e "${YELLOW}(This will be skipped - run manually after validation)${NC}"
# Uncomment to run tests automatically
# ./test-all-environments.sh "./$PACKAGE_FILE"

echo -e "\n${GREEN}✅ Package validation complete!${NC}"
echo -e "${YELLOW}Your package is ready for publishing. Run the following commands to publish:${NC}"
echo -e "npm run prepublishOnly"
echo -e "npm publish"
echo 
echo -e "${YELLOW}For final verification, run:${NC}"
echo -e "./test-all-environments.sh \"./$PACKAGE_FILE\""
