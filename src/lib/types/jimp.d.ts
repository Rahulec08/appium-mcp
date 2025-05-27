/**
 * Type definitions for the Jimp wrapper
 */

// Define color type
export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

// Define a basic JimpImage interface
export interface JimpImage {
  getWidth(): number;
  getHeight(): number;
  getPixelColor(x: number, y: number): number;
}

// Define the Jimp constructor
export interface JimpConstructor {
  read(path: string): Promise<JimpImage>;
}

// Export the module structure
export const Jimp: JimpConstructor;
export function intToRGBA(color: number): RGBA;
export function rgbaToInt(r: number, g: number, b: number, a: number): number;
export function colorDiff(color1: RGBA, color2: RGBA): number;
export function limit255(n: number): number;
