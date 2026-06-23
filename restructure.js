const fs = require('fs');
const path = require('path');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

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

console.log('🚀 Starting restructuring...');

// 1. Create frontend folder
if (!fs.existsSync('frontend')) {
  fs.mkdirSync('frontend');
}

// 2. Move src/ to frontend/src/
if (fs.existsSync('src')) {
  console.log('📦 Moving src/ to frontend/src/...');
  copyRecursiveSync('src', 'frontend/src');
  removeRecursiveSync('src');
}

// 3. Move assets/ to frontend/assets/
if (fs.existsSync('assets')) {
  console.log('📦 Moving assets/ to frontend/assets/...');
  copyRecursiveSync('assets', 'frontend/assets');
  removeRecursiveSync('assets');
}

// 4. Move config files to frontend/
const filesToMove = [
  'index.html',
  'vite.config.ts',
  'tsconfig.json',
  'patch.js'
];

filesToMove.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`📦 Moving ${file} to frontend/${file}...`);
    fs.copyFileSync(file, `frontend/${file}`);
    fs.unlinkSync(file);
  }
});

// 5. Delete duplicate server.ts in the root
if (fs.existsSync('server.ts')) {
  console.log('🧹 Deleting duplicate root server.ts...');
  fs.unlinkSync('server.ts');
}

// 6. Delete root package.json and package-lock.json to keep root clean
if (fs.existsSync('package.json')) {
  console.log('🧹 Deleting root package.json...');
  fs.unlinkSync('package.json');
}
if (fs.existsSync('package-lock.json')) {
  console.log('🧹 Deleting root package-lock.json...');
  fs.unlinkSync('package-lock.json');
}

console.log('✅ Restructuring completed successfully!');
