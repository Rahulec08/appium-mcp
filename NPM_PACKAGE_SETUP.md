# MCP-Appium NPM Package Setup Guide

This guide will help you set up and publish the MCP-Appium server as an NPM package, making it easy for others to install and use.

## 1. Preparing the Package

### Update package.json

First, ensure your `package.json` file is properly configured for npm publishing:

```json
{
  "name": "mcp-appium",
  "version": "1.0.0",
  "description": "Model Context Protocol (MCP) server for mobile automation using Appium",
  "main": "dist-temp/src/index.js",
  "types": "dist-temp/src/index.d.ts",
  "type": "module",
  "bin": {
    "mcp-appium": "./dist-temp/src/cli.js"
  },
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "npm run build",
    "start": "node dist-temp/src/index.js",
    "test": "node test-scripts/test-all-visual-components.sh"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/username/mcp-appium.git"
  },
  "keywords": [
    "MCP",
    "Appium",
    "Mobile",
    "Automation",
    "Testing",
    "Model Context Protocol"
  ],
  "author": "Your Name",
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/username/mcp-appium/issues"
  },
  "homepage": "https://github.com/username/mcp-appium#readme",
  "engines": {
    "node": ">=16.0.0"
  }
}
```

### Update CLI Entry Point

Ensure your CLI entry point file (`src/cli.ts`) has the proper shebang line at the top:

```typescript
#!/usr/bin/env node
// CLI implementation code...
```

### Create .npmignore File

Create an `.npmignore` file to exclude files that shouldn't be published:

```
# Source files (already compiled in dist)
src/
tests/
examples/

# Development configuration
.github/
.vscode/
.editorconfig
.gitignore
.eslintrc
.prettier*
tsconfig.json

# Build artifacts
coverage/
test-output/
test-scripts/
test-screenshots/

# Specific files
*.log
*.md
!README.md
!USAGE_GUIDE.md
!LICENSE
*.sample.*
```

## 2. Building and Publishing

### Build the Package

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

### Test the Package Locally

Before publishing, test the package locally:

```bash
# Create a global symlink
npm link

# Test the CLI
mcp-appium --version
```

### Publish to NPM

Once everything is working correctly, publish to NPM:

```bash
# Login to NPM (if not already logged in)
npm login

# Publish the package
npm publish
```

For scoped packages (e.g., @yourorganization/mcp-appium):

```bash
npm publish --access public
```

## 3. Creating Releases

### Versioning

Follow semantic versioning (SemVer) for your releases:

- **Major version (x.0.0)**: Incompatible API changes
- **Minor version (0.x.0)**: Added functionality in a backward-compatible manner
- **Patch version (0.0.x)**: Backward-compatible bug fixes

Update the version in package.json:

```bash
# Update version
npm version patch  # or minor, or major
```

### GitHub Releases

1. Create a tag matching your version
2. Push the tag to GitHub
3. Create a release on GitHub with release notes

## 4. CI/CD Integration

Consider setting up CI/CD pipelines for automated testing and deployment:

1. Add GitHub Actions workflow for testing on pull requests
2. Add automated publishing workflow for new version tags

Example GitHub Actions workflow:

```yaml
name: Test and Publish

on:
  push:
    tags:
      - "v*"

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "16"
      - run: npm ci
      - run: npm test

  publish:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "16"
          registry-url: "https://registry.npmjs.org"
      - run: npm ci
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## 5. Documentation

Ensure comprehensive documentation is available:

1. **README.md**: Overview, quick start guide
2. **USAGE_GUIDE.md**: Detailed usage instructions
3. **API.md**: API documentation
4. **CONTRIBUTING.md**: Guidelines for contributors

## 6. Support and Maintenance

Set up proper support channels:

1. Issue templates on GitHub
2. Clearly defined support policy
3. Response timeframes for issues and pull requests
