"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.limit255 = exports.colorDiff = exports.rgbaToInt = exports.intToRGBA = exports.Jimp = exports.JimpModule = void 0;
/**
 * This file fixes the Jimp import and usage based on the module's structure
 */
// We need to use the require approach to get all the properties correctly
// TypeScript doesn't recognize the nested structure properly with ES imports
var JimpOriginal = require("jimp");
// Cast the module with our interface
var JimpTyped = JimpOriginal;
// Access module functions directly and Jimp class
exports.JimpModule = JimpTyped;
// Export the Jimp class for read operations
exports.Jimp = JimpTyped.Jimp;
// Export the utility functions directly for easier access
exports.intToRGBA = JimpTyped.intToRGBA;
exports.rgbaToInt = JimpTyped.rgbaToInt;
exports.colorDiff = JimpTyped.colorDiff;
exports.limit255 = JimpTyped.limit255;
