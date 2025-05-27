const Jimp = require("jimp");
console.log("Jimp type:", typeof Jimp);
console.log("Jimp keys:", Object.keys(Jimp));

// Check if it has a read method directly
console.log("Direct read method:", typeof Jimp.read);

// Check if it has utility functions directly on the module
console.log("intToRGBA exists:", typeof Jimp.intToRGBA);
console.log("rgbaToInt exists:", typeof Jimp.rgbaToInt);
console.log("colorDiff exists:", typeof Jimp.colorDiff);
console.log("limit255 exists:", typeof Jimp.limit255);

