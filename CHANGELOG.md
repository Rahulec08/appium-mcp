# Changelog

All notable changes to the MCP-Appium Visual package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.8] - 2025-05-27

### Fixed

- **CRITICAL FIX**: Fixed Node.js 18 compatibility issue with `import.meta.resolve` not being available
- Replaced `import.meta.resolve()` with `pathToFileURL()` for broader Node.js version support
- Added robust entry point detection that works across different Node.js versions
- Fixed the remaining Node.js 18 compatibility issues that were causing NPX failures in Claude Desktop

### Changed

- Enhanced entry point detection with fallback for older Node.js versions
- Improved NPX package reliability for Claude Desktop integration

## [1.2.7] - 2025-05-27

### Fixed

- **CRITICAL FIX**: Removed console.error output pollution in stdio mode that was causing JSON parsing errors in Claude Desktop
- Fixed Node.js 18 compatibility by replacing `import ... with { type: "json" }` syntax with fs.readFileSync approach
- Ensured clean JSON-RPC communication without stderr interference when using stdio transport
- MCP server now runs silently in stdio mode, only outputting proper JSON-RPC messages

### Changed

- Enhanced stdio transport to avoid any stderr pollution that could interfere with MCP client communication
- HTTP transport still shows server status messages as they don't interfere with communication
- Improved Claude Desktop integration reliability

## [1.2.6] - 2025-05-27

### Fixed

- Fixed NPX integration to properly handle --appium-url command line argument
- Updated registerMobileTools function to accept configuration parameter
- Fixed npx-entry.ts to parse command line arguments correctly
- Server now properly passes appiumUrl from CLI to Appium tools
- Fixed issue where external Appium servers were not being used when specified via CLI

### Changed

- Enhanced command line argument parsing in NPX entry point
- Improved configuration passing from CLI to MCP tools
- Updated help documentation for NPX usage

## [1.2.5] - 2025-05-27

### Fixed

- Fixed TypeScript import issues in main index.ts file
- Reverted to direct imports instead of barrel exports to ensure runtime compatibility
- Ensured proper binary executable functionality for NPX usage

### Changed

- Improved module import reliability for better IDE support

## [1.2.4] - 2025-05-27

### Fixed

- Fixed NPX binary entry point to properly use index.js for Claude Desktop compatibility
- Added proper shebang (#!/usr/bin/env node) to main entry point
- Corrected package.json bin configuration for seamless npx integration

### Changed

- Updated main binary to point directly to index.js for immediate MCP server startup
- Improved Claude Desktop integration with npx command support

## [1.2.3] - 2025-05-27

### Added

- Enhanced documentation with comprehensive integration guides
- Added INTEGRATION_COMPLETE.md with full setup instructions
- Updated QUICKSTART.md with improved user experience
- Added multiple Claude Desktop configuration examples
- Improved NPM usage guides and troubleshooting documentation

### Fixed

- Updated documentation to reflect current working configuration
- Improved Claude Desktop integration instructions
- Enhanced NPX usage examples

### Changed

- Refined documentation structure for better user onboarding
- Updated configuration examples for various deployment scenarios

## [1.2.2] - 2025-05-27

### Fixed

- Fixed HTTP transport implementation to use correct @modelcontextprotocol/sdk API
- Fixed default command behavior to run only MCP server (not Appium) for Claude Desktop compatibility
- Added command line argument parsing for --transport, --port, --host, --appium-port, and --log-level options
- Fixed Claude Desktop configuration issues by making MCP server run standalone by default

### Added

- New `start-with-appium` command for users who want both Appium and MCP server started together
- Support for HTTP transport with proper environment variable handling
- Enhanced help documentation with all available command line options

### Changed

- Default behavior now runs only the MCP server via STDIO transport (Appium should be started separately)
- Updated README.md with correct configuration examples for Claude Desktop
- Improved command line interface with better help text and option explanations

## [1.2.1] - 2025-05-27

### Fixed

- Resolved CommonJS/ESM compatibility issues
- Fixed Jimp import errors in imageProcessor module
- Fixed circular dependencies between index.ts and server.ts
- Updated package export structure for better module compatibility
- Improved package structure for proper npm distribution

## [1.2.0] - 2023-05-27

### Added

- Visual recovery features using image processing techniques
- Enhanced scrollScreen method using W3C Actions API
- Added fallback to TouchAction API for older Appium versions
- Improved image comparison capabilities

### Fixed

- Resolved TypeScript errors with Jimp imports by creating ESM wrappers
- Fixed coordinate calculation in scrollScreen method
- Improved error handling in image processing operations
- Fixed ESM compatibility issues for npm package distribution

### Changed

- Updated documentation with visual recovery examples
- Improved package.json configuration for better module compatibility
- Added author information in package.json

## [1.1.0] - 2023-04-15

### Added

- Initial implementation of Model Context Protocol server for Appium
- Basic mobile automation tools
- Inspector tools for element locators
- ADB tools for Android device communication

### Fixed

- Initial stabilization fixes
- Package structure for npm distribution

## [1.0.0] - 2023-03-01

### Added

- Initial release with core functionality
