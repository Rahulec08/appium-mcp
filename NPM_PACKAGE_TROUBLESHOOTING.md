# MCP-Appium NPM Package Troubleshooting Guide

This guide helps you troubleshoot issues when installing and using the MCP-Appium package from NPM on other systems.

## Common Issues and Solutions

### Issue: Package Not Found

**Problem:** When running `npx mcp-appium`, the system cannot find the package.

**Solutions:**

1. Ensure the package is installed globally or locally:

   ```bash
   npm install -g mcp-appium-visual   # Global installation
   # OR
   npm install mcp-appium-visual      # Local installation
   ```

2. Check that `mcp-appium` is properly set up as a binary in the package.json:

   ```json
   "bin": {
     "mcp-appium": "./dist/npx-entry.js"
   }
   ```

3. Verify the binary file has proper execution permissions:
   ```bash
   chmod +x ./dist/npx-entry.js
   ```

### Issue: ESM/CommonJS Compatibility

**Problem:** Error "Cannot use import statement outside a module" or similar module-related errors.

**Solutions:**

1. Ensure your package.json has the correct type setting:

   ```json
   "type": "module"
   ```

2. For CommonJS projects, create a `.cjs` version of your entry points.

3. Use the provided CommonJS test file (`npm-compatible-test.cjs`) to validate functionality.

### Issue: TypeScript Integration

**Problem:** Errors when trying to use the package with TypeScript.

**Solutions:**

1. Make sure declaration files are generated during build:

   ```json
   "compilerOptions": {
     "declaration": true
   }
   ```

2. Add typings field to package.json:

   ```json
   "types": "./dist/index.d.ts"
   ```

3. Ensure TypeScript source files are included in published package (for source maps):
   ```json
   "files": [
     "dist",
     "src"
   ]
   ```

### Issue: Missing Dependencies

**Problem:** Runtime errors indicating missing dependencies.

**Solution:**

1. Move dependencies from devDependencies to dependencies in package.json
2. Verify peer dependencies are properly declared
3. Use the `--no-peer` flag if needed during installation:
   ```bash
   npm install --no-peer mcp-appium-visual
   ```

## Testing Your Installation

Use the provided test files to verify your installation works correctly:

1. ESM test (Node.js with ES modules):

   ```bash
   node examples/config-test.js
   ```

2. CommonJS test (maximum compatibility):
   ```bash
   node examples/npm-compatible-test.cjs
   ```

If both tests run successfully, your MCP-Appium installation is working correctly!

## Publishing Checklist

Before publishing a new version:

1. Test with `npm pack` to verify the package contents
2. Run `npm install ./mcp-appium-visual-1.1.0.tgz` to test local installation
3. Verify bin scripts are executable
4. Test both ESM and CommonJS compatibility
5. Ensure all required files are included in the package
