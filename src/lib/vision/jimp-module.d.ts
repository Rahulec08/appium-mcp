/**
 * Type declarations for the Jimp module wrapper
 */

// Define the basic shape of the Jimp object
interface JimpObject {
  read: (path: string) => Promise<JimpImage>;
  // Add other methods as needed
}

// Define the shape of a Jimp image instance
interface JimpImage {
  getWidth: () => number;
  getHeight: () => number;
  getPixelColor: (x: number, y: number) => number;
  // Add other methods as needed
}

// Define the color type returned by intToRGBA
interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

// Declare the exports
export const Jimp: JimpObject;
export function intToRGBA(colorInt: number): RGBA;
export function rgbaToInt(r: number, g: number, b: number, a: number): number;
export function colorDiff(color1: RGBA, color2: RGBA): number;
export function limit255(n: number): number;

// Default export
declare const JimpDefault: {
  Jimp: JimpObject;
  intToRGBA: typeof intToRGBA;
  rgbaToInt: typeof rgbaToInt;
  colorDiff: typeof colorDiff;
  limit255: typeof limit255;
  // Add other exported properties as needed
};

export default JimpDefault;
