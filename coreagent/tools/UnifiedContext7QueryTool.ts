/**
 * Unified Context7 Query Tool
 * 
 * Constitutional AI-compliant tool for documentation and context retrieval
 * through the Context7 MCP integration system.
 */

import { UnifiedMCPTool, ToolExecutionResult, InputSchema } from './UnifiedMCPTool';
import { Context7MCPIntegration, DocumentationQuery, DocumentationResult } from '../mcp/Context7MCPIntegration';
import { OneAgentMemory, OneAgentMemoryConfig } from '../memory/OneAgentMemory';

export interface Context7QueryParams {
  source?: string;
  query: string;
  context?: string;
  maxResults?: number;
  cacheOnly?: boolean;
}

export interface Context7QueryResult extends ToolExecutionResult {
  // The main results are in the 'data' property as required by ToolExecutionResult
}

/**
 * Unified Context7 Query Tool for documentation retrieval
 */
export class UnifiedContext7QueryTool extends UnifiedMCPTool {
  private context7Integration: Context7MCPIntegration;
  private memorySystem: OneAgentMemory;
  public name: string;

  constructor(context7Integration: Context7MCPIntegration) {
    const schema: InputSchema = {
      type: 'object',
      properties: {
        source: { type: 'string', description: 'Documentation source to query (optional)' },
        query: { type: 'string', description: 'Search query for documentation' },
        context: { type: 'string', description: 'Additional context for the search (optional)' },
        maxResults: { type: 'number', description: 'Maximum number of results to return (default: 5)' },
        cacheOnly: { type: 'boolean', description: 'Only return cached results (optional)' }
      },
      required: ['query']
    };

    super(
      'oneagent_context7_query',
      'Query documentation and context from various sources with Constitutional AI validation',
      schema,
      'enhanced'
    );
    
    this.context7Integration = context7Integration;
    const memoryConfig: OneAgentMemoryConfig = {
      apiKey: process.env.MEM0_API_KEY || 'demo-key',
      apiUrl: process.env.MEM0_API_URL
    };
    this.memorySystem = new OneAgentMemory(memoryConfig);
    this.name = 'oneagent_context7_query';
  }

  /**
   * Core execution method implementing documentation search
   */
  public async executeCore(args: Context7QueryParams): Promise<ToolExecutionResult> {
    const startTime = Date.now();

    try {
      // Prepare documentation query with proper type handling
      const docQuery: DocumentationQuery = {
        source: args.source || 'all',
        query: args.query,
        maxResults: args.maxResults || 5
      };

      // Add context only if provided
      if (args.context) {
        docQuery.context = args.context;
      }

      // Execute documentation search
      const results = await this.context7Integration.queryDocumentation(docQuery);
      const queryTime = Date.now() - startTime;

      // Apply Constitutional AI validation to results
      const validatedResults = await this.validateResults(results, args.query);

      // Store learning in memory
      await this.storeLearning(args, validatedResults, queryTime);

      // Calculate quality score
      const qualityScore = await this.calculateQualityScore(validatedResults);      // Create response data
      const responseData: Context7QueryResult = {
        success: true,
        data: {
          results: validatedResults,
          source: args.source || 'multiple',
          cached: validatedResults.some(r => r.cached),
          totalResults: validatedResults.length,
          queryTime,
          metadata: {
            queryType: 'documentation',
            sourcesQueried: args.source ? 1 : this.context7Integration.getAvailableSources().length,
            cacheHitRatio: this.context7Integration.getCacheHitRatio(),
            averageResponseTime: queryTime
          }
        },
        qualityScore
      };

      return responseData;

    } catch (error) {
      throw new Error(`Context7 query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate input parameters
   */
  private async validateParams(params: Context7QueryParams): Promise<void> {
    if (!params.query || params.query.trim().length === 0) {
      throw new Error('Query parameter is required and cannot be empty');
    }

    if (params.query.length > 500) {
      throw new Error('Query parameter too long (max 500 characters)');
    }

    if (params.maxResults && (params.maxResults < 1 || params.maxResults > 50)) {
      throw new Error('maxResults must be between 1 and 50');
    }

    // Constitutional AI: Safety check for query content
    const unsafePatterns = [
      /\b(password|secret|token|key)\b/i,
      /\b(hack|exploit|vulnerability)\b/i,
      /\b(malicious|dangerous|harmful)\b/i
    ];

    for (const pattern of unsafePatterns) {
      if (pattern.test(params.query)) {
        throw new Error('Query contains potentially unsafe content');
      }
    }
  }

  /**
   * Validate and filter results using Constitutional AI principles
   */
  private async validateResults(results: DocumentationResult[], originalQuery: string): Promise<DocumentationResult[]> {
    const validatedResults: DocumentationResult[] = [];

    for (const result of results) {
      try {
        // Constitutional AI: Accuracy check
        if (result.relevanceScore < 0.3) {
          continue; // Skip low-relevance results
        }

        // Constitutional AI: Safety check
        if (await this.containsUnsafeContent(result.content)) {
          continue; // Skip potentially unsafe content
        }

        // Constitutional AI: Helpfulness check
        if (await this.isHelpfulForQuery(result, originalQuery)) {
          validatedResults.push(result);
        }

      } catch (error) {
        // Constitutional AI: Transparency - log validation errors        console.warn(`Context7 result validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        continue;
      }
    }

    return validatedResults;
  }

