// filepath: coreagent/integration/webToolsIntegration.ts
// Integration layer for WebSearchTool and WebFetchTool with findings storage

import { WebSearchTool } from '../tools/webSearch';
import { WebFetchTool } from '../tools/webFetch';
import { WebFindingsManager } from '../intelligence/webFindingsManager';
import { WebSearchOptions, WebSearchResponse } from '../tools/webSearch';
import { WebFetchOptions, WebFetchResponse } from '../types/webFetch';
import { FindingsSearchOptions } from '../types/webFindings';
import { BraveSearchResponse } from '../types/braveSearch';
import { MemoryIntelligence } from '../intelligence/memoryIntelligence';
import { EmbeddingCache } from '../performance/embeddingCache';
import { MemoryBridge } from '../integration/memoryBridge';

export interface EnhancedWebSearchOptions extends WebSearchOptions {
  storeFindings?: boolean;
  userId?: string;
  sessionId?: string;
  skipCache?: boolean;
}

export interface EnhancedWebFetchOptions extends Omit<WebFetchOptions, 'url'> {
  storeFindings?: boolean;
  userId?: string;
  sessionId?: string;
  skipCache?: boolean;
}

export interface CachedSearchResult {
  cached: boolean;
  cacheAge?: number; // milliseconds
  response: WebSearchResponse;
  fromStorage?: boolean;
}

export interface CachedFetchResult {
  cached: boolean;
  cacheAge?: number; // milliseconds
  response: WebFetchResponse;
  fromStorage?: boolean;
}

/**
 * Enhanced web tools with intelligent findings storage and caching
 */
export class EnhancedWebTools {
  private webSearchTool: WebSearchTool;
  private webFetchTool: WebFetchTool;
  private findingsManager: WebFindingsManager;

  constructor(
    webSearchTool: WebSearchTool,
    webFetchTool: WebFetchTool,
    memoryIntelligence?: MemoryIntelligence,
    embeddingCache?: EmbeddingCache,
    memoryBridge?: MemoryBridge
  ) {
    this.webSearchTool = webSearchTool;
    this.webFetchTool = webFetchTool;
    this.findingsManager = new WebFindingsManager(
      {        storage: {
          enableCaching: true,
          enablePersistence: true,
          maxCacheSize: 200, // MB
          defaultTTL: 15 * 60 * 1000, // 15 minutes for web searches
          compressionThreshold: 50 * 1024, // 50KB
          autoCleanupInterval: 30 * 60 * 1000 // 30 minutes
        },
        classification: {
          autoClassify: true,
          importanceThreshold: 0.5,
          devAgentRelevanceBoost: 2.0 // Higher boost for development-related content
        },        privacy: {
          obfuscateUrls: false,
          excludePatterns: [
            '**/login/**',
            '**/auth/**',
            '**/admin/**',
            '**/dashboard/**',
            '**/account/**'
          ],
          maxPersonalDataRetention: 30 // days
        }
      },
      memoryIntelligence,
      embeddingCache,
      memoryBridge
    );

    console.log('🔧 Enhanced web tools initialized with intelligent findings storage');
  }

