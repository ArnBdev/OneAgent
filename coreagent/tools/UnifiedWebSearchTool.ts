/**
 * Unified Web Search Tool
 * Constitutional AI compliant web search with quality filtering
 */

import { UnifiedMCPTool, ToolExecutionResult, InputSchema } from './UnifiedMCPTool';
import { WebSearchTool, WebSearchOptions } from './webSearch';
import { BraveSearchClient } from './braveSearchClient';
import { oneAgentConfig } from '../config/index';

export class UnifiedWebSearchTool extends UnifiedMCPTool {
  private webSearchTool: WebSearchTool;

  constructor() {
    const schema: InputSchema = {
      type: 'object',
      properties: {
        query: { 
          type: 'string', 
          description: 'Search query for web content' 
        },
        maxResults: { 
          type: 'number', 
          description: 'Maximum number of results (default: 5)' 
        },
        qualityThreshold: { 
          type: 'number', 
          description: 'Minimum quality score for results (0-100, default: 80)' 
        },
        safesearch: { 
          type: 'string', 
          enum: ['strict', 'moderate', 'off'],
          description: 'Safe search setting (default: moderate)' 
        }
      },
      required: ['query']
    };

    super(
      'oneagent_web_search',
      'Web search with quality filtering and Constitutional AI validation',
      schema,
      'enhanced'
    );    // Initialize with proper Brave client using centralized config
    const braveClient = new BraveSearchClient({
      apiKey: oneAgentConfig.braveApiKey || 'mock_mode',
      baseUrl: 'https://api.search.brave.com/res/v1/web/search',
      timeout: 10000,
      retryAttempts: 3
    });
    this.webSearchTool = new WebSearchTool(braveClient);
  }

  protected async executeCore(args: any): Promise<ToolExecutionResult> {
    try {
      const { 
        query, 
        maxResults = 5, 
        qualityThreshold = 80,
        safesearch = 'moderate'
      } = args;

      const searchOptions: WebSearchOptions = {
        query,
        count: maxResults,
        safesearch,
        includeRecent: true
      };

      const searchResults = await this.webSearchTool.search(searchOptions);

      // Apply quality filtering
      const filteredResults = searchResults.results.filter(result => {
        // Basic quality scoring based on title/description completeness
        let score = 0;
        if (result.title && result.title.length > 10) score += 30;
        if (result.description && result.description.length > 50) score += 40;
        if (result.url && result.url.includes('https://')) score += 20;
        if (result.age && !result.age.includes('years ago')) score += 10;
        
        return score >= qualityThreshold;
      });      return {
        success: true,
        data: {
          query: searchResults.query,
          totalResults: searchResults.totalResults,
          results: filteredResults,
          searchTime: searchResults.searchTime,
          qualityFiltered: filteredResults.length < searchResults.results.length,
          qualityThreshold,
          timestamp: searchResults.timestamp
        },
        qualityScore: this.calculateQualityScore(filteredResults, searchResults.results),
        metadata: {
          searchType: 'web_search',
          toolFramework: 'unified_mcp_v1.0',
          constitutionalLevel: 'enhanced'
        }
      };    } catch (error) {
      return {
        success: false,
        data: error instanceof Error ? error.message : 'Web search failed',
        qualityScore: 0
      };
    }
  }

  private calculateQualityScore(filtered: any[], original: any[]): number {
    if (original.length === 0) return 0;
    
    const filterRatio = filtered.length / original.length;
    const baseScore = Math.min(filtered.length * 15, 75); // Up to 75 for results count
    const qualityBonus = filterRatio > 0.8 ? 25 : filterRatio > 0.5 ? 15 : 5;
    
    return Math.min(baseScore + qualityBonus, 100);
  }
}
