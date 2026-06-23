const fs = require('fs');

function patchFiles() {
  const files = [
    'src/components/TradingTerminal.tsx',
    'src/components/WalletAndKyc.tsx',
    'src/components/AdminCRM.tsx',
    'src/App.tsx'
  ];

  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*)\.toLocaleString\(/g, '(Number($1) || 0).toLocaleString(');
    content = content.replace(/\(Number\(\(Number\((.*?)\) \|\| 0\)\) \|\| 0\)/g, '(Number($1) || 0)');
    fs.writeFileSync(file, content, 'utf8');
    console.log('Patched ' + file);
  }
}

patchFiles();
