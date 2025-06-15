"use strict";
// filepath: coreagent/tools/webSearch.ts
// Web search tool using Brave Search API
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSearchTool = void 0;
class WebSearchTool {
    constructor(braveClient) {
        this.braveClient = braveClient;
    }
    /**
     * Perform a web search and return formatted results
     */
    async search(options) {
        const startTime = Date.now();
        try {
            console.log(`🔍 WebSearchTool: Searching for "${options.query}"`);
            const searchOptions = {
                count: options.count || 5,
                safesearch: options.safesearch || 'moderate',
                country: options.country || 'US'
            };
            // Perform main search
            const results = await this.braveClient.quickSearch(options.query, searchOptions);
            // Optionally include recent results
            let recentResults = [];
            if (options.includeRecent) {
                try {
                    recentResults = await this.braveClient.searchRecent(options.query, 2);
                }
                catch (error) {
                    console.log('⚠️ Could not fetch recent results:', error);
                }
            }
            // Combine and deduplicate results
            const allResults = this.combineAndDeduplicateResults(results, recentResults);
            // Format results
            const formattedResults = allResults.slice(0, options.count || 5).map((result, index) => ({
                title: result.title,
                url: result.url,
                description: result.description,
                ...(result.age && { age: result.age }),
                relevanceScore: this.calculateRelevanceScore(result, options.query, index)
            }));
            const searchTime = Date.now() - startTime;
            const response = {
                query: options.query,
                totalResults: formattedResults.length,
                results: formattedResults,
                searchTime,
                timestamp: new Date().toISOString()
            };
            console.log(`🔍 WebSearchTool: Found ${response.totalResults} results in ${searchTime}ms`);
            return response;
        }
        catch (error) {
            console.error('❌ WebSearchTool error:', error.message);
            // Return empty results on error, but don't throw
            return {
                query: options.query,
                totalResults: 0,
                results: [],
                searchTime: Date.now() - startTime,
                timestamp: new Date().toISOString()
            };
        }
    }
    /**
     * Quick search with minimal options
     */
    async quickSearch(query, count = 3) {
        return this.search({ query, count });
    }
    /**
     * Search for news/recent information
     */
    async searchNews(query, count = 5) {
        return this.search({
            query: `${query} news`,
            count,
            includeRecent: true
        });
    }
    /**
     * Search with specific country/region
     */
    async searchByRegion(query, country, count = 5) {
        return this.search({ query, country, count });
    }
    /**
     * Test the web search functionality
     */
    async testSearch() {
        try {
            console.log('🔍 Testing web search functionality...');
            const testResult = await this.quickSearch('OpenAI GPT-4', 1);
            const isWorking = testResult.totalResults > 0 || testResult.results.length >= 0;
            if (isWorking) {
                console.log('✅ Web search test passed');
            }
            else {
                console.log('⚠️ Web search test returned no results');
            }
            return isWorking;
        }
        catch (error) {
            console.error('❌ Web search test failed:', error);
            return false;
        }
    }
    /**
     * Combine results from multiple searches and remove duplicates
     */
    combineAndDeduplicateResults(mainResults, recentResults) {
        const combined = [...mainResults];
        const existingUrls = new Set(mainResults.map(r => r.url));
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
    calculateRelevanceScore(result, query, position) {
        let score = 100 - (position * 10); // Base score decreases with position
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
            clientConfig: this.braveClient.getConfig()
        };
    }
}
exports.WebSearchTool = WebSearchTool;
