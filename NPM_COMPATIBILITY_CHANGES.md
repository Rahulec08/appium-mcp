# NPM Package Compatibility Improvements

This document outlines the enhancements made to improve the compatibility of the MCP-Appium package when installed via npm.

## 1. Module System Support

### ESM Support (Default)

- Main entry point: `dist/index.js`
- Used with: `import { ... } from 'mcp-appium-visual'`
- TypeScript declaration files included

### CommonJS Support

- CJS entry point: `dist/index.cjs`
- Used with: `const { ... } = require('mcp-appium-visual')`
- Compatible with older Node.js versions and projects

## 2. Executable Binaries

Binary commands made available via npm:

- `mcp-appium` - Main MCP server entry point (ESM)
- `mcp-appium-cjs` - CommonJS compatible entry point
- `mcp-appium-visual` - Original command
- `mcp-appium-visual-server` - Server launcher
- `mcp-appium-visual-cli` - CLI tool

All binary files have executable permissions ensured via the `set-permissions` script.

## 3. Package.json Configuration

- `"type": "module"` - Indicates this is an ES module package
- `"exports"` field - Provides conditional exports for different module systems
- `"bin"` field - Registers all executables
- `"files"` field - Includes all necessary files in the published package

## 4. Documentation

Created several helpful guides:

- `NPM_PACKAGE_TROUBLESHOOTING.md` - Troubleshooting common issues
- `PUBLISHING_GUIDE.md` - How to publish the package to npm
- `CROSS_PLATFORM_TROUBLESHOOTING.md` - Platform-specific compatibility issues

## 5. Testing Scripts

Created testing scripts to ensure package works in different environments:

- `test-all-environments.sh` - Tests ESM, CommonJS, and TypeScript compatibility
- `validate-package.sh` - Validates package contents before publishing
- `check-permissions.sh` - Verifies executable permissions on bin files
- `publish-checklist.sh` - Interactive publishing workflow

## 6. Build Process Improvements

- Automatic copying of CommonJS files during build
- Setting of executable permissions as part of prepare and build
- Source maps and declaration files generation for better debugging

## 7. Cross-Platform Compatibility

- Support for Windows, macOS, and Linux environments
- Path normalization for cross-platform compatibility
- CommonJS fallbacks for environments without ESM support
