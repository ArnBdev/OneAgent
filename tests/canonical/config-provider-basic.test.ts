/**
 * config-provider-basic.test.ts
 * Validates Phase 1 UnifiedConfigProvider layering, mutation, freeze & monitoring events.
 */
import { UnifiedConfigProvider } from '../../coreagent/config/UnifiedConfigProvider';
import { unifiedMonitoringService } from '../../coreagent/monitoring/UnifiedMonitoringService';
import { assertOperationCoverage } from '../utils/monitoringTestUtils';

async function run() {
  // Base snapshot
  const snap1 = UnifiedConfigProvider.getSnapshot();
  if (!snap1.hash) throw new Error('Initial hash missing');

  // Apply runtime override
  UnifiedConfigProvider.applyRuntimeOverride({ memoryPort: snap1.config.memoryPort + 1 }, { reason: 'test-runtime-override', actor: 'config-test' });
  const snap2 = UnifiedConfigProvider.getSnapshot();
  if (snap2.config.memoryPort !== snap1.config.memoryPort + 1) throw new Error('Runtime override not applied');
  if (snap2.hash === snap1.hash) throw new Error('Hash did not change after runtime override');

  // Apply scoped override (restore memoryPort, tweak mcpPort)
  UnifiedConfigProvider.applyScopedOverride('test-scope', { mcpPort: snap2.config.mcpPort + 5 }, { reason: 'scoped-adjust', actor: 'config-test' });
  const snap3 = UnifiedConfigProvider.getSnapshot();
  if (snap3.config.mcpPort !== snap2.config.mcpPort + 5) throw new Error('Scoped override not applied');

  // Freeze
  UnifiedConfigProvider.freezeConfig('freeze-for-validation');
  if (!UnifiedConfigProvider.isFrozen()) throw new Error('Config not frozen');

  // Attempt mutation after freeze should throw
  let blocked = false;
  try { UnifiedConfigProvider.applyRuntimeOverride({ host: 'blocked-change' }); } catch { blocked = true; }
  if (!blocked) throw new Error('Mutation after freeze did not throw');

  // Monitoring validation (skip if disabled)
  const events = unifiedMonitoringService.getRecentEvents(200);
  const requiredOps = ['config_load','config_runtime_override','config_scoped_override','config_freeze'];
  assertOperationCoverage(events, 'UnifiedConfigProvider', requiredOps, { allowSkipOnDisabled: true });

  console.log('[config-provider-basic.test] PASS', { hash: snap3.hash, frozen: UnifiedConfigProvider.isFrozen() });
  if (process.env.ONEAGENT_FAST_TEST_MODE === '1' && process.env.ONEAGENT_TEST_BATCH_MODE !== '1') process.exit(0);
}

run().catch(err => {
  console.error('[config-provider-basic.test] FAIL', err);
  // Always exit on failure (even in batch)
  process.exit(1);
});
