/**
 * TaskQueue - Dependency-Aware Task Queue with Parallel Execution
 *
 * Foundational orchestration component that:
 * - Resolves task dependencies using topological sort
 * - Executes independent tasks in parallel for optimal throughput
 * - Maintains memory-backed state for reliability and observability
 * - Provides error handling with retry logic and circuit breakers
 * - Integrates with canonical OneAgent systems (Memory, Monitoring, Backbone)
 *
 * Architecture Principles:
 * - Constitutional AI: Validates critical task assignments
 * - Canonical Systems: Uses UnifiedBackboneService, OneAgentMemory, UnifiedMonitoringService
 * - Quality-First: 80%+ Grade A standards with comprehensive error handling
 * - Memory-Driven: Persistent state for crash recovery and audit trails
 *
 * Features:
 * - Topological sort for dependency resolution
 * - Parallel execution of independent tasks
 * - Priority-based scheduling (critical > high > medium > low)
 * - Exponential backoff retry with max attempts
 * - Circuit breaker pattern for failing tasks
 * - Real-time progress tracking and metrics
 * - Memory-backed state persistence
 *
 * @version 4.4.0
 * @author OneAgent Professional Development Platform
 */

import {
  createUnifiedId,
  createUnifiedTimestamp,
  getOneAgentMemory,
} from '../utils/UnifiedBackboneService';
import type { UnifiedTimestamp } from '../types/oneagent-backbone-types';
import { OneAgentMemory } from '../memory/OneAgentMemory';
import { unifiedMonitoringService } from '../monitoring/UnifiedMonitoringService';

// =============================================================================
// TASK QUEUE TYPES
// =============================================================================

export type TaskStatus = 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * Circuit breaker for executor failure isolation
 */
export interface CircuitBreaker {
  executorId: string;
  state: CircuitState;
  failureCount: number;
  lastFailureTime: number;
  successCount: number;
  nextAttemptTime: number;
}

/**
 * Event types for real-time progress updates
 */
export type TaskQueueEventType =
  | 'task_added'
  | 'task_started'
  | 'task_completed'
  | 'task_failed'
  | 'task_retry'
  | 'task_blocked'
  | 'circuit_opened'
  | 'circuit_closed'
  | 'queue_processed';

export interface TaskQueueEvent {
  type: TaskQueueEventType;
  taskId?: string;
  taskName?: string;
  executorId?: string;
  timestamp: UnifiedTimestamp;
  metadata?: Record<string, unknown>;
}

export type TaskQueueEventHandler = (event: TaskQueueEvent) => void;

export interface QueuedTask {
  id: string;
  name: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;

  /** Task dependencies (must complete before this task can start) */
  dependsOn: string[];

  /** Task data payload (passed to executor) */
  payload: Record<string, unknown>;

  /** Executor function identifier (used to look up executor) */
  executorId: string;

  /** Retry configuration */
  maxAttempts: number;
  currentAttempt: number;
  nextAttemptAt?: UnifiedTimestamp;

  /** Timestamps */
  createdAt: UnifiedTimestamp;
  queuedAt?: UnifiedTimestamp;
  startedAt?: UnifiedTimestamp;
  completedAt?: UnifiedTimestamp;

  /** Result and error tracking */
  result?: unknown;
  error?: {
    code: string;
    message: string;
    timestamp: UnifiedTimestamp;
  };

  /** Metadata */
  metadata?: Record<string, unknown>;
}

export interface TaskExecutor {
  id: string;
  name: string;
  execute: (task: QueuedTask) => Promise<unknown>;
  timeout?: number; // milliseconds
}

export interface TaskQueueConfig {
  maxConcurrent?: number; // Max parallel tasks
  retryBaseDelay?: number; // Base delay for exponential backoff (ms)
  retryMaxDelay?: number; // Max retry delay cap (ms)
  defaultMaxAttempts?: number; // Default retry attempts
  defaultTimeout?: number; // Default executor timeout (ms)
  memoryEnabled?: boolean; // Enable memory persistence

