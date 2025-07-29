const fs = require('fs');
const path = require('path');

// Simple 1x1 purple pixel as base64 PNG
const purplePixelPNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');

// Icon sizes
const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];

// Create icons
sizes.forEach(size => {
  const filename = path.join(__dirname, '..', 'public', `icon-${size}x${size}.png`);
  fs.writeFileSync(filename, purplePixelPNG);
  console.log(`Created ${filename}`);
});

// Create favicon
fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.ico'), purplePixelPNG);
console.log('Created favicon.ico');

console.log('✓ All icon files created successfully');