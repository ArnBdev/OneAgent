/**
 * config-provider-advanced.test.ts
 * Deeper validation of UnifiedConfigProvider deterministic hashing, clear, reset, and mutation block events.
 */
import { UnifiedConfigProvider } from '../../coreagent/config/UnifiedConfigProvider';
import { unifiedMonitoringService } from '../../coreagent/monitoring/UnifiedMonitoringService';
import { assertOperationCoverage, assertOperationSequence } from '../utils/monitoringTestUtils';

async function run() {
  if (process.env.ONEAGENT_FAST_TEST_MODE !== '1') {
    process.env.ONEAGENT_FAST_TEST_MODE = '1';
  }
  // Ensure clean baseline
  UnifiedConfigProvider.resetForTest('advanced-start');
  const baseSnap = UnifiedConfigProvider.getSnapshot();

  // Apply two scoped overrides in different order sequences to verify hash consistency when logically identical
  UnifiedConfigProvider.applyScopedOverride('alpha', { mcpPort: baseSnap.config.mcpPort + 10 });
  UnifiedConfigProvider.applyScopedOverride('beta', { memoryPort: baseSnap.config.memoryPort + 2 });
  const hashOrder1 = UnifiedConfigProvider.getHash();

  // Reset & reapply in reverse order
  UnifiedConfigProvider.resetForTest('reorder');
  UnifiedConfigProvider.applyScopedOverride('beta', { memoryPort: baseSnap.config.memoryPort + 2 });
  UnifiedConfigProvider.applyScopedOverride('alpha', { mcpPort: baseSnap.config.mcpPort + 10 });
  const hashOrder2 = UnifiedConfigProvider.getHash();

  if (hashOrder1 !== hashOrder2)
    throw new Error('Hash mismatch for logically equivalent override sets (order-sensitive)');

  // Clear one scoped override and ensure hash changes
  UnifiedConfigProvider.clearScopedOverride('beta');
  const hashAfterClear = UnifiedConfigProvider.getHash();
  if (hashAfterClear === hashOrder2)
    throw new Error('Hash did not change after clearing scoped override');

  // Freeze and assert mutation blocked event
  UnifiedConfigProvider.freezeConfig('advanced-freeze');
  let blocked = false;
  try {
    UnifiedConfigProvider.applyScopedOverride('gamma', { host: 'should-not-apply' });
  } catch {
    blocked = true;
  }
  if (!blocked) throw new Error('Scoped override applied after freeze');

  const events = unifiedMonitoringService.getRecentEvents(400);
  const requiredOps = [
    'config_test_reset', // initial reset
    'config_scoped_override', // alpha first set
    'config_scoped_override', // beta first set
    'config_test_reset', // reorder reset
    'config_scoped_override', // beta second set
    'config_scoped_override', // alpha second set
    'config_scoped_override_clear', // clear beta
    'config_freeze',
    'config_mutation_blocked',
  ];
  // Coverage: we only need that each distinct required op type appears at least once (some duplicates expected)
  const distinctRequired = Array.from(new Set(requiredOps));
  assertOperationCoverage(events, 'UnifiedConfigProvider', distinctRequired, {
    allowSkipOnDisabled: true,
  });

  // Sequence: ensure reset -> scoped_override -> freeze subsequence
  assertOperationSequence(events, 'UnifiedConfigProvider', [
    'config_test_reset',
    'config_scoped_override',
    'config_freeze',
  ]);

  console.log('[config-provider-advanced.test] PASS', { hashOrder1, hashOrder2, hashAfterClear });
  if (process.env.ONEAGENT_FAST_TEST_MODE === '1' && process.env.ONEAGENT_TEST_BATCH_MODE !== '1')
    return;
}

run().catch((err) => {
  console.error('[config-provider-advanced.test] FAIL', err);
  throw err;
});
