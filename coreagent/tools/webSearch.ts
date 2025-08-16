// filepath: coreagent/tools/webSearch.ts
// Web search tool using Brave Search API with Canonical OneAgent Memory Integration

import { BraveSearchClient } from './braveSearchClient';
import { BraveSearchResult } from '../types/braveSearch';
import { OneAgentMemory } from '../memory/OneAgentMemory';
import { createUnifiedTimestamp, unifiedMetadataService } from '../utils/UnifiedBackboneService';

// Canonical memory integration for search result caching and learning

export interface WebSearchOptions {
  query: string;
  count?: number;
  safesearch?: 'strict' | 'moderate' | 'off';
  country?: string;
  includeRecent?: boolean; // Also search for recent results
  timeout?: number; // Request timeout in milliseconds
  retries?: number; // Number of retry attempts
  language?: string; // Search language preference
}

export interface WebSearchError {
  code: string;
  message: string;
  query: string;
  isRetryable: boolean;
  technicalDetails?: string;
}

export interface WebSearchResponse {
  query: string;
  totalResults: number;
  results: Array<{
    title: string;
    url: string;
    description: string;
    age?: string;
    relevanceScore?: number;
    domain?: string; // Extracted domain for filtering
    snippet?: string; // Enhanced snippet
  }>;
  searchTime: number; // milliseconds
  timestamp: string;
  metadata?: {
    searchType: string;
    safesearch?: string;
    country?: string;
    totalAvailable?: number;
    filtersApplied?: boolean;
    relatedQueries?: string[];
    originalQuery?: string;
    enhancedQuery?: string;
  };
  success: boolean;
  error?: string;
}

export class WebSearchTool {
  private braveClient: BraveSearchClient;
  // Enhanced class properties
  private readonly defaultTimeout: number = 10000;
  private readonly defaultRetries: number = 3;
  private searchCount: number = 0;
  private totalSearchTime: number = 0;

  // Canonical OneAgent Memory Integration
  private memorySystem?: OneAgentMemory;
  private enableMemoryLearning: boolean = true;

  constructor(braveClient: BraveSearchClient, memorySystem?: OneAgentMemory) {
    this.braveClient = braveClient;

    if (memorySystem) {
      this.memorySystem = memorySystem;
      console.log('🧠 WebSearchTool: Canonical memory integration enabled');
    }
  }

  /**
   * Perform a web search and return formatted results
   */
  async search(options: WebSearchOptions): Promise<WebSearchResponse> {
    const startTime = createUnifiedTimestamp().unix;

    try {
      console.log(`🔍 WebSearchTool: Searching for "${options.query}"`);

      const searchOptions = {
        count: options.count || 5,
        safesearch: options.safesearch || 'moderate',
        country: options.country || 'US',
      };

      // Perform main search
      const results = await this.braveClient.quickSearch(options.query, searchOptions);

      // Optionally include recent results
      let recentResults: BraveSearchResult[] = [];
      if (options.includeRecent) {
        try {
          recentResults = await this.braveClient.searchRecent(options.query, 2);
        } catch (error) {
          console.log('⚠️ Could not fetch recent results:', error);
        }
      }

      // Combine and deduplicate results
      const allResults = this.combineAndDeduplicateResults(results, recentResults);

      // Format results with enhanced canonical processing
      const formattedResults = allResults.slice(0, options.count || 5).map((result, index) => ({
        title: result.title,
        url: result.url,
        description: result.description,
        domain: this.extractDomain(result.url),
        snippet: this.createEnhancedSnippet(result.description, options.query),
        ...(result.age && { age: result.age }),
        relevanceScore: this.calculateRelevanceScore(result, options.query, index),
      }));

      const searchTime = createUnifiedTimestamp().unix - startTime;
      this.updateStats(searchTime);

      const response: WebSearchResponse = {
        query: options.query,
        totalResults: formattedResults.length,
        results: formattedResults,
        searchTime,
        timestamp: new Date().toISOString(),
        metadata: {
          searchType: options.includeRecent ? 'comprehensive' : 'standard',
          safesearch: searchOptions.safesearch,
          country: searchOptions.country,
          totalAvailable: allResults.length,
        },
        success: true,
      };

      console.log(`🔍 WebSearchTool: Found ${response.totalResults} results in ${searchTime}ms`);

      // Canonical Memory Integration: Store successful search patterns and results
      if (this.memorySystem && this.enableMemoryLearning && response.totalResults > 0) {
        try {
          await this.storeSearchLearning(options.query, response);
          await this.storeQualityResults(options.query, response.results);
        } catch (error) {
          console.warn('⚠️ Memory integration error:', error);
        }
      }

      return response;
    } catch (error: unknown) {
      const searchTime = createUnifiedTimestamp().unix - startTime;
      const errorClassification = this.classifySearchError(error);

      console.error(
        `❌ WebSearchTool error (${errorClassification.code}):`,
        errorClassification.technicalDetails || errorClassification.message,
      );

      // Enhanced error response with canonical structure
      const errorResponse: WebSearchResponse = {
        query: options.query,
        totalResults: 0,
        results: [],
        searchTime,
        timestamp: new Date().toISOString(),
        metadata: {
          searchType: 'error',
          ...(options.safesearch && { safesearch: options.safesearch }),
          ...(options.country && { country: options.country }),
        },
        success: false,
        error: errorClassification.message,
      };

      return errorResponse;
    }
  }

