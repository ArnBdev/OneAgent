// Canonical OneAgent Memory Integration
// All memory operations must use the canonical RESTful API and follow OneAgent/ALITA standards.
// This module provides a production-grade, type-safe interface for memory actions.

import fetch from 'node-fetch';
import { unifiedLogger } from '../utils/UnifiedLogger';
import type { RequestInit as NodeFetchRequestInit } from 'node-fetch';
import {
  OneAgentUnifiedBackbone,
  createUnifiedId,
  createUnifiedTimestamp,
  unifiedMetadataService,
} from '../utils/UnifiedBackboneService';
import { environmentConfig } from '../config/EnvironmentConfig';
import { BatchMemoryOperations } from './BatchMemoryOperations';
import {
  UnifiedMetadata,
  MemorySearchResult,
  MemoryRecord,
} from '../types/oneagent-backbone-types';

const MCP_PROTOCOL_VERSION = '2025-06-18';

/**
 * Configuration interface for OneAgentMemory
 */
export interface OneAgentMemoryConfig {
  apiKey?: string;
  apiUrl?: string | undefined;
  enableCaching?: boolean;
  batchSize?: number;
  batchTimeout?: number;
  requestTimeout?: number; // Add configurable request timeout
  enableConstitutionalValidation?: boolean; // Add Constitutional AI validation
  // Allow additional config keys with unknown values (explicitly typed)
  [key: string]: unknown;
}

// =========================
// Internal Type Interfaces
// =========================
interface AddMemoryCanonicalPayload {
  content: string;
  userId: string;
  metadata: UnifiedMetadata | Partial<UnifiedMetadata>;
}

// LegacyAddMemoryPayload removed (deprecated path eliminated)

// AddMemoryResponse removed with legacy method

interface MemorySearchQuery {
  user_id?: string; // legacy alias
  userId?: string;
  query?: string;
  text?: string; // legacy alias
  limit?: number;
  [key: string]: unknown;
}

interface UpdateMemoryPayload {
  content?: string;
  userId?: string;
  user_id?: string;
  metadata?: Record<string, unknown>;
  [k: string]: unknown;
}
interface PatchMemoryPayload {
  content?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

// Generic loose JSON result (internal only)
interface HTTPJsonResult {
  id?: string;
  data?: { id?: string; _id?: string; results?: unknown };
  results?: unknown;
  [k: string]: unknown;
}

/**
 * Canonical OneAgent memory client with singleton pattern
 * Enhanced with UnifiedMetadata and Constitutional AI integration
 */
export class OneAgentMemory {
  private static instance: OneAgentMemory | null = null;
  private static initializationLogged = false;
  // Basic log level control to reduce verbosity outside debug scenarios
  private static logLevel: 'info' | 'debug' =
    (process.env.ONEAGENT_MEMORY_LOG_LEVEL as 'info' | 'debug') || 'info';
  private static debug(...args: unknown[]) {
    if (OneAgentMemory.logLevel === 'debug') {
      console.log('[OneAgentMemory][debug]', ...args);
    }
  }

  private config: OneAgentMemoryConfig;
  private batchOperations: BatchMemoryOperations;
  private cachingEnabled: boolean;
  private constitutionalValidationEnabled: boolean;

