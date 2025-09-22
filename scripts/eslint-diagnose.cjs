// Diagnostic script to run ESLint programmatically and print any fatal errors
const { ESLint } = require('eslint');

async function main() {
  try {
    const eslint = new ESLint();
    const results = await eslint.lintFiles(['tests/canonical/a2a-events.smoke.test.ts']);
    console.log('Linted', results.length, 'files');
    for (const r of results) {
      if (r.fatalErrorCount || r.errorCount || r.warningCount) {
        console.log('File:', r.filePath);
        for (const m of r.messages) {
          console.log(
            `${m.fatal ? 'FATAL' : ''} ${r.filePath}:${m.line}:${m.column} ${m.message} (${m.ruleId})`,
          );
        }
      }
    }
  } catch (e) {
    console.error('ESLint programmatic failure:', (e && e.stack) || e);
    process.exit(2);
  }
}

main();
