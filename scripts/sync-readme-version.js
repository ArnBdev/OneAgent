#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pkgPath = path.join(root, 'package.json');
const readmePath = path.join(root, 'README.md');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

const pkg = readJson(pkgPath);
const version = pkg.version;

let readme = fs.readFileSync(readmePath, 'utf8');
const original = readme;

// Replace top-level header line that contains OneAgent version
readme = readme.replace(
  /^#\s+OneAgent\s+v[0-9A-Za-z.\-+]+.*$/m,
  `# OneAgent v${version} - Memory-Driven Intelligence Platform`,
);

// Replace trailing canonical README notation if present
readme = readme.replace(
  /This is the canonical README for OneAgent v[0-9A-Za-z.\-+]+\./m,
  `This is the canonical README for OneAgent v${version}.`,
);

if (readme !== original) {
  fs.writeFileSync(readmePath, readme, 'utf8');
  console.log(`README.md updated to v${version}`);
  process.exit(0);
} else {
  console.log('README.md already in sync');
  process.exit(0);
}
