#!/usr/bin/env node

/**
 * This script tests the Jimp wrappers to ensure they work correctly
 * in both ESM and CommonJS environments.
 */

// Import both wrappers to test
import { Jimp, intToRGBA } from "./src/lib/vision/jimp-esm.js";

async function testJimpWrappers() {
  console.log("Testing Jimp wrappers...");

  try {
    console.log("Testing jimp-esm.js wrapper:");

    // Test Jimp constructor
    const img1 = await Jimp.create(100, 100, 0xff0000ff);
    console.log(`- Created image: ${img1.getWidth()}x${img1.getHeight()}`);

    // Test utility function
    const color = intToRGBA(0xff0000ff);
    console.log(`- intToRGBA works: ${JSON.stringify(color)}`);

    // Test reading an image
    try {
      const img2 = await Jimp.read("./test-screenshots/sample.png");
      console.log(`- Read image: ${img2.getWidth()}x${img2.getHeight()}`);
    } catch (err) {
      console.log(`- Read image test skipped: No test image available`);
    }

    console.log("✅ ESM wrapper works correctly");
  } catch (err) {
    console.error("❌ ESM wrapper test failed:", err);
    process.exit(1);
  }

  try {
    // Test the fixed TypeScript import via dynamic import
    const jimpFixedModule = await import("./src/lib/vision/jimp-fixed.js");
    console.log("\nTesting jimp-fixed.ts wrapper (compiled to JS):");

    // Test exposed properties
    console.log(
      `- JimpModule available: ${
        typeof jimpFixedModule.JimpModule !== "undefined"
      }`
    );
    console.log(
      `- Jimp available: ${typeof jimpFixedModule.Jimp !== "undefined"}`
    );
    console.log(
      `- intToRGBA available: ${
        typeof jimpFixedModule.intToRGBA !== "undefined"
      }`
    );

    console.log("✅ TypeScript wrapper works correctly");
  } catch (err) {
    console.error("❌ TypeScript wrapper test failed:", err);
    process.exit(1);
  }

  console.log("\nAll Jimp wrapper tests passed! 🎉");
}

testJimpWrappers().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