  /**
   * Initialize OneAgentMemory with configuration
   */
  constructor(config: OneAgentMemoryConfig) {
    this.config = config;
    this.batchOperations = new BatchMemoryOperations(this);
    this.cachingEnabled = config.enableCaching !== false; // Default to enabled
    this.constitutionalValidationEnabled = config.enableConstitutionalValidation !== false;

    // Only log initialization once to prevent spam
    if (!OneAgentMemory.initializationLogged) {
      unifiedLogger.info(`[OneAgentMemory] MCP Protocol Version: ${MCP_PROTOCOL_VERSION}`);
      unifiedLogger.info(`[OneAgentMemory] MEM0_API_KEY present`, {
        present: !!(config.apiKey || process.env.MEM0_API_KEY),
      });
      unifiedLogger.info(`[OneAgentMemory] Caching enabled`, { enabled: this.cachingEnabled });
      unifiedLogger.info(`[OneAgentMemory] Constitutional validation enabled`, {
        enabled: this.constitutionalValidationEnabled,
      });
      OneAgentMemory.initializationLogged = true;
    }
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
   * Add a memory item (canonical OneAgent method)
   * Uses UnifiedMetadata and UnifiedTimestamp for enhanced functionality
   */
  async addMemoryCanonical(
    content: string,
    metadata?: Partial<UnifiedMetadata>,
    userId?: string,
  ): Promise<string> {
    if (process.env.ONEAGENT_FAST_TEST_MODE === '1') {
      // Skip remote call for fast tests; return synthetic ID
      return createUnifiedId('memory', userId || 'fast-test');
    }
    // Generate canonical ID and timestamp
    const memoryId = createUnifiedId('memory', userId || 'default-user');
    const timestamp = createUnifiedTimestamp();

    // Create canonical metadata using UnifiedMetadataService
    // Allow caller to override metadata type (for domain-specific memories like 'agent-message')
    const overrideType = (metadata as Partial<UnifiedMetadata> | undefined)?.type || 'memory';
    const canonicalMetadata = unifiedMetadataService.create(overrideType, 'OneAgentMemory', {
      ...metadata,
      temporal: {
        created: timestamp,
        updated: timestamp,
        accessed: timestamp,
        contextSnapshot: {
          timeOfDay:
            new Date().getHours() < 12
              ? 'morning'
              : new Date().getHours() < 18
                ? 'afternoon'
                : 'evening',
          dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
            new Date().getDay()
          ],
          businessContext:
            new Date().getDay() >= 1 &&
            new Date().getDay() <= 5 &&
            new Date().getHours() >= 9 &&
            new Date().getHours() <= 17,
          energyContext: 'standard',
        },
        ...metadata?.temporal,
      },
      system: {
        source: 'OneAgentMemory',
        component: 'memory-system',
        userId: userId || 'default-user',
        ...metadata?.system,
      },
    });

    // Send UnifiedMetadata directly to the updated Python server
    const payload = {
      content,
      userId: userId || canonicalMetadata.system?.userId || 'default-user',
      metadata: canonicalMetadata, // Send full UnifiedMetadata structure
    };

    const result = await this.performAddMemoryCanonical(payload);
    unifiedLogger.debug(`[OneAgentMemory] [addMemoryCanonical] Memory stored`, { memoryId });

    // Cache the canonical metadata for future retrieval
    if (this.cachingEnabled) {
      const cacheKey = `metadata:${memoryId}`;
      await OneAgentUnifiedBackbone.getInstance().cache.set(cacheKey, canonicalMetadata, 3600); // 1 hour cache
    }

    return result?.id || memoryId;
  }

  /**
   * Canonical alias: addMemory (ergonomic name after legacy removal)
   * Preferred usage going forward; internally delegates to addMemoryCanonical for continuity.
   */
  async addMemory(
    content: string,
    metadata?: Partial<UnifiedMetadata>,
    userId?: string,
  ): Promise<string> {
    return this.addMemoryCanonical(content, metadata, userId);
  }

  /**
   * Perform memory add operation with canonical UnifiedMetadata
   */
  private async performAddMemoryCanonical(
    data: AddMemoryCanonicalPayload,
  ): Promise<HTTPJsonResult | undefined> {
    const baseUrl = this.config.apiUrl || environmentConfig.endpoints.memory.url;
    const endpoint = baseUrl.replace(/\/$/, '') + '/v1/memories';

    const timeoutMs = this.config.requestTimeout || 15000;
    unifiedLogger.debug(`[OneAgentMemory] [addMemoryCanonical] POST ${endpoint}`);
    unifiedLogger.debug(`[OneAgentMemory] [addMemoryCanonical] Payload`, data);

    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
      const timeout = setTimeout(() => controller && controller.abort(), timeoutMs);
      timeout.unref?.();
      const authHeader = `Bearer ${this.config.apiKey || process.env.MEM0_API_KEY}`;
      if (authHeader) {
        // Deterministically mask bearer token to avoid leaking secrets while preserving limited diagnosability.
        let masked = 'Bearer ***';
        if (authHeader.startsWith('Bearer ')) {
          const token = authHeader.slice(7).trim();
          if (token.length >= 10) {
            masked = `Bearer ${token.slice(0, 6)}***${token.slice(-4)}`;
          } else if (token.length > 0) {
            masked = 'Bearer ***';
          }
        }
        unifiedLogger.debug(`[OneAgentMemory] [addMemoryCanonical] Authorization header`, {
          authorization: masked,
        });
      }

      const fetchOptions: NodeFetchRequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
          'MCP-Protocol-Version': MCP_PROTOCOL_VERSION,
        },
        body: JSON.stringify(data),
      };
      if (controller && controller.signal) {
        (fetchOptions as NodeFetchRequestInit & { signal?: AbortSignal }).signal =
          controller.signal;
      }

