/**
 * Mem0MemoryClient.ts
 * 
 * TypeScript client for OneAgent Mem0 Memory Server
 * Provides clean interface to Mem0 memory operations
 * 
 * @version 1.0.0
 * @author OneAgent Professional Development Platform
 */

import { oneAgentConfig } from '../config/index';

export interface Mem0Memory {
  id: string;
  content: string;
  user_id: string;
  metadata: Record<string, any>;
  score?: number;
  created_at: string;
  updated_at?: string;
}

export interface Mem0SearchResult {
  success: boolean;
  query: string;
  user_id: string;
  memories: Mem0Memory[];
  total_found: number;
  limit: number;
  error?: string;
}

export interface Mem0CreateResult {
  success: boolean;
  memory_id: string;
  content: string;
  user_id: string;
  metadata: Record<string, any>;
  timestamp: string;
  error?: string;
}

export interface Mem0DeleteResult {
  success: boolean;
  memory_id: string;
  user_id: string;
  message?: string;
  error?: string;
}

export class Mem0MemoryClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = oneAgentConfig.memoryUrl, timeout: number = 10000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Check if the Mem0 server is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) return false;
      
      const result = await response.json();
      return result.status === 'healthy';
    } catch (error) {
      console.error('Mem0 health check failed:', error);
      return false;
    }
  }

  /**
   * Create a new memory entry
   */
  async createMemory(
    content: string,
    userId: string = 'oneagent_system',
    metadata: Record<string, any> = {}
  ): Promise<Mem0CreateResult> {
    try {
      const response = await fetch(`${this.baseUrl}/memory/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          user_id: userId,
          metadata
        }),
        signal: AbortSignal.timeout(this.timeout)
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        memory_id: '',
        content,
        user_id: userId,
        metadata,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Search memories using semantic search
   */
  async searchMemories(
    query: string,
    userId: string = 'oneagent_system',
    limit: number = 10
  ): Promise<Mem0SearchResult> {
    try {
      const response = await fetch(`${this.baseUrl}/memory/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          user_id: userId,
          limit
        }),
        signal: AbortSignal.timeout(this.timeout)
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        query,
        user_id: userId,
        memories: [],
        total_found: 0,
        limit,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get all memories for a user
   */
  async getUserMemories(
    userId: string = 'oneagent_system',
    limit: number = 50
  ): Promise<Mem0SearchResult> {
    try {
      const response = await fetch(`${this.baseUrl}/memory/user/${userId}?limit=${limit}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(this.timeout)
      });

      const result = await response.json();
      
      // Convert to search result format for compatibility
      return {
        success: result.success,
        query: '',
        user_id: userId,
        memories: result.memories || [],
        total_found: result.total_found || 0,
        limit,
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        query: '',
        user_id: userId,
        memories: [],
        total_found: 0,
        limit,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete a memory
   */
  async deleteMemory(
    memoryId: string,
    userId: string = 'oneagent_system'
  ): Promise<Mem0DeleteResult> {
    try {
      const response = await fetch(`${this.baseUrl}/memory/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memory_id: memoryId,
          user_id: userId
        }),
        signal: AbortSignal.timeout(this.timeout)
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        memory_id: memoryId,
        user_id: userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * MCP-compatible method for OneAgent integration
   * This provides compatibility with existing OneAgent memory tools
   */
  async getMemoryContext(
    query: string,
    userId: string = 'oneagent_system',
    limit: number = 10
  ): Promise<Mem0SearchResult> {
    return this.searchMemories(query, userId, limit);
  }
}

// Export singleton instance
export const mem0Client = new Mem0MemoryClient();

// Export for easy importing
export default Mem0MemoryClient;