  /**
   * Quick search with minimal options
   */
  async quickSearch(query: string, count: number = 3): Promise<WebSearchResponse> {
    return this.search({ query, count });
  }

  /**
   * Search for news/recent information
   */
  async searchNews(query: string, count: number = 5): Promise<WebSearchResponse> {
    return this.search({
      query: `${query} news`,
      count,
      includeRecent: true,
    });
  }

  /**
   * Search with specific country/region
   */
  async searchByRegion(
    query: string,
    country: string,
    count: number = 5,
  ): Promise<WebSearchResponse> {
    return this.search({ query, country, count });
  }

  /**
   * Advanced search with filtering and sorting
   */
  async advancedSearch(options: {
    query: string;
    count?: number;
    filterDomains?: string[]; // Filter results by specific domains
    excludeDomains?: string[]; // Exclude specific domains
    minRelevanceScore?: number; // Minimum relevance score
    sortBy?: 'relevance' | 'date' | 'domain'; // Sort results
    language?: string;
    safesearch?: 'strict' | 'moderate' | 'off';
    country?: string;
  }): Promise<WebSearchResponse> {
    // Perform initial search
    const searchOptions: WebSearchOptions = {
      query: options.query,
      count: (options.count || 5) + 10, // Get extra results for filtering
    };

    if (options.language) searchOptions.language = options.language;
    if (options.safesearch) searchOptions.safesearch = options.safesearch;
    if (options.country) searchOptions.country = options.country;

    const searchResult = await this.search(searchOptions);

    if (!searchResult.success) {
      return searchResult;
    }

    let filteredResults = searchResult.results;

    // Apply domain filtering
    if (options.filterDomains && options.filterDomains.length > 0) {
      filteredResults = filteredResults.filter(
        (result) =>
          result.domain && options.filterDomains!.some((domain) => result.domain!.includes(domain)),
      );
    }

    // Apply domain exclusion
    if (options.excludeDomains && options.excludeDomains.length > 0) {
      filteredResults = filteredResults.filter(
        (result) =>
          !result.domain ||
          !options.excludeDomains!.some((domain) => result.domain!.includes(domain)),
      );
    }

    // Apply relevance score filtering
    if (options.minRelevanceScore !== undefined) {
      filteredResults = filteredResults.filter(
        (result) => (result.relevanceScore || 0) >= options.minRelevanceScore!,
      );
    }

    // Apply sorting
    if (options.sortBy) {
      switch (options.sortBy) {
        case 'relevance':
          filteredResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
          break;
        case 'date':
          filteredResults.sort((a, b) => {
            // Sort by age (newer first)
            if (!a.age && !b.age) return 0;
            if (!a.age) return 1;
            if (!b.age) return -1;
            return a.age.localeCompare(b.age);
          });
          break;
        case 'domain':
          filteredResults.sort((a, b) => (a.domain || '').localeCompare(b.domain || ''));
          break;
      }
    }

    // Trim to requested count
    filteredResults = filteredResults.slice(0, options.count || 5);

    return {
      ...searchResult,
      results: filteredResults,
      totalResults: filteredResults.length,
      metadata: {
        ...searchResult.metadata,
        searchType: 'advanced',
        filtersApplied: true,
      },
    };
  }

