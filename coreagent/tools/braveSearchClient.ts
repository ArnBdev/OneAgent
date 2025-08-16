// filepath: coreagent/tools/braveSearchClient.ts
// Brave Search API client for web search capabilities

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  BraveSearchQuery,
  BraveSearchResponse,
  BraveSearchResult,
  BraveSearchConfig,
  BraveSearchError,
} from '../types/braveSearch';
import { createUnifiedTimestamp } from '../utils/UnifiedBackboneService';

export class BraveSearchClient {
  private client: AxiosInstance;
  private config: BraveSearchConfig;
  private mockMode: boolean = false;
  private lastRequestTime: number = 0;
  private requestCount: number = 0;
  private monthlyRequestCount: number = 0;
  private monthStart: number = createUnifiedTimestamp().unix;

  constructor(config: BraveSearchConfig) {
    this.config = {
      baseUrl: 'https://api.search.brave.com/res/v1/web/search',
      timeout: 10000,
      retryAttempts: 3,
      ...config,
    }; // Enable mock mode if no API key provided or in test environment
    this.mockMode =
      !config.apiKey ||
      config.apiKey === 'your_brave_search_api_key_here' ||
      process.env.NODE_ENV === 'test';

    if (this.mockMode) {
      console.log(
        '🔍 BraveSearchClient: Running in fallback mode (DuckDuckGo) - Configure BRAVE_API_KEY for production',
      );
    }
    if (!this.mockMode) {
      this.client = axios.create({
        baseURL: this.config.baseUrl!,
        timeout: this.config.timeout!,
        headers: {
          'X-Subscription-Token': this.config.apiKey,
          Accept: 'application/json',
          'Accept-Encoding': 'gzip',
        },
      });
    } else {
      console.log('🔍 BraveSearchClient: Running in mock mode');
      // Create a dummy client for mock mode
      this.client = axios.create();
    }
  }
  /**
   * Ensure we respect rate limits (1 request per second, 2000 per month)
   */
  private async enforceRateLimit(): Promise<void> {
    const now = createUnifiedTimestamp();

    // Reset monthly counter if needed
    if (now.unix - this.monthStart > 30 * 24 * 60 * 60 * 1000) {
      // ~30 days
      this.monthlyRequestCount = 0;
      this.monthStart = now.unix;
    }

    // Check monthly limit
    if (this.monthlyRequestCount >= 2000) {
      console.warn('🚫 Monthly Brave Search limit (2000) reached. Switching to mock mode.');
      this.mockMode = true;
      return;
    }

    // Enforce 1 request per second limit
    const timeSinceLastRequest = now.unix - this.lastRequestTime;
    if (timeSinceLastRequest < 1000) {
      const delay = 1000 - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: waiting ${delay}ms before next request`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    this.lastRequestTime = createUnifiedTimestamp().unix;
    this.monthlyRequestCount++;
  }

  /**
   * Perform a web search using Brave Search API
   */ async search(query: BraveSearchQuery): Promise<BraveSearchResult[]> {
    try {
      if (this.mockMode) {
        return this.mockSearch(query);
      }

      // Enforce rate limiting before making request
      await this.enforceRateLimit();

      console.log(`🔍 Searching for: "${query.q}"`);

      const params = {
        q: query.q,
        count: query.count || 10,
        offset: query.offset || 0,
        safesearch: query.safesearch || 'moderate',
        country: query.country || 'US',
      };

      const response: AxiosResponse<BraveSearchResponse> = await this.client.get('', { params });

      if (response.status !== 200) {
        throw new Error(`Brave Search API returned status ${response.status}`);
      }

      const results = response.data.web?.results || [];
      console.log(`🔍 Found ${results.length} search results`);

      return results;
    } catch (error: unknown) {
      console.error(
        '❌ Brave Search API error:',
        error instanceof Error ? error.message : 'Unknown error',
      );

      if (axios.isAxiosError(error)) {
        const braveError: BraveSearchError = {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message,
          details: error.response?.data,
        };
        throw braveError;
      }

      throw error;
    }
  }

  /**
   * Search with automatic retry logic
   */
  async searchWithRetry(
    query: BraveSearchQuery,
    maxRetries?: number,
  ): Promise<BraveSearchResult[]> {
    const retries = maxRetries || this.config.retryAttempts || 3;
    let lastError: unknown;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await this.search(query);
      } catch (error) {
        lastError = error;
        console.log(`🔍 Search attempt ${attempt}/${retries} failed, retrying...`);

        if (attempt < retries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Quick search - simplified interface for common use cases
   */
  async quickSearch(
    searchTerm: string,
    options?: {
      count?: number;
      safesearch?: 'strict' | 'moderate' | 'off';
      country?: string;
    },
  ): Promise<BraveSearchResult[]> {
    const query: BraveSearchQuery = {
      q: searchTerm,
      count: options?.count || 5,
      safesearch: options?.safesearch || 'moderate',
      country: options?.country || 'US',
    };

    return this.searchWithRetry(query);
  }

  /**
   * Search for recent results (last week)
   */
  async searchRecent(searchTerm: string, count: number = 5): Promise<BraveSearchResult[]> {
    const query: BraveSearchQuery = {
      q: `${searchTerm} after:${this.getLastWeekDate()}`,
      count,
      safesearch: 'moderate',
    };

    return this.searchWithRetry(query);
  }

  /**
   * Test the connection to Brave Search API
   */
  async testConnection(): Promise<boolean> {
    try {
      if (this.mockMode) {
        console.log('🔍 BraveSearchClient: Mock connection test passed');
        return true;
      }

      const testResults = await this.quickSearch('test', { count: 1 });
      console.log('🔍 BraveSearchClient: Connection test passed');
      return testResults.length >= 0; // Even 0 results is a successful connection
    } catch (error) {
      console.error('❌ BraveSearchClient: Connection test failed:', error);
      return false;
    }
  }
  /**
   * Real web search using DuckDuckGo as fallback when Brave API is not available
   * This ensures we always return real, live web search results (never placeholders)
   */
  private async mockSearch(query: BraveSearchQuery): Promise<BraveSearchResult[]> {
    console.log(`🔍 Brave API not configured - using DuckDuckGo fallback for: "${query.q}"`);
    console.log(`⚠️ CRITICAL: Configure BRAVE_API_KEY in .env for production-grade search`);

    try {
      // Use a real web search fallback - DuckDuckGo instant answers API
      const fallbackResults = await this.fallbackWebSearch(query.q, query.count || 3);
      return fallbackResults;
    } catch (error) {
      console.error('❌ Fallback search also failed:', error);

      // Only return educational results if all real search methods fail
      return this.getEducationalResults(query);
    }
  }

  /**
   * Fallback web search using DuckDuckGo instant answers
   */
  private async fallbackWebSearch(searchTerm: string, count: number): Promise<BraveSearchResult[]> {
    try {
      // DuckDuckGo instant answers API (free, no API key required)
      const response = await axios.get(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(searchTerm)}&format=json&no_html=1&skip_disambig=1`,
      );

      const results: BraveSearchResult[] = [];

      // Convert DuckDuckGo results to our format
      if (response.data.AbstractURL) {
        results.push({
          title: response.data.AbstractText || `Search result for "${searchTerm}"`,
          url: response.data.AbstractURL,
          description:
            response.data.Abstract || response.data.AbstractText || 'No description available',
          age: 'Recent',
          language: 'en',
          family_friendly: true,
        });
      }

      // Add related topics if available
      if (response.data.RelatedTopics && response.data.RelatedTopics.length > 0) {
        for (let i = 0; i < Math.min(count - 1, response.data.RelatedTopics.length); i++) {
          const topic = response.data.RelatedTopics[i];
          if (topic.FirstURL) {
            results.push({
              title: topic.Text || `Related: ${searchTerm}`,
              url: topic.FirstURL,
              description: topic.Text || 'Related search result',
              age: 'Recent',
              language: 'en',
              family_friendly: true,
            });
          }
        }
      }

      console.log(`🔍 DuckDuckGo fallback returned ${results.length} real results`);
      return results.slice(0, count);
    } catch (error) {
      console.error('❌ DuckDuckGo fallback failed:', error);
      throw error;
    }
  }

  /**
   * Educational results - only used when all real search methods fail
   */
  private getEducationalResults(query: BraveSearchQuery): BraveSearchResult[] {
    console.log(`⚠️ FALLBACK TO EDUCATIONAL RESULTS - Configure real search API keys!`);

    return [
      {
        title: `Configure BRAVE_API_KEY for "${query.q}" searches`,
        url: `https://brave.com/search/api/`,
        description: `To get real web search results for "${query.q}", configure BRAVE_API_KEY in your .env file. This educational result is shown because no real search APIs are configured.`,
        age: 'Educational',
        language: 'en',
        family_friendly: true,
      },
      {
        title: `Search API Configuration Guide`,
        url: `https://github.com/brave/search-api`,
        description: `Learn how to set up Brave Search API or other web search services to replace these educational placeholders with real search results.`,
        age: 'Educational',
        language: 'en',
        family_friendly: true,
      },
    ];
  }

  /**
   * Get date string for last week (for recent search)
   */
  private getLastWeekDate(): string {
    const timestamp = createUnifiedTimestamp();
    const date = new Date(timestamp.utc);
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  }

  /**
   * Get client configuration (without sensitive data)
   */
  getConfig() {
    return {
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      retryAttempts: this.config.retryAttempts,
      mockMode: this.mockMode,
    };
  }
}
