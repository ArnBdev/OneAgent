/**
 * Embedding Cache for OneAgent Memory System
 * Implements LRU cache with content hashing to reduce API calls
 */

import * as crypto from 'crypto';

export interface CacheEntry {
  embedding: number[];
  timestamp: number;
  contentHash: string;
  accessCount: number;
}

export class EmbeddingCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly maxSize: number;
  private readonly ttlMs: number;

  constructor(maxSize: number = 1000, ttlHours: number = 24) {
    this.maxSize = maxSize;
    this.ttlMs = ttlHours * 60 * 60 * 1000;
  }

  /**
   * Generate content hash for caching
   */
  private generateHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Get cached embedding if available
   */
  getCachedEmbedding(content: string): number[] | null {
    const hash = this.generateHash(content);
    const entry = this.cache.get(hash);
    
    if (!entry) return null;
    
    // Check TTL
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(hash);
      return null;
    }
    
    // Update access count and timestamp
    entry.accessCount++;
    entry.timestamp = Date.now();
    
    return entry.embedding;
  }

  /**
   * Cache embedding
   */
  cacheEmbedding(content: string, embedding: number[]): void {
    const hash = this.generateHash(content);
    
    // LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLeastRecentlyUsed();
    }
    
    this.cache.set(hash, {
      embedding,
      timestamp: Date.now(),
      contentHash: hash,
      accessCount: 1
    });
  }

  /**
   * Evict least recently used entry
   */
  private evictLeastRecentlyUsed(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, entry] of Array.from(this.cache)) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; hitRate: number } {
    const totalAccess = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.accessCount, 0);
    const hitRate = totalAccess > 0 ? (totalAccess - this.cache.size) / totalAccess : 0;
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: Math.max(0, Math.min(1, hitRate))
    };
  }

  /**
   * Clear expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of Array.from(this.cache)) {
      if (now - entry.timestamp > this.ttlMs) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instance
export const globalEmbeddingCache = new EmbeddingCache();
