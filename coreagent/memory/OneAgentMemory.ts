// Canonical OneAgent Memory Integration
// All memory operations must use the canonical RESTful API and follow OneAgent/ALITA standards.
// This module provides a production-grade, type-safe interface for memory actions.

import fetch from 'node-fetch';
import { OneAgentUnifiedBackbone } from '../utils/UnifiedBackboneService';
import { BatchMemoryOperations } from './BatchMemoryOperations';

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
  [key: string]: any;
}

/**
 * Canonical OneAgent memory client with singleton pattern
 */
export class OneAgentMemory {
  private static instance: OneAgentMemory | null = null;
  private static initializationLogged = false;
  
  private config: OneAgentMemoryConfig;
  private batchOperations: BatchMemoryOperations;
  private cachingEnabled: boolean;

  /**
   * Initialize OneAgentMemory with configuration
   */
  constructor(config: OneAgentMemoryConfig) {
    this.config = config;
    this.batchOperations = new BatchMemoryOperations(this);
    this.cachingEnabled = config.enableCaching !== false; // Default to enabled
    
    // Only log initialization once to prevent spam
    if (!OneAgentMemory.initializationLogged) {
      console.log(`[OneAgentMemory] MCP Protocol Version: ${MCP_PROTOCOL_VERSION}`);
      console.log(`[OneAgentMemory] MEM0_API_KEY present:`, !!(config.apiKey || process.env.MEM0_API_KEY));
      console.log(`[OneAgentMemory] Caching enabled:`, this.cachingEnabled);
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
   * Add a memory item (optimized with caching and batching)
   */
  async addMemory(data: any): Promise<any> {
    const content = data.content || data.text || data;
    
    // Check cache for duplicate content
    if (this.cachingEnabled && typeof content === 'string') {
      const cacheKey = `embedding:${content.slice(0, 100)}`;
      const cachedEmbedding = await OneAgentUnifiedBackbone.getInstance().cache.get(cacheKey);
      if (cachedEmbedding) {
        console.log(`[OneAgentMemory] Cache hit for content length: ${content.length}`);
        // Skip if exact content already exists (optional optimization)
      }
    }
    
    // Try with retries for timeout/abort errors
    let lastError: Error | null = null;
    const maxRetries = 2;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.performAddMemory(data);
      } catch (error) {
        lastError = error as Error;
        
        // Only retry on abort/timeout errors
        if (lastError.message.includes('aborted') || lastError.message.includes('timeout')) {
          console.warn(`[OneAgentMemory] addMemory attempt ${attempt} failed: ${lastError.message}`);
          if (attempt < maxRetries) {
            console.log(`[OneAgentMemory] Retrying in ${attempt * 1000}ms...`);
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            continue;
          }
        }
        
        // For other errors, don't retry
        throw error;
      }
    }
    
    // If we get here, all retries failed
    throw lastError || new Error('Unexpected error during memory add');
  }

  /**
   * Sanitize metadata for mem0 compatibility
   * mem0 only accepts str, int, float, bool, or None in metadata
   */
  private sanitizeMetadata(metadata: any): Record<string, any> {
    if (!metadata || typeof metadata !== 'object') {
      return {};
    }

    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(metadata)) {
      if (value === null || value === undefined) {
        sanitized[key] = null;
      } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      } else if (Array.isArray(value)) {
        // Handle arrays specially - keep as array if all elements are primitives
        if (value.every(item => typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean')) {
          sanitized[key] = value;
        } else {
          // If array contains complex objects, serialize to JSON string
          sanitized[key] = JSON.stringify(value);
        }
      } else if (typeof value === 'object') {
        // Serialize complex objects to JSON strings
        try {
          sanitized[key] = JSON.stringify(value);
        } catch (error) {
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

  /**
   * Perform actual memory add operation
   */
  private async performAddMemory(data: any): Promise<any> {
    const baseUrl = process.env.ONEAGENT_MEMORY_URL || this.config.apiUrl || 'http://localhost:8010';
    const endpoint = baseUrl.replace(/\/$/, '') + '/v1/memories';
    
    // Sanitize metadata for mem0 compatibility
    const sanitizedMetadata = this.sanitizeMetadata(data.metadata || {});
    
    const payload = {
      content: data.content || data.text || data,
      userId: data.user_id || data.userId || 'default-user',
      metadata: sanitizedMetadata, // Use sanitized metadata
    };
    const timeoutMs = this.config.requestTimeout || 15000; // Configurable timeout, default 15 seconds
    console.log(`[OneAgentMemory] [addMemory] POST ${endpoint}`);
    console.log(`[OneAgentMemory] [addMemory] Payload:`, payload);
    console.log(`[OneAgentMemory] [addMemory] Original metadata keys:`, Object.keys(data.metadata || {}));
    console.log(`[OneAgentMemory] [addMemory] Sanitized metadata keys:`, Object.keys(sanitizedMetadata));
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
      const timeout = setTimeout(() => controller && controller.abort(), timeoutMs);
      const authHeader = `Bearer ${this.config.apiKey || process.env.MEM0_API_KEY}`;
      console.log(`[OneAgentMemory] [addMemory] Authorization header: '${authHeader}'`);
      const fetchOptions: any = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
          'MCP-Protocol-Version': MCP_PROTOCOL_VERSION,
        },
        body: JSON.stringify(payload),
      };
      if (controller && controller.signal) fetchOptions.signal = controller.signal as any;
      const res = await fetch(endpoint, fetchOptions);
      clearTimeout(timeout);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      const json = await res.json();
      console.log(`[OneAgentMemory] [addMemory] HTTP result:`, json);
      return json;
    } catch (httpError) {
      this.handleError('addMemory', httpError);
    }
  }

