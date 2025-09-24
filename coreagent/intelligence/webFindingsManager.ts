// filepath: coreagent/intelligence/webFindingsManager.ts
// Intelligent web findings storage and management system

import {
  WebSearchFinding,
  WebFetchFinding,
  WebFindingsConfig,
  FindingsSearchOptions,
  FindingsSearchResult,
  FindingsStorageStats,
  FindingsCleanupResult,
} from '../types/webFindings';
import { BraveSearchResponse } from '../types/braveSearch';
import { WebFetchResponse } from '../types/webFetch';
import { MemoryIntelligence } from './memoryIntelligence';
import type { IMemoryClient } from '../types/oneagent-backbone-types';
import { OneAgentUnifiedBackbone } from '../utils/UnifiedBackboneService';
import { createUnifiedTimestamp } from '../utils/UnifiedBackboneService';
import * as path from 'path';
import { promises as fs } from 'fs';
import * as crypto from 'crypto';

export class WebFindingsManager {
  private config: WebFindingsConfig;
  private memoryIntelligence: MemoryIntelligence | undefined;
  private cacheSystem = OneAgentUnifiedBackbone.getInstance().cache;
  private memoryClient: IMemoryClient | undefined;
  // Allow disabling module-local map caches in favor of canonical unified cache only
  private readonly localCacheDisabled: boolean =
    process.env.ONEAGENT_WEBFINDINGS_DISABLE_LOCAL_CACHE === '1';
  private readonly negativeCacheTtlMs: number = Number(
    process.env.ONEAGENT_WEBFINDINGS_NEG_TTL_MS ?? 120000,
  );

  // In-memory caches
  private searchCache = new Map<string, WebSearchFinding>();
  private fetchCache = new Map<string, WebFetchFinding>();

  // File system paths
  private readonly basePath: string;
  private readonly cachePath: string;
  private readonly persistentPath: string;

  // Performance tracking
  private stats = {
    operations: 0,
    cacheHits: 0,
    cacheMisses: 0,
    classifications: 0,
    persistedFindings: 0,
  };

  constructor(
    config?: Partial<WebFindingsConfig>,
    memoryIntelligence?: MemoryIntelligence,
    _embeddingCache?: unknown, // Legacy parameter, now using unified cache
    memoryClient?: IMemoryClient,
  ) {
    this.config = {
      storage: {
        enableCaching: true,
        enablePersistence: true,
        maxCacheSize: 100, // MB
        defaultTTL: 30 * 60 * 1000, // 30 minutes
        compressionThreshold: 50 * 1024, // 50KB
        autoCleanupInterval: 60 * 60 * 1000, // 1 hour
      },
      classification: {
        autoClassify: true,
        importanceThreshold: 0.6,
        devAgentRelevanceBoost: 1.5,
      },
      integration: {
        memoryIntelligence: !!memoryIntelligence,
        embeddingCache: true, // Always available via unified cache
        memoryBridge: !!memoryClient, // Use memoryClient for memoryBridge compatibility
      },
      privacy: {
        obfuscateUrls: false,
        excludePatterns: ['**/login/**', '**/auth/**', '**/admin/**', '**/private/**'],
        maxPersonalDataRetention: 30, // days
      },
      ...config,
    };
    this.memoryIntelligence = memoryIntelligence;
    // Legacy embeddingCache parameter ignored - using unified cache system
    this.memoryClient = memoryClient;

    // Setup file system paths
    this.basePath = path.join(process.cwd(), 'data', 'web-findings');
    this.cachePath = path.join(this.basePath, 'cache');
    this.persistentPath = path.join(this.basePath, 'persistent');

    this.initializeStorage();
    this.setupCleanupInterval();
  }

