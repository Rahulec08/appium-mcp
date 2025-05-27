/**
 * This is a wrapper for Jimp that properly exposes the module's structure
 * in a way that works with ES modules.
 */

// Import Jimp in a dynamic way
import JimpDefault from "jimp";

// Re-export the nested Jimp object for consistency
export const Jimp = JimpDefault.Jimp || JimpDefault;

// Export the utility functions directly
export const intToRGBA = JimpDefault.intToRGBA;
export const rgbaToInt = JimpDefault.rgbaToInt;
export const colorDiff = JimpDefault.colorDiff;
export const limit255 = JimpDefault.limit255;

// Export the module itself
export default JimpDefault;