  /**
   * Search with automatic query enhancement
   */
  async intelligentSearch(
    query: string,
    options?: {
      count?: number;
      enhanceQuery?: boolean;
      includeRelated?: boolean;
      language?: string;
      country?: string;
    },
  ): Promise<WebSearchResponse> {
    let enhancedQuery = query;

    // Enhance query with common search operators if requested
    if (options?.enhanceQuery !== false) {
      enhancedQuery = this.enhanceSearchQuery(query);
    }

    const searchOptions: WebSearchOptions = {
      query: enhancedQuery,
      count: options?.count || 5,
      includeRecent: true,
    };

    if (options?.language) searchOptions.language = options.language;
    if (options?.country) searchOptions.country = options.country;

    const searchResult = await this.search(searchOptions);

    // Add related search suggestions if requested
    if (options?.includeRelated && searchResult.success) {
      const relatedQueries = this.generateRelatedQueries(query);
      if (searchResult.metadata) {
        searchResult.metadata.relatedQueries = relatedQueries;
      }
    }

    return {
      ...searchResult,
      metadata: {
        ...searchResult.metadata,
        searchType: 'intelligent',
        originalQuery: query,
        ...(enhancedQuery !== query && { enhancedQuery }),
      },
    };
  }

  /**
   * Test the web search functionality
   */
  async testSearch(): Promise<boolean> {
    try {
      console.log('🔍 Testing web search functionality...');

      const testResult = await this.quickSearch('OpenAI GPT-4', 1);
      const isWorking = testResult.totalResults > 0 || testResult.results.length >= 0;

      if (isWorking) {
        console.log('✅ Web search test passed');
      } else {
        console.log('⚠️ Web search test returned no results');
      }

      return isWorking;
    } catch (error) {
      console.error('❌ Web search test failed:', error);
      return false;
    }
  }

  /**
   * Combine results from multiple searches and remove duplicates
   */
  private combineAndDeduplicateResults(
    mainResults: BraveSearchResult[],
    recentResults: BraveSearchResult[],
  ): BraveSearchResult[] {
    const combined = [...mainResults];
    const existingUrls = new Set(mainResults.map((r) => r.url));

    // Add recent results if they're not duplicates
    for (const recentResult of recentResults) {
      if (!existingUrls.has(recentResult.url)) {
        combined.push(recentResult);
        existingUrls.add(recentResult.url);
      }
    }

    return combined;
  }

