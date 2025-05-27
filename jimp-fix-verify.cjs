const JimpModule = require("jimp");
console.log("JimpModule structure:", Object.keys(JimpModule));
console.log("Has Jimp property:", !!JimpModule.Jimp);

// Use the nested Jimp object
const Jimp = JimpModule.Jimp;

// Test if Jimp has read function
console.log("Jimp.read exists:", !!Jimp.read);

// Test if intToRGBA exists directly on module
console.log("JimpModule.intToRGBA exists:", !!JimpModule.intToRGBA);

