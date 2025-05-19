# Publishing MCP-Appium to NPM

This guide walks you through the process of publishing the MCP-Appium package to the npm registry.

## Pre-publication Checklist

Before publishing, make sure to:

1. Update the version number in `package.json`
2. Ensure all tests pass
3. Validate the package structure
4. Check that all bin files have correct permissions
5. Verify the package works correctly when installed

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