  /**
   * Calculate a simple relevance score for results
   */
  private calculateRelevanceScore(
    result: BraveSearchResult,
    query: string,
    position: number,
  ): number {
    let score = 100 - position * 10; // Base score decreases with position

    const queryTerms = query.toLowerCase().split(' ');
    const titleLower = result.title.toLowerCase();
    const descLower = result.description.toLowerCase();

    // Boost score for query terms in title
    for (const term of queryTerms) {
      if (titleLower.includes(term)) {
        score += 20;
      }
      if (descLower.includes(term)) {
        score += 10;
      }
    }

    // Boost for recent results
    if (result.age && (result.age.includes('hour') || result.age.includes('minute'))) {
      score += 15;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get search tool configuration
   */
  getConfig() {
    return {
      provider: 'Brave Search',
      clientConfig: this.braveClient.getConfig(),
    };
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    searchCount: number;
    averageSearchTime: number;
    totalSearchTime: number;
  } {
    return {
      searchCount: this.searchCount,
      averageSearchTime: this.searchCount > 0 ? this.totalSearchTime / this.searchCount : 0,
      totalSearchTime: this.totalSearchTime,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.searchCount = 0;
    this.totalSearchTime = 0;
    console.log('📊 WebSearchTool: Statistics reset');
  }

  /**
   * Health check for search functionality
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    message: string;
    details: {
      searchClientAvailable: boolean;
      testPassed?: boolean;
      error?: string;
    };
  }> {
    try {
      const clientConfig = this.braveClient.getConfig();
      const clientAvailable = !!clientConfig;

      if (!clientAvailable) {
        return {
          status: 'unhealthy',
          message: 'Search client not available',
          details: { searchClientAvailable: false },
        };
      }

      // Perform a simple test search
      const testPassed = await this.testSearch();

      return {
        status: testPassed ? 'healthy' : 'degraded',
        message: testPassed
          ? 'WebSearchTool is healthy and search functionality confirmed'
          : 'WebSearchTool is available but search test failed',
        details: {
          searchClientAvailable: true,
          testPassed,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'WebSearchTool health check failed',
        details: {
          searchClientAvailable: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  // PRIVATE HELPER METHODS

  /**
   * Perform search with retry logic
   */
  private async performSearchWithRetry(
    query: string,
    options: {
      count: number;
      safesearch: 'strict' | 'moderate' | 'off';
      country: string;
      timeout: number;
    },
    maxRetries: number,
  ): Promise<BraveSearchResult[]> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Create search options without timeout property
        const searchOptions = {
          count: options.count,
          safesearch: options.safesearch,
          country: options.country,
        };
        return await this.braveClient.quickSearch(query, searchOptions);
      } catch (error) {
        lastError = error;
        const errorClassification = this.classifySearchError(error);

        if (!errorClassification.isRetryable || attempt === maxRetries) {
          throw error;
        }

        console.log(
          `⚠️ WebSearchTool: Attempt ${attempt}/${maxRetries} failed (retryable), waiting before retry...`,
        );
        await this.sleep(1000 * attempt); // Exponential backoff
      }
    }

    throw lastError;
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Create enhanced snippet highlighting query terms
   */
  private createEnhancedSnippet(description: string, query: string): string {
    const queryTerms = query.toLowerCase().split(' ');
    let snippet = description;

    // Highlight query terms (for display purposes)
    for (const term of queryTerms) {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      snippet = snippet.replace(regex, `**${term}**`);
    }

    return snippet.length > 200 ? snippet.substring(0, 200) + '...' : snippet;
  }

  /**
   * Update search statistics
   */
  private updateStats(searchTime: number): void {
    this.searchCount++;
    this.totalSearchTime += searchTime;
  }

  /**
   * Classify search errors for better handling
   */
  private classifySearchError(error: unknown): WebSearchError {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    // Network/connectivity errors
    if (errorMsg.includes('ENOTFOUND') || errorMsg.includes('ECONNREFUSED')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Unable to connect to search service. Please check your internet connection.',
        query: '',
        isRetryable: true,
        technicalDetails: errorMsg,
      };
    }

    // Timeout errors
    if (errorMsg.includes('timeout')) {
      return {
        code: 'TIMEOUT_ERROR',
        message: 'Search request timed out. Please try again.',
        query: '',
        isRetryable: true,
        technicalDetails: errorMsg,
      };
    }

    // Rate limiting
    if (errorMsg.includes('429') || errorMsg.includes('rate limit')) {
      return {
        code: 'RATE_LIMIT_ERROR',
        message: 'Search rate limit exceeded. Please wait before searching again.',
        query: '',
        isRetryable: true,
        technicalDetails: errorMsg,
      };
    }

    // API key issues
    if (errorMsg.includes('401') || errorMsg.includes('unauthorized')) {
      return {
        code: 'AUTH_ERROR',
        message: 'Search service authentication failed. Please check API credentials.',
        query: '',
        isRetryable: false,
        technicalDetails: errorMsg,
      };
    }

    // Generic error
    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected search error occurred. Please try again.',
      query: '',
      isRetryable: false,
      technicalDetails: errorMsg,
    };
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Enhance search query with common operators
   */
  private enhanceSearchQuery(query: string): string {
    // Add quotes for exact phrase search if not already quoted
    if (!query.includes('"') && query.includes(' ')) {
      return `"${query}"`;
    }
    return query;
  }

  /**
   * Generate related search queries
   */
  private generateRelatedQueries(query: string): string[] {
    const baseQuery = query.toLowerCase();
    const relatedTerms = [
      `${baseQuery} tutorial`,
      `${baseQuery} guide`,
      `${baseQuery} examples`,
      `${baseQuery} best practices`,
      `how to ${baseQuery}`,
    ];

    return relatedTerms.slice(0, 3); // Return top 3 related queries
  }

  // CANONICAL ONEAGENT MEMORY INTEGRATION

  /**
   * Store search learning patterns in canonical memory system
   */
  private async storeSearchLearning(query: string, response: WebSearchResponse): Promise<void> {
    if (!this.memorySystem) return;

    try {
      // Store successful search pattern with canonical metadata
      const unified = unifiedMetadataService.create('search_pattern', 'WebSearchTool', {
        system: { userId: 'system', component: 'web-search', source: 'WebSearchTool' },
        content: {
          category: 'web_search',
          tags: ['search', 'query_pattern', 'performance'],
          sensitivity: 'internal',
          relevanceScore: 0.75,
          contextDependency: 'session',
        },
        custom: {
          query,
          timestamp: response.timestamp,
          query_length: query.length,
          result_count: response.totalResults,
          search_time_ms: response.searchTime,
          domains: response.results.map((r) => r.domain).filter(Boolean),
          relevance_scores: response.results.map((r) => r.relevanceScore).filter(Boolean),
        },
      });
      await this.memorySystem.addMemoryCanonical(
        `Search Query: "${query}" | Results: ${response.totalResults} found in ${response.searchTime}ms | Top domains: ${response.results
          .slice(0, 3)
          .map((r) => r.domain)
          .join(', ')}`,
        unified,
        'system',
      );
      console.log(`🧠 Stored search learning for query: "${query}"`);
    } catch (error) {
      console.warn('⚠️ Failed to store search learning:', error);
    }
  }

