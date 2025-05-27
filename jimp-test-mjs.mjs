// Test file to see how Jimp works
import Jimp from "jimp";

async function testJimp() {
  try {
    // Create a new image
    const image = new Jimp(100, 100, 0xffffffff);
    console.log("Created a new image");

    // Try to load an existing image
    try {
      const image2 = await Jimp.read(
        "./test-screenshots/about_phone_2025-05-12T07-58-15-397Z.png"
      );
      console.log("Loaded image using Jimp.read()");
    } catch (err) {
      console.error("Error loading image with Jimp.read():", err);
    }
  } catch (err) {
    console.error("Error testing Jimp:", err);
  }
}

testJimp();
