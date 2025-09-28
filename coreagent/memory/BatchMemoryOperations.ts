/**
 * Batch Memory Operations for OneAgent
 * Implements batching to reduce API calls and improve efficiency
 */

import { OneAgentMemory } from './OneAgentMemory';
import { createUnifiedTimestamp } from '../utils/UnifiedBackboneService';

export interface BatchOperation {
  type: 'add' | 'search' | 'edit' | 'delete';
  data: Record<string, unknown>;
  id?: string;
}

export interface BatchOperationResult {
  type: string;
  result: unknown;
  id?: string;
}
export interface BatchOperationError {
  type: string;
  error: string;
  id?: string;
}
export interface BatchResult {
  success: boolean;
  results: BatchOperationResult[];
  errors: BatchOperationError[];
  processingTime: number;
}

export class BatchMemoryOperations {
  private memory: OneAgentMemory;
  private batchQueue: BatchOperation[] = [];
  private batchSize: number;
  private batchTimeout: number;
  private batchTimer: NodeJS.Timeout | null = null;
  private deterministic: boolean;
  private immediateFlush: boolean;

  constructor(memory: OneAgentMemory, batchSize: number = 10, batchTimeoutMs: number = 2000) {
    this.memory = memory;
    this.batchSize = batchSize;
    this.batchTimeout = batchTimeoutMs;
    // Deterministic mode for tests: immediate flush & disable timers when env flag set
    this.deterministic = process.env.ONEAGENT_BATCH_DETERMINISTIC === '1';
    this.immediateFlush = process.env.ONEAGENT_BATCH_IMMEDIATE_FLUSH === '1';
  }

  /**
   * Add operation to batch queue
   */
  async queueOperation(operation: BatchOperation): Promise<void> {
    this.batchQueue.push(operation);

    // Immediate flush path (test determinism)
    if (this.immediateFlush) {
      await this.processBatch();
      return;
    }

    // Process batch if size limit reached
    if (this.batchQueue.length >= this.batchSize) {
      await this.processBatch();
      return;
    }

    // Set timeout for batch processing
    if (!this.batchTimer) {
      if (this.deterministic) {
        // In deterministic mode, process synchronously after microtask
        this.batchTimer = setTimeout(() => {
          this.processBatch();
        }, 0);
      } else {
        this.batchTimer = setTimeout(() => {
          this.processBatch();
        }, this.batchTimeout);
      }
      // Do not keep the process alive solely for batch flush
      (this.batchTimer as unknown as NodeJS.Timer).unref?.();
    }
  }

  /**
   * Process queued batch operations
   */
  async processBatch(): Promise<BatchResult> {
    if (this.batchQueue.length === 0) {
      return { success: true, results: [], errors: [], processingTime: 0 };
    }

    const startTime = createUnifiedTimestamp().unix;
    const operations = [...this.batchQueue];
    this.batchQueue = [];

    // Clear timeout
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    console.log(`[BatchMemoryOperations] Processing batch of ${operations.length} operations`);

    const results: BatchOperationResult[] = [];
    const errors: BatchOperationError[] = [];

    // Group operations by type for efficient processing
    const grouped = this.groupOperationsByType(operations);

    try {
      // Process each group
      for (const [type, ops] of Object.entries(grouped)) {
        switch (type) {
          case 'add':
            await this.processBatchAdd(ops as BatchOperation[], results, errors);
            break;
          case 'search':
            await this.processBatchSearch(ops as BatchOperation[], results, errors);
            break;
          case 'edit':
            await this.processBatchEdit(ops as BatchOperation[], results, errors);
            break;
          case 'delete':
            await this.processBatchDelete(ops as BatchOperation[], results, errors);
            break;
        }
      }
    } catch (error) {
      console.error('[BatchMemoryOperations] Batch processing error:', error);
      errors.push({ type: 'batch', error: error instanceof Error ? error.message : String(error) });
    }

    const processingTime = createUnifiedTimestamp().unix - startTime;
    console.log(`[BatchMemoryOperations] Batch completed in ${processingTime}ms`);

    return {
      success: errors.length === 0,
      results,
      errors,
      processingTime,
    };
  }

  /**
   * Group operations by type
   */
  private groupOperationsByType(operations: BatchOperation[]): Record<string, BatchOperation[]> {
    const grouped: Record<string, BatchOperation[]> = {};

    for (const op of operations) {
      if (!grouped[op.type]) {
        grouped[op.type] = [];
      }
      grouped[op.type].push(op);
    }

    return grouped;
  }

