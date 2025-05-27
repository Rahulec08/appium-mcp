/**
 * ES Module compatible wrapper for Jimp
 * This file provides a clean way to import and use Jimp in an ES module environment
 */

// Import Jimp using a dynamic import for ES module compatibility
async function getJimpModule() {
  try {
    const jimpModule = await import("jimp");
    return jimpModule.default || jimpModule;
  } catch (err) {
    console.error("Error importing Jimp:", err);
    throw err;
  }
}

// Create a cached instance of the Jimp module
let cachedJimpModule = null;
let cachedJimp = null;

/**
 * Get the Jimp module - caches the result after first call
 * @returns The Jimp module with all utility functions
 */
export async function getJimp() {
  if (!cachedJimpModule) {
    cachedJimpModule = await getJimpModule();
    cachedJimp = cachedJimpModule.Jimp || cachedJimpModule;
  }
  return {
    module: cachedJimpModule,
    Jimp: cachedJimp,
    intToRGBA: cachedJimpModule.intToRGBA,
    rgbaToInt: cachedJimpModule.rgbaToInt,
    colorDiff: cachedJimpModule.colorDiff,
    limit255: cachedJimpModule.limit255,
  };
}

/**
 * Helper function to read an image file
 * @param path Path to the image file
 * @returns Promise that resolves to a Jimp image
 */
export async function readImage(path) {
  const { Jimp } = await getJimp();
  return Jimp.read(path);
}

/**
 * Helper function to convert integer color to RGBA
 * @param colorInt Integer representation of color
 * @returns RGBA object
 */
export async function intToRGBA(colorInt) {
  const { module } = await getJimp();
  return module.intToRGBA(colorInt);
}

export default {
  getJimp,
  readImage,
  intToRGBA,
};
