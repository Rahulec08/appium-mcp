const Jimp = require('jimp');

function test() {
  // Print out all properties on the Jimp object
  console.log('Jimp properties:', Object.keys(Jimp));
  
  // Check for read method
  console.log('Jimp.read exists?', 'read' in Jimp);
  
  // Check if any of the exports are functions that could be used to read an image
  for (const key of Object.keys(Jimp)) {
    const type = typeof Jimp[key];
    if (type === 'function') {
      console.log();
    }
  }
}

test();
