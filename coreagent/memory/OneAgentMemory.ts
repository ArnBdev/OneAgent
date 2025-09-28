// Canonical OneAgent Memory Integration
// All memory operations must use the canonical RESTful API and follow OneAgent/ALITA standards.
// This module provides a production-grade, type-safe interface for memory actions.

import { unifiedLogger } from '../utils/UnifiedLogger';
import { createUnifiedId } from '../utils/UnifiedBackboneService';
import type { IMemoryClient } from './clients/IMemoryClient';
import { Mem0MemoryClient } from './clients/Mem0MemoryClient';
import { MemgraphMemoryClient } from './clients/MemgraphMemoryClient';
import type {
  MemoryClientConfig,
  MemoryQuery,
  MemoryAddRequest,
  MemoryEditRequest,
  MemoryDeleteRequest,
  MemorySearchResult,
  MemoryHealthStatus,
  MemoryEvent,
} from '../types/oneagent-memory-types';

/**
 * Configuration interface for OneAgentMemory
 */
export type OneAgentMemoryConfig = MemoryClientConfig;

/**
 * Canonical OneAgent memory client with singleton pattern
 * Enhanced with UnifiedMetadata and Constitutional AI integration
 */

export class OneAgentMemory {
  private static instance: OneAgentMemory | null = null;
  private client: IMemoryClient;
  private config: OneAgentMemoryConfig;
  private eventListener?: (event: MemoryEvent) => void;

  constructor(config: OneAgentMemoryConfig) {
    this.config = config;
    // Backend selection logic
    const provider = config.provider || process.env.ONEAGENT_MEMORY_PROVIDER || 'mem0';
    if (provider === 'memgraph') {
      this.client = new MemgraphMemoryClient(config);
    } else {
      this.client = new Mem0MemoryClient(config);
    }
    unifiedLogger.info(`[OneAgentMemory] Initialized with backend: ${this.client.backendName}`);
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: OneAgentMemoryConfig): OneAgentMemory {
    if (!OneAgentMemory.instance) {
      OneAgentMemory.instance = new OneAgentMemory(config || {});
    }
    return OneAgentMemory.instance;
  }

  /**
   * Add a memory item using the canonical IMemoryClient interface
   */
  /**
   * Canonical addMemory: accepts a MemoryAddRequest object
   */
  async addMemory(req: MemoryAddRequest): Promise<string> {
    // Ensure userId is present in metadata for traceability
    if (!req.metadata || typeof req.metadata !== 'object') {
      req.metadata = {};
    }
    if (!('userId' in req.metadata)) {
      req.metadata.userId = 'default-user';
    }
    const result = await this.client.addMemory(req);
    return result.id || createUnifiedId('memory', String(req.metadata.userId));
  }

  async searchMemory(query: MemoryQuery): Promise<MemorySearchResult[]> {
    return this.client.searchMemories(query);
  }

  async editMemory(
    req: MemoryEditRequest,
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    return this.client.editMemory(req);
  }

  async deleteMemory(
    req: MemoryDeleteRequest,
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    return this.client.deleteMemory(req);
  }

  async getHealthStatus(): Promise<MemoryHealthStatus> {
    return this.client.getHealthStatus();
  }

  async getCapabilities(): Promise<string[]> {
    return this.client.getCapabilities();
  }

  async subscribeEvents(onEvent: (event: MemoryEvent) => void): Promise<void> {
    this.eventListener = onEvent;
    await this.client.subscribeEvents(onEvent);
  }

  async unsubscribeEvents(): Promise<void> {
    this.eventListener = undefined;
    await this.client.unsubscribeEvents();
  }

  async close(): Promise<void> {
    await this.unsubscribeEvents();
  }
}
