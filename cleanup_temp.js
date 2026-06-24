const fs = require('fs');
const path = require('path');

function removeRecursiveSync(src) {
  if (fs.existsSync(src)) {
    const stats = fs.statSync(src);
    if (stats.isDirectory()) {
      fs.readdirSync(src).forEach((childItemName) => {
        removeRecursiveSync(path.join(src, childItemName));
      });
      fs.rmdirSync(src);
    } else {
      fs.unlinkSync(src);
    }
  }
}

console.log('🧹 Cleaning up temporary files...');

if (fs.existsSync('frontend')) {
  console.log('Removing frontend/ folder...');
  removeRecursiveSync('frontend');
}

if (fs.existsSync('restructure.js')) {
  console.log('Removing restructure.js...');
  fs.unlinkSync('restructure.js');
}

console.log('✅ Temporary files cleaned up!');

// Self-destruct
setTimeout(() => {
  if (fs.existsSync('cleanup_temp.js')) {
    fs.unlinkSync('cleanup_temp.js');
  }
}, 500);