  /**
   * Store web search findings with intelligent classification
   */
  async storeSearchFinding(
    query: string,
    searchResponse: BraveSearchResponse,
    userId?: string,
    sessionId?: string,
  ): Promise<WebSearchFinding> {
    const startTime = createUnifiedTimestamp();
    this.stats.operations++;

    try {
      // Build metadata object carefully to handle optional properties
      const endTime = createUnifiedTimestamp();
      const metadata: WebSearchFinding['metadata'] = {
        timestamp: startTime.iso,
        totalResults: searchResponse.web?.results?.length || 0,
        searchTime: endTime.unix - startTime.unix,
        source: 'brave',
      };

      if (userId) metadata.userId = userId;
      if (sessionId) metadata.sessionId = sessionId;

      // Create finding object
      const finding: WebSearchFinding = {
        id: this.generateFindingId('search', query),
        query,
        results: searchResponse.web?.results || [],
        metadata,
        classification: await this.classifySearchFinding(query, searchResponse),
        storage: {
          cached: false,
          persistToMemory: false,
          ttl: this.config.storage.defaultTTL,
          accessCount: 1,
          lastAccessed: startTime.iso,
        },
      };

      // Determine storage strategy
      if (finding.classification.importance >= this.config.classification.importanceThreshold) {
        finding.storage.persistToMemory = true;
        await this.persistToMemorySystem(finding);
        this.stats.persistedFindings++;
      }

      // Cache the finding (canonical unified cache first, then optional local map)
      if (this.config.storage.enableCaching) {
        try {
          const ttl = finding.storage.ttl ?? this.config.storage.defaultTTL;
          const queryHash = this.hashQuery(query);
          await this.cacheSystem.set(this.buildSearchIdKey(finding.id), finding, ttl);
          await this.cacheSystem.set(this.buildQueryKey(queryHash), finding, ttl);
        } catch (e) {
          // Best-effort cache; do not fail the operation
          console.warn('⚠️ Unified cache set failed for search finding (non-fatal):', e);
        }

        if (!this.localCacheDisabled) {
          this.searchCache.set(finding.id, finding);
          // Also cache by query hash for quick lookup
          const queryHash = this.hashQuery(query);
          this.searchCache.set(queryHash, finding);
        }
        finding.storage.cached = true;
      }

      // Save to persistent storage if enabled
      if (this.config.storage.enablePersistence) {
        await this.saveToDisk(finding, 'search');
      }

      console.log(
        `✅ Search finding stored: query="${query.substring(0, 50)}..." importance=${finding.classification.importance}`,
      );
      return finding;
    } catch (error) {
      console.error('❌ Failed to store search finding:', error);
      throw error;
    }
  }

  /**
   * Store web fetch findings with intelligent classification
   */
  async storeFetchFinding(
    url: string,
    fetchResponse: WebFetchResponse,
    userId?: string,
    sessionId?: string,
  ): Promise<WebFetchFinding> {
    const startTime = createUnifiedTimestamp();
    this.stats.operations++;

    try {
      // Extract and analyze content
      const extracted = await this.extractContentData(fetchResponse);
      // Build metadata object carefully to handle optional properties
      const metadata: WebFetchFinding['metadata'] = {
        timestamp: startTime.iso,
        fetchTime: fetchResponse.fetchTime,
        statusCode: fetchResponse.statusCode,
        domain: this.extractDomain(url), // Add domain for easy citation
      };

      if (fetchResponse.metadata?.title) metadata.title = fetchResponse.metadata.title;
      if (fetchResponse.metadata?.description)
        metadata.description = fetchResponse.metadata.description;
      if (userId) metadata.userId = userId;
      if (sessionId) metadata.sessionId = sessionId;

      // Create finding object
      const finding: WebFetchFinding = {
        id: this.generateFindingId('fetch', url),
        url: fetchResponse.finalUrl || url,
        originalUrl: url,
        content: {
          text: fetchResponse.content.text || '',
          size: fetchResponse.content.size,
          contentType: fetchResponse.content.contentType,
          encoding: fetchResponse.content.encoding,
        },
        metadata,
        extracted,
        classification: await this.classifyFetchFinding(url, fetchResponse, extracted),
        storage: {
          cached: false,
          persistToMemory: false,
          ttl: this.config.storage.defaultTTL,
          accessCount: 1,
          lastAccessed: startTime.iso,
          compressed: false,
        },
      };

      // Determine storage strategy
      if (finding.classification.importance >= this.config.classification.importanceThreshold) {
        finding.storage.persistToMemory = true;
        await this.persistToMemorySystem(finding);
        this.stats.persistedFindings++;
      }

      // Cache the finding (canonical unified cache first, then optional local map)
      if (this.config.storage.enableCaching) {
        try {
          const ttl = finding.storage.ttl ?? this.config.storage.defaultTTL;
          const urlHash = this.hashUrl(url);
          await this.cacheSystem.set(this.buildFetchIdKey(finding.id), finding, ttl);
          await this.cacheSystem.set(this.buildUrlKey(urlHash), finding, ttl);
        } catch (e) {
          console.warn('⚠️ Unified cache set failed for fetch finding (non-fatal):', e);
        }

        if (!this.localCacheDisabled) {
          this.fetchCache.set(finding.id, finding);
          // Also cache by URL hash for quick lookup
          const urlHash = this.hashUrl(url);
          this.fetchCache.set(urlHash, finding);
        }
        finding.storage.cached = true;
      }

      // Save to persistent storage if enabled
      if (this.config.storage.enablePersistence) {
        await this.saveToDisk(finding, 'fetch');
      }

      console.log(
        `✅ Fetch finding stored: url="${url.substring(0, 50)}..." importance=${finding.classification.importance}`,
      );
      return finding;
    } catch (error) {
      console.error('❌ Failed to store fetch finding:', error);
      throw error;
    }
  }

