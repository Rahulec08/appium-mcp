/**
 * CommonJS compatible Jimp wrapper
 */
const Jimp = require("jimp");

module.exports = {
  Jimp: Jimp.Jimp || Jimp,
  intToRGBA: Jimp.intToRGBA,
  rgbaToInt: Jimp.rgbaToInt,
  colorDiff: Jimp.colorDiff,
  limit255: Jimp.limit255,
};
