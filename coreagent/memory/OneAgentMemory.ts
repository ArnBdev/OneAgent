// Canonical OneAgent Memory Integration using mem0ai
// All memory operations must use the canonical mem0 API and follow OneAgent/ALITA standards.
// This module provides a production-grade, type-safe interface for memory actions.

import mem0 from 'mem0ai';
import fetch from 'node-fetch'; // Add this at the top if not present

/**
 * Configuration interface for OneAgentMemory
 */
export interface OneAgentMemoryConfig {
  apiKey?: string;
  apiUrl?: string | undefined;
  [key: string]: any;
}

/**
 * Canonical OneAgent memory client using mem0ai
 */
export class OneAgentMemory {
  private client: any;
  private config: OneAgentMemoryConfig;

  /**
   * Initialize OneAgentMemory with configuration
   */
  constructor(config: OneAgentMemoryConfig) {
    this.config = config;
    // Only include apiKey if defined (cloud mode); for local, only pass apiUrl
    const clientConfig: any = {};
    if (config.apiUrl) clientConfig.apiUrl = config.apiUrl;
    if (config.apiKey) clientConfig.apiKey = config.apiKey;
    this.client = new mem0(clientConfig);
  }

  /**
   * Add a memory item to a collection (robust, with logging, timeout, and fallback)
   */
  async addMemory(collection: string, data: any): Promise<any> {
    // Always use ONEAGENT_MEMORY_URL from env if available, fallback to 8001
    const baseUrl = process.env.ONEAGENT_MEMORY_URL || this.config.apiUrl || 'http://localhost:8001';
    const endpoint = baseUrl.endsWith('/') ? `${baseUrl}v1/memories/` : `${baseUrl}/v1/memories/`;
    const payload = {
      messages: Array.isArray(data.messages) ? data.messages : [data.content || data.text || data],
      user_id: data.user_id || 'default-user',
      agent_id: data.agent_id || 'default-agent',
      metadata: data.metadata || {},
    };
    const timeoutMs = 10000;
    console.log(`[OneAgentMemory] [addMemory] POST ${endpoint}`);
    console.log(`[OneAgentMemory] [addMemory] Payload:`, payload);
    try {
      // Try mem0ai client first
      const result = await Promise.race([
        this.client.add(collection, data),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout after 10s')), timeoutMs)),
      ]);
      console.log(`[OneAgentMemory] [addMemory] mem0ai client result:`, result);
      return result;
    } catch (clientError) {
      console.warn(`[OneAgentMemory] [addMemory] mem0ai client failed, falling back to direct HTTP:`, clientError);
      // Fallback: direct HTTP POST
      try {
        // Patch: Use cross-compatible AbortController for node-fetch
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
        const timeout = setTimeout(() => controller && controller.abort(), timeoutMs);
        const fetchOptions: any = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
        this.handleError('addMemory (HTTP fallback)', httpError);
      }
    }
  }

  /**
   * Search memory in a collection
   */
  async searchMemory(collection: string, query: any): Promise<any> {
    // Always use ONEAGENT_MEMORY_URL from env if available, fallback to 8001
    const baseUrl = process.env.ONEAGENT_MEMORY_URL || this.config.apiUrl || 'http://localhost:8001';
    const endpoint = baseUrl.endsWith('/') ? `${baseUrl}v1/memories/search/` : `${baseUrl}/v1/memories/search/`;
    const payload = {
      query: query.query || query.text || query,
      user_id: query.user_id || 'default-user',
      agent_id: query.agent_id || 'default-agent',
      limit: query.limit || 5,
    };
    const timeoutMs = 10000;
    console.log(`[OneAgentMemory] [searchMemory] POST ${endpoint}`);
    console.log(`[OneAgentMemory] [searchMemory] Payload:`, payload);
    try {
      // Try mem0ai client first
      const result = await Promise.race([
        this.client.search(collection, query),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout after 10s')), timeoutMs)),
      ]);
      console.log(`[OneAgentMemory] [searchMemory] mem0ai client result:`, result);
      return result;
    } catch (clientError) {
      console.warn(`[OneAgentMemory] [searchMemory] mem0ai client failed, falling back to direct HTTP:`, clientError);
      // Fallback: direct HTTP POST
      try {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
        const timeout = setTimeout(() => controller && controller.abort(), timeoutMs);
        const fetchOptions: any = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
        console.log(`[OneAgentMemory] [searchMemory] HTTP result:`, json);
        return json;
      } catch (httpError) {
        this.handleError('searchMemory (HTTP fallback)', httpError);
      }
    }
  }

  /**
   * Update a memory item in a collection
   */
  async updateMemory(collection: string, id: string, data: any): Promise<any> {
    try {
      return await this.client.update(collection, id, data);
    } catch (error) {
      this.handleError('updateMemory', error);
    }
  }

  /**
   * Delete a memory item in a collection
   */
  async deleteMemory(collection: string, id: string): Promise<any> {
    try {
      return await this.client.delete(collection, id);
    } catch (error) {
      this.handleError('deleteMemory', error);
    }
  }

  /**
   * Graph operations (e.g., get graph neighbors)
   */
  async getGraphNeighbors(nodeId: string, options: any = {}): Promise<any> {
    try {
      return await this.client.graph.getNeighbors(nodeId, options);
    } catch (error) {
      this.handleError('getGraphNeighbors', error);
    }
  }

  /**
   * Add multimodal memory (with embedding)
   */
  async addMultimodalMemory(collection: string, data: any, embedding: number[]): Promise<any> {
    try {
      return await this.client.add(collection, { ...data, embedding });
    } catch (error) {
      this.handleError('addMultimodalMemory', error);
    }
  }

  /**
   * Canonical shutdown/cleanup
   */
  async close(): Promise<void> {
    if (this.client && typeof this.client.close === 'function') {
      await this.client.close();
    }
  }

  /**
   * Professional error handler with transparency and safety
   */
  private handleError(method: string, error: unknown): never {
    const errMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`[OneAgentMemory] ${method} failed: ${errMsg}`);
  }
}

// All memory operations are validated and documented per OneAgent/ALITA standards.
// Extend this module as new mem0 features and best practices are discovered.
