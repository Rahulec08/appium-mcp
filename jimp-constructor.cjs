const Jimp = require('jimp');

async function test() {
  try {
    console.log('Jimp type:', typeof Jimp);
    
    // Use constructor to load image instead of read
    const image = await new Jimp('./test-screenshots/about_phone_2025-05-12T07-58-15-397Z.png');
    console.log('Image width:', image.getWidth());
    
    // Test utility functions on the Jimp object
    console.log('intToRGBA exists on Jimp?', typeof Jimp.intToRGBA);
    console.log('rgbaToInt exists on Jimp?', typeof Jimp.rgbaToInt);
    
    // Alternative ways to access these functions
    console.log('Utilities on the prototype?', typeof Jimp.prototype.intToRGBA);
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
