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

const readme = fs.readFileSync(readmePath, 'utf8');

const headerMatch = readme.match(/^#\s+OneAgent\s+v([0-9A-Za-z.\-+]+).*$/m);
if (!headerMatch) {
  console.error('README header not found');
  process.exit(2);
}

const readmeVersion = headerMatch[1];
if (readmeVersion !== version) {
  console.error(`Version mismatch: package.json=${version} README=${readmeVersion}`);
  process.exit(1);
}

console.log(`README version (${readmeVersion}) matches package.json`);
process.exit(0);
