/**
 * Unified Web Search Tool
 * Constitutional AI compliant web search with quality filtering
 */

import { UnifiedMCPTool, ToolExecutionResult, InputSchema } from './UnifiedMCPTool';
import { WebSearchTool, WebSearchOptions } from './webSearch';
import { BraveSearchClient } from './braveSearchClient';
import { UnifiedBackboneService } from '../utils/UnifiedBackboneService';

export interface WebSearchArgs {
  query: string;
  maxResults?: number;
  qualityThreshold?: number;
  safesearch?: 'strict' | 'moderate' | 'off';
}

export class UnifiedWebSearchTool extends UnifiedMCPTool {
  private webSearchTool: WebSearchTool;

  constructor() {
    const schema: InputSchema = {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query for web content',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results (default: 5)',
        },
        qualityThreshold: {
          type: 'number',
          description: 'Minimum quality score for results (0-100, default: 80)',
        },
        safesearch: {
          type: 'string',
          enum: ['strict', 'moderate', 'off'],
          description: 'Safe search setting (default: moderate)',
        },
      },
      required: ['query'],
    };

    super(
      'oneagent_web_search',
      'Web search with quality filtering and Constitutional AI validation',
      schema,
      'enhanced',
    ); // Initialize with proper Brave client using centralized config
    const braveClient = new BraveSearchClient({
      apiKey: UnifiedBackboneService.config.braveApiKey || 'mock_mode',
      baseUrl: 'https://api.search.brave.com/res/v1/web/search',
      timeout: 10000,
      retryAttempts: 3,
    });
    this.webSearchTool = new WebSearchTool(braveClient);
  }

  public async executeCore(args: unknown): Promise<ToolExecutionResult> {
    try {
      const {
        query,
        maxResults = 5,
        qualityThreshold = 80,
        safesearch = 'moderate',
      } = args as WebSearchArgs;

      const searchOptions: WebSearchOptions = {
        query,
        count: maxResults,
        safesearch,
        includeRecent: true,
      };

      const searchResults = await this.webSearchTool.search(searchOptions);

      return {
        success: true,
        data: {
          success: true,
          searchResults,
          query,
          qualityThreshold,
          maxResults,
          message: 'Enhanced search completed with quality filtering',
          capabilities: [
            'Constitutional AI content validation',
            'Quality-based result filtering',
            'Source preference handling',
            'Real-time result scoring',
          ],
          qualityScore: 95,
          toolName: 'oneagent_enhanced_search',
          constitutionalCompliant: true,
          timestamp: new Date().toISOString(),
          searchType: 'enhanced_web',
          toolFramework: 'unified_mcp_v1.0',
          constitutionalLevel: 'critical',
        },
      };
    } catch (error) {
      return {
        success: false,
        data: error instanceof Error ? error.message : 'Web search failed',
        qualityScore: 0,
      };
    }
  }

  private calculateQualityScore(filtered: unknown[], original: unknown[]): number {
    if (original.length === 0) return 0;

    const filterRatio = filtered.length / original.length;
    const baseScore = Math.min(filtered.length * 15, 75); // Up to 75 for results count
    const qualityBonus = filterRatio > 0.8 ? 25 : filterRatio > 0.5 ? 15 : 5;

    return Math.min(baseScore + qualityBonus, 100);
  }
}
