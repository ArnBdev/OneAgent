import { OneAgentMemory } from '../memory/OneAgentMemory';
import {
  IMemoryClient,
  UnifiedMetadata,
  MemorySearchOptions,
  MemorySearchResult,
  MemoryRecord,
  UnifiedMemoryEntry
} from '../types/oneagent-backbone-types';

/**
 * Canonical wrapper for OneAgentMemory implementing IMemoryClient
 */
export class OneAgentMemoryMemoryClient implements IMemoryClient {
  private client: OneAgentMemory;

  constructor(config?: any) {
    this.client = OneAgentMemory.getInstance(config);
  }

  async store(content: string, metadata: UnifiedMetadata): Promise<string> {
    const result = await this.client.addMemory({ content, metadata });
    return result?.id || '';
  }

  async retrieve(query: string, options?: MemorySearchOptions): Promise<MemorySearchResult> {
    const res = await this.client.searchMemory({ query, ...options });
    // Canonicalize result to MemorySearchResult
    return {
      results: Array.isArray(res) ? res : [],
      totalFound: Array.isArray(res) ? res.length : 0,
      searchTime: 0,
      averageRelevance: 0,
      averageQuality: 0,
      constitutionalCompliance: 1,
      queryContext: [],
      suggestedRefinements: [],
      relatedQueries: []
    };
  }

  async update(id: string, changes: Partial<MemoryRecord>): Promise<boolean> {
    await this.client.updateMemory(id, changes);
    return true;
  }

  async delete(id: string): Promise<boolean> {
    await this.client.deleteMemory(id, 'default-user');
    return true;
  }

  async findSimilar(contentId: string, threshold?: number): Promise<MemoryRecord[]> {
    // Not implemented in mem0; stub for future memgraph integration
    return [];
  }

  async getByTags(tags: string[]): Promise<MemoryRecord[]> {
    // Not implemented; stub
    return [];
  }

  async getByTimeRange(start: Date, end: Date): Promise<MemoryRecord[]> {
    // Not implemented; stub
    return [];
  }

  async getStats(): Promise<any> {
    return this.client.getOptimizationStats();
  }

  async optimizeStorage(): Promise<void> {
    // Not implemented; stub
  }

  async validateCompliance(content: string): Promise<boolean> {
    // Not implemented; stub
    return true;
  }

  async auditMemories(): Promise<any[]> {
    // Not implemented; stub
    return [];
  }
}