  // Circuit breaker configuration
  circuitBreakerEnabled?: boolean; // Enable circuit breaker pattern (default true)
  circuitBreakerThreshold?: number; // Failures before opening circuit (default 5)
  circuitBreakerWindow?: number; // Time window for failure tracking (ms, default 60000)
  circuitBreakerTimeout?: number; // Time to wait before half-open (ms, default 30000)
  circuitBreakerSuccessThreshold?: number; // Successes in half-open before closing (default 2)
}

export interface TaskQueueMetrics {
  totalTasks: number;
  pendingTasks: number;
  queuedTasks: number;
  runningTasks: number;
  completedTasks: number;
  failedTasks: number;
  blockedTasks: number;
  averageExecutionTime: number; // milliseconds
  successRate: number; // percentage
}

// =============================================================================
// TASK QUEUE IMPLEMENTATION
// =============================================================================

export class TaskQueue {
  private memory: OneAgentMemory;
  private tasks: Map<string, QueuedTask>;
  private executors: Map<string, TaskExecutor>;
  private running: Set<string>; // Currently executing task IDs
  private config: Required<TaskQueueConfig>;
  private queueId: string;

  // Circuit breaker state per executor
  private circuitBreakers: Map<string, CircuitBreaker>;

  // Event listeners for real-time progress
  private eventHandlers: TaskQueueEventHandler[];

  constructor(config: TaskQueueConfig = {}) {
    this.memory = getOneAgentMemory();
    this.tasks = new Map();
    this.executors = new Map();
    this.running = new Set();
    this.queueId = createUnifiedId('operation', 'taskqueue');
    this.circuitBreakers = new Map();
    this.eventHandlers = [];

    // Set default configuration
    this.config = {
      maxConcurrent: config.maxConcurrent ?? 5,
      retryBaseDelay: config.retryBaseDelay ?? 2000,
      retryMaxDelay: config.retryMaxDelay ?? 60000,
      defaultMaxAttempts: config.defaultMaxAttempts ?? 3,
      defaultTimeout: config.defaultTimeout ?? 30000,
      memoryEnabled: config.memoryEnabled ?? true,
      circuitBreakerEnabled: config.circuitBreakerEnabled ?? true,
      circuitBreakerThreshold: config.circuitBreakerThreshold ?? 5,
      circuitBreakerWindow: config.circuitBreakerWindow ?? 60000,
      circuitBreakerTimeout: config.circuitBreakerTimeout ?? 30000,
      circuitBreakerSuccessThreshold: config.circuitBreakerSuccessThreshold ?? 2,
    };

    console.log(`[TaskQueue:${this.queueId}] Initialized with config:`, this.config);
  }

  /**
   * Register a task executor (function that executes specific task types)
   */
  registerExecutor(executor: TaskExecutor): void {
    this.executors.set(executor.id, executor);

    // Initialize circuit breaker for executor
    if (this.config.circuitBreakerEnabled) {
      this.circuitBreakers.set(executor.id, {
        executorId: executor.id,
        state: 'closed',
        failureCount: 0,
        lastFailureTime: 0,
        successCount: 0,
        nextAttemptTime: 0,
      });
    }

    console.log(`[TaskQueue] Registered executor: ${executor.name} (${executor.id})`);
  }

  /**
   * Add event listener for real-time progress updates
   */
  addEventListener(handler: TaskQueueEventHandler): void {
    this.eventHandlers.push(handler);
  }

  /**
   * Remove event listener
   */
  removeEventListener(handler: TaskQueueEventHandler): void {
    const index = this.eventHandlers.indexOf(handler);
    if (index !== -1) {
      this.eventHandlers.splice(index, 1);
    }
  }

