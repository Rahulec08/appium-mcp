// Simple CommonJS test for nested Jimp
const JimpModule = require('jimp');
const Jimp = JimpModule.Jimp;

console.log('Nested Jimp object:', Object.keys(Jimp));
console.log('Jimp.read type:', typeof Jimp.read);
console.log('Jimp constructor:', typeof Jimp);

// Try to use the read method
if (typeof Jimp.read === 'function') {
  console.log('Jimp.read exists, will try to use it');
  Jimp.read('./test-screenshots/about_phone_2025-05-12T07-58-15-397Z.png')
    .then(image => {
      console.log('Successfully loaded image with width:', image.getWidth());
    })
    .catch(err => {
      console.error('Error loading image:', err);
    });
} else {
  console.log('Jimp.read does not exist, will check for other methods');
}
