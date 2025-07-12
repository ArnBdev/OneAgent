/**
 * Embedding Cache System for OneAgent Performance Optimization
 * 
 * Provides intelligent caching of embeddings to reduce API calls and improve
 * response times for the OneAgent system.
 * 
 * Features:
 * - LRU eviction policy
 * - TTL-based expiration
 * - Memory usage monitoring
 * - Performance metrics
 */

import { EmbeddingResult } from '../types/gemini';

export interface CacheOptions {
  maxSize?: number;
  ttlMs?: number;
  enableMetrics?: boolean;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  totalRequests: number;
  hitRate: number;
  memoryUsage: number;
  estimatedSavingsMs: number;
}

interface CacheEntry {
  embedding: EmbeddingResult;
  accessTime: number;
  createdTime: number;
  accessCount: number;
}

/**
 * High-performance LRU cache with TTL for embeddings
 */
export class EmbeddingCache {
  private cache = new Map<string, CacheEntry>();
  private readonly maxSize: number;
  private readonly ttlMs: number;
  private readonly enableMetrics: boolean;
  
  // Performance metrics
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalRequests: 0,
    hitRate: 0,
    memoryUsage: 0,
    estimatedSavingsMs: 0
  };

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 1000;
    this.ttlMs = options.ttlMs || 3600000; // 1 hour default
    this.enableMetrics = options.enableMetrics ?? true;
    
    console.log(`🚀 EmbeddingCache initialized: maxSize=${this.maxSize}, ttl=${this.ttlMs}ms`);
  }

  /**
   * Generate cache key for text and options
   */
  private generateKey(text: string, model?: string, taskType?: string): string {
    const normalizedText = text.trim().toLowerCase();
    const keyComponents = [normalizedText, model || 'default', taskType || 'default'];
    return Buffer.from(keyComponents.join('|')).toString('base64');
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.createdTime > this.ttlMs;
  }

  /**
   * Evict least recently used entries
   */
  private evictLRU(): void {
    if (this.cache.size <= this.maxSize) return;

    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].accessTime - b[1].accessTime);

    const toEvict = entries.slice(0, entries.length - this.maxSize + 1);
    
    for (const [key] of toEvict) {
      this.cache.delete(key);
      if (this.enableMetrics) {
        this.metrics.evictions++;
      }
    }

    console.log(`♻️ Evicted ${toEvict.length} LRU cache entries`);
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      console.log(`🧹 Cleaned up ${expiredCount} expired cache entries`);
    }
  }

  /**
   * Get embedding from cache
   */
  get(text: string, model?: string, taskType?: string): EmbeddingResult | null {
    if (this.enableMetrics) {
      this.metrics.totalRequests++;
    }

    const key = this.generateKey(text, model, taskType);
    const entry = this.cache.get(key);

    if (!entry || this.isExpired(entry)) {
      if (entry) {
        this.cache.delete(key);
      }
      
      if (this.enableMetrics) {
        this.metrics.misses++;
      }
      return null;
    }

    // Update access time and count
    entry.accessTime = Date.now();
    entry.accessCount++;
    this.cache.set(key, entry);

    if (this.enableMetrics) {
      this.metrics.hits++;
      this.metrics.estimatedSavingsMs += 100; // Approximate API call time
    }

    return entry.embedding;
  }

  /**
   * Store embedding in cache
   */
  set(text: string, embedding: EmbeddingResult, model?: string, taskType?: string): void {
    const key = this.generateKey(text, model, taskType);
    const now = Date.now();

    const entry: CacheEntry = {
      embedding,
      accessTime: now,
      createdTime: now,
      accessCount: 1
    };

    this.cache.set(key, entry);

    // Perform maintenance
    this.evictLRU();
    
    // Periodically clean up expired entries
    if (Math.random() < 0.1) { // 10% chance
      this.cleanupExpired();
    }
  }

  /**
   * Check if embedding exists in cache
   */
  has(text: string, model?: string, taskType?: string): boolean {
    const key = this.generateKey(text, model, taskType);
    const entry = this.cache.get(key);
    return entry !== undefined && !this.isExpired(entry);
  }

  /**
   * Get cache performance metrics
   */
  getMetrics(): CacheMetrics {
    if (!this.enableMetrics) {
      return { ...this.metrics, hitRate: 0 };
    }

    this.metrics.hitRate = this.metrics.totalRequests > 0 
      ? this.metrics.hits / this.metrics.totalRequests 
      : 0;

    // Estimate memory usage (approximate)
    this.metrics.memoryUsage = this.cache.size * 768 * 8; // 768 dims * 8 bytes per float64

    return { ...this.metrics };
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    
    // Reset metrics
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalRequests: 0,
      hitRate: 0,
      memoryUsage: 0,
      estimatedSavingsMs: 0
    };

    console.log(`🗑️ Cache cleared: ${size} entries removed`);
  }

  /**
   * Get cache size and status
   */
  getStatus(): {
    size: number;
    maxSize: number;
    utilizationPercent: number;
    oldestEntryAge: number;
    newestEntryAge: number;
  } {
    if (this.cache.size === 0) {
      return {
        size: 0,
        maxSize: this.maxSize,
        utilizationPercent: 0,
        oldestEntryAge: 0,
        newestEntryAge: 0
      };
    }

    const now = Date.now();
    const entries = Array.from(this.cache.values());
    const creationTimes = entries.map(e => e.createdTime);

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      utilizationPercent: (this.cache.size / this.maxSize) * 100,
      oldestEntryAge: now - Math.min(...creationTimes),
      newestEntryAge: now - Math.max(...creationTimes)
    };
  }

  /**
   * Warm up cache with common queries
   */
  async warmUp(commonQueries: string[], generateEmbedding: (text: string) => Promise<EmbeddingResult>): Promise<void> {
    console.log(`🔥 Warming up cache with ${commonQueries.length} common queries...`);
    
    const warmupPromises = commonQueries.map(async (query) => {
      if (!this.has(query)) {
        try {
          const embedding = await generateEmbedding(query);
          this.set(query, embedding);
        } catch (error) {
          console.warn(`⚠️ Failed to warm up cache for query: "${query.substring(0, 30)}..."`);
        }
      }
    });

    await Promise.all(warmupPromises);
    console.log(`✅ Cache warmup completed: ${this.cache.size} entries loaded`);
  }
}
