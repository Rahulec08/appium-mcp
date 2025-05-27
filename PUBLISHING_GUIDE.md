# Publishing MCP-Appium to NPM

This guide walks you through the process of publishing the MCP-Appium package to the npm registry.

## Pre-publication Checklist

Before publishing, make sure to:

1. Update the version number in `package.json`
2. Ensure all tests pass
3. Validate the package structure
4. Check that all bin files have correct permissions
5. Verify the package works correctly when installed
6. Check that the Jimp ESM imports are working correctly

## Important Module Compatibility Notes

### Jimp Module Fix

The package uses Jimp for image processing, which requires special handling for proper TypeScript and ESM compatibility:

1. We've created wrapper modules in `/src/lib/vision/`:

   - `jimp-esm.js` - ES module wrapper
   - `jimp-fixed.ts` - TypeScript wrapper

2. All imports of Jimp should use these wrappers instead of importing directly:

```typescript
// CORRECT - Use the wrapper
import { Jimp, intToRGBA } from "./jimp-esm.js";

// INCORRECT - Direct import may cause TypeScript errors
import * as Jimp from "jimp";
```

3. When making changes to image processing code, always verify that:
   - TypeScript compilation succeeds
   - Both ESM and CommonJS usage work
   - The image processing functions work correctly at runtime

## Step 1: Validate the Package

Run the validation script to check if the package is ready for publication:

```bash
# Clean and rebuild the package
npm run clean && npm run build

# Set permissions for all binary files
npm run set-permissions

# Create a test package
npm pack
```

This creates a file named `mcp-appium-visual-[version].tgz` that you can test locally.

## Step 2: Test the Package Locally

Test the package locally to make sure it works as expected:

```bash
# Test CommonJS and ESM compatibility
./test-all-environments.sh ./mcp-appium-visual-[version].tgz
```

## Step 3: Log in to npm Registry

If you haven't already logged in to npm, do so now:

```bash
npm login
```

You'll be prompted for your username, password, and email address.

## Step 4: Publish the Package

Once everything is validated, publish the package:

```bash
# For a normal release
npm publish

# For a beta/pre-release version
npm publish --tag beta

# For a public scoped package
npm publish --access public
```

## Step 5: Verify the Publication

After publishing, verify that the package is available on npm:

```bash
# Check if the package is published
npm view mcp-appium-visual

# Install the package from npm to test it
npx mcp-appium-visual
```

## Version Management

Follow semantic versioning (semver) principles:

- `MAJOR` version for incompatible API changes
- `MINOR` version for added functionality in a backwards compatible manner
- `PATCH` version for backwards compatible bug fixes

To update the version:

```bash
# Increment patch version (1.0.0 -> 1.0.1)
npm version patch

# Increment minor version (1.0.0 -> 1.1.0)
npm version minor

# Increment major version (1.0.0 -> 2.0.0)
npm version major
```

## Unpublishing (if necessary)

If you need to unpublish a package (only possible within 72 hours):

```bash
# Unpublish a specific version
npm unpublish mcp-appium-visual@1.0.0

# Unpublish the entire package (use with caution)
npm unpublish mcp-appium-visual --force
```

## Maintainance

After publishing, remember to:

1. Create a Git tag for the release
2. Update the release notes/changelog
3. Update any documentation that references the package version

## Visual Recovery Features

The MCP-Appium Visual package includes enhanced visual features that should be tested before publishing:

### Key Visual Features

1. **Image Processing**:

   - Template matching (finding smaller images within larger ones)
   - OCR (text recognition)
   - Image comparison
   - UI element detection

2. **Enhanced Scrolling**:
   - W3C Actions API support
   - Fallback to TouchActions for older Appium versions
   - Directional scrolling with adjustable distance

### Testing Visual Features

Before publishing, test the visual features using the provided examples:

```bash
# Test visual recovery features
npx ts-node examples/visual-recovery-test.ts

# Test image processing
npx ts-node examples/visual-processing-test.ts

# Test the MCP visual recovery integration
npx ts-node examples/mcp-visual-recovery-test.ts
```

### Platform Compatibility

Visual features should work across platforms:

1. **Android**:

   - Test on both emulators and physical devices
   - Test with different Android versions (especially 10+)
   - Verify both UiAutomator2 and Espresso drivers

2. **iOS**:
   - Test on both simulators and physical devices
   - Test with different iOS versions
   - Verify XCUITest driver compatibility

### Common Issues to Watch For

1. **Jimp Import Issues**:

   - ESM vs CommonJS incompatibilities
   - TypeScript definition problems
   - Runtime "Jimp.Jimp is not a constructor" errors

2. **Scrolling Problems**:

   - Different behavior between Android and iOS
   - W3C Actions API inconsistencies
   - Coordinate calculation issues

3. **Image Processing Errors**:
   - Tesseract.js integration issues
   - Memory usage with large images
   - Temporary file handling
