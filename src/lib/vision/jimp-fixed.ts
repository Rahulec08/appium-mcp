/**
 * This file fixes the Jimp import and usage based on the module's structure
 */
// We need to use the require approach to get all the properties correctly
// TypeScript doesn't recognize the nested structure properly with ES imports
const JimpOriginal = require("jimp");

// Define module type to avoid TypeScript errors
interface JimpModule {
  Jimp: any;
  intToRGBA: (color: number) => { r: number; g: number; b: number; a: number };
  rgbaToInt: (r: number, g: number, b: number, a: number) => number;
  colorDiff: (color1: any, color2: any) => number;
  limit255: (n: number) => number;
  [key: string]: any;
}

// Cast the module with our interface
const JimpTyped = JimpOriginal as JimpModule;

// Access module functions directly and Jimp class
export const JimpModule = JimpTyped;

// Export the Jimp class for read operations
export const Jimp = JimpTyped.Jimp;

// Export the utility functions directly for easier access
export const intToRGBA = JimpTyped.intToRGBA;
export const rgbaToInt = JimpTyped.rgbaToInt;
export const colorDiff = JimpTyped.colorDiff;
export const limit255 = JimpTyped.limit255;
