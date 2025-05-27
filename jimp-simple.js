const Jimp = require('jimp');

async function test() {
  try {
    const image = await Jimp.read('./test-screenshots/about_phone_2025-05-12T07-58-15-397Z.png');
    console.log('Image width:', image.getWidth());
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
