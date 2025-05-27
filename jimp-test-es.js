// Test how Jimp should be correctly imported and used with Node16 module resolution
import Jimp from "jimp/es";

async function testJimp() {
  try {
    console.log("Testing Jimp import...");
    console.log("Jimp type:", typeof Jimp);
    console.log("Jimp constructor:", Jimp);

    if (typeof Jimp === "function") {
      console.log("✅ Jimp is imported as a function!");

      // Test creating an image
      const image = await Jimp.create(100, 100, 0xffffffff);
      console.log("✅ Created a new image");

      // Test reading an image
      console.log("Testing image reading...");
      // Try using Jimp as a function (constructor/factory pattern)
      const image2 = await new Jimp(
        "./test-screenshots/about_phone_2025-05-12T07-58-15-397Z.png"
      );
      console.log("✅ Read image using new Jimp()");
    } else {
      console.log("❌ Jimp is not imported as a function");
    }
  } catch (error) {
    console.error("Error testing Jimp:", error);
  }
}

testJimp().catch(console.error);