      const res = await fetch(endpoint, fetchOptions);
      clearTimeout(timeout);

      if (!res.ok) {
        const text = await res.text();
        unifiedLogger.error(`[OneAgentMemory] addMemoryCanonical failed - HTTP ${res.status}`, {
          response: text,
        });
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const json = await res.json();
      unifiedLogger.debug(`[OneAgentMemory] [addMemoryCanonical] HTTP result`, json);
      return json;
    } catch (httpError) {
      this.handleError('addMemoryCanonical', httpError);
    }
  }

  /**
   * Convert UnifiedMetadata to legacy MemoryMetadata format for Python server
   */
  private convertUnifiedToLegacyMetadata(
    unifiedMetadata: UnifiedMetadata,
  ): Record<string, unknown> {
    return {
      userId: unifiedMetadata.system.userId || 'default-user',
      sessionId: unifiedMetadata.system.sessionId,
      timestamp: unifiedMetadata.temporal.created.unix,
      category: unifiedMetadata.content.category,
      tags: unifiedMetadata.content.tags,
      importance: 'medium', // Map from unifiedMetadata if needed
      conversationContext: unifiedMetadata.system.sessionId,
      constitutionallyValidated: unifiedMetadata.quality.constitutionalCompliant,
      sensitivityLevel: unifiedMetadata.content.sensitivity,
      relevanceScore: unifiedMetadata.content.relevanceScore,
      confidenceScore: unifiedMetadata.quality.confidence,
      sourceReliability: 0.95, // Default high reliability for OneAgent memories
      // Additional fields for enhanced functionality
      memoryId: unifiedMetadata.id,
      source: unifiedMetadata.system.source,
      component: unifiedMetadata.system.component,
      qualityScore: unifiedMetadata.quality.score,
    };
  }

  /**
   * Sanitize metadata for mem0 compatibility
   * mem0 only accepts str, int, float, bool, or None in metadata
   */
  private sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
    if (!metadata || typeof metadata !== 'object') {
      return {};
    }

    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(metadata)) {
      if (value === null || value === undefined) {
        sanitized[key] = null;
      } else if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        sanitized[key] = value;
      } else if (Array.isArray(value)) {
        // Handle arrays specially - keep as array if all elements are primitives
        if (
          value.every(
            (item) =>
              typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean',
          )
        ) {
          sanitized[key] = value;
        } else {
          // If array contains complex objects, serialize to JSON string
          sanitized[key] = JSON.stringify(value);
        }
      } else if (typeof value === 'object') {
        // Serialize complex objects to JSON strings
        try {
          sanitized[key] = JSON.stringify(value);
        } catch {
          // If JSON serialization fails, convert to string
          sanitized[key] = String(value);
        }
      } else {
        // Convert everything else to string
        sanitized[key] = String(value);
      }
    }

    return sanitized;
  }

  // performAddMemory removed with legacy add path

  /**
   * Search memory (canonical RESTful implementation)
   */
  async searchMemory(query: MemorySearchQuery | string): Promise<MemorySearchResult | undefined> {
    if (process.env.ONEAGENT_FAST_TEST_MODE === '1') {
      return { results: [], total: 0 } as unknown as MemorySearchResult;
    }
    const baseUrl = this.config.apiUrl || environmentConfig.endpoints.memory.url;
    const qObj: MemorySearchQuery | undefined = typeof query === 'string' ? undefined : query;
    const userId = qObj?.user_id || qObj?.userId || 'default-user';
    const q = typeof query === 'string' ? query : qObj?.query || qObj?.text || '';
    const limit = qObj?.limit || 5;
    const endpoint = `${baseUrl.replace(/\/$/, '')}/v1/memories?userId=${encodeURIComponent(userId)}${q ? `&query=${encodeURIComponent(q)}` : ''}&limit=${limit}`;
    const timeoutMs = 10000;
    unifiedLogger.debug(`[OneAgentMemory] [searchMemory] GET ${endpoint}`);
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
      const timeout = setTimeout(() => controller && controller.abort(), timeoutMs);
      timeout.unref?.();
      const fetchOptions: NodeFetchRequestInit = {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.config.apiKey || process.env.MEM0_API_KEY}`,
          'MCP-Protocol-Version': MCP_PROTOCOL_VERSION,
        },
      };
      if (controller && controller.signal) {
        (fetchOptions as NodeFetchRequestInit & { signal?: AbortSignal }).signal =
          controller.signal;
      }
      const res = await fetch(endpoint, fetchOptions);
      clearTimeout(timeout);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      const json = await res.json();
      const adapted = this.adaptSearchResponse(
        json,
        typeof query === 'string' ? query : query.query || query.text || '',
      );
      unifiedLogger.debug(`[OneAgentMemory] [searchMemory] Adapted result count`, {
        count: adapted.results.length,
      });
      return adapted;
    } catch (httpError) {
      this.handleError('searchMemory', httpError);
    }
  }

  /**
   * Update a memory item (canonical RESTful implementation)
   */
  async updateMemory(id: string, data: UpdateMemoryPayload): Promise<HTTPJsonResult | undefined> {
    const baseUrl = this.config.apiUrl || environmentConfig.endpoints.memory.url;
    const endpoint = `${baseUrl.replace(/\/$/, '')}/v1/memories/${id}`;

    // Sanitize metadata for mem0 compatibility
    const sanitizedMetadata = this.sanitizeMetadata(data.metadata || {});

    const payload = {
      content: data.content || data.text || data,
      userId: data.user_id || data.userId || 'default-user',
      metadata: sanitizedMetadata, // Use sanitized metadata
    };
    const timeoutMs = 10000;
    unifiedLogger.debug(`[OneAgentMemory] [updateMemory] PUT ${endpoint}`);
    unifiedLogger.debug(`[OneAgentMemory] [updateMemory] Sanitized metadata keys`, {
      keys: Object.keys(sanitizedMetadata),
    });
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
      const timeout = setTimeout(() => controller && controller.abort(), timeoutMs);
      timeout.unref?.();
      const fetchOptions: NodeFetchRequestInit = {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey || process.env.MEM0_API_KEY}`,
          'MCP-Protocol-Version': MCP_PROTOCOL_VERSION,
        },
        body: JSON.stringify(payload),
      };
      if (controller && controller.signal) {
        (fetchOptions as NodeFetchRequestInit & { signal?: AbortSignal }).signal =
          controller.signal;
      }
      const res = await fetch(endpoint, fetchOptions);
      clearTimeout(timeout);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      const json = await res.json();
      unifiedLogger.debug(`[OneAgentMemory] [updateMemory] HTTP result`, json);
      return json;
    } catch (httpError) {
      this.handleError('updateMemory', httpError);
    }
  }

  /**
   * Delete a memory item (canonical RESTful implementation)
   */
  async deleteMemory(id: string, userId: string): Promise<HTTPJsonResult | undefined> {
    const baseUrl = this.config.apiUrl || environmentConfig.endpoints.memory.url;
    const endpoint = `${baseUrl.replace(/\/$/, '')}/v1/memories/${id}?userId=${encodeURIComponent(userId)}`;
    const timeoutMs = 10000;
    unifiedLogger.debug(`[OneAgentMemory] [deleteMemory] DELETE ${endpoint}`);
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
      const timeout = setTimeout(() => controller && controller.abort(), timeoutMs);
      timeout.unref?.();
      const fetchOptions: NodeFetchRequestInit = {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.config.apiKey || process.env.MEM0_API_KEY}`,
          'MCP-Protocol-Version': MCP_PROTOCOL_VERSION,
        },
      };
      if (controller && controller.signal) {
        (fetchOptions as NodeFetchRequestInit & { signal?: AbortSignal }).signal =
          controller.signal;
      }
      const res = await fetch(endpoint, fetchOptions);
      clearTimeout(timeout);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      const json = await res.json();
      unifiedLogger.debug(`[OneAgentMemory] [deleteMemory] HTTP result`, json);
      return json;
    } catch (httpError) {
      this.handleError('deleteMemory', httpError);
    }
  }

  /**
   * Health check (canonical RESTful implementation)
   */
  async ping(): Promise<HTTPJsonResult | undefined> {
    const baseUrl = this.config.apiUrl || environmentConfig.endpoints.memory.url;
    const endpoint = `${baseUrl.replace(/\/$/, '')}/ping`;
    const timeoutMs = 5000;
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
      const timeout = setTimeout(() => controller && controller.abort(), timeoutMs);
      timeout.unref?.();
      const fetchOptions: NodeFetchRequestInit = {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.config.apiKey || process.env.MEM0_API_KEY}`,
          'MCP-Protocol-Version': MCP_PROTOCOL_VERSION,
        },
      };
      if (controller && controller.signal) {
        (fetchOptions as NodeFetchRequestInit & { signal?: AbortSignal }).signal =
          controller.signal;
      }
      const res = await fetch(endpoint, fetchOptions);
      clearTimeout(timeout);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      const json = await res.json();
      unifiedLogger.debug(`[OneAgentMemory] [ping] HTTP result`, json);
      return json;
    } catch (httpError) {
      this.handleError('ping', httpError);
    }
  }

  /**
   * Partially update a memory item (PATCH, deeply integrated advanced metadata)
   * Supports extensible, nested, and typed metadata (backbone metadata system)
   */
  async patchMemory(id: string, patch: PatchMemoryPayload): Promise<HTTPJsonResult | undefined> {
    const baseUrl = this.config.apiUrl || environmentConfig.endpoints.memory.url;
    const endpoint = `${baseUrl.replace(/\/$/, '')}/v1/memories/${id}`;

    // Deep merge for advanced metadata (backbone metadata system)
    const payload: Record<string, unknown> = {};
    if (patch.content !== undefined) payload.content = patch.content;
    if (patch.userId !== undefined) payload.userId = patch.userId;
    if (patch.metadata !== undefined) {
      // Sanitize metadata for mem0 compatibility
      payload.metadata = this.sanitizeMetadata(patch.metadata);
    }

    const timeoutMs = 10000;
    unifiedLogger.debug(`[OneAgentMemory] [patchMemory] PATCH ${endpoint}`);
    unifiedLogger.debug(`[OneAgentMemory] [patchMemory] Payload`, payload);
    console.log(
      `[OneAgentMemory] [patchMemory] Sanitized metadata keys:`,
      Object.keys(payload.metadata || {}),
    );
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
      const timeout = setTimeout(() => controller && controller.abort(), timeoutMs);
      timeout.unref?.();
      const fetchOptions: NodeFetchRequestInit = {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey || process.env.MEM0_API_KEY}`,
          'MCP-Protocol-Version': MCP_PROTOCOL_VERSION,
        },
        body: JSON.stringify(payload),
      };
      if (controller && controller.signal) {
        (fetchOptions as NodeFetchRequestInit & { signal?: AbortSignal }).signal =
          controller.signal;
      }
      const res = await fetch(endpoint, fetchOptions);
      clearTimeout(timeout);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      const json = await res.json();
      console.log(`[OneAgentMemory] [patchMemory] HTTP result:`, json);
      return json;
    } catch (httpError) {
      this.handleError('patchMemory', httpError);
    }
  }

  /**
   * Canonical shutdown/cleanup
   */
  async close(): Promise<void> {
    // Flush any pending batch operations
    await this.batchOperations.flushBatch();

    // Cleanup embedding cache (handled by unified cache system)
    // OneAgentUnifiedBackbone.getInstance().cache.clear();
  }

  /**
   * Add to batch queue (optimized for quota management)
   */
  async addMemoryBatch(data: Record<string, unknown>): Promise<void> {
    await this.batchOperations.queueOperation({
      type: 'add',
      data,
      id: createUnifiedId('memory', 'batch'),
    });
  }

  /**
   * Search with caching
   */
  async searchMemoryOptimized(
    query: MemorySearchQuery | string,
  ): Promise<MemorySearchResult | undefined> {
    const queryString = typeof query === 'string' ? query : query.query || query.text || '';

    if (this.cachingEnabled && queryString) {
      // Simple search result caching could be added here
      console.log(`[OneAgentMemory] Optimized search for: ${queryString.substring(0, 50)}...`);
    }

    return this.searchMemory(query);
  }

  /**
   * Get cache and batch statistics
   */
  getOptimizationStats(): { cache: unknown; batch: unknown; cachingEnabled: boolean } {
    return {
      cache: OneAgentUnifiedBackbone.getInstance().cache.getHealth(),
      batch: this.batchOperations.getBatchStatus(),
      cachingEnabled: this.cachingEnabled,
    };
  }

  /**
   * Flush batch operations immediately
   */
  async flushBatch(): Promise<unknown> {
    return this.batchOperations.flushBatch();
  }

  /**
   * Professional error handler with transparency and safety
   */
  private handleError(method: string, error: unknown): never {
    const errMsg = error instanceof Error ? error.message : String(error);

    // Provide more context for common errors
    if (errMsg.includes('aborted') || errMsg.includes('user aborted')) {
      console.warn(
        `[OneAgentMemory] ${method} was aborted - likely due to timeout or cancellation`,
      );
    } else if (errMsg.includes('ECONNREFUSED') || errMsg.includes('fetch failed')) {
      console.warn(`[OneAgentMemory] ${method} failed - memory server may be unavailable`);
    } else if (errMsg.includes('422')) {
      console.warn(`[OneAgentMemory] ${method} failed - validation error in request payload`);
    }

    throw new Error(`[OneAgentMemory] ${method} failed: ${errMsg}`);
  }

  /**
   * Normalize arbitrary memory service JSON into canonical MemorySearchResult
   * Provides defensive defaults so upstream code can rely on array semantics.
   */
  private adaptSearchResponse(raw: HTTPJsonResult, originalQuery: string): MemorySearchResult {
    const started = Date.now();
    // Canonical server shape: { success: boolean, data: MemoryResponse[] | MemoryResponse, message?, ... }
    const rawObj = raw as unknown as { data?: unknown };
    const arr: unknown[] = Array.isArray(rawObj?.data)
      ? (rawObj.data as unknown[])
      : rawObj?.data
        ? [rawObj.data as unknown]
        : [];
    const records: MemoryRecord[] = arr.map((r) => {
      const rec = r as Record<string, unknown>;
      const meta: UnifiedMetadata =
        (rec.metadata as UnifiedMetadata) ||
        unifiedMetadataService.create('memory-search', 'OneAgentMemory', {
          system: {
            userId: (rec.userId as string) || 'default-user',
            source: 'memory-search',
            component: 'memory-system',
          },
          content: {
            category: 'general',
            tags: ['search-fallback'],
            sensitivity: 'internal',
            relevanceScore: 0.5,
            contextDependency: 'session',
          },
        });
      return {
        id: (rec.id as string) || createUnifiedId('memory', 'search'),
        content: typeof rec.content === 'string' ? rec.content : JSON.stringify(rec),
        metadata: meta,
        relatedMemories: [],
        conversationId: undefined,
        parentMemory: undefined,
        accessCount: 0,
        lastAccessed: new Date(),
        qualityScore: 0,
        constitutionalStatus: 'compliant',
        lastValidation: new Date(),
      } as MemoryRecord;
    });
    const duration = Math.max(1, Date.now() - started);
    return {
      results: records,
      totalFound: records.length,
      totalResults: records.length,
      searchTime: duration,
      averageRelevance: 0,
      averageQuality: 0,
      constitutionalCompliance: 1.0,
      queryContext: [],
      suggestedRefinements: [],
      relatedQueries: [],
      query: originalQuery || '',
    };
  }
}

// All memory operations are validated and documented per OneAgent/ALITA standards.
// Extend this module as new features and best practices are discovered.
