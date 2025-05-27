/**
 * This file provides a dynamic loader for Jimp that works in both ESM and CommonJS environments
 */

// We'll use dynamic import to load Jimp
const loadJimp = async () => {
  try {
    // Try to load Jimp using ESM import
    const jimp = await import("jimp");
    return jimp.default || jimp;
  } catch (e) {
    // If that fails, try CommonJS require (this won't be used in ESM context)
    try {
      // @ts-ignore
      return require("jimp");
    } catch (e2) {
      throw new Error(`Failed to load Jimp: ${e2.message}`);
    }
  }
};

export { loadJimp };
