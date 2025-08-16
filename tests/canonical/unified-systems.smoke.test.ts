/**
 * Canonical Unified Systems Smoke Test (direct executable)
 * Run via: npm run smoke
 */
import assert from 'node:assert';
import { createUnifiedTimestamp, createUnifiedId, OneAgentUnifiedBackbone } from '../../coreagent/utils/UnifiedBackboneService';

function testUnifiedTimestampAndId() {
  const ts1 = createUnifiedTimestamp();
  const ts2 = createUnifiedTimestamp();
  assert.ok(ts1.unix <= ts2.unix, 'Timestamps monotonic');

  const id = createUnifiedId('operation', 'smoke');
  assert.ok(id.includes('operation') && id.includes('smoke'), 'ID contains type and context');
  console.log('✓ unified timestamp + id');
}

function testCacheSingleton() {
  const backbone = OneAgentUnifiedBackbone.getInstance();
  assert.ok(backbone.cache, 'Cache instance available');
  console.log('✓ cache singleton accessible');
}

function run() {
  console.log('Running canonical unified systems smoke test...');
  testUnifiedTimestampAndId();
  testCacheSingleton();
  console.log('All canonical smoke assertions passed.');
  // Active background timers (cache cleanup, monitoring) keep event loop open.
  // For this isolated smoke script we terminate explicitly once assertions pass.
  setImmediate(() => process.exit(0));
}

run();