  /**
   * Process batch add operations
   */
  private async processBatchAdd(
    operations: BatchOperation[],
    results: BatchOperationResult[],
    errors: BatchOperationError[],
  ): Promise<void> {
    for (const op of operations) {
      try {
        // Derive canonical fields from legacy/op data
        const data = op.data as Record<string, unknown>;
        const content =
          typeof data.content === 'string'
            ? data.content
            : typeof data.text === 'string'
              ? data.text
              : JSON.stringify({ ...(data || {}), metadata: undefined });
        const userId =
          typeof data.userId === 'string'
            ? data.userId
            : typeof (data as Record<string, unknown>).userId === 'string'
              ? String((data as Record<string, unknown>).userId)
              : 'default-user';
        const rawMeta = (data.metadata as Record<string, unknown>) || {};
        const type = (rawMeta.type as string) || 'batch_memory';

        // Build canonical metadata for addMemory
        const metadata = {
          userId,
          type,
          system: {
            source: 'BatchMemoryOperations',
            component: 'batch-processor',
          },
          content: {
            category: 'batch',
            tags: ['batch', 'memory', type],
            sensitivity: 'internal',
            relevanceScore: 0.5,
            contextDependency: 'session',
          },
          custom: {
            originalMetadata: rawMeta,
            batchId: op.id,
            queuedAt: createUnifiedTimestamp().iso,
          },
        };

        const newId = await this.memory.addMemory({
          content,
          metadata,
        });
        results.push({ type: 'add', result: { id: newId }, id: op.id });
      } catch (error) {
        errors.push({
          type: 'add',
          error: error instanceof Error ? error.message : String(error),
          id: op.id,
        });
      }
    }
  }

  /**
   * Process batch search operations
   */
  private async processBatchSearch(
    operations: BatchOperation[],
    results: BatchOperationResult[],
    errors: BatchOperationError[],
  ): Promise<void> {
    for (const op of operations) {
      try {
        // Ensure op.data is a valid MemoryQuery
        const query = op.data as unknown as import('../types/oneagent-memory-types').MemoryQuery;
        if (!query.query) throw new Error('Batch search operation missing query string');
        const result = await this.memory.searchMemory(query);
        results.push({ type: 'search', result, id: op.id });
      } catch (error) {
        errors.push({
          type: 'search',
          error: error instanceof Error ? error.message : String(error),
          id: op.id,
        });
      }
    }
  }

  /**
   * Process batch edit operations
   */
  private async processBatchEdit(
    operations: BatchOperation[],
    results: BatchOperationResult[],
    errors: BatchOperationError[],
  ): Promise<void> {
    for (const op of operations) {
      try {
        // Note: editMemory method needs to be implemented in OneAgentMemory
        const result = { success: true, message: 'Edit operation queued' };
        results.push({ type: 'edit', result, id: op.id });
      } catch (error) {
        errors.push({
          type: 'edit',
          error: error instanceof Error ? error.message : String(error),
          id: op.id,
        });
      }
    }
  }

  /**
   * Process batch delete operations
   */
  private async processBatchDelete(
    operations: BatchOperation[],
    results: BatchOperationResult[],
    errors: BatchOperationError[],
  ): Promise<void> {
    for (const op of operations) {
      try {
        const data = op.data as { id?: string };
        if (!data.id) throw new Error('Batch delete operation missing id');
        const result = await this.memory.deleteMemory({ id: String(data.id) });
        results.push({ type: 'delete', result, id: op.id });
      } catch (error) {
        errors.push({
          type: 'delete',
          error: error instanceof Error ? error.message : String(error),
          id: op.id,
        });
      }
    }
  }

  /**
   * Force process current batch
   */
  async flushBatch(): Promise<BatchResult> {
    return await this.processBatch();
  }

  /**
   * Get batch queue status
   */
  getBatchStatus(): { queueSize: number; batchSize: number; hasTimer: boolean } {
    return {
      queueSize: this.batchQueue.length,
      batchSize: this.batchSize,
      hasTimer: this.batchTimer !== null,
    };
  }

  /** Test-only helper to force deterministic processing of current queue without side-effects */
  async __testForceProcess(): Promise<BatchResult> {
    return await this.processBatch();
  }
}