  /**
   * Search stored findings with intelligent filtering
   */
  async searchFindings(options: FindingsSearchOptions = {}): Promise<FindingsSearchResult> {
    const startTime = createUnifiedTimestamp();

    try {
      let findings: (WebSearchFinding | WebFetchFinding)[] = [];

      // Search in cache first
      if (this.config.storage.enableCaching) {
        findings = await this.searchInCache(options);
      }

      // If no results in cache or cache disabled, search persistent storage
      if (findings.length === 0 && this.config.storage.enablePersistence) {
        findings = await this.searchInPersistentStorage(options);
      }

      // Use memory intelligence for semantic search if available
      if (findings.length === 0 && options.query && this.memoryIntelligence) {
        findings = await this.semanticSearch(options.query, options);
      }

      // Apply sorting
      findings = this.sortFindings(findings, options.sortBy, options.sortOrder);

      // Apply limit
      if (options.limit && options.limit > 0) {
        findings = findings.slice(0, options.limit);
      }

      const endTime = createUnifiedTimestamp();
      const searchTime = endTime.unix - startTime.unix;

      const metadata: FindingsSearchResult['metadata'] = {
        total: findings.length,
        searchTime,
        cached: findings.length > 0 && findings[0].storage?.cached === true,
      };

      if (options.query) {
        metadata.query = options.query;
      }

      return {
        findings,
        metadata,
      };
    } catch (error) {
      console.error('❌ Failed to search findings:', error);
      throw error;
    }
  }

  /**
   * Get storage statistics and performance metrics
   */
  async getStorageStats(): Promise<FindingsStorageStats> {
    try {
      const cacheSize = this.calculateCacheSize();
      const persistentStats = await this.calculatePersistentStats();

      return {
        cache: {
          size: cacheSize.sizeInMB,
          entries: this.searchCache.size + this.fetchCache.size,
          hitRate: this.stats.operations > 0 ? this.stats.cacheHits / this.stats.operations : 0,
          oldestEntry: cacheSize.oldestEntry,
          newestEntry: cacheSize.newestEntry,
        },
        persistent: persistentStats,
        performance: {
          avgClassificationTime: 0, // TODO: Implement timing
          avgStorageTime: 0,
          avgRetrievalTime: 0,
          totalOperations: this.stats.operations,
        },
      };
    } catch (error) {
      console.error('❌ Failed to get storage stats:', error);
      throw error;
    }
  }

  /**
   * Clean up expired and low-importance findings
   */
  async cleanupFindings(): Promise<FindingsCleanupResult> {
    const startTime = createUnifiedTimestamp();

    try {
      const removed = { expired: 0, lowImportance: 0, duplicates: 0 };
      let retained = 0;
      let spaceSaved = 0;

      // Clean up in-memory cache
      const cacheCleanup = await this.cleanupCache();
      removed.expired += cacheCleanup.expired;
      removed.lowImportance += cacheCleanup.lowImportance;

      // Clean up persistent storage
      if (this.config.storage.enablePersistence) {
        const persistentCleanup = await this.cleanupPersistentStorage();
        removed.expired += persistentCleanup.expired;
        removed.lowImportance += persistentCleanup.lowImportance;
        removed.duplicates += persistentCleanup.duplicates;
        spaceSaved += persistentCleanup.spaceSaved;
      }

      retained = this.searchCache.size + this.fetchCache.size;
      const endTime = createUnifiedTimestamp();
      const operationTime = endTime.unix - startTime.unix;

      console.log(
        `🧹 Cleanup completed: removed ${removed.expired + removed.lowImportance + removed.duplicates} findings, retained ${retained}, saved ${spaceSaved}MB in ${operationTime}ms`,
      );

      return {
        removed,
        retained,
        spaceSaved,
        operationTime,
      };
    } catch (error) {
      console.error('❌ Failed to cleanup findings:', error);
      throw error;
    }
  }

  // Private helper methods

