/**
 * Test script to verify Jimp ESM imports
 */

// Try different import approaches
console.log("Testing Jimp import methods...");

// Immediately log something to check if the script is running
console.log("Script is running...");

// Import 1: Direct from Jimp
import("jimp")
  .then((jimpModule) => {
    console.log("Direct Jimp import structure:", Object.keys(jimpModule));
    console.log("Has default export:", !!jimpModule.default);
    console.log("Has Jimp property:", !!jimpModule.Jimp);
    console.log("Has intToRGBA:", !!jimpModule.intToRGBA);

    // Try to access the Jimp class
    if (jimpModule.Jimp) {
      console.log("Jimp class found at jimpModule.Jimp");
    } else if (jimpModule.default && jimpModule.default.Jimp) {
      console.log("Jimp class found at jimpModule.default.Jimp");
    } else if (typeof jimpModule.default === "function") {
      console.log("jimpModule.default is a function");
    } else {
      console.log("Could not locate Jimp class");
    }

    // Now try our wrapper
    return import("./src/lib/vision/jimp-esm.js");
  })
  .then((wrapper) => {
    console.log("\nJimp wrapper import structure:", Object.keys(wrapper));
    console.log("Has Jimp export:", !!wrapper.Jimp);
    console.log("Has intToRGBA:", !!wrapper.intToRGBA);
    console.log("Has default export:", !!wrapper.default);
  })
  .catch((err) => {
    console.error("\nError in import chain:", err);
  })
  .finally(() => {
    console.log("\nTest complete.");
  });