  /**
   * Check if content contains unsafe information
   */
  private async containsUnsafeContent(content: string): Promise<boolean> {
    const unsafePatterns = [
      /\b(password|secret|token|api[_\-]?key)\s*[:=]\s*\S+/i,
      /\b(private|confidential|internal)\s+(key|token|secret)/i,
      /\bDO\s+NOT\s+(SHARE|DISTRIBUTE|COPY)/i
    ];

    return unsafePatterns.some(pattern => pattern.test(content));
  }

  /**
   * Check if result is helpful for the original query
   */
  private async isHelpfulForQuery(result: DocumentationResult, query: string): Promise<boolean> {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentWords = result.content.toLowerCase().split(/\s+/);
    const titleWords = result.title.toLowerCase().split(/\s+/);

    // Calculate relevance based on word overlap
    const titleMatches = queryWords.filter(word => titleWords.some(tw => tw.includes(word) || word.includes(tw)));
    const contentMatches = queryWords.filter(word => contentWords.some(cw => cw.includes(word) || word.includes(cw)));

    // Require minimum relevance threshold
    const relevanceRatio = (titleMatches.length * 2 + contentMatches.length) / (queryWords.length * 3);
    return relevanceRatio >= 0.3; // 30% relevance threshold
  }

  /**
   * Store learning and context in memory
   */
  private async storeLearning(params: Context7QueryParams, results: DocumentationResult[], queryTime: number): Promise<void> {
    try {
      const learning: any = {
        id: `learning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentId: this.name, // Use tool name as agentId for now
        learningType: 'documentation_context',
        content: JSON.stringify({
          query: params.query,
          source: params.source || 'multiple',
          resultsCount: results.length,
          queryTime,
          timestamp: new Date().toISOString(),
          quality: {
            averageRelevance: results.reduce((sum, r) => sum + r.relevanceScore, 0) / (results.length || 1),
            sourcesCovered: results.map(r => r.source).filter((s, i, arr) => arr.indexOf(s) === i).length,
            cached: results.filter(r => r.cached).length
          },
          topResults: results.slice(0, 3).map(r => ({
            title: r.title,
            source: r.source,
            relevanceScore: r.relevanceScore,
            url: r.url
          }))
        }),
        confidence: 0.9,
        applicationCount: 0,
        lastApplied: new Date(),
        sourceConversations: [],
        metadata: {
          tool: 'context7_query',
          source: params.source || 'multiple',
          resultsCount: results.length,
          query: params.query
        }
      };
      await this.memorySystem.addMemory('learnings', learning);
    } catch (error) {
      // Non-critical error - log but don't fail the main operation
      console.warn(`Failed to store Context7 learning: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate quality score for the results
   */
  private async calculateQualityScore(results: DocumentationResult[]): Promise<number> {
    if (results.length === 0) {
      return 0;
    }

    // Base score from result count and relevance
    const avgRelevance = results.reduce((sum, r) => sum + r.relevanceScore, 0) / results.length;
    const countScore = Math.min(results.length / 5, 1); // Normalize to max 5 results
    
    // Bonus for diverse sources
    const uniqueSources = new Set(results.map(r => r.source)).size;
    const diversityBonus = Math.min(uniqueSources / 3, 0.2); // Max 20% bonus for 3+ sources

    // Cache efficiency bonus
    const cacheRatio = results.filter(r => r.cached).length / results.length;
    const cacheBonus = cacheRatio * 0.1; // Max 10% bonus for full cache hits

    // Calculate final score (0-100)
    const finalScore = (avgRelevance * 60 + countScore * 20 + diversityBonus * 100 + cacheBonus * 100);
    
    return Math.round(Math.min(finalScore, 100));
  }

  /**
   * Get available documentation sources
   */
  public getAvailableSources(): string[] {
    return this.context7Integration.getAvailableSources().map(s => s.name);
  }

  /**
   * Get Context7 performance metrics
   */
  public getPerformanceMetrics() {
    return this.context7Integration.getPerformanceStatus();
  }
}