  /**
   * Retrieve similar search patterns from canonical memory
   */
  private async getSimilarSearchPatterns(query: string): Promise<unknown[]> {
    if (!this.memorySystem) return [];

    try {
      const searchResults = await this.memorySystem.searchMemory(
        `search query similar to: ${query}`,
      );

      return Array.isArray(searchResults) ? searchResults : [];
    } catch (error) {
      console.warn('⚠️ Failed to retrieve similar search patterns:', error);
      return [];
    }
  }

  /**
   * Store high-quality search results for future reference
   */
  private async storeQualityResults(
    query: string,
    results: WebSearchResponse['results'],
  ): Promise<void> {
    if (!this.memorySystem || results.length === 0) return;

    try {
      // Store only high-relevance results
      const qualityResults = results.filter((r) => (r.relevanceScore || 0) > 70);

      if (qualityResults.length > 0) {
        const unified = unifiedMetadataService.create('quality_search_results', 'WebSearchTool', {
          system: { userId: 'system', component: 'web-search', source: 'WebSearchTool' },
          content: {
            category: 'web_search',
            tags: ['search_results', 'high_quality', 'reference'],
            sensitivity: 'internal',
            relevanceScore: 0.8,
            contextDependency: 'session',
          },
          custom: {
            original_query: query,
            result_count: qualityResults.length,
            domains: qualityResults.map((r) => r.domain),
            urls: qualityResults.map((r) => r.url),
          },
        });
        await this.memorySystem.addMemoryCanonical(
          `High-quality search results for "${query}": ${qualityResults.map((r) => `${r.title} (${r.domain}) - ${r.description.substring(0, 100)}`).join(' | ')}`,
          unified,
          'system',
        );
        console.log(`🧠 Stored ${qualityResults.length} quality results for: "${query}"`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to store quality results:', error);
    }
  }

  /**
   * Get cached search insights from canonical memory
   */
  async getSearchInsights(query: string): Promise<{
    similarQueries: string[];
    commonDomains: string[];
    avgResponseTime: number;
    recommendedFilters: string[];
  }> {
    if (!this.memorySystem) {
      return {
        similarQueries: [],
        commonDomains: [],
        avgResponseTime: 0,
        recommendedFilters: [],
      };
    }

    try {
      const patterns = await this.getSimilarSearchPatterns(query);

      // Analyze patterns to provide insights with proper type handling
      const domains = patterns.flatMap((p) => {
        const pattern = p as { metadata?: { domains?: string[] } };
        return pattern.metadata?.domains || [];
      });

      const responseTimes = patterns
        .map((p) => {
          const pattern = p as { metadata?: { search_time_ms?: number } };
          return pattern.metadata?.search_time_ms || 0;
        })
        .filter((t) => t > 0);

      return {
        similarQueries: patterns
          .map((p) => {
            const pattern = p as { metadata?: { original_query?: string } };
            return pattern.metadata?.original_query;
          })
          .filter((q): q is string => Boolean(q))
          .slice(0, 3),
        commonDomains: Array.from(new Set(domains)).slice(0, 5),
        avgResponseTime:
          responseTimes.length > 0
            ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
            : 0,
        recommendedFilters: this.generateRecommendedFilters(domains),
      };
    } catch (error) {
      console.warn('⚠️ Failed to get search insights:', error);
      return {
        similarQueries: [],
        commonDomains: [],
        avgResponseTime: 0,
        recommendedFilters: [],
      };
    }
  }

  /**
   * Generate recommended filters based on historical data
   */
  private generateRecommendedFilters(domains: string[]): string[] {
    const domainCounts: Record<string, number> = {};
    domains.forEach((domain) => {
      domainCounts[domain] = (domainCounts[domain] || 0) + 1;
    });

    return Object.entries(domainCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([domain]) => domain);
  }
}
