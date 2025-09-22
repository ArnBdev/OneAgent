/**
 * guard-deprecated-deps.cjs
 * Prevent reintroduction of deprecated / removed dependencies or APIs.
 */
const fs = require('fs');
const path = require('path');

const BANNED_PACKAGES = ['@google/generative-ai'];
const BANNED_SYMBOLS = ['GoogleGenerativeAI', 'GenerativeModel'];
const SCAN_DIRS = ['coreagent', 'src', 'tests', 'scripts'];

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
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
      walk(full, acc);
    } else acc.push(full);
  }
  return acc;
}

function isText(file) {
  return /\.(ts|tsx|js|cjs|mjs|json|md|yml|yaml)$/i.test(file);
}

function main() {
  const root = process.cwd();
  const pkgJson = path.join(root, 'package.json');
  const violations = [];
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgJson, 'utf8'));
    for (const banned of BANNED_PACKAGES) {
      if (
        (pkg.dependencies && pkg.dependencies[banned]) ||
        (pkg.devDependencies && pkg.devDependencies[banned]) ||
        (pkg.optionalDependencies && pkg.optionalDependencies[banned])
      ) {
        violations.push(`package.json contains banned dependency ${banned}`);
      }
    }
  } catch (e) {
    console.warn('WARN: cannot parse package.json', e.message);
  }

  for (const dir of SCAN_DIRS) {
    const full = path.join(root, dir);
    if (!fs.existsSync(full)) continue;
    for (const file of walk(full)) {
      if (!isText(file)) continue;
      let content;
      try {
        content = fs.readFileSync(file, 'utf8');
      } catch {
        continue;
      }
      // Only flag banned package if used in import/require, not just mentioned in comments/docs
      for (const banned of BANNED_PACKAGES) {
        const importRegex = new RegExp(
          `(import\\s+[^;]*['\"]${banned}['\"]|require\\(['\"]${banned}['\"]\\))`,
        );
        if (importRegex.test(content)) violations.push(`${banned} imported in ${file}`);
      }
      for (const sym of BANNED_SYMBOLS) {
        if (file.includes('guard-deprecated-deps.cjs')) continue;
        if (new RegExp(`(^|\n)[^\n]*${sym}[^a-zA-Z0-9_]`).test(content))
          violations.push(`Symbol ${sym} found in ${file}`);
      }
    }
  }

  if (violations.length) {
    console.error('Deprecated Dependency Guard failed:');
    for (const v of violations) console.error(' - ' + v);
    process.exit(2);
  } else {
    console.log('Deprecated Dependency Guard: PASS');
  }
}

main();