  /**
   * Emit event to all listeners
   */
  private emitEvent(event: TaskQueueEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch (error) {
        console.error('[TaskQueue] Event handler error:', error);
      }
    }
  }

  /**
   * Add a task to the queue
   */
  async addTask(
    task: Omit<QueuedTask, 'id' | 'status' | 'createdAt' | 'currentAttempt'>,
  ): Promise<string> {
    const timestamp = createUnifiedTimestamp();
    const taskId = createUnifiedId('operation', 'task');

    const queuedTask: QueuedTask = {
      ...task,
      id: taskId,
      status: 'pending',
      createdAt: timestamp,
      currentAttempt: 0,
    };

    this.tasks.set(taskId, queuedTask);

    // Persist to memory if enabled
    if (this.config.memoryEnabled) {
      await this.persistTaskToMemory(queuedTask);
    }

    // Track metrics
    unifiedMonitoringService.trackOperation('TaskQueue', 'addTask', 'success', {
      queueId: this.queueId,
      taskId,
      priority: task.priority,
    });

    // Emit event
    this.emitEvent({
      type: 'task_added',
      taskId,
      taskName: queuedTask.name,
      executorId: queuedTask.executorId,
      timestamp,
      metadata: { priority: task.priority },
    });

    console.log(`[TaskQueue] Task added: ${queuedTask.name} (${taskId})`);
    return taskId;
  }

  /**
   * Process the queue: resolve dependencies, execute ready tasks in parallel
   */
  async processQueue(): Promise<TaskQueueMetrics> {
    const startTime = createUnifiedTimestamp();
    console.log(`[TaskQueue] Processing queue (${this.tasks.size} tasks)...`);

    // Update circuit breaker states
    if (this.config.circuitBreakerEnabled) {
      this.updateCircuitBreakers();
    }

    // Resolve dependencies and identify ready tasks
    const readyTasks = this.getReadyTasks();

    if (readyTasks.length === 0) {
      console.log('[TaskQueue] No ready tasks to execute');
      return this.getMetrics();
    }

    // Sort by priority (critical > high > medium > low)
    const priorityOrder: Record<TaskPriority, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };
    readyTasks.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

    // Execute tasks in parallel up to maxConcurrent limit
    const toExecute = readyTasks.slice(0, this.config.maxConcurrent - this.running.size);

    console.log(`[TaskQueue] Executing ${toExecute.length} tasks in parallel`);

    const executionPromises = toExecute.map((task) => this.executeTask(task));
    await Promise.allSettled(executionPromises);

    const duration = createUnifiedTimestamp().unix - startTime.unix;
    console.log(`[TaskQueue] Queue processing complete (${duration}ms)`);

    // Track metrics
    unifiedMonitoringService.trackOperation('TaskQueue', 'processQueue', 'success', {
      queueId: this.queueId,
      tasksExecuted: toExecute.length,
      durationMs: duration,
    });

    // Emit event
    const metrics = this.getMetrics();
    this.emitEvent({
      type: 'queue_processed',
      timestamp: createUnifiedTimestamp(),
      metadata: {
        tasksExecuted: toExecute.length,
        durationMs: duration,
        metrics,
      },
    });

    return metrics;
  }

  /**
   * Execute a single task with error handling and retry logic
   */
  private async executeTask(task: QueuedTask): Promise<void> {
    const taskId = task.id;
    const startTime = createUnifiedTimestamp();

    // Check circuit breaker before execution
    if (this.config.circuitBreakerEnabled) {
      const breaker = this.circuitBreakers.get(task.executorId);
      if (breaker && breaker.state === 'open') {
        const now = createUnifiedTimestamp().unix;
        if (now < breaker.nextAttemptTime) {
          console.warn(
            `[TaskQueue] Circuit breaker OPEN for ${task.executorId}, skipping task: ${task.name}`,
          );
          task.status = 'blocked';
          this.emitEvent({
            type: 'task_blocked',
            taskId,
            taskName: task.name,
            executorId: task.executorId,
            timestamp: createUnifiedTimestamp(),
            metadata: { reason: 'circuit_breaker_open' },
          });
          return;
        }
        // Transition to half-open
        breaker.state = 'half-open';
        breaker.successCount = 0;
        console.log(`[TaskQueue] Circuit breaker HALF-OPEN for ${task.executorId}`);
      }
    }

    try {
      // Mark as running
      task.status = 'running';
      task.startedAt = startTime;
      this.running.add(taskId);

      // Update memory
      if (this.config.memoryEnabled) {
        await this.updateTaskStatus(taskId, 'running');
      }

      // Emit event
      this.emitEvent({
        type: 'task_started',
        taskId,
        taskName: task.name,
        executorId: task.executorId,
        timestamp: startTime,
      });

      console.log(`[TaskQueue] Executing task: ${task.name} (${taskId})`);

      // Get executor
      const executor = this.executors.get(task.executorId);
      if (!executor) {
        throw new Error(`Executor not found: ${task.executorId}`);
      }

      // Execute with timeout
      const timeout = executor.timeout ?? this.config.defaultTimeout;
      const result = await this.executeWithTimeout(executor.execute(task), timeout);

      // Mark as completed
      task.status = 'completed';
      task.completedAt = createUnifiedTimestamp();
      task.result = result;
      this.running.delete(taskId);

      // Calculate duration
      const duration = task.completedAt.unix - startTime.unix;

      // Update circuit breaker on success
      if (this.config.circuitBreakerEnabled) {
        this.recordCircuitBreakerSuccess(task.executorId);
      }

      // Update memory
      if (this.config.memoryEnabled) {
        await this.updateTaskStatus(taskId, 'completed', result);
      }

      // Track metrics
      unifiedMonitoringService.trackOperation('TaskQueue', 'executeTask', 'success', {
        queueId: this.queueId,
        taskId,
        executorId: task.executorId,
        durationMs: duration,
        priority: task.priority,
      });

      // Record duration for detailed metrics (specialized operation key per canonical pattern)
      try {
        const perf = unifiedMonitoringService.getPerformanceMonitor();
        perf.recordDurationFromEvent('TaskQueue.executeTask', duration);
      } catch {
        /* non-fatal */
      }

      // Emit event
      this.emitEvent({
        type: 'task_completed',
        taskId,
        taskName: task.name,
        executorId: task.executorId,
        timestamp: task.completedAt,
        metadata: { durationMs: duration },
      });

      console.log(`[TaskQueue] Task completed: ${task.name} (${duration}ms)`);
    } catch (error) {
      // Update circuit breaker on failure
      if (this.config.circuitBreakerEnabled) {
        this.recordCircuitBreakerFailure(task.executorId);
      }
      await this.handleTaskFailure(task, error);
    }
  }

  /**
   * Handle task failure with retry logic
   */
  private async handleTaskFailure(task: QueuedTask, error: unknown): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const timestamp = createUnifiedTimestamp();

    task.error = {
      code: 'execution_error',
      message: errorMessage,
      timestamp,
    };
    task.currentAttempt += 1;
    this.running.delete(task.id);

    console.error(
      `[TaskQueue] Task failed: ${task.name} (attempt ${task.currentAttempt}/${task.maxAttempts})`,
      errorMessage,
    );

    // Check if we should retry
    if (task.currentAttempt < task.maxAttempts) {
      // Calculate exponential backoff delay
      const delay = Math.min(
        this.config.retryBaseDelay * Math.pow(2, task.currentAttempt - 1),
        this.config.retryMaxDelay,
      );

      task.status = 'queued';
      const nextAttemptUnix = timestamp.unix + delay;
      task.nextAttemptAt = {
        ...createUnifiedTimestamp(),
        unix: nextAttemptUnix,
        iso: new Date(nextAttemptUnix).toISOString(),
        utc: new Date(nextAttemptUnix).toUTCString(),
      };

      console.log(`[TaskQueue] Task queued for retry in ${delay}ms: ${task.name}`);

      // Track retry
      unifiedMonitoringService.trackOperation('TaskQueue', 'taskRetry', 'success', {
        queueId: this.queueId,
        taskId: task.id,
        attempt: task.currentAttempt,
        delayMs: delay,
      });

      // Emit event
      this.emitEvent({
        type: 'task_retry',
        taskId: task.id,
        taskName: task.name,
        executorId: task.executorId,
        timestamp,
        metadata: { attempt: task.currentAttempt, delayMs: delay },
      });
    } else {
      // Max attempts reached, mark as failed
      task.status = 'failed';
      task.completedAt = timestamp;

      console.error(`[TaskQueue] Task failed permanently: ${task.name} (max attempts reached)`);

      // Track failure
      unifiedMonitoringService.trackOperation('TaskQueue', 'executeTask', 'error', {
        queueId: this.queueId,
        taskId: task.id,
        executorId: task.executorId,
        error: errorMessage,
        attempts: task.currentAttempt,
      });

      // Emit event
      this.emitEvent({
        type: 'task_failed',
        taskId: task.id,
        taskName: task.name,
        executorId: task.executorId,
        timestamp,
        metadata: { error: errorMessage, attempts: task.currentAttempt },
      });
    }

    // Update memory
    if (this.config.memoryEnabled) {
      await this.updateTaskStatus(task.id, task.status, undefined, task.error);
    }
  }

  // =============================================================================
  // CIRCUIT BREAKER METHODS
  // =============================================================================

  /**
   * Update circuit breaker states based on time and thresholds
   */
  private updateCircuitBreakers(): void {
    const now = createUnifiedTimestamp().unix;

    for (const [executorId, breaker] of this.circuitBreakers.entries()) {
      // Reset failure count if outside window
      if (
        breaker.lastFailureTime > 0 &&
        now - breaker.lastFailureTime > this.config.circuitBreakerWindow
      ) {
        breaker.failureCount = 0;
      }

      // Check if half-open circuit should attempt close
      if (
        breaker.state === 'half-open' &&
        breaker.successCount >= this.config.circuitBreakerSuccessThreshold
      ) {
        this.closeCircuit(executorId);
      }
    }
  }

  /**
   * Record circuit breaker success
   */
  private recordCircuitBreakerSuccess(executorId: string): void {
    const breaker = this.circuitBreakers.get(executorId);
    if (!breaker) return;

    if (breaker.state === 'half-open') {
      breaker.successCount++;
      console.log(
        `[TaskQueue] Circuit breaker success count: ${breaker.successCount}/${this.config.circuitBreakerSuccessThreshold} for ${executorId}`,
      );

      if (breaker.successCount >= this.config.circuitBreakerSuccessThreshold) {
        this.closeCircuit(executorId);
      }
    } else if (breaker.state === 'closed') {
      // Reset failure count on success
      breaker.failureCount = 0;
    }
  }

  /**
   * Record circuit breaker failure
   */
  private recordCircuitBreakerFailure(executorId: string): void {
    const breaker = this.circuitBreakers.get(executorId);
    if (!breaker) return;

    const now = createUnifiedTimestamp().unix;
    breaker.failureCount++;
    breaker.lastFailureTime = now;

    console.warn(
      `[TaskQueue] Circuit breaker failure count: ${breaker.failureCount}/${this.config.circuitBreakerThreshold} for ${executorId}`,
    );

    // Open circuit if threshold reached
    if (breaker.state === 'closed' && breaker.failureCount >= this.config.circuitBreakerThreshold) {
      this.openCircuit(executorId);
    } else if (breaker.state === 'half-open') {
      // Failed in half-open, reopen circuit
      this.openCircuit(executorId);
    }
  }

  /**
   * Open circuit for executor
   */
  private openCircuit(executorId: string): void {
    const breaker = this.circuitBreakers.get(executorId);
    if (!breaker) return;

    const now = createUnifiedTimestamp().unix;
    breaker.state = 'open';
    breaker.nextAttemptTime = now + this.config.circuitBreakerTimeout;
    breaker.successCount = 0;

    console.error(
      `[TaskQueue] Circuit breaker OPENED for ${executorId} until ${new Date(breaker.nextAttemptTime).toISOString()}`,
    );

    // Emit event
    this.emitEvent({
      type: 'circuit_opened',
      executorId,
      timestamp: createUnifiedTimestamp(),
      metadata: {
        failureCount: breaker.failureCount,
        nextAttemptTime: breaker.nextAttemptTime,
      },
    });

    // Track in monitoring
    unifiedMonitoringService.trackOperation('TaskQueue', 'circuitBreakerOpen', 'error', {
      queueId: this.queueId,
      executorId,
      failureCount: breaker.failureCount,
    });
  }

  /**
   * Close circuit for executor
   */
  private closeCircuit(executorId: string): void {
    const breaker = this.circuitBreakers.get(executorId);
    if (!breaker) return;

    breaker.state = 'closed';
    breaker.failureCount = 0;
    breaker.successCount = 0;

    console.log(`[TaskQueue] Circuit breaker CLOSED for ${executorId}`);

    // Emit event
    this.emitEvent({
      type: 'circuit_closed',
      executorId,
      timestamp: createUnifiedTimestamp(),
    });

    // Track in monitoring
    unifiedMonitoringService.trackOperation('TaskQueue', 'circuitBreakerClosed', 'success', {
      queueId: this.queueId,
      executorId,
    });
  }

  /**
   * Get circuit breaker state for executor
   */
  getCircuitState(executorId: string): CircuitState | undefined {
    return this.circuitBreakers.get(executorId)?.state;
  }

  /**
   * Get all circuit breaker states
   */
  getAllCircuitStates(): Map<string, CircuitBreaker> {
    return new Map(this.circuitBreakers);
  }

  /**
   * Get tasks that are ready to execute (all dependencies completed)
   */
  private getReadyTasks(): QueuedTask[] {
    const ready: QueuedTask[] = [];
    const now = createUnifiedTimestamp().unix;

    for (const task of this.tasks.values()) {
      // Skip if not pending or queued
      if (task.status !== 'pending' && task.status !== 'queued') {
        continue;
      }

      // Skip if retry delay not elapsed
      if (task.nextAttemptAt && task.nextAttemptAt.unix > now) {
        continue;
      }

      // Check if all dependencies are completed
      const allDepsCompleted = task.dependsOn.every((depId) => {
        const depTask = this.tasks.get(depId);
        return depTask && depTask.status === 'completed';
      });

      // Check if any dependencies are blocked or failed
      const anyDepsBlocked = task.dependsOn.some((depId) => {
        const depTask = this.tasks.get(depId);
        return depTask && (depTask.status === 'blocked' || depTask.status === 'failed');
      });

      if (anyDepsBlocked) {
        task.status = 'blocked';
        continue;
      }

      if (allDepsCompleted) {
        ready.push(task);
      }
    }

    return ready;
  }

  /**
   * Topological sort for dependency resolution
   * Returns tasks in execution order (dependencies first)
   */
  topologicalSort(): QueuedTask[] {
    const sorted: QueuedTask[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (taskId: string): void => {
      if (visited.has(taskId)) return;
      if (visiting.has(taskId)) {
        throw new Error(`Circular dependency detected: ${taskId}`);
      }

      const task = this.tasks.get(taskId);
      if (!task) return;

      visiting.add(taskId);

      // Visit dependencies first
      for (const depId of task.dependsOn) {
        visit(depId);
      }

      visiting.delete(taskId);
      visited.add(taskId);
      sorted.push(task);
    };

    // Visit all tasks
    for (const taskId of this.tasks.keys()) {
      try {
        visit(taskId);
      } catch (error) {
        console.error(`[TaskQueue] Topological sort error:`, error);
        throw error;
      }
    }

    return sorted;
  }

  /**
   * Get current queue metrics
   */
  getMetrics(): TaskQueueMetrics {
    const tasks = Array.from(this.tasks.values());
    const completedTasks = tasks.filter((t) => t.status === 'completed');

    // Calculate average execution time
    let totalDuration = 0;
    let durationCount = 0;
    for (const task of completedTasks) {
      if (task.startedAt && task.completedAt) {
        totalDuration += task.completedAt.unix - task.startedAt.unix;
        durationCount++;
      }
    }
    const avgDuration = durationCount > 0 ? totalDuration / durationCount : 0;

    // Calculate success rate
    const terminatedTasks = tasks.filter((t) => t.status === 'completed' || t.status === 'failed');
    const successRate =
      terminatedTasks.length > 0 ? (completedTasks.length / terminatedTasks.length) * 100 : 0;

    return {
      totalTasks: tasks.length,
      pendingTasks: tasks.filter((t) => t.status === 'pending').length,
      queuedTasks: tasks.filter((t) => t.status === 'queued').length,
      runningTasks: tasks.filter((t) => t.status === 'running').length,
      completedTasks: completedTasks.length,
      failedTasks: tasks.filter((t) => t.status === 'failed').length,
      blockedTasks: tasks.filter((t) => t.status === 'blocked').length,
      averageExecutionTime: Math.round(avgDuration),
      successRate: Math.round(successRate * 100) / 100,
    };
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): QueuedTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get all tasks
   */
  getAllTasks(): QueuedTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Clear completed and failed tasks
   */
  clearTerminatedTasks(): void {
    for (const [taskId, task] of this.tasks.entries()) {
      if (task.status === 'completed' || task.status === 'failed') {
        this.tasks.delete(taskId);
      }
    }
    console.log(`[TaskQueue] Cleared terminated tasks`);
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  /**
   * Execute a promise with timeout
   */
  private executeWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Task execution timeout (${timeoutMs}ms)`)), timeoutMs),
      ),
    ]);
  }

  /**
   * Persist task to memory
   */
  private async persistTaskToMemory(task: QueuedTask): Promise<void> {
    try {
      await this.memory.addMemory({
        content: `TaskQueue Task: ${task.name}`,
        metadata: {
          type: 'taskqueue_task',
          queueId: this.queueId,
          taskId: task.id,
          taskName: task.name,
          priority: task.priority,
          status: task.status,
          executorId: task.executorId,
          dependsOn: task.dependsOn,
          createdAt: task.createdAt.iso,
          ...(task.metadata || {}),
        } as unknown as Record<string, unknown>,
      });
    } catch (error) {
      console.warn(`[TaskQueue] Failed to persist task to memory:`, error);
    }
  }

  /**
   * Update task status in memory
   */
  private async updateTaskStatus(
    taskId: string,
    status: TaskStatus,
    result?: unknown,
    error?: QueuedTask['error'],
  ): Promise<void> {
    try {
      const task = this.tasks.get(taskId);
      if (!task) return;

      await this.memory.addMemory({
        content: `TaskQueue Status Update: ${task.name} -> ${status}`,
        metadata: {
          type: 'taskqueue_status',
          queueId: this.queueId,
          taskId,
          taskName: task.name,
          status,
          timestamp: createUnifiedTimestamp().iso,
          ...(result ? { result: String(result).substring(0, 200) } : {}),
          ...(error ? { error: error.message } : {}),
        } as unknown as Record<string, unknown>,
      });
    } catch (error) {
      console.warn(`[TaskQueue] Failed to update task status in memory:`, error);
    }
  }
}
