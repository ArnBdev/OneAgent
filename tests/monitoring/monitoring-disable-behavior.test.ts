/**
 * Verifies that monitoring no-op stub is used when ONEAGENT_DISABLE_AUTO_MONITORING=1
 */
import '../setup/disableMonitoring';
import { unifiedMonitoringService } from '../../coreagent/monitoring/UnifiedMonitoringService';

interface MinimalMonitoringShape {
  isMonitoring?: boolean;
}

describe('monitoring disable behavior', () => {
  it('provides a no-op monitoring service when disabled', async () => {
    expect((unifiedMonitoringService as unknown as MinimalMonitoringShape).isMonitoring).toBe(
      false,
    );
    await unifiedMonitoringService.startMonitoring();
    await unifiedMonitoringService.stopMonitoring();
    unifiedMonitoringService.trackOperation?.('test', 'op', 'success', {} as any);
  });
});
