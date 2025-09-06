// scripts/guard-metrics.cjs
// Simple CI guard: scan selected source directories for banned metric tokens.

const fs = require('fs');
const path = require('path');

// Tokens we do not want to appear in source code
const bannedTokens = ['execute_latency', 'execute-latency', 'executeLatency'];
// Only scan these top-level directories to reduce noise
const allowedDirs = ['coreagent', 'src', 'tests', 'scripts'];

const SELF = path.resolve(__filename);

function walk(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // skip large or generated folders
      if (
        [
          'node_modules',
          '.git',
          'dist',
          'oneagent_unified_memory',
          'oneagent_gemini_memory',
        ].includes(entry.name)
      )
        continue;
      walk(full, fileList);
    } else {
      fileList.push(full);
    }
  }
  return fileList;
}

function isTextFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return ['.ts', '.tsx', '.js', '.cjs', '.mjs', '.json', '.md', '.yml', '.yaml'].includes(ext);
}

function isInAllowedDir(filePath) {
  const rel = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  return allowedDirs.some((d) => rel === d || rel.startsWith(d + '/'));
}

function main() {
  const root = process.cwd();
  const files = walk(root);
  const violations = [];

  for (const file of files) {
    if (!isTextFile(file)) continue;
    if (!isInAllowedDir(file)) continue;
    // avoid self-detection
    if (path.resolve(file) === SELF) continue;
    let content;
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch (err) {
      continue; // unreadable or binary
    }

    for (const token of bannedTokens) {
      if (content.includes(token)) violations.push({ file, token });
    }
  }

  if (violations.length > 0) {
    console.error('Banned metric/token guard failed. Found banned tokens:');
    for (const v of violations) console.error(` - ${v.token} in ${v.file}`);
    process.exitCode = 2; // CI will see non-zero
  } else {
    console.log('Guard check passed: no banned metric tokens found in source dirs.');
  }
}

main();
