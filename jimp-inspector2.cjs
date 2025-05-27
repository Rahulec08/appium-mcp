// Simple CommonJS test for Jimp
const Jimp = require('jimp');

console.log('Jimp object:', Object.keys(Jimp));
console.log('Jimp.read type:', typeof Jimp.read);
console.log('Jimp constructor:', typeof Jimp);

// Let's check if there's a Jimp property
if ('Jimp' in Jimp) {
  console.log('Found nested Jimp property:', typeof Jimp.Jimp);
}
