/**
 * PERFORMANCE PROFILER (DEPRECATED)
 * Backward-compatible shim delegating to canonical monitoring.
 * Do not add any local metric state here.
 */
import { unifiedMonitoringService } from '../monitoring/UnifiedMonitoringService';
import { createUnifiedTimestamp } from '../utils/UnifiedBackboneService';
import { PerformanceMonitor } from '../monitoring/PerformanceMonitor';

export class PerformanceProfiler {
  private readonly monitor: PerformanceMonitor;
  private static warned = false;

  constructor(monitor?: PerformanceMonitor) {
    this.monitor = monitor || new PerformanceMonitor();
    if (!PerformanceProfiler.warned) {
      PerformanceProfiler.warned = true;
      unifiedMonitoringService.trackOperation(
        'performance_profiler',
        'deprecation_notice',
        'success',
        {
          message:
            'PerformanceProfiler deprecated. Use UnifiedMonitoringService + PerformanceMonitor.',
        },
      );
    }
  }

  startOperation(
    operationId: string,
    operationType: string,
    metadata?: Record<string, unknown>,
  ): void {
    unifiedMonitoringService.trackOperation('performance_profiler', operationType, 'success', {
      operationId,
      phase: 'start',
      ...(metadata || {}),
      startUnix: createUnifiedTimestamp().unix,
    });
  }

  endOperation(
    operationId: string,
    success: boolean = true,
    error?: string,
    metadata?: Record<string, unknown>,
  ): void {
    unifiedMonitoringService.trackOperation(
      'performance_profiler',
      'operation_complete',
      success ? 'success' : 'error',
      {
        operationId,
        phase: 'end',
        error,
        ...(metadata || {}),
        endUnix: createUnifiedTimestamp().unix,
      },
    );
  }

  async checkPerformance(operationType: string) {
    return this.monitor.getDetailedMetrics(operationType);
  }

  async generateReport() {
    return this.monitor.getGlobalReport();
  }

  clearMetrics(): void {}
  getMetricsCount(): number {
    return 0;
  }
}

export const globalProfiler = new PerformanceProfiler();

export function createDeprecatedProfiler(): PerformanceProfiler {
  unifiedMonitoringService.trackOperation(
    'performance_profiler',
    'deprecated_factory_call',
    'success',
    {
      message: 'createDeprecatedProfiler called. Migrate to canonical services.',
    },
  );
  return globalProfiler;
}