  private async initializeStorage(): Promise<void> {
    try {
      await fs.mkdir(this.basePath, { recursive: true });
      await fs.mkdir(this.cachePath, { recursive: true });
      await fs.mkdir(this.persistentPath, { recursive: true });
      await fs.mkdir(path.join(this.persistentPath, 'search'), { recursive: true });
      await fs.mkdir(path.join(this.persistentPath, 'fetch'), { recursive: true });
      console.log(`📁 Web findings storage initialized at: ${this.basePath}`);
    } catch (error) {
      console.error('❌ Failed to initialize storage:', error);
    }
  }

  private setupCleanupInterval(): void {
    if (this.config.storage.autoCleanupInterval > 0) {
      const t = setInterval(() => {
        this.cleanupFindings().catch(console.error);
      }, this.config.storage.autoCleanupInterval);
      // Avoid holding the process open for background cleanup
      t.unref?.();
    }
  }

  private generateFindingId(type: 'search' | 'fetch', input: string): string {
    const timestamp = createUnifiedTimestamp();
    const hash = crypto
      .createHash('sha256')
      .update(input + timestamp.unix)
      .digest('hex');
    return `${type}_${hash.substring(0, 16)}`;
  }

  private hashQuery(query: string): string {
    return crypto.createHash('md5').update(query.toLowerCase().trim()).digest('hex');
  }

