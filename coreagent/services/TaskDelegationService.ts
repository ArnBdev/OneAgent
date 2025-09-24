import { createUnifiedId, createUnifiedTimestamp } from '../utils/UnifiedBackboneService';
import { OneAgentMemory } from '../memory/OneAgentMemory';
import { unifiedMonitoringService } from '../monitoring/UnifiedMonitoringService';

export interface DelegatedTask {
  id: string;
  createdAt: string;
  /** ISO timestamp when task was dispatched to an agent (set when status -> dispatched) */
  dispatchedAt?: string;
  /** ISO timestamp when task reached terminal state (completed|failed) */
  completedAt?: string;
  /** Duration in ms between dispatch and completion (computed when completed) */
  durationMs?: number;
  source: 'proactive_analysis';
  finding: string;
  action: string;
  targetAgent?: string;
  status: 'queued' | 'dispatched' | 'failed' | 'completed';
  snapshotHash?: string;
  lastErrorCode?: string;
  lastErrorMessage?: string;
  attempts?: number;
  maxAttempts?: number;
  /** ISO timestamp when next retry attempt is eligible (undefined => immediately eligible) */
  nextAttemptAt?: string;
  /** Numeric unix ms for faster gating comparisons */
  nextAttemptUnix?: number;
}

export class TaskDelegationService {
  private static instance: TaskDelegationService;
  private memory = OneAgentMemory.getInstance();
  private queue: DelegatedTask[] = [];
  private dedup = new Set<string>();
  private readonly MAX_QUEUE = 100; // Prevent unbounded growth (memory hygiene)
  private restored = false;
  private lastSnapshotTs = 0;
  private readonly SNAPSHOT_MIN_INTERVAL_MS = 15_000; // throttle snapshot persistence
  /** Lazily provided deep analysis accessor to avoid circular import with ProactiveTriageOrchestrator */
  private deepAnalysisProvider:
    | (() => { summary: string; recommendedActions: string[]; snapshotHash?: string } | null)
    | null = null;
  private constructor() {}
  static getInstance(): TaskDelegationService {
    if (!this.instance) this.instance = new TaskDelegationService();
    return this.instance;
  }

  /**
   * Register provider for latest deep analysis (called by ProactiveTriageOrchestrator once)
   * Decouples modules to eliminate circular dependency.
   */
  registerDeepAnalysisProvider(
    provider: () => { summary: string; recommendedActions: string[]; snapshotHash?: string } | null,
  ): void {
    this.deepAnalysisProvider = provider;
  }

  async harvestAndQueue(): Promise<DelegatedTask[]> {
    if (!this.restored) {
      await this.restoreFromMemory().catch(() => {});
    }
    const deep = this.deepAnalysisProvider ? this.deepAnalysisProvider() : null;
    if (!deep) return [];
    const nowTs = createUnifiedTimestamp().iso;
    const inserted: DelegatedTask[] = [];
    for (const action of deep.recommendedActions.slice(0, 10)) {
      const sig = `${deep.snapshotHash || 'nohash'}::${action.toLowerCase()}`;
      if (this.dedup.has(sig)) continue; // skip duplicates
      this.dedup.add(sig);
      const task: DelegatedTask = {
        id: createUnifiedId('operation', 'proactive_task'),
        createdAt: nowTs,
        source: 'proactive_analysis',
        finding: deep.summary,
        action,
        targetAgent: this.inferAgent(action),
        status: 'queued',
        snapshotHash: deep.snapshotHash,
        attempts: 0,
        maxAttempts: Number(process.env.ONEAGENT_TASK_MAX_ATTEMPTS || 3),
      };
      this.queue.push(task);
      inserted.push(task);
      unifiedMonitoringService.trackOperation('TaskDelegation', 'queue', 'success', {
        targetAgent: task.targetAgent || 'unassigned',
        action: action.substring(0, 60),
      });
      // Memory persistence (best-effort) only for new tasks
      this.persistTaskMemory(task).catch(() => {});
    }
    // Enforce queue cap (drop oldest first if exceeded)
    while (this.queue.length > this.MAX_QUEUE) {
      const dropped = this.queue.shift();
      if (dropped)
        unifiedMonitoringService.trackOperation('TaskDelegation', 'queue_trim', 'success', {
          dropped: dropped.id,
        });
    }
    return inserted;
  }

