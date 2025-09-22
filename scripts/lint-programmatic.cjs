// Programmatic ESLint runner to mitigate silent CLI failures on Windows environment.
// Mirrors core ignore list logic and fails on any error (warnings allowed temporarily).
const { ESLint } = require('eslint');

process.on('exit', (code) => {
  console.log('[lint-programmatic] process exit code', code);
});
process.on('uncaughtException', (err) => {
  console.error('[lint-programmatic] uncaughtException', (err && err.stack) || err);
  process.exitCode = 1;
});
process.on('unhandledRejection', (reason) => {
  console.error('[lint-programmatic] unhandledRejection', reason);
  process.exitCode = 1;
});

// Files/patterns to ignore explicitly (in addition to config ignores)
const EXTRA_IGNORES = [
  'coreagent/server/mission-control-ws.ts',
  'coreagent/monitoring/LatencySeries.ts',
  'coreagent/services/optionalNeo4jShim.ts',
];

async function run() {
  console.log('Programmatic ESLint start');
  const fs = require('fs');
  fs.writeFileSync('lint-debug.log', '[1] start\n');
  let eslint;
  try {
    if (process.env.LINT_MODE === 'minimal') {
      eslint = new ESLint({
        errorOnUnmatchedPattern: false,
        overrideConfigFile: false,
        overrideConfig: {
          ignores: ['**/node_modules/**', 'dist/**'],
          languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
          rules: { 'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }] },
        },
      });
      fs.appendFileSync('lint-debug.log', '[2a] ESLint constructed (minimal)\n');
    } else {
      eslint = new ESLint({
        errorOnUnmatchedPattern: false,
      });
    }
    fs.appendFileSync('lint-debug.log', '[2] ESLint constructed\n');
  } catch (e) {
    fs.appendFileSync('lint-debug.log', '[ERR] construct ' + ((e && e.stack) || e) + '\n');
    throw e;
  }
  // Target all TS sources (honors ignores from eslint.config.mjs). We previously narrowed to a single
  // file while diagnosing a silent crash; now that the issue no longer reproduces after system restart,
  // we restore full coverage. If LINT_SCOPE env var is set (comma-separated globs) it overrides defaults.
  const envScope = process.env.LINT_SCOPE;
  const patterns = envScope
    ? envScope
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : ['**/*.ts', '**/*.tsx'];
  let results;
  try {
    fs.appendFileSync('lint-debug.log', '[3] before lintFiles\n');
    results = await eslint.lintFiles(patterns);
    fs.appendFileSync('lint-debug.log', '[4] after lintFiles results=' + results.length + '\n');
    console.log(
      `[lint-programmatic] Linted ${results.length} file(s) matching patterns: ${patterns.join(', ')}`,
    );
  } catch (e) {
    fs.appendFileSync('lint-debug.log', '[ERR] lintFiles ' + ((e && e.stack) || e) + '\n');
    console.error('[lint-programmatic] lintFiles threw', (e && e.stack) || e);
    throw e;
  }
  if (!results || results.length === 0) {
    console.error('No lint results produced for patterns:', patterns);
  }
  const filtered = results.filter(
    (r) => !EXTRA_IGNORES.some((p) => r.filePath.endsWith(p.replace(/\\/g, '/'))),
  );
  let errorCount = 0;
  let warningCount = 0;
  for (const r of filtered) {
    if (r.errorCount || r.warningCount) {
      for (const m of r.messages) {
        if (m.severity === 2) {
          errorCount += 1;
          console.error(`ERROR ${r.filePath}:${m.line}:${m.column} ${m.message} (${m.ruleId})`);
        } else if (m.severity === 1) {
          warningCount += 1;
          // Keep output concise; could be expanded if needed
        }
      }
    }
  }
  console.log(
    `ESLint Summary: ${filtered.length} files, errors=${errorCount}, warnings=${warningCount}`,
  );
  fs.appendFileSync(
    'lint-debug.log',
    `[5] summary errors=${errorCount} warnings=${warningCount}\n`,
  );
  const strict = process.env.LINT_STRICT === '1';
  if (errorCount > 0 || (strict && warningCount > 0)) {
    console.error('Exiting with errors');
    process.exit(1);
  } else {
    console.log(strict ? 'No lint errors or warnings (strict mode).' : 'No lint errors detected.');
    process.exit(0);
  }
}

run().catch((e) => {
  console.error('Programmatic ESLint failed:', (e && e.stack) || e);
  process.exit(2);
});
