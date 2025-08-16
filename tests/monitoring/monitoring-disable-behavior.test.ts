/**
 * Verifies that monitoring no-op stub is used when ONEAGENT_DISABLE_AUTO_MONITORING=1
 */
import '../setup/disableMonitoring';
import { unifiedMonitoringService } from '../../coreagent/monitoring/UnifiedMonitoringService';

interface MinimalMonitoringShape {
  isMonitoring?: boolean;
}

(async () => {
  if ((unifiedMonitoringService as unknown as MinimalMonitoringShape).isMonitoring !== false) {
    throw new Error('Expected no-op unifiedMonitoringService when disabled');
  }
  // Should not throw
  await unifiedMonitoringService.startMonitoring();
  await unifiedMonitoringService.stopMonitoring();
  unifiedMonitoringService.trackOperation?.('test', 'op', 'success', {});
  console.log('[monitoring-disable-behavior.test] PASS');
})();
