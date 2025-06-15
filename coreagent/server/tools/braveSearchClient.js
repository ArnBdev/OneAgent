"use strict";
// filepath: coreagent/tools/braveSearchClient.ts
// Brave Search API client for web search capabilities
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BraveSearchClient = void 0;
const axios_1 = __importDefault(require("axios"));
class BraveSearchClient {
    constructor(config) {
        this.mockMode = false;
        this.lastRequestTime = 0;
        this.requestCount = 0;
        this.monthlyRequestCount = 0;
        this.monthStart = Date.now();
        this.config = {
            baseUrl: 'https://api.search.brave.com/res/v1/web/search',
            timeout: 10000,
            retryAttempts: 3,
            ...config
        };
        // Enable mock mode if no API key provided or in test environment
        this.mockMode = !config.apiKey || config.apiKey === 'your_brave_search_api_key_here' || process.env.NODE_ENV === 'test';
        if (!this.mockMode) {
            this.client = axios_1.default.create({
                baseURL: this.config.baseUrl,
                timeout: this.config.timeout,
                headers: {
                    'X-Subscription-Token': this.config.apiKey,
                    'Accept': 'application/json',
                    'Accept-Encoding': 'gzip'
                }
            });
        }
        else {
            console.log('🔍 BraveSearchClient: Running in mock mode');
            // Create a dummy client for mock mode
            this.client = axios_1.default.create();
        }
    }
    /**
     * Ensure we respect rate limits (1 request per second, 2000 per month)
     */
    async enforceRateLimit() {
        const now = Date.now();
        // Reset monthly counter if needed
        if (now - this.monthStart > 30 * 24 * 60 * 60 * 1000) { // ~30 days
            this.monthlyRequestCount = 0;
            this.monthStart = now;
        }
        // Check monthly limit
        if (this.monthlyRequestCount >= 2000) {
            console.warn('🚫 Monthly Brave Search limit (2000) reached. Switching to mock mode.');
            this.mockMode = true;
            return;
        }
        // Enforce 1 request per second limit
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < 1000) {
            const delay = 1000 - timeSinceLastRequest;
            console.log(`⏳ Rate limiting: waiting ${delay}ms before next request`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        this.lastRequestTime = Date.now();
        this.monthlyRequestCount++;
    }
    /**
     * Perform a web search using Brave Search API
     */ async search(query) {
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
                country: query.country || 'US'
            };
            const response = await this.client.get('', { params });
            if (response.status !== 200) {
                throw new Error(`Brave Search API returned status ${response.status}`);
            }
            const results = response.data.web?.results || [];
            console.log(`🔍 Found ${results.length} search results`);
            return results;
        }
        catch (error) {
            console.error('❌ Brave Search API error:', error.message);
            if (axios_1.default.isAxiosError(error)) {
                const braveError = {
                    code: error.code || 'UNKNOWN_ERROR',
                    message: error.message,
                    details: error.response?.data
                };
                throw braveError;
            }
            throw error;
        }
    }
    /**
     * Search with automatic retry logic
     */
    async searchWithRetry(query, maxRetries) {
        const retries = maxRetries || this.config.retryAttempts || 3;
        let lastError;
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                return await this.search(query);
            }
            catch (error) {
                lastError = error;
                console.log(`🔍 Search attempt ${attempt}/${retries} failed, retrying...`);
                if (attempt < retries) {
                    // Exponential backoff
                    const delay = Math.pow(2, attempt) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        throw lastError;
    }
    /**
     * Quick search - simplified interface for common use cases
     */
    async quickSearch(searchTerm, options) {
        const query = {
            q: searchTerm,
            count: options?.count || 5,
            safesearch: options?.safesearch || 'moderate',
            country: options?.country || 'US'
        };
        return this.searchWithRetry(query);
    }
    /**
     * Search for recent results (last week)
     */
    async searchRecent(searchTerm, count = 5) {
        const query = {
            q: `${searchTerm} after:${this.getLastWeekDate()}`,
            count,
            safesearch: 'moderate'
        };
        return this.searchWithRetry(query);
    }
    /**
     * Test the connection to Brave Search API
     */
    async testConnection() {
        try {
            if (this.mockMode) {
                console.log('🔍 BraveSearchClient: Mock connection test passed');
                return true;
            }
            const testResults = await this.quickSearch('test', { count: 1 });
            console.log('🔍 BraveSearchClient: Connection test passed');
            return testResults.length >= 0; // Even 0 results is a successful connection
        }
        catch (error) {
            console.error('❌ BraveSearchClient: Connection test failed:', error);
            return false;
        }
    }
    /**
     * Mock search implementation for development/testing
     */
    mockSearch(query) {
        console.log(`🔍 Mock search for: "${query.q}"`);
        const mockResults = [
            {
                title: `Mock Result 1 for "${query.q}"`,
                url: `https://example.com/result1?q=${encodeURIComponent(query.q)}`,
                description: `This is a mock search result for the query "${query.q}". In production, this would be real search results from Brave Search API.`,
                age: '2 hours ago',
                language: 'en',
                family_friendly: true
            },
            {
                title: `Mock Result 2 for "${query.q}"`,
                url: `https://example.com/result2?q=${encodeURIComponent(query.q)}`,
                description: `Another mock search result showing how the Brave Search integration would work with real data.`,
                age: '1 day ago',
                language: 'en',
                family_friendly: true
            },
            {
                title: `Mock Result 3 for "${query.q}"`,
                url: `https://example.com/result3?q=${encodeURIComponent(query.q)}`,
                description: `Third mock result demonstrating the search functionality. Replace with real API key to get actual results.`,
                age: '3 days ago',
                language: 'en',
                family_friendly: true
            }
        ];
        // Simulate API delay
        return new Promise(resolve => {
            setTimeout(() => resolve(mockResults.slice(0, query.count || 3)), 100);
        });
    }
    /**
     * Get date string for last week (for recent search)
     */
    getLastWeekDate() {
        const date = new Date();
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
            mockMode: this.mockMode
        };
    }
}
exports.BraveSearchClient = BraveSearchClient;
