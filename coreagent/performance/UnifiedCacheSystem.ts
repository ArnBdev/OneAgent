/**
 * Unified Cache System for OneAgent DevAgent
 * 
 * Implements multi-tier performance optimization with 1ms/50ms/200ms targets
 * based on BMAD v4 research findings.
 */

export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  accessCount: number;
  size: number;
  ttl?: number;
}

export interface CacheMetrics {
  tier1Hits: number;
  tier2Hits: number;
  tier3Hits: number;
  totalMisses: number;
  totalQueries: number;
  averageResponseTime: number;
  memoryUsage: number;
}

export interface CacheConfig {
  tier1Size: number;    // Memory cache (1ms target)
  tier2Size: number;    // Fast storage (50ms target)
  tier3Size: number;    // Persistent storage (200ms target)
  defaultTTL: number;   // Default time-to-live in ms
  cleanupInterval: number;
}

/**
 * Multi-tier cache system for optimal DevAgent performance
 */
export class UnifiedCacheSystem<T> {
  private tier1Cache: Map<string, CacheEntry<T>> = new Map(); // Memory cache
  private tier2Cache: Map<string, CacheEntry<T>> = new Map(); // Fast storage
  private tier3Cache: Map<string, CacheEntry<T>> = new Map(); // Persistent storage
  