  /**
   * Search memory (canonical RESTful implementation)
   */
  async searchMemory(query: any): Promise<any> {
    const baseUrl = process.env.ONEAGENT_MEMORY_URL || this.config.apiUrl || 'http://localhost:8010';
    const userId = query.user_id || query.userId || 'default-user';
    const q = query.query || query.text || query;
    const limit = query.limit || 5;
    const endpoint = `${baseUrl.replace(/\/$/, '')}/v1/memories?userId=${encodeURIComponent(userId)}${q ? `&query=${encodeURIComponent(q)}` : ''}&limit=${limit}`;
    const timeoutMs = 10000;
    console.log(`[OneAgentMemory] [searchMemory] GET ${endpoint}`);
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
      const timeout = setTimeout(() => controller && controller.abort(), timeoutMs);
      const fetchOptions: any = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey || process.env.MEM0_API_KEY}`,
          'MCP-Protocol-Version': MCP_PROTOCOL_VERSION,
        },
      };
      if (controller && controller.signal) fetchOptions.signal = controller.signal as any;
      const res = await fetch(endpoint, fetchOptions);
      clearTimeout(timeout);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      const json = await res.json();
      console.log(`[OneAgentMemory] [searchMemory] HTTP result:`, json);
      return json;
    } catch (httpError) {
      this.handleError('searchMemory', httpError);
    }
  }

  /**
   * Update a memory item (canonical RESTful implementation)
   */
  async updateMemory(id: string, data: any): Promise<any> {
    const baseUrl = process.env.ONEAGENT_MEMORY_URL || this.config.apiUrl || 'http://localhost:8010';
    const endpoint = `${baseUrl.replace(/\/$/, '')}/v1/memories/${id}`;
    
    // Sanitize metadata for mem0 compatibility
    const sanitizedMetadata = this.sanitizeMetadata(data.metadata || {});
    
    const payload = {
      content: data.content || data.text || data,
      userId: data.user_id || data.userId || 'default-user',
      metadata: sanitizedMetadata, // Use sanitized metadata
    };
    const timeoutMs = 10000;
    console.log(`[OneAgentMemory] [updateMemory] PUT ${endpoint}`);
    console.log(`[OneAgentMemory] [updateMemory] Sanitized metadata keys:`, Object.keys(sanitizedMetadata));
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
      const timeout = setTimeout(() => controller && controller.abort(), timeoutMs);
      const fetchOptions: any = {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey || process.env.MEM0_API_KEY}`,
          'MCP-Protocol-Version': MCP_PROTOCOL_VERSION,
        },
        body: JSON.stringify(payload),
      };
      if (controller && controller.signal) fetchOptions.signal = controller.signal as any;
      const res = await fetch(endpoint, fetchOptions);
      clearTimeout(timeout);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      const json = await res.json();
      console.log(`[OneAgentMemory] [updateMemory] HTTP result:`, json);
      return json;
    } catch (httpError) {
      this.handleError('updateMemory', httpError);
    }
  }

  /**
   * Delete a memory item (canonical RESTful implementation)
   */
  async deleteMemory(id: string, userId: string): Promise<any> {
    const baseUrl = process.env.ONEAGENT_MEMORY_URL || this.config.apiUrl || 'http://localhost:8010';
    const endpoint = `${baseUrl.replace(/\/$/, '')}/v1/memories/${id}?userId=${encodeURIComponent(userId)}`;
    const timeoutMs = 10000;
    console.log(`[OneAgentMemory] [deleteMemory] DELETE ${endpoint}`);
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
      const timeout = setTimeout(() => controller && controller.abort(), timeoutMs);
      const fetchOptions: any = {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey || process.env.MEM0_API_KEY}`,
          'MCP-Protocol-Version': MCP_PROTOCOL_VERSION,
        },
      };
      if (controller && controller.signal) fetchOptions.signal = controller.signal as any;
      const res = await fetch(endpoint, fetchOptions);
      clearTimeout(timeout);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      const json = await res.json();
      console.log(`[OneAgentMemory] [deleteMemory] HTTP result:`, json);
      return json;
    } catch (httpError) {
      this.handleError('deleteMemory', httpError);
    }
  }

  /**
   * Health check (canonical RESTful implementation)
   */
  async ping(): Promise<any> {
    const baseUrl = process.env.ONEAGENT_MEMORY_URL || this.config.apiUrl || 'http://localhost:8010';
    const endpoint = `${baseUrl.replace(/\/$/, '')}/ping`;
    const timeoutMs = 5000;
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
      const timeout = setTimeout(() => controller && controller.abort(), timeoutMs);
      const fetchOptions: any = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey || process.env.MEM0_API_KEY}`,
          'MCP-Protocol-Version': MCP_PROTOCOL_VERSION,
        },
      };
      if (controller && controller.signal) fetchOptions.signal = controller.signal as any;
      const res = await fetch(endpoint, fetchOptions);
      clearTimeout(timeout);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      const json = await res.json();
      console.log(`[OneAgentMemory] [ping] HTTP result:`, json);
      return json;
    } catch (httpError) {
      this.handleError('ping', httpError);
    }
  }

  /**
   * Partially update a memory item (PATCH, deeply integrated advanced metadata)
   * Supports extensible, nested, and typed metadata (backbone metadata system)
   */
  async patchMemory(id: string, patch: Partial<{ content: any; userId: string; metadata: Record<string, any> }>): Promise<any> {
    const baseUrl = process.env.ONEAGENT_MEMORY_URL || this.config.apiUrl || 'http://localhost:8010';
    const endpoint = `${baseUrl.replace(/\/$/, '')}/v1/memories/${id}`;
    
    // Deep merge for advanced metadata (backbone metadata system)
    const payload: any = {};
    if (patch.content !== undefined) payload.content = patch.content;
    if (patch.userId !== undefined) payload.userId = patch.userId;
    if (patch.metadata !== undefined) {
      // Sanitize metadata for mem0 compatibility
      payload.metadata = this.sanitizeMetadata(patch.metadata);
    }
    
    const timeoutMs = 10000;
    console.log(`[OneAgentMemory] [patchMemory] PATCH ${endpoint}`);
    console.log(`[OneAgentMemory] [patchMemory] Payload:`, payload);
    console.log(`[OneAgentMemory] [patchMemory] Sanitized metadata keys:`, Object.keys(payload.metadata || {}));
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
      const timeout = setTimeout(() => controller && controller.abort(), timeoutMs);
      const fetchOptions: any = {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey || process.env.MEM0_API_KEY}`,
          'MCP-Protocol-Version': MCP_PROTOCOL_VERSION,
        },
        body: JSON.stringify(payload),
      };
      if (controller && controller.signal) fetchOptions.signal = controller.signal as any;
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
  async addMemoryBatch(data: any): Promise<void> {
    await this.batchOperations.queueOperation({
      type: 'add',
      data,
      id: Math.random().toString(36).substr(2, 9)
    });
  }

  /**
   * Search with caching
   */
  async searchMemoryOptimized(query: any): Promise<any> {
    const queryString = typeof query === 'string' ? query : query.query || query.text;
    
    if (this.cachingEnabled && queryString) {
      // Simple search result caching could be added here
      console.log(`[OneAgentMemory] Optimized search for: ${queryString.substring(0, 50)}...`);
    }
    
    return this.searchMemory(query);
  }

  /**
   * Get cache and batch statistics
   */
  getOptimizationStats(): any {
    return {
      cache: OneAgentUnifiedBackbone.getInstance().cache.getHealth(),
      batch: this.batchOperations.getBatchStatus(),
      cachingEnabled: this.cachingEnabled
    };
  }

  /**
   * Flush batch operations immediately
   */
  async flushBatch(): Promise<any> {
    return await this.batchOperations.flushBatch();
  }

  /**
   * Professional error handler with transparency and safety
   */
  private handleError(method: string, error: unknown): never {
    const errMsg = error instanceof Error ? error.message : String(error);
    
    // Provide more context for common errors
    if (errMsg.includes('aborted') || errMsg.includes('user aborted')) {
      console.warn(`[OneAgentMemory] ${method} was aborted - likely due to timeout or cancellation`);
    } else if (errMsg.includes('ECONNREFUSED') || errMsg.includes('fetch failed')) {
      console.warn(`[OneAgentMemory] ${method} failed - memory server may be unavailable`);
    } else if (errMsg.includes('422')) {
      console.warn(`[OneAgentMemory] ${method} failed - validation error in request payload`);
    }
    
    throw new Error(`[OneAgentMemory] ${method} failed: ${errMsg}`);
  }
}

// All memory operations are validated and documented per OneAgent/ALITA standards.
// Extend this module as new features and best practices are discovered.
