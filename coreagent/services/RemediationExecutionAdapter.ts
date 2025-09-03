import { createUnifiedTimestamp } from '../utils/UnifiedBackboneService';
import { unifiedMonitoringService } from '../monitoring/UnifiedMonitoringService';
import { taskDelegationService } from './TaskDelegationService';

declare global {
  // Augment globalThis with optional execution adapter reference
  // (var declaration used for global augmentation in Node.js ambient context)
  var __oneagentExecutionAdapter: RemediationExecutionAdapter | undefined; // NOSONAR - global coordination point
}

/**
 * RemediationExecutionAdapter
 * Minimal execution simulation producing realistic latency & success/failure variation.
 * Zero parallel metric stores: emits duration via existing trackOperation path.
 */
export class RemediationExecutionAdapter {
  private failureRate: number; // 0..1
  private minLatencyMs: number;
  private maxLatencyMs: number;

  constructor(opts?: { failureRate?: number; minLatencyMs?: number; maxLatencyMs?: number }) {
    this.failureRate = Math.min(Math.max(opts?.failureRate ?? 0.2, 0), 1);
    this.minLatencyMs = Math.max(10, opts?.minLatencyMs ?? 80);
    this.maxLatencyMs = Math.max(this.minLatencyMs, opts?.maxLatencyMs ?? 1200);
  }

  /** Execute a delegated task by id. Returns success/failure result. */
  async execute(taskId: string): Promise<{
    success: boolean;
    errorCode?: string;
    errorMessage?: string;
  }> {
    const task = taskDelegationService.getAllTasks().find((t) => t.id === taskId);
    if (!task) {
      return { success: false, errorCode: 'task_not_found', errorMessage: 'Task missing in queue' };
    }
    const start = createUnifiedTimestamp();
    // Simulate latency (uniform) – future: distribution aware of action type
    const span = this.maxLatencyMs - this.minLatencyMs;
    const simulated = this.minLatencyMs + Math.random() * span;
    await new Promise((r) => setTimeout(r, simulated));
    const success = Math.random() > this.failureRate;
    const end = createUnifiedTimestamp();
    // Emit operation metric with durationMs (ingested by PerformanceMonitor)
    unifiedMonitoringService.trackOperation(
      'TaskDelegation',
      'execute',
      success ? 'success' : 'error',
      {
        taskId,
        targetAgent: task.targetAgent || 'unassigned',
        durationMs: end.unix - start.unix,
        simulatedLatencyMs: simulated,
        attempts: task.attempts ?? 0,
      },
    );
    if (success) return { success: true };
    return {
      success: false,
      errorCode: 'remediation_failed',
      errorMessage: 'Simulated remediation failure',
    };
  }
}

// Register global adapter instance (idempotent)
if (!globalThis.__oneagentExecutionAdapter) {
  globalThis.__oneagentExecutionAdapter = new RemediationExecutionAdapter();
}

export const remediationExecutionAdapter = globalThis.__oneagentExecutionAdapter!;