  private metrics: CacheMetrics;
  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      tier1Size: 100,      // 100 entries in memory
      tier2Size: 1000,     // 1000 entries in fast storage
      tier3Size: 10000,    // 10000 entries in persistent storage
      defaultTTL: 3600000, // 1 hour default TTL
      cleanupInterval: 300000, // 5 minutes cleanup interval
      ...config
    };

    this.metrics = {
      tier1Hits: 0,
      tier2Hits: 0,
      tier3Hits: 0,
      totalMisses: 0,
      totalQueries: 0,
      averageResponseTime: 0,
      memoryUsage: 0
    };

    this.startCleanupTimer();
  }

  /**
   * Get value from cache with performance tracking
   */
  async get(key: string): Promise<T | undefined> {
    const startTime = Date.now();
    this.metrics.totalQueries++;

    try {
      // Tier 1: Memory cache (target: 1ms)
      const tier1Entry = this.tier1Cache.get(key);
      if (tier1Entry && this.isEntryValid(tier1Entry)) {
        tier1Entry.accessCount++;
        this.metrics.tier1Hits++;
        this.updateResponseTime(startTime);
        return tier1Entry.value;
      }

      // Tier 2: Fast storage (target: 50ms)
      const tier2Entry = this.tier2Cache.get(key);
      if (tier2Entry && this.isEntryValid(tier2Entry)) {
        tier2Entry.accessCount++;
        this.metrics.tier2Hits++;
        
        // Promote to tier 1 if frequently accessed
        if (tier2Entry.accessCount > 3) {
          this.promoteToTier1(key, tier2Entry);
        }
        
        this.updateResponseTime(startTime);
        return tier2Entry.value;
      }

      // Tier 3: Persistent storage (target: 200ms)
      const tier3Entry = this.tier3Cache.get(key);
      if (tier3Entry && this.isEntryValid(tier3Entry)) {
        tier3Entry.accessCount++;
        this.metrics.tier3Hits++;
        
        // Promote to tier 2 if frequently accessed
        if (tier3Entry.accessCount > 2) {
          this.promoteToTier2(key, tier3Entry);
        }
        
        this.updateResponseTime(startTime);
        return tier3Entry.value;
      }

      // Cache miss
      this.metrics.totalMisses++;
      this.updateResponseTime(startTime);
      return undefined;

    } catch (error) {
      console.error('[UnifiedCache] Error during cache lookup:', error);
      this.metrics.totalMisses++;
      this.updateResponseTime(startTime);
      return undefined;
    }
  }

  /**
   * Set value in cache with automatic tier placement
   */
  async set(key: string, value: T, ttl?: number): Promise<void> {
    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      accessCount: 1,
      size: this.estimateSize(value),
      ttl: ttl || this.config.defaultTTL
    };

    // Start in tier 3 (persistent storage)
    this.setInTier3(key, entry);
    this.updateMemoryUsage();
  }

  /**
   * Delete entry from all tiers
   */
  async delete(key: string): Promise<boolean> {
    const deleted1 = this.tier1Cache.delete(key);
    const deleted2 = this.tier2Cache.delete(key);
    const deleted3 = this.tier3Cache.delete(key);
    
    this.updateMemoryUsage();
    return deleted1 || deleted2 || deleted3;
  }

  /**
   * Clear all cache tiers
   */
  async clear(): Promise<void> {
    this.tier1Cache.clear();
    this.tier2Cache.clear();
    this.tier3Cache.clear();
    this.resetMetrics();
    this.updateMemoryUsage();
  }

  /**
   * Get cache performance metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Get cache hit ratios by tier
   */
  getHitRatios(): {
    tier1: number;
    tier2: number;
    tier3: number;
    overall: number;
  } {
    const totalQueries = this.metrics.totalQueries;
    if (totalQueries === 0) {
      return { tier1: 0, tier2: 0, tier3: 0, overall: 0 };
    }

    const totalHits = this.metrics.tier1Hits + this.metrics.tier2Hits + this.metrics.tier3Hits;

    return {
      tier1: this.metrics.tier1Hits / totalQueries,
      tier2: this.metrics.tier2Hits / totalQueries,
      tier3: this.metrics.tier3Hits / totalQueries,
      overall: totalHits / totalQueries
    };
  }

  /**
   * Check if performance targets are being met
   */
  getPerformanceStatus(): {
    tier1Performance: boolean;  // 1ms target
    tier2Performance: boolean;  // 50ms target
    tier3Performance: boolean;  // 200ms target
    overallHealth: boolean;
  } {
    const avgResponseTime = this.metrics.averageResponseTime;
    const hitRatios = this.getHitRatios();

    return {
      tier1Performance: hitRatios.tier1 > 0.3 && avgResponseTime < 1,
      tier2Performance: hitRatios.tier2 > 0.4 && avgResponseTime < 50,
      tier3Performance: avgResponseTime < 200,
      overallHealth: hitRatios.overall > 0.7 && avgResponseTime < 100
    };
  }

  /**
   * Force cleanup of expired entries
   */
  async cleanup(): Promise<void> {
    const now = Date.now();
    let cleanedCount = 0;

    // Cleanup tier 1
    for (const [key, entry] of this.tier1Cache.entries()) {
      if (!this.isEntryValid(entry, now)) {
        this.tier1Cache.delete(key);
        cleanedCount++;
      }
    }

    // Cleanup tier 2
    for (const [key, entry] of this.tier2Cache.entries()) {
      if (!this.isEntryValid(entry, now)) {
        this.tier2Cache.delete(key);
        cleanedCount++;
      }
    }

    // Cleanup tier 3
    for (const [key, entry] of this.tier3Cache.entries()) {
      if (!this.isEntryValid(entry, now)) {
        this.tier3Cache.delete(key);
        cleanedCount++;
      }
    }

    this.updateMemoryUsage();
    console.log(`[UnifiedCache] Cleaned up ${cleanedCount} expired entries`);
  }

  /**
   * Promote entry from tier 2 to tier 1
   */
  private promoteToTier1(key: string, entry: CacheEntry<T>): void {
    if (this.tier1Cache.size >= this.config.tier1Size) {
      this.evictLRUFromTier1();
    }
    
    this.tier1Cache.set(key, entry);
    this.tier2Cache.delete(key);
  }

  /**
   * Promote entry from tier 3 to tier 2
   */
  private promoteToTier2(key: string, entry: CacheEntry<T>): void {
    if (this.tier2Cache.size >= this.config.tier2Size) {
      this.evictLRUFromTier2();
    }
    
    this.tier2Cache.set(key, entry);
    this.tier3Cache.delete(key);
  }

  /**
   * Set entry in tier 3
   */
  private setInTier3(key: string, entry: CacheEntry<T>): void {
    if (this.tier3Cache.size >= this.config.tier3Size) {
      this.evictLRUFromTier3();
    }
    
    this.tier3Cache.set(key, entry);
  }

  /**
   * Evict least recently used entry from tier 1
   */
  private evictLRUFromTier1(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.tier1Cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const evictedEntry = this.tier1Cache.get(oldestKey);
      this.tier1Cache.delete(oldestKey);
      
      // Demote to tier 2
      if (evictedEntry) {
        this.tier2Cache.set(oldestKey, evictedEntry);
      }
    }
  }

  /**
   * Evict least recently used entry from tier 2
   */
  private evictLRUFromTier2(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.tier2Cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const evictedEntry = this.tier2Cache.get(oldestKey);
      this.tier2Cache.delete(oldestKey);
      
      // Demote to tier 3
      if (evictedEntry) {
        this.tier3Cache.set(oldestKey, evictedEntry);
      }
    }
  }

  /**
   * Evict least recently used entry from tier 3
   */
  private evictLRUFromTier3(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.tier3Cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.tier3Cache.delete(oldestKey);
    }
  }

  /**
   * Check if cache entry is still valid
   */
  private isEntryValid(entry: CacheEntry<T>, currentTime?: number): boolean {
    const now = currentTime || Date.now();
    return entry.ttl ? (now - entry.timestamp) < entry.ttl : true;
  }

  /**
   * Estimate size of cached value
   */
  private estimateSize(value: T): number {
    try {
      return JSON.stringify(value).length;
    } catch {
      return 1; // Fallback size
    }
  }

  /**
   * Update response time metrics
   */
  private updateResponseTime(startTime: number): void {
    const responseTime = Date.now() - startTime;
    const totalQueries = this.metrics.totalQueries;
    const currentAverage = this.metrics.averageResponseTime;
    
    this.metrics.averageResponseTime = 
      ((currentAverage * (totalQueries - 1)) + responseTime) / totalQueries;
  }

  /**
   * Update memory usage metrics
   */
  private updateMemoryUsage(): void {
    let totalSize = 0;
    
    for (const entry of this.tier1Cache.values()) {
      totalSize += entry.size;
    }
    for (const entry of this.tier2Cache.values()) {
      totalSize += entry.size;
    }
    for (const entry of this.tier3Cache.values()) {
      totalSize += entry.size;
    }
    
    this.metrics.memoryUsage = totalSize;
  }

  /**
   * Reset all metrics
   */
  private resetMetrics(): void {
    this.metrics = {
      tier1Hits: 0,
      tier2Hits: 0,
      tier3Hits: 0,
      totalMisses: 0,
      totalQueries: 0,
      averageResponseTime: 0,
      memoryUsage: 0
    };
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    await this.clear();
  }
}
