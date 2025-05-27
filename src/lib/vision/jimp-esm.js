/**
 * This file provides ESM compatibility for Jimp
 * Using direct named imports from the Jimp module
 */
import { Jimp, intToRGBA, rgbaToInt, colorDiff, limit255 } from "jimp";

// Export named exports
export { Jimp, intToRGBA, rgbaToInt, colorDiff, limit255 };

// Export as default for compatibility
export default Jimp;
