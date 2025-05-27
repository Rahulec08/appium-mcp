// Simple CommonJS test for Jimp
const JimpModule = require('jimp');
const Jimp = JimpModule.Jimp;

// Check if Jimp.read exists
if (typeof Jimp.read === 'function') {
  console.log('✅ Jimp.read is a function');
  
  // Test reading an image
  Jimp.read('./test-screenshots/about_phone_2025-05-12T07-58-15-397Z.png')
    .then(image => {
      // Check methods available on image object
      console.log('Image methods:', Object.keys(image.__proto__).slice(0, 20));
      
      // Check standard image methods
      if (typeof image.getWidth === 'function') {
        console.log('✅ image.getWidth() =', image.getWidth());
      } else {
        console.log('❌ image.getWidth is not a function');
      }
      
      if (typeof image.getHeight === 'function') {
        console.log('✅ image.getHeight() =', image.getHeight());
      } else {
        console.log('❌ image.getHeight is not a function');
      }
      
      if (typeof image.getPixelColor === 'function') {
        console.log('✅ image.getPixelColor() exists');
      } else {
        console.log('❌ image.getPixelColor is not a function');
      }
      
      // Check intToRGBA exists in the module
      if (typeof JimpModule.intToRGBA === 'function') {
        const color = JimpModule.intToRGBA(0xFF0000FF);
        console.log('✅ JimpModule.intToRGBA works:', color);
      } else {
        console.log('❌ JimpModule.intToRGBA is not a function');
      }
    })
    .catch(err => {
      console.error('❌ Error loading image:', err);
    });
} else {
  console.log('❌ Jimp.read is not a function');
}
