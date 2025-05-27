// Different Jimp import approaches to test
import * as fs from "fs/promises";
import path from "path";

// Testing different import styles
async function testJimpImports() {
  try {
    console.log("Testing Jimp imports...");

    // Method 1: Standard import (ES Module style)
    const Jimp1 = await import("jimp");
    console.log("Method 1 (import() - dynamic): ", typeof Jimp1.default);

    try {
      // Test basic functionality
      const image1 = await Jimp1.default.create(100, 100, 0xff0000ff);
      console.log(
        "Method 1 - Created image:",
        image1.getWidth(),
        "x",
        image1.getHeight()
      );
    } catch (e) {
      console.error("Method 1 error:", e);
    }

    // Method 2: Legacy import
    try {
      const Jimp2 = await import("jimp/legacy");
      console.log("Method 2 (jimp/legacy - dynamic): ", typeof Jimp2.default);

      // Test basic functionality
      const image2 = await Jimp2.default.create(100, 100, 0xff0000ff);
      console.log(
        "Method 2 - Created image:",
        image2.getWidth(),
        "x",
        image2.getHeight()
      );
    } catch (e) {
      console.error("Method 2 error:", e);
    }

    // Method 3: CommonJS require
    try {
      const Jimp3 = require("jimp");
      console.log("Method 3 (require): ", typeof Jimp3);

      // Test basic functionality
      const image3 = await Jimp3.create(100, 100, 0xff0000ff);
      console.log(
        "Method 3 - Created image:",
        image3.getWidth(),
        "x",
        image3.getHeight()
      );
    } catch (e) {
      console.error("Method 3 error:", e);
    }
  } catch (e) {
    console.error("Error during import tests:", e);
  }
}

testJimpImports().catch(console.error);
