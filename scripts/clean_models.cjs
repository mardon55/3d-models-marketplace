const fs = require('fs');
const path = require('path');
const { readPNG } = require('./find_blemish.cjs');
const { writePNG } = require('./png_utils.cjs');

const dir = 'public/assets/models';

function cleanImage(filename, cleanFn) {
  const filePath = path.join(dir, filename);
  const img = readPNG(fs.readFileSync(filePath));
  console.log(`\nProcessing ${filename}...`);
  cleanFn(img);
  writePNG(filePath, img.width, img.height, img.pixels);
  console.log(`Saved clean ${filename}`);
}

// 1. gaming-chair.png
cleanImage('gaming-chair.png', (img) => {
  let cleared = 0;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const idx = (y * img.width + x) * 4;
      // Artifacts are at x < 60
      if (x < 60 && img.pixels[idx + 3] > 0) {
        img.pixels[idx] = 0;
        img.pixels[idx + 1] = 0;
        img.pixels[idx + 2] = 0;
        img.pixels[idx + 3] = 0;
        cleared++;
      }
      // Clear tiny alpha noise
      if (img.pixels[idx + 3] < 10) {
        img.pixels[idx] = 0;
        img.pixels[idx + 1] = 0;
        img.pixels[idx + 2] = 0;
        img.pixels[idx + 3] = 0;
      }
    }
  }
  // Clear stray pixel at (121, 380)
  const idx = (380 * img.width + 121) * 4;
  img.pixels[idx] = 0;
  img.pixels[idx + 1] = 0;
  img.pixels[idx + 2] = 0;
  img.pixels[idx + 3] = 0;
  console.log(`gaming-chair: cleared ${cleared} artifact pixels`);
});

// 2. container.png
cleanImage('container.png', (img) => {
  let cleared = 0;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const idx = (y * img.width + x) * 4;
      // Artifacts are at x < 40
      if (x < 40 && img.pixels[idx + 3] > 0) {
        img.pixels[idx] = 0;
        img.pixels[idx + 1] = 0;
        img.pixels[idx + 2] = 0;
        img.pixels[idx + 3] = 0;
        cleared++;
      }
      // Clear tiny alpha noise
      if (img.pixels[idx + 3] < 10) {
        img.pixels[idx] = 0;
        img.pixels[idx + 1] = 0;
        img.pixels[idx + 2] = 0;
        img.pixels[idx + 3] = 0;
      }
    }
  }
  console.log(`container: cleared ${cleared} artifact pixels`);
});

// 3. steel-beams.png
cleanImage('steel-beams.png', (img) => {
  let cleared = 0;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const idx = (y * img.width + x) * 4;
      // Artifacts are at x < 45
      if (x < 45 && img.pixels[idx + 3] > 0) {
        img.pixels[idx] = 0;
        img.pixels[idx + 1] = 0;
        img.pixels[idx + 2] = 0;
        img.pixels[idx + 3] = 0;
        cleared++;
      }
      // Clear tiny alpha noise
      if (img.pixels[idx + 3] < 10) {
        img.pixels[idx] = 0;
        img.pixels[idx + 1] = 0;
        img.pixels[idx + 2] = 0;
        img.pixels[idx + 3] = 0;
      }
    }
  }
  console.log(`steel-beams: cleared ${cleared} artifact pixels`);
});

// 4. helicopter.png
cleanImage('helicopter.png', (img) => {
  const stray = [[153, 183], [327, 183], [323, 184], [322, 185], [357, 203]];
  for (const [x, y] of stray) {
    const idx = (y * img.width + x) * 4;
    img.pixels[idx] = 0;
    img.pixels[idx + 1] = 0;
    img.pixels[idx + 2] = 0;
    img.pixels[idx + 3] = 0;
  }
  for (let i = 0; i < img.width * img.height; i++) {
    if (img.pixels[i * 4 + 3] < 10) {
      img.pixels[i * 4] = 0;
      img.pixels[i * 4 + 1] = 0;
      img.pixels[i * 4 + 2] = 0;
      img.pixels[i * 4 + 3] = 0;
    }
  }
  console.log('helicopter: cleared stray pixels and alpha noise');
});

// 5. m4a1.png
cleanImage('m4a1.png', (img) => {
  const stray = [[107, 116]];
  for (const [x, y] of stray) {
    const idx = (y * img.width + x) * 4;
    img.pixels[idx] = 0;
    img.pixels[idx + 1] = 0;
    img.pixels[idx + 2] = 0;
    img.pixels[idx + 3] = 0;
  }
  for (let i = 0; i < img.width * img.height; i++) {
    if (img.pixels[i * 4 + 3] < 10) {
      img.pixels[i * 4] = 0;
      img.pixels[i * 4 + 1] = 0;
      img.pixels[i * 4 + 2] = 0;
      img.pixels[i * 4 + 3] = 0;
    }
  }
  console.log('m4a1: cleared stray pixels and alpha noise');
});

// 6. villa.png
cleanImage('villa.png', (img) => {
  const stray = [[87, 211], [67, 213], [69, 223]];
  for (const [x, y] of stray) {
    const idx = (y * img.width + x) * 4;
    img.pixels[idx] = 0;
    img.pixels[idx + 1] = 0;
    img.pixels[idx + 2] = 0;
    img.pixels[idx + 3] = 0;
  }
  for (let i = 0; i < img.width * img.height; i++) {
    if (img.pixels[i * 4 + 3] < 10) {
      img.pixels[i * 4] = 0;
      img.pixels[i * 4 + 1] = 0;
      img.pixels[i * 4 + 2] = 0;
      img.pixels[i * 4 + 3] = 0;
    }
  }
  console.log('villa: cleared stray pixels and alpha noise');
});

// 7. mercedes.png
cleanImage('mercedes.png', (img) => {
  for (let i = 0; i < img.width * img.height; i++) {
    if (img.pixels[i * 4 + 3] < 10) {
      img.pixels[i * 4] = 0;
      img.pixels[i * 4 + 1] = 0;
      img.pixels[i * 4 + 2] = 0;
      img.pixels[i * 4 + 3] = 0;
    }
  }
  console.log('mercedes: cleared alpha noise');
});

// 8. sofa.png
cleanImage('sofa.png', (img) => {
  for (let i = 0; i < img.width * img.height; i++) {
    if (img.pixels[i * 4 + 3] < 10) {
      img.pixels[i * 4] = 0;
      img.pixels[i * 4 + 1] = 0;
      img.pixels[i * 4 + 2] = 0;
      img.pixels[i * 4 + 3] = 0;
    }
  }
  console.log('sofa: cleared alpha noise');
});
