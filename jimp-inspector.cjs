// Simple CommonJS test for Jimp
const Jimp = require("jimp");

// Test if Jimp has read method and how to access it
console.log("Jimp constructor type:", typeof Jimp);
console.log("Jimp.read exists:", typeof Jimp.read === "function");
console.log("Jimp.intToRGBA exists:", typeof Jimp.intToRGBA === "function");

async function testJimp() {
  try {
    // Test reading an image using Jimp.read
    const image = await Jimp.read(
      "test-screenshots/about_phone_2025-05-12T07-58-15-397Z.png"
    );
    console.log(
      "Image loaded with dimensions:",
      image.getWidth(),
      "x",
      image.getHeight()
    );

    // Test color conversion
    const pixel = image.getPixelColor(0, 0);
    const rgba = Jimp.intToRGBA(pixel);
    console.log("First pixel RGBA:", rgba);

    return true;
  } catch (error) {
    console.error("Error testing Jimp:", error);
    return false;
  }
}

testJimp().then((success) => {
  if (success) {
    console.log("✅ Jimp test successful");
  } else {
    console.log("❌ Jimp test failed");
  }
});
