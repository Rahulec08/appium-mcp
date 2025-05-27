// Test script to log how to properly import and use Jimp
import Jimp from "jimp";

console.log("Jimp import:", Jimp);
console.log("Jimp constructor type:", typeof Jimp);

// Check if read is a static method or needs to be used differently
console.log("Jimp.read exists?", !!Jimp.read);
console.log("Jimp.read type:", typeof Jimp.read);

// Try importing in other ways
import * as JimpStar from "jimp";
console.log("JimpStar type:", typeof JimpStar);
console.log("JimpStar default export:", typeof JimpStar.default);
console.log("JimpStar read exists?", !!JimpStar.read);
