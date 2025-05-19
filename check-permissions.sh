#!/bin/bash

# Check if all bin files have executable permissions

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Get bin entries from package.json
BIN_FILES=( $(jq -r '.bin | to_entries | .[] | .value' package.json | sed 's/^\.\///') )

echo "Checking executable permissions..."
ALL_GOOD=true

for bin_file in "${BIN_FILES[@]}"; do
  if [ ! -x "$bin_file" ]; then
    echo -e "${RED}❌ $bin_file is not executable${NC}"
    ALL_GOOD=false
  else
    echo -e "${GREEN}✓ $bin_file is executable${NC}"
  fi
done

if [ "$ALL_GOOD" = true ]; then
  echo -e "\n${GREEN}✅ All binary files have correct permissions${NC}"
else
  echo -e "\n${RED}❌ Some binary files are missing executable permissions${NC}"
  exit 1
fi
