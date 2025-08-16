#!/usr/bin/env node
/**
 * Minimal dev-utils.cjs for targeted test runs.
 * Usage: node scripts/dev-utils.cjs test <testfile>
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');

function run() {
  const [, , cmd, ...rest] = process.argv;
  if (cmd !== 'test') {
    console.error('[dev-utils] Unsupported command:', cmd);
    process.exit(1);
  }
  if (rest.length === 0) {
    console.error('[dev-utils] Provide one or more test file paths.');
    process.exit(1);
  }
  const testFiles = rest.map((f) => path.resolve(f));
  if (testFiles.length > 1) {
    process.env.ONEAGENT_TEST_BATCH_MODE = '1';
  }
  if (!process.env.ONEAGENT_FAST_TEST_MODE) process.env.ONEAGENT_FAST_TEST_MODE = '1';
  process.env.TS_NODE_TRANSPILE_ONLY = '1';
  require('ts-node/register');
  for (const file of testFiles) {
    console.log(`[dev-utils] Running test: ${file}`);
    try {
      require(file);
    } catch (err) {
      console.error('[dev-utils] Test execution failed:', err);
      process.exit(1);
    }
  }
}
run();
