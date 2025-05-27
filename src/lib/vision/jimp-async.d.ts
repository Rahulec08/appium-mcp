/**
 * Type definitions for the async Jimp wrapper
 */

// Define the shape of a Jimp module
export interface JimpModule {
  Jimp: any;
  intToRGBA: (colorInt: number) => RGBA;
  rgbaToInt: (r: number, g: number, b: number, a: number) => number;
  colorDiff: (color1: RGBA, color2: RGBA) => number;
  limit255: (n: number) => number;
}

// Define the shape of a Jimp instance
export interface JimpImage {
  getWidth: () => number;
  getHeight: () => number;
  getPixelColor: (x: number, y: number) => number;
  // Add other methods as needed
}

// Define the shape of an RGBA color
export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

// Define the shape of the getJimp result
export interface JimpWrapper {
  module: JimpModule;
  Jimp: any;
  intToRGBA: (colorInt: number) => RGBA;
  rgbaToInt: (r: number, g: number, b: number, a: number) => number;
  colorDiff: (color1: RGBA, color2: RGBA) => number;
  limit255: (n: number) => number;
}

// Function definitions
export function getJimp(): Promise<JimpWrapper>;
export function readImage(path: string): Promise<JimpImage>;
export function intToRGBA(colorInt: number): Promise<RGBA>;

// Default export
declare const _default: {
  getJimp: typeof getJimp;
  readImage: typeof readImage;
  intToRGBA: typeof intToRGBA;
};

export default _default;