  /**
   * Enhanced web search with intelligent caching and storage
   */
  async search(options: EnhancedWebSearchOptions): Promise<CachedSearchResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Enhanced search: "${options.query}"`);

      // Check cache first (unless explicitly skipped)
      if (!options.skipCache) {
        const cachedResult = await this.getCachedSearchResult(options.query, options.userId);
        if (cachedResult) {
          console.log(`⚡ Cache hit for search: "${options.query}" (age: ${cachedResult.cacheAge}ms)`);
          return cachedResult;
        }
      }

      // Perform actual search
      const searchResponse = await this.webSearchTool.search(options);
        // Store findings if enabled (default: true)
      if (options.storeFindings !== false) {
        await this.findingsManager.storeSearchFinding(
          options.query,
          this.convertToBraveSearchResponse(searchResponse),
          options.userId,
          options.sessionId
        );
      }

      const searchTime = Date.now() - startTime;
      console.log(`✅ Enhanced search completed in ${searchTime}ms: ${searchResponse.totalResults} results`);

      return {
        cached: false,
        response: searchResponse,
        fromStorage: false
      };

    } catch (error) {
      console.error('❌ Enhanced search failed:', error);
      throw error;
    }
  }

  /**
   * Enhanced web fetch with intelligent caching and storage
   */
  async fetch(url: string, options: EnhancedWebFetchOptions = {}): Promise<CachedFetchResult> {
    const startTime = Date.now();
    
    try {
      console.log(`📥 Enhanced fetch: ${url.substring(0, 80)}...`);

      // Check cache first (unless explicitly skipped)
      if (!options.skipCache) {
        const cachedResult = await this.getCachedFetchResult(url, options.userId);
        if (cachedResult) {
          console.log(`⚡ Cache hit for fetch: ${url.substring(0, 50)}... (age: ${cachedResult.cacheAge}ms)`);
          return cachedResult;
        }
      }

      // Perform actual fetch
      const fetchResponse = await this.webFetchTool.fetchContent({
        url,
        ...options
      });
      
      // Store findings if enabled (default: true)
      if (options.storeFindings !== false) {
        await this.findingsManager.storeFetchFinding(
          url,
          fetchResponse,
          options.userId,
          options.sessionId
        );
      }

      const fetchTime = Date.now() - startTime;
      console.log(`✅ Enhanced fetch completed in ${fetchTime}ms: ${fetchResponse.content.size} bytes`);

      return {
        cached: false,
        response: fetchResponse,
        fromStorage: false
      };

    } catch (error) {
      console.error('❌ Enhanced fetch failed:', error);
      throw error;
    }
  }

  /**
   * Quick search with automatic caching - optimized for DevAgent use
   */  async quickSearch(
    query: string, 
    count: number = 5,
    userId?: string,
    sessionId?: string
  ): Promise<WebSearchResponse> {
    const searchOptions: EnhancedWebSearchOptions = {
      query,
      count,
      storeFindings: true
    };
    
    if (userId) searchOptions.userId = userId;
    if (sessionId) searchOptions.sessionId = sessionId;
    
    const result = await this.search(searchOptions);
    
    return result.response;
  }

  /**
   * Quick fetch with automatic caching - optimized for DevAgent use
   */  async quickFetch(
    url: string,
    userId?: string,
    sessionId?: string
  ): Promise<WebFetchResponse> {
    const fetchOptions: EnhancedWebFetchOptions = {
      extractContent: true,
      extractMetadata: true,
      storeFindings: true
    };
    
    if (userId) fetchOptions.userId = userId;
    if (sessionId) fetchOptions.sessionId = sessionId;
    
    const result = await this.fetch(url, fetchOptions);
    
    return result.response;
  }

  /**
   * Batch search multiple queries with intelligent deduplication
   */
  async batchSearch(
    queries: string[],
    options: Partial<EnhancedWebSearchOptions> = {}
  ): Promise<Map<string, CachedSearchResult>> {
    console.log(`🔍 Batch search: ${queries.length} queries`);
    
    const results = new Map<string, CachedSearchResult>();
    const promises = queries.map(async (query) => {
      try {
        const result = await this.search({ ...options, query });
        results.set(query, result);
      } catch (error) {
        console.error(`❌ Batch search failed for query "${query}":`, error);
      }
    });

    await Promise.all(promises);
    console.log(`✅ Batch search completed: ${results.size}/${queries.length} successful`);
    
    return results;
  }

  /**
   * Batch fetch multiple URLs with intelligent deduplication
   */
  async batchFetch(
    urls: string[],
    options: Partial<EnhancedWebFetchOptions> = {}
  ): Promise<Map<string, CachedFetchResult>> {
    console.log(`📥 Batch fetch: ${urls.length} URLs`);
    
    const results = new Map<string, CachedFetchResult>();
    const promises = urls.map(async (url) => {
      try {
        const result = await this.fetch(url, options);
        results.set(url, result);
      } catch (error) {
        console.error(`❌ Batch fetch failed for URL "${url}":`, error);
      }
    });

    await Promise.all(promises);
    console.log(`✅ Batch fetch completed: ${results.size}/${urls.length} successful`);
    
    return results;
  }

  /**
   * Search stored findings using intelligent filtering
   */  async searchStoredFindings(options: {
    query?: string;
    category?: string;
    userId?: string;
    limit?: number;
    type?: 'search' | 'fetch' | 'both';
  } = {}) {
    const searchOptions: FindingsSearchOptions = {
      limit: options.limit || 20,
      sortBy: 'importance',
      sortOrder: 'desc'
    };
    
    if (options.query) searchOptions.query = options.query;
    if (options.category) searchOptions.category = options.category;
    if (options.userId) searchOptions.userId = options.userId;
    
    return await this.findingsManager.searchFindings(searchOptions);
  }

  /**
   * Get storage statistics and performance metrics
   */
  async getStorageStats() {
    return await this.findingsManager.getStorageStats();
  }

  /**
   * Clean up expired and low-importance findings
   */
  async cleanup() {
    return await this.findingsManager.cleanupFindings();
  }

  /**
   * Get DevAgent-relevant findings (high importance + dev category)
   */  async getDevAgentFindings(userId?: string, limit: number = 50) {
    const searchOptions: FindingsSearchOptions = {
      limit: limit * 2, // Get more to filter
      sortBy: 'importance',
      sortOrder: 'desc'
    };
    
    if (userId) searchOptions.userId = userId;
    
    const findings = await this.findingsManager.searchFindings(searchOptions);

    // Filter for DevAgent relevance
    const devFindings = findings.findings.filter(finding => {
      const isDevRelevant = finding.classification.category === 'devagent' ||
                           finding.classification.category === 'documentation' ||
                           finding.classification.importance >= 0.7;
      
      // Check for development-related content
      if ('query' in finding) {
        const query = finding.query.toLowerCase();
        return isDevRelevant || query.includes('typescript') || query.includes('react') || 
               query.includes('development') || query.includes('programming');
      } else {
        const url = finding.url.toLowerCase();
        const title = finding.metadata.title?.toLowerCase() || '';
        return isDevRelevant || finding.classification.framework ||
               url.includes('docs') || title.includes('documentation');
      }
    });

    return {
      findings: devFindings.slice(0, limit),
      total: devFindings.length,
      totalStored: findings.findings.length
    };
  }

  // Private helper methods

  private async getCachedSearchResult(query: string, userId?: string): Promise<CachedSearchResult | null> {    try {
      const searchOptions: FindingsSearchOptions = {
        query,
        limit: 1,
        sortBy: 'date',
        sortOrder: 'desc'
      };
      
      if (userId) searchOptions.userId = userId;
      
      const findings = await this.findingsManager.searchFindings(searchOptions);

      if (findings.findings.length > 0) {
        const finding = findings.findings[0];
        if ('query' in finding && finding.storage.cached) {
          const cacheAge = Date.now() - new Date(finding.storage.lastAccessed).getTime();
          
          // Check if cache is still valid
          if (cacheAge < finding.storage.ttl) {
            // Update access time
            finding.storage.lastAccessed = new Date().toISOString();
            finding.storage.accessCount++;

            return {
              cached: true,
              cacheAge,
              response: {
                query: finding.query,
                totalResults: finding.metadata.totalResults,
                results: finding.results,
                searchTime: finding.metadata.searchTime,
                timestamp: finding.metadata.timestamp
              },
              fromStorage: true
            };
          }
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Failed to get cached search result:', error);
      return null;
    }
  }

  private async getCachedFetchResult(url: string, userId?: string): Promise<CachedFetchResult | null> {    try {
      const searchOptions: FindingsSearchOptions = {
        query: url,
        limit: 1,
        sortBy: 'date',
        sortOrder: 'desc'
      };
      
      if (userId) searchOptions.userId = userId;
      
      const findings = await this.findingsManager.searchFindings(searchOptions);

      if (findings.findings.length > 0) {
        const finding = findings.findings[0];
        if ('url' in finding && finding.storage.cached) {
          const cacheAge = Date.now() - new Date(finding.storage.lastAccessed).getTime();
          
          // Check if cache is still valid
          if (cacheAge < finding.storage.ttl) {
            // Update access time
            finding.storage.lastAccessed = new Date().toISOString();
            finding.storage.accessCount++;

            return {
              cached: true,
              cacheAge,
              response: {                url: finding.originalUrl,
                finalUrl: finding.url,
                statusCode: finding.metadata.statusCode,
                statusText: 'OK', // TODO: Store status text
                headers: {}, // TODO: Store headers
                content: {
                  raw: finding.content.html || finding.content.text, // Use HTML if available, otherwise text
                  text: finding.content.text,
                  size: finding.content.size,
                  contentType: finding.content.contentType,
                  encoding: finding.content.encoding || 'utf-8', // Use stored encoding or default
                  wordCount: finding.extracted.wordCount
                },
                metadata: {
                  ...(finding.metadata.title && { title: finding.metadata.title }),
                  ...(finding.metadata.description && { description: finding.metadata.description })
                },
                fetchTime: finding.metadata.fetchTime,
                timestamp: finding.metadata.timestamp,
                success: true
              },
              fromStorage: true
            };
          }
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Failed to get cached fetch result:', error);
      return null;
    }
  }

  /**
   * Convert WebSearchResponse to BraveSearchResponse format
   */
  private convertToBraveSearchResponse(response: WebSearchResponse): BraveSearchResponse {
    return {
      query: {
        original: response.query,
        show_strict_warning: false,
        is_navigational: false,
        is_geolocal: false,
        local_decision: '',
        local_locations_idx: 0,
        is_trending: false,
        is_news_breaking: false,
        ask_for_location: false,
        language: {
          main: 'en',
          language_display: 'English'
        },
        spellcheck_off: false,
        country: 'US',
        bad_results: false,
        should_fallback: false,
        postal_code: '',
        city: '',
        header_country: 'US',
        more_results_available: response.totalResults > response.results.length,
        custom_location_label: '',
        reddit_cluster: ''
      },
      mixed: {
        type: 'mixed',
        main: response.results.map(r => ({
          title: r.title,
          url: r.url,
          description: r.description,
          age: r.age,
          language: 'en',
          family_friendly: true
        })),
        top: [],
        side: []
      },
      web: {
        type: 'web',
        results: response.results.map(r => ({
          title: r.title,
          url: r.url,
          description: r.description,
          age: r.age,
          language: 'en',
          family_friendly: true
        })),
        family_friendly: true
      }
    } as BraveSearchResponse;
  }
}