  private inferAgent(action: string): string | undefined {
    const l = action.toLowerCase();
    if (l.includes('latency') || l.includes('optimiz') || l.includes('refactor')) return 'DevAgent';
    if (l.includes('document') || l.includes('write')) return 'OfficeAgent';
    if (l.includes('fitness') || l.includes('health')) return 'FitnessAgent';
    return undefined;
  }

  /** Get a shallow copy of currently queued (undispatched) tasks */
  getQueuedTasks(): DelegatedTask[] {
    return this.queue.filter((t) => t.status === 'queued').slice();
  }

  /** Get shallow copy of all tasks regardless of status (for diagnostics/testing) */
  getAllTasks(): DelegatedTask[] {
    return this.queue.slice();
  }

  /** Mark a task as dispatched (idempotent). Returns updated task or undefined. */
  markDispatched(taskId: string): DelegatedTask | undefined {
    const task = this.queue.find((t) => t.id === taskId);
    if (!task) return undefined;
    if (task.status === 'queued') {
      task.status = 'dispatched';
      task.dispatchedAt = createUnifiedTimestamp().iso;
      unifiedMonitoringService.trackOperation('TaskDelegation', 'dispatch_mark', 'success', {
        taskId,
        targetAgent: task.targetAgent || 'unassigned',
      });
      // Persist status transition (best-effort)
      this.persistTaskMemory(task, true).catch(() => {});
      this.maybePersistSnapshot();
    }
    return task;
  }

