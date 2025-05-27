const JimpModule = require('jimp');

async function test() {
  try {
    console.log('JimpModule type:', typeof JimpModule);
    console.log('JimpModule.Jimp exists?', node jimp-inspect.cjsJimpModule.Jimp);
    console.log('JimpModule.Jimp type:', typeof JimpModule.Jimp);
    
    if (JimpModule.Jimp && typeof JimpModule.Jimp === 'function') {
      // Try using JimpModule.Jimp to read an image
      const image = await JimpModule.Jimp.read('./test-screenshots/about_phone_2025-05-12T07-58-15-397Z.png');
      console.log('Image width:', image.getWidth());
    }
    
    // Test intToRGBA
    console.log('intToRGBA exists:', typeof JimpModule.intToRGBA);
    if (JimpModule.intToRGBA) {
      const rgba = JimpModule.intToRGBA(0xFF0000FF);
      console.log('RGBA value:', rgba);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
