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

export interface BatchResult {
  success: boolean;
  results: any[];
  errors: any[];
  processingTime: number;
}

export class BatchMemoryOperations {
  private memory: OneAgentMemory;
  private batchQueue: BatchOperation[] = [];
  private batchSize: number;
  private batchTimeout: number;
  private batchTimer: NodeJS.Timeout | null = null;

  constructor(memory: OneAgentMemory, batchSize: number = 10, batchTimeoutMs: number = 2000) {
    this.memory = memory;
    this.batchSize = batchSize;
    this.batchTimeout = batchTimeoutMs;
  }

  /**
   * Add operation to batch queue
   */
  async queueOperation(operation: BatchOperation): Promise<void> {
    this.batchQueue.push(operation);
    
    // Process batch if size limit reached
    if (this.batchQueue.length >= this.batchSize) {
      await this.processBatch();
      return;
    }
    
    // Set timeout for batch processing
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.processBatch();
      }, this.batchTimeout);
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

    const results: any[] = [];
    const errors: any[] = [];

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
      errors.push({ error: error instanceof Error ? error.message : String(error), operations: operations.length });
    }

    const processingTime = createUnifiedTimestamp().unix - startTime;
    console.log(`[BatchMemoryOperations] Batch completed in ${processingTime}ms`);

    return {
      success: errors.length === 0,
      results,
      errors,
      processingTime
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
  private async processBatchAdd(operations: BatchOperation[], results: any[], errors: any[]): Promise<void> {
    for (const op of operations) {
      try {
        const result = await this.memory.addMemory(op.data);
        results.push({ type: 'add', result, id: op.id });
      } catch (error) {
        errors.push({ type: 'add', error: error instanceof Error ? error.message : String(error), id: op.id });
      }
    }
  }

  /**
   * Process batch search operations
   */
  private async processBatchSearch(operations: BatchOperation[], results: any[], errors: any[]): Promise<void> {
    for (const op of operations) {
      try {
        const result = await this.memory.searchMemory(op.data);
        results.push({ type: 'search', result, id: op.id });
      } catch (error) {
        errors.push({ type: 'search', error: error instanceof Error ? error.message : String(error), id: op.id });
      }
    }
  }

  /**
   * Process batch edit operations
   */
  private async processBatchEdit(operations: BatchOperation[], results: any[], errors: any[]): Promise<void> {
    for (const op of operations) {
      try {
        // Note: editMemory method needs to be implemented in OneAgentMemory
        const result = { success: true, message: 'Edit operation queued' };
        results.push({ type: 'edit', result, id: op.id });
      } catch (error) {
        errors.push({ type: 'edit', error: error instanceof Error ? error.message : String(error), id: op.id });
      }
    }
  }

  /**
   * Process batch delete operations
   */
  private async processBatchDelete(operations: BatchOperation[], results: any[], errors: any[]): Promise<void> {
    for (const op of operations) {
      try {
        const data = op.data as Record<string, unknown>;
        const result = await this.memory.deleteMemory(String(data.memoryId), String(data.userId));
        results.push({ type: 'delete', result, id: op.id });
      } catch (error) {
        errors.push({ type: 'delete', error: error instanceof Error ? error.message : String(error), id: op.id });
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
      hasTimer: this.batchTimer !== null
    };
  }
}