  /** Internal helper to persist a task state to memory (best-effort, non-blocking). */
  private async persistTaskMemory(task: DelegatedTask, statusUpdate = false): Promise<void> {
    try {
      await this.memory.addMemoryCanonical(
        `${statusUpdate ? 'TaskStatus' : 'ProactiveDelegation'}:${task.action}`,
        {
          type: 'proactive_task',
          taskId: task.id,
          targetAgent: task.targetAgent,
          status: task.status,
          createdAt: task.createdAt,
          sourceFinding: task.finding,
          snapshotHash: task.snapshotHash,
          lastErrorCode: task.lastErrorCode,
          lastErrorMessage: task.lastErrorMessage,
          attempts: task.attempts,
          maxAttempts: task.maxAttempts,
          nextAttemptAt: task.nextAttemptAt,
          nextAttemptUnix: task.nextAttemptUnix,
        } as unknown as Record<string, unknown>,
        'system-proactive',
      );
    } catch (err) {
      console.warn('[TaskDelegationService] Failed to persist task memory', {
        taskId: task.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  /** Mark task execution result */
  markExecutionResult(
    taskId: string,
    success: boolean,
    errorCode?: string,
    errorMessage?: string,
    durationMs?: number,
  ): DelegatedTask | undefined {
    const task = this.queue.find((t) => t.id === taskId);
    if (!task) return undefined;
    if (success) {
      task.status = 'completed';
      task.lastErrorCode = undefined;
      task.lastErrorMessage = undefined;
      task.completedAt = createUnifiedTimestamp().iso;
    } else {
      task.status = 'failed';
      task.lastErrorCode = errorCode || 'execution_error';
      task.lastErrorMessage = errorMessage;
      task.completedAt = createUnifiedTimestamp().iso;
    }
    // Derive or assign duration
    if (typeof durationMs === 'number') {
      task.durationMs = durationMs;
    } else if (typeof task.durationMs !== 'number' && task.dispatchedAt && task.completedAt) {
      try {
        const d = Date.parse(task.completedAt) - Date.parse(task.dispatchedAt);
        if (isFinite(d) && d >= 0) task.durationMs = d;
      } catch {
        /* ignore parse errors */
      }
    }
    const opMeta: Record<string, unknown> = {
      taskId: task.id,
      targetAgent: task.targetAgent || 'unassigned',
      ...(typeof task.durationMs === 'number' ? { durationMs: task.durationMs } : {}),
    };
    if (success) {
      unifiedMonitoringService.trackOperation('TaskDelegation', 'execute', 'success', opMeta);
    } else {
      unifiedMonitoringService.trackOperation('TaskDelegation', 'execute', 'error', {
        ...opMeta,
        errorCode: task.lastErrorCode,
      });
    }
    // Specialized latency feed using compound operation id to disambiguate from any other generic 'execute' operations.
    // This does NOT introduce a parallel metrics store; it reuses the canonical PerformanceMonitor with a distinct key.
    try {
      if (typeof task.durationMs === 'number') {
        const perf = unifiedMonitoringService.getPerformanceMonitor();
        perf.recordDurationFromEvent('TaskDelegation.execute', task.durationMs);
      }
    } catch {
      /* non-fatal */
    }
    this.persistTaskMemory(task, true).catch(() => {});
    this.maybePersistSnapshot();
    return task;
  }

  /** Attempt to requeue a failed task if attempts remain (exponential backoff simulated by timestamp spacing externally). */
  maybeRequeue(taskId: string): DelegatedTask | undefined {
    const task = this.queue.find((t) => t.id === taskId);
    if (!task) return undefined;
    if (task.status !== 'failed') return task;
    task.attempts = (task.attempts || 0) + 1;
    if (task.attempts < (task.maxAttempts ?? 3)) {
      task.status = 'queued';
      unifiedMonitoringService.trackOperation('TaskDelegation', 'retry', 'success', {
        taskId: task.id,
        attempt: task.attempts,
        max: task.maxAttempts,
      });
      // Schedule next attempt via exponential backoff (base * 2^(attempt-1)) with max cap
      const base = parseInt(process.env.ONEAGENT_TASK_RETRY_BASE_DELAY_MS || '2000', 10) || 2000;
      const cap = parseInt(process.env.ONEAGENT_TASK_RETRY_MAX_DELAY_MS || '60000', 10) || 60000;
      const delay = Math.min(base * Math.pow(2, (task.attempts || 1) - 1), cap);
      const now = createUnifiedTimestamp();
      task.nextAttemptUnix = now.unix + delay;
      task.nextAttemptAt = new Date(task.nextAttemptUnix).toISOString();
      unifiedMonitoringService.trackOperation('TaskDelegation', 'retry_backoff', 'success', {
        taskId: task.id,
        attempt: task.attempts,
        delayMs: delay,
        max: task.maxAttempts,
      });
      this.persistTaskMemory(task, true).catch(() => {});
      return task;
    }
    unifiedMonitoringService.trackOperation('TaskDelegation', 'retry_exhausted', 'error', {
      taskId: task.id,
      attempts: task.attempts,
      max: task.maxAttempts,
      lastErrorCode: task.lastErrorCode,
    });
    return task;
  }

  /**
   * Process requeue eligibility for all failed tasks whose nextAttemptUnix has passed.
   * Returns list of taskIds requeued. Designed to be invoked by orchestrator scheduler (future) or tests.
   */
  processDueRequeues(nowUnix: number = Date.now()): string[] {
    const requeued: string[] = [];
    for (const t of this.queue) {
      if (
        t.status === 'failed' &&
        typeof t.nextAttemptUnix === 'number' &&
        t.nextAttemptUnix <= nowUnix
      ) {
        const beforeAttempts = t.attempts || 0;
        const updated = this.maybeRequeue(t.id);
        if (updated && updated.status === 'queued' && (updated.attempts || 0) > beforeAttempts) {
          requeued.push(updated.id);
        }
      }
    }
    if (requeued.length) {
      // Aggregated wave metric (single event per sweep for observability, low cardinality)
      unifiedMonitoringService.trackOperation('TaskDelegation', 'requeue_wave', 'success', {
        count: requeued.length,
      });
    }
    return requeued;
  }

  /** Mark dispatch failure before execution (e.g., no target agent). */
  markDispatchFailure(taskId: string, code: string, message?: string): DelegatedTask | undefined {
    const task = this.queue.find((t) => t.id === taskId);
    if (!task) return undefined;
    if (task.status === 'queued' || task.status === 'dispatched') {
      task.status = 'failed';
      task.lastErrorCode = code;
      task.lastErrorMessage = message;
      unifiedMonitoringService.trackOperation('TaskDelegation', 'dispatch', 'error', {
        taskId: task.id,
        targetAgent: task.targetAgent || 'unassigned',
        errorCode: code,
      });
      this.persistTaskMemory(task, true).catch(() => {});
      this.maybePersistSnapshot();
      return task;
    }
    return task;
  }

  /** Persist a lightweight snapshot of queue state (best-effort) */
  async persistSnapshot(): Promise<void> {
    const snapshot = this.queue.map((t) => ({
      id: t.id,
      status: t.status,
      action: t.action,
      attempts: t.attempts || 0,
      maxAttempts: t.maxAttempts || 0,
      nextAttemptAt: t.nextAttemptAt,
    }));
    try {
      await this.memory.addMemoryCanonical(
        'TaskDelegationSnapshot',
        {
          type: 'proactive_task_snapshot',
          queueLength: this.queue.length,
          snapshot,
          temporal: { persistedAt: createUnifiedTimestamp() },
        } as unknown as Record<string, unknown>,
        'system-proactive',
      );
      this.lastSnapshotTs = Date.now();
    } catch {
      /* ignore */
    }
  }

  /** Throttled snapshot persistence to avoid excessive memory writes */
  private maybePersistSnapshot(): void {
    if (process.env.ONEAGENT_FAST_TEST_MODE === '1') return; // skip noise in fast tests
    const now = Date.now();
    if (now - this.lastSnapshotTs < this.SNAPSHOT_MIN_INTERVAL_MS) return;
    this.persistSnapshot().catch(() => {});
  }

  /** Restore queue state from recent proactive_task memories */
  private async restoreFromMemory(): Promise<void> {
    this.restored = true;
    if (process.env.ONEAGENT_FAST_TEST_MODE === '1') return; // skip in fast tests
    try {
      // Basic search: look for recent proactive task records
      const results = await this.memory.searchMemory({
        query: 'ProactiveDelegation',
        limit: 50,
        userId: 'system-proactive',
      });
      const arr = (results && (results as unknown as { results?: unknown[] }).results) || [];
      if (!Array.isArray(arr)) return;
      for (const r of arr) {
        const rec = r as { metadata?: Record<string, unknown>; content?: string };
        if (rec.content && rec.content.startsWith('ProactiveDelegation:')) {
          const meta = rec.metadata || {};
          const taskId = meta.taskId as string | undefined;
          if (!taskId || this.queue.find((t) => t.id === taskId)) continue;
          const status = (meta.status as DelegatedTask['status']) || 'queued';
          this.queue.push({
            id: taskId,
            createdAt: (meta.createdAt as string) || createUnifiedTimestamp().iso,
            source: 'proactive_analysis',
            finding: (meta.sourceFinding as string) || 'restored-task',
            action: rec.content.replace('ProactiveDelegation:', ''),
            targetAgent: (meta.targetAgent as string) || undefined,
            status,
            snapshotHash: (meta.snapshotHash as string) || undefined,
            lastErrorCode: (meta.lastErrorCode as string) || undefined,
            lastErrorMessage: (meta.lastErrorMessage as string) || undefined,
            attempts: (meta.attempts as number) || 0,
            maxAttempts:
              (meta.maxAttempts as number) || Number(process.env.ONEAGENT_TASK_MAX_ATTEMPTS || 3),
            nextAttemptAt: (meta.nextAttemptAt as string) || undefined,
            nextAttemptUnix: (meta.nextAttemptUnix as number) || undefined,
          });
        }
      }
      // Rebuild dedup set
      for (const t of this.queue) {
        const sig = `${t.snapshotHash || 'nohash'}::${t.action.toLowerCase()}`;
        this.dedup.add(sig);
      }
      unifiedMonitoringService.trackOperation('TaskDelegation', 'restore', 'success', {
        restored: this.queue.length,
      });
    } catch (err) {
      unifiedMonitoringService.trackOperation('TaskDelegation', 'restore', 'error', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  /** Public wrapper for deterministic test invocation of restore logic */
  async restore(): Promise<void> {
    if (this.restored) return; // idempotent
    await this.restoreFromMemory();
  }
}

export const taskDelegationService = TaskDelegationService.getInstance();