  private hashUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const normalizedUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
      return crypto.createHash('md5').update(normalizedUrl).digest('hex');
    } catch {
      return crypto.createHash('md5').update(url).digest('hex');
    }
  }

  private async classifySearchFinding(
    query: string,
    response: BraveSearchResponse,
  ): Promise<WebSearchFinding['classification']> {
    // Basic classification based on query patterns
    let category: WebSearchFinding['classification']['category'] = 'general';
    let importance = 0.5;
    const tags: string[] = [];

    const queryLower = query.toLowerCase();

    // Category detection
    if (
      queryLower.includes('documentation') ||
      queryLower.includes('docs') ||
      queryLower.includes('api')
    ) {
      category = 'documentation';
      importance += 0.2;
      tags.push('documentation');
    } else if (
      queryLower.includes('error') ||
      queryLower.includes('troubleshoot') ||
      queryLower.includes('fix')
    ) {
      category = 'troubleshooting';
      importance += 0.2;
      tags.push('troubleshooting');
    } else if (
      queryLower.includes('tutorial') ||
      queryLower.includes('guide') ||
      queryLower.includes('how to')
    ) {
      category = 'research';
      importance += 0.1;
      tags.push('learning');
    }

    // DevAgent relevance boost
    if (
      queryLower.includes('typescript') ||
      queryLower.includes('react') ||
      queryLower.includes('node') ||
      queryLower.includes('development') ||
      queryLower.includes('programming')
    ) {
      category = 'devagent';
      importance *= this.config.classification.devAgentRelevanceBoost;
      tags.push('development');
    }

    // Quality indicators based on available response data
    const resultCount = response.web?.results?.length || 0;
    if (resultCount > 10) importance += 0.1;

    return {
      category,
      importance: Math.min(1, importance),
      relevanceScore: Math.min(1, resultCount / 20),
      tags,
    };
  }

  private async classifyFetchFinding(
    url: string,
    response: WebFetchResponse,
    extracted: WebFetchFinding['extracted'],
  ): Promise<WebFetchFinding['classification']> {
    // Basic classification based on URL and content
    let category: WebFetchFinding['classification']['category'] = 'other';
    let importance = 0.5;
    const topics: string[] = [];

    const urlLower = url.toLowerCase();
    const textLower = extracted.keyPoints.join(' ').toLowerCase();

    // Category detection
    if (urlLower.includes('docs') || urlLower.includes('documentation')) {
      category = 'documentation';
      importance += 0.3;
      topics.push('documentation');
    } else if (urlLower.includes('api') || textLower.includes('api reference')) {
      category = 'api-reference';
      importance += 0.25;
      topics.push('api');
    } else if (urlLower.includes('tutorial') || urlLower.includes('guide')) {
      category = 'tutorial';
      importance += 0.2;
      topics.push('tutorial');
    } else if (urlLower.includes('github') || urlLower.includes('gitlab')) {
      category = 'code';
      importance += 0.15;
      topics.push('code');
    }

    // Framework detection
    let framework: string | undefined;
    if (textLower.includes('typescript')) framework = 'TypeScript';
    else if (textLower.includes('react')) framework = 'React';
    else if (textLower.includes('node.js') || textLower.includes('nodejs')) framework = 'Node.js';
    else if (textLower.includes('vue')) framework = 'Vue';

    // DevAgent relevance boost
    if (framework || textLower.includes('development') || textLower.includes('programming')) {
      importance *= this.config.classification.devAgentRelevanceBoost;
      topics.push('development');
    }

    // Quality indicators
    if (extracted.wordCount > 500) importance += 0.1;
    if (response.statusCode === 200) importance += 0.05;
    if (response.metadata?.title) importance += 0.05;

    // Build result object with proper optional property handling
    const result: WebFetchFinding['classification'] = {
      category,
      importance: Math.min(1, importance),
      relevanceScore: Math.min(1, extracted.wordCount / 2000),
      topics,
    };

    if (framework) {
      result.framework = framework;
    }

    return result;
  }

  private async extractContentData(
    response: WebFetchResponse,
  ): Promise<WebFetchFinding['extracted']> {
    const text = response.content.text || '';
    const wordCount = text.split(/\s+/).length;

    // Extract key points (simple implementation)
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 20);
    const keyPoints = sentences.slice(0, 5).map((s) => s.trim());

    // Extract links (simple implementation)
    const linkRegex = /https?:\/\/[^\s<>"]+/g;
    const links = [...(text.match(linkRegex) || [])].slice(0, 10);

    // Extract images (simple implementation)
    const imgRegex = /\.(jpg|jpeg|png|gif|svg|webp)/gi;
    const images = [...(text.match(imgRegex) || [])].slice(0, 5);

    return {
      keyPoints,
      links,
      images,
      wordCount,
    };
  }

  private async persistToMemorySystem(finding: WebSearchFinding | WebFetchFinding): Promise<void> {
    if (!this.memoryIntelligence) return;

    try {
      let content: string;
      let metadata: Record<string, unknown>;

      if ('query' in finding) {
        // Search finding
        content = `Web search: "${finding.query}" found ${finding.metadata.totalResults} results`;
        metadata = {
          category: 'web_search',
          query: finding.query,
          resultCount: finding.metadata.totalResults,
          classification: finding.classification.category,
          importance: finding.classification.importance,
        };
      } else {
        // Fetch finding
        content = `Web content: ${finding.metadata.title || finding.url} - ${finding.extracted.keyPoints[0] || 'No summary'}`;
        metadata = {
          category: 'web_content',
          url: finding.url,
          title: finding.metadata.title,
          classification: finding.classification.category,
          importance: finding.classification.importance,
          framework: finding.classification.framework,
        };
      }

      await this.memoryIntelligence.storeMemory(
        content,
        finding.metadata.userId || 'system',
        metadata,
      );
      console.log(`💾 Finding persisted to memory system: ${finding.id}`);
    } catch (error) {
      console.error('❌ Failed to persist to memory system:', error);
    }
  }

  private async saveToDisk(
    finding: WebSearchFinding | WebFetchFinding,
    type: 'search' | 'fetch',
  ): Promise<void> {
    try {
      const filename = `${finding.id}.json`;
      const filepath = path.join(this.persistentPath, type, filename);

      await fs.mkdir(path.dirname(filepath), { recursive: true });
      await fs.writeFile(filepath, JSON.stringify(finding, null, 2));
    } catch (error) {
      console.error('❌ Failed to save finding to disk:', error);
    }
  }

  private async searchInCache(
    options: FindingsSearchOptions,
  ): Promise<(WebSearchFinding | WebFetchFinding)[]> {
    const findings: (WebSearchFinding | WebFetchFinding)[] = [];
    const seen = new Set<string>();

    // Negative cache: if we know this query had no results recently, short-circuit
    if (this.config.storage.enableCaching && options.query) {
      try {
        const q = options.query.trim();
        const nkey = this.buildQueryNegativeKey(this.hashQuery(q));
        const neg = (await this.cacheSystem.get(nkey)) as boolean | null;
        if (neg) {
          this.stats.cacheHits++;
          return [];
        }
      } catch {
        // ignore
      }
    }

    // Prefer unified cache direct lookups when query provided
    if (this.config.storage.enableCaching && options.query) {
      try {
        const q = options.query.trim();
        const queryHash = this.hashQuery(q);
        const byQuery = (await this.cacheSystem.get(this.buildQueryKey(queryHash))) as
          | WebSearchFinding
          | WebFetchFinding
          | null;
        if (byQuery && this.matchesSearchOptions(byQuery, options)) {
          findings.push(byQuery);
          seen.add(byQuery.id);
          this.stats.cacheHits++;
        }

        // If the query looks like a URL, also try URL-hash key
        if (/^https?:\/\//i.test(q) || /\w+\.[a-z]{2,}/i.test(q)) {
          const urlHash = this.hashUrl(q);
          const byUrl = (await this.cacheSystem.get(this.buildUrlKey(urlHash))) as
            | WebSearchFinding
            | WebFetchFinding
            | null;
          if (byUrl && !seen.has(byUrl.id) && this.matchesSearchOptions(byUrl, options)) {
            findings.push(byUrl);
            seen.add(byUrl.id);
            this.stats.cacheHits++;
          }
        }
      } catch (e) {
        // Best-effort; fallback to local scan
        console.warn('⚠️ Unified cache query failed during searchInCache (non-fatal):', e);
        this.stats.cacheMisses++;
      }
    }

    if (!this.localCacheDisabled) {
      // Scan local in-memory maps as a fast, ephemeral index
      for (const finding of Array.from(this.searchCache.values())) {
        if (!seen.has(finding.id) && this.matchesSearchOptions(finding, options)) {
          findings.push(finding);
          seen.add(finding.id);
          this.stats.cacheHits++;
        }
      }
      for (const finding of Array.from(this.fetchCache.values())) {
        if (!seen.has(finding.id) && this.matchesSearchOptions(finding, options)) {
          findings.push(finding);
          seen.add(finding.id);
          this.stats.cacheHits++;
        }
      }
    }

    // If still empty and a query was provided, set a short negative cache marker
    if (this.config.storage.enableCaching && options.query && findings.length === 0) {
      try {
        const nkey = this.buildQueryNegativeKey(this.hashQuery(options.query.trim()));
        await this.cacheSystem.set(nkey, true, this.negativeCacheTtlMs);
      } catch {
        // best-effort only
      }
    }

    return findings;
  }

  private async searchInPersistentStorage(
    options: FindingsSearchOptions,
  ): Promise<(WebSearchFinding | WebFetchFinding)[]> {
    try {
      const findings: (WebSearchFinding | WebFetchFinding)[] = [];

      // Search in search findings
      const searchDir = path.join(this.persistentPath, 'search');
      try {
        const searchFiles = await fs.readdir(searchDir);
        for (const filename of searchFiles) {
          if (filename.endsWith('.json')) {
            try {
              const filepath = path.join(searchDir, filename);
              const content = await fs.readFile(filepath, 'utf-8');
              const finding: WebSearchFinding = JSON.parse(content);
              if (this.matchesSearchOptions(finding, options)) {
                findings.push(finding);
              }
            } catch {
              console.warn(`⚠️ Failed to parse search finding: ${filename}`);
            }
          }
        }
      } catch {
        // Directory might not exist yet
      }

      // Search in fetch findings
      const fetchDir = path.join(this.persistentPath, 'fetch');
      try {
        const fetchFiles = await fs.readdir(fetchDir);
        for (const filename of fetchFiles) {
          if (filename.endsWith('.json')) {
            try {
              const filepath = path.join(fetchDir, filename);
              const content = await fs.readFile(filepath, 'utf-8');
              const finding: WebFetchFinding = JSON.parse(content);
              if (this.matchesSearchOptions(finding, options)) {
                findings.push(finding);
              }
            } catch {
              console.warn(`⚠️ Failed to parse fetch finding: ${filename}`);
            }
          }
        }
      } catch {
        // Directory might not exist yet
      }

      return findings;
    } catch (error) {
      console.error('❌ Failed to search persistent storage:', error);
      return [];
    }
  }

  private async semanticSearch(
    _query: string,
    _options: FindingsSearchOptions,
  ): Promise<(WebSearchFinding | WebFetchFinding)[]> {
    try {
      if (!this.memoryIntelligence) {
        return [];
      }

      // For now, return empty array since searchMemories method doesn't exist yet
      // TODO: Implement memory intelligence integration when searchMemories is available
      return [];
    } catch (error) {
      console.error('❌ Failed to perform semantic search:', error);
      return [];
    }
  }

  private matchesSearchOptions(
    finding: WebSearchFinding | WebFetchFinding,
    options: FindingsSearchOptions,
  ): boolean {
    // Basic matching logic
    if (options.query) {
      const query = options.query.toLowerCase();
      if ('query' in finding) {
        if (!finding.query.toLowerCase().includes(query)) return false;
      } else {
        if (
          !finding.url.toLowerCase().includes(query) &&
          !finding.metadata.title?.toLowerCase().includes(query)
        )
          return false;
      }
    }

    if (options.category && finding.classification.category !== options.category) {
      return false;
    }

    if (options.userId && finding.metadata.userId !== options.userId) {
      return false;
    }

    return true;
  }

  private sortFindings(
    findings: (WebSearchFinding | WebFetchFinding)[],
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'desc',
  ): (WebSearchFinding | WebFetchFinding)[] {
    const multiplier = sortOrder === 'desc' ? -1 : 1;

    return findings.sort((a, b) => {
      switch (sortBy) {
        case 'importance':
          return (a.classification.importance - b.classification.importance) * multiplier;
        case 'date':
          return (
            (new Date(a.metadata.timestamp).getTime() - new Date(b.metadata.timestamp).getTime()) *
            multiplier
          );
        case 'access_count':
          return (a.storage.accessCount - b.storage.accessCount) * multiplier;
        default:
          return (a.classification.relevanceScore - b.classification.relevanceScore) * multiplier;
      }
    });
  }

  private calculateCacheSize(): { sizeInMB: number; oldestEntry: string; newestEntry: string } {
    let totalSize = 0;
    const currentTime = createUnifiedTimestamp();
    let oldestTime = currentTime.unix; // ms
    let newestTime = 0; // ms
    let entries = 0;

    // Calculate search cache size
    for (const finding of Array.from(this.searchCache.values())) {
      const findingSize = JSON.stringify(finding).length;
      totalSize += findingSize;
      entries++;
      const timestamp = new Date(finding.metadata.timestamp).getTime();
      oldestTime = Math.min(oldestTime, timestamp);
      newestTime = Math.max(newestTime, timestamp);
    }

    // Calculate fetch cache size
    for (const finding of Array.from(this.fetchCache.values())) {
      const findingSize = JSON.stringify(finding).length;
      totalSize += findingSize;
      entries++;
      const timestamp = new Date(finding.metadata.timestamp).getTime();
      oldestTime = Math.min(oldestTime, timestamp);
      newestTime = Math.max(newestTime, timestamp);
    }

    const oldestIso = entries > 0 ? new Date(oldestTime).toISOString() : currentTime.iso;
    const newestIso =
      entries > 0 ? new Date(newestTime || oldestTime).toISOString() : currentTime.iso;

    return {
      sizeInMB: totalSize / (1024 * 1024),
      oldestEntry: oldestIso,
      newestEntry: newestIso,
    };
  }

  private async calculatePersistentStats(): Promise<FindingsStorageStats['persistent']> {
    try {
      let totalFindings = 0;
      let searchFindings = 0;
      let fetchFindings = 0;
      let totalImportance = 0;
      let totalSize = 0;

      // Count search findings
      const searchDir = path.join(this.persistentPath, 'search');
      try {
        const searchFiles = await fs.readdir(searchDir);
        for (const filename of searchFiles) {
          if (filename.endsWith('.json')) {
            try {
              const filepath = path.join(searchDir, filename);
              const stats = await fs.stat(filepath);
              totalSize += stats.size;

              const content = await fs.readFile(filepath, 'utf-8');
              const finding: WebSearchFinding = JSON.parse(content);
              searchFindings++;
              totalImportance += finding.classification.importance;
            } catch {
              // Skip corrupted files
            }
          }
        }
      } catch {
        // Directory might not exist
      }

      // Count fetch findings
      const fetchDir = path.join(this.persistentPath, 'fetch');
      try {
        const fetchFiles = await fs.readdir(fetchDir);
        for (const filename of fetchFiles) {
          if (filename.endsWith('.json')) {
            try {
              const filepath = path.join(fetchDir, filename);
              const stats = await fs.stat(filepath);
              totalSize += stats.size;

              const content = await fs.readFile(filepath, 'utf-8');
              const finding: WebFetchFinding = JSON.parse(content);
              fetchFindings++;
              totalImportance += finding.classification.importance;
            } catch {
              // Skip corrupted files
            }
          }
        }
      } catch {
        // Directory might not exist
      }

      totalFindings = searchFindings + fetchFindings;

      return {
        totalFindings,
        searchFindings,
        fetchFindings,
        avgImportance: totalFindings > 0 ? totalImportance / totalFindings : 0,
        storageSize: totalSize / (1024 * 1024), // Convert to MB
      };
    } catch (error) {
      console.error('❌ Failed to calculate persistent stats:', error);
      return {
        totalFindings: 0,
        searchFindings: 0,
        fetchFindings: 0,
        avgImportance: 0,
        storageSize: 0,
      };
    }
  }

  private async cleanupCache(): Promise<{ expired: number; lowImportance: number }> {
    let expired = 0;
    let lowImportance = 0;
    const now = createUnifiedTimestamp();

    if (this.localCacheDisabled) {
      // Unified cache handles TTL expiry internally; nothing to do locally
      return { expired: 0, lowImportance: 0 };
    }

    // Clean search cache
    for (const [key, finding] of Array.from(this.searchCache.entries())) {
      const age = new Date(now.iso).getTime() - new Date(finding.storage.lastAccessed).getTime();
      if (age > finding.storage.ttl) {
        this.searchCache.delete(key);
        expired++;
      } else if (finding.classification.importance < 0.3) {
        this.searchCache.delete(key);
        lowImportance++;
      }
    }

    // Clean fetch cache
    for (const [key, finding] of Array.from(this.fetchCache.entries())) {
      const age = new Date(now.iso).getTime() - new Date(finding.storage.lastAccessed).getTime();
      if (age > finding.storage.ttl) {
        this.fetchCache.delete(key);
        expired++;
      } else if (finding.classification.importance < 0.3) {
        this.fetchCache.delete(key);
        lowImportance++;
      }
    }

    return { expired, lowImportance };
  }

  private async cleanupPersistentStorage(): Promise<{
    expired: number;
    lowImportance: number;
    duplicates: number;
    spaceSaved: number;
  }> {
    let expired = 0;
    let lowImportance = 0;
    const duplicates = 0;
    let spaceSaved = 0;
    const now = createUnifiedTimestamp();

    try {
      // Cleanup search findings
      const searchDir = path.join(this.persistentPath, 'search');
      try {
        const searchFiles = await fs.readdir(searchDir);
        for (const filename of searchFiles) {
          if (filename.endsWith('.json')) {
            try {
              const filepath = path.join(searchDir, filename);
              const stats = await fs.stat(filepath);
              const content = await fs.readFile(filepath, 'utf-8');
              const finding: WebSearchFinding = JSON.parse(content);

              const age =
                new Date(now.iso).getTime() - new Date(finding.storage.lastAccessed).getTime();
              const shouldDelete =
                age > finding.storage.ttl || finding.classification.importance < 0.3;

              if (shouldDelete) {
                await fs.unlink(filepath);
                spaceSaved += stats.size;

                if (age > finding.storage.ttl) expired++;
                else lowImportance++;
              }
            } catch {
              // Skip corrupted files
            }
          }
        }
      } catch {
        // Directory might not exist
      }

      // Cleanup fetch findings
      const fetchDir = path.join(this.persistentPath, 'fetch');
      try {
        const fetchFiles = await fs.readdir(fetchDir);
        for (const filename of fetchFiles) {
          if (filename.endsWith('.json')) {
            try {
              const filepath = path.join(fetchDir, filename);
              const stats = await fs.stat(filepath);
              const content = await fs.readFile(filepath, 'utf-8');
              const finding: WebFetchFinding = JSON.parse(content);

              const age =
                new Date(now.iso).getTime() - new Date(finding.storage.lastAccessed).getTime();
              const shouldDelete =
                age > finding.storage.ttl || finding.classification.importance < 0.3;

              if (shouldDelete) {
                await fs.unlink(filepath);
                spaceSaved += stats.size;

                if (age > finding.storage.ttl) expired++;
                else lowImportance++;
              }
            } catch {
              // Skip corrupted files
            }
          }
        }
      } catch {
        // Directory might not exist
      }

      return {
        expired,
        lowImportance,
        duplicates,
        spaceSaved: spaceSaved / (1024 * 1024), // Convert to MB
      };
    } catch {
      console.error('❌ Failed to cleanup persistent storage');
      return { expired: 0, lowImportance: 0, duplicates: 0, spaceSaved: 0 };
    }
  }

  /**
   * Extract domain from URL for citation purposes (simple, non-overengineered)
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      // If URL parsing fails, return the URL as-is
      return url;
    }
  }

  // Unified cache key helpers
  private buildSearchIdKey(id: string): string {
    return `webfindings:search:id:${id}`;
  }
  private buildFetchIdKey(id: string): string {
    return `webfindings:fetch:id:${id}`;
  }
  private buildQueryKey(queryHash: string): string {
    return `webfindings:q:${queryHash}`;
  }
  private buildUrlKey(urlHash: string): string {
    return `webfindings:u:${urlHash}`;
  }
  private buildQueryNegativeKey(queryHash: string): string {
    return `webfindings:qneg:${queryHash}`;
  }
}
