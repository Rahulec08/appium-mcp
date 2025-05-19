# Troubleshooting MCP-Appium on Other Systems

This guide addresses common issues when installing and running MCP-Appium as an npm package on different systems.

## Installation Issues

### Error: EACCES: permission denied

**Problem:** Permission errors when installing globally.

**Solution:**

```bash
# Option 1: Use sudo (not recommended)
sudo npm install -g mcp-appium-visual

# Option 2: Fix npm permissions (recommended)
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.profile
source ~/.profile
npm install -g mcp-appium-visual
```

### Error: Cannot find module 'mcp-appium'

**Problem:** The package binary isn't available in PATH.

**Solutions:**

1. If installed globally, ensure npm's bin directory is in your PATH
2. If installed locally, use `npx` to execute:
   ```bash
   npx mcp-appium
   ```
3. Try the alternative CommonJS binary:
   ```bash
   npx mcp-appium-cjs
   ```

## Module System Compatibility

### Error: Cannot use import statement outside a module

**Problem:** Trying to use ES modules in a CommonJS environment.

**Solutions:**

1. Use the CommonJS binary:
   ```bash
   npx mcp-appium-cjs
   ```
2. Add `"type": "module"` to your package.json

### Error: [ERR_REQUIRE_ESM]: Must use import to load ES Module

**Problem:** Trying to use `require()` with an ESM module.

**Solutions:**

1. Use dynamic import:
   ```javascript
   (async () => {
     const module = await import("mcp-appium-visual");
     // Use module...
   })();
   ```
2. Use the CommonJS entry point:
   ```javascript
   const mcpAppium = require("mcp-appium-visual");
   ```

## TypeScript Issues

### Error: Cannot find module or its corresponding type declarations

**Problem:** TypeScript can't find the type definitions.

**Solutions:**

1. Make sure you've installed the package correctly
2. Update your tsconfig.json:
   ```json
   {
     "compilerOptions": {
       "moduleResolution": "NodeNext",
       "esModuleInterop": true,
       "resolveJsonModule": true
     }
   }
   ```
3. Try using path mapping in tsconfig.json:
   ```json
   {
     "compilerOptions": {
       "paths": {
         "mcp-appium-visual": ["./node_modules/mcp-appium-visual/dist"]
       }
     }
   }
   ```

## Runtime Issues

### Error: Cannot find module './npx-entry.js'

**Problem:** The internal structure of the package is incorrect.

**Solutions:**

1. Reinstall the package
2. Use the test script to validate the installation:
   ```bash
   ./test-all-environments.sh
   ```

### Error: spawn ENOENT

**Problem:** Node.js cannot find the Appium executable.

**Solutions:**

1. Make sure Appium is installed:
   ```bash
   npm install -g appium
   ```
2. Make sure appium is in your PATH
3. Specify the full path to appium in your configuration:
   ```javascript
   const config = {
     appiumBinaryPath: "/path/to/appium",
   };
   ```

## Operating System-Specific Issues

### Windows

**Issues:**

1. Path separators (use `path.join` instead of hardcoded '/')
2. Line endings (CRLF vs LF)

**Solutions:**

1. Use the npm package `cross-env` for environment variables
2. Use `process.platform` to check the OS:
   ```javascript
   const isWin = process.platform === "win32";
   const appiumCmd = isWin ? "appium.cmd" : "appium";
   ```

### macOS

**Issues:**

1. Permission issues with globally installed binaries
2. M1/M2 compatibility with native dependencies

**Solutions:**

1. Use Homebrew to install prerequisites
2. Consider using node version manager (nvm) for M1/M2 compatibility

### Linux

**Issues:**

1. Missing dependencies for Appium
2. Android SDK path issues

**Solutions:**

1. Install required dependencies:
   ```bash
   sudo apt-get install -y openjdk-11-jdk android-tools-adb
   ```
2. Set ANDROID_HOME environment variable:
   ```bash
   export ANDROID_HOME=/path/to/android-sdk
   ```

## Testing Your Installation

Use our comprehensive test script to verify your installation is working correctly:

```bash
# Test a local tarball
./test-all-environments.sh ./mcp-appium-visual-1.1.0.tgz

# Test installed package
./test-all-environments.sh
```

If all tests run successfully, your MCP-Appium installation is working correctly across all supported module systems!
