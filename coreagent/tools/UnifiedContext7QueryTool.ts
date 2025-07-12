/**
 * Unified Context7 Query Tool
 * 
 * Constitutional AI-compliant tool for documentation and context retrieval
 * through the Context7 MCP integration system.
 */

import { UnifiedMCPTool, ToolExecutionResult, InputSchema } from './UnifiedMCPTool';
import { Context7MCPIntegration, WebDocumentationQuery, WebDocumentationResult, WebDevelopmentSource } from '../mcp/Context7MCPIntegration';
import { OneAgentMemory, OneAgentMemoryConfig } from '../memory/OneAgentMemory';

export interface Context7Learning {
  id: string;
  agentId: string;
  learningType: string;
  content: string;
  confidence: number;
  applicationCount: number;
  lastApplied: Date;
  sourceConversations: unknown[];
  metadata: {
    tool: string;
    source: string;
    resultsCount: number;
    query: string;
  };
}

export interface Context7QueryParams {
  source?: string;
  query: string;
  context?: string;
  maxResults?: number;
  cacheOnly?: boolean;
}

export interface Context7QueryResult extends ToolExecutionResult {
  data: {
    results: WebDocumentationResult[];
    source: string;
    cached: boolean;
    totalResults: number;
    queryTime: number;
    metadata: {
      queryType: string;
      sourcesQueried: number;
      cacheHitRatio: number;
      averageResponseTime: number;
    };
  };
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
      // Prepare web documentation query with proper type handling
      const docQuery: WebDocumentationQuery = {
        technology: args.source || 'all',
        topic: args.query,
        maxResults: args.maxResults || 5
      };

      // Add context and version only if provided
      if (args.context) {
        docQuery.context = args.context;
      }

      // Execute web documentation search
      const results = await this.context7Integration.queryWebDocumentation(docQuery);
      const queryTime = Date.now() - startTime;

      // Apply Constitutional AI validation to results
      const validatedResults = await this.validateResults(results, args.query);

      // Store learning in memory
      await this.storeLearning(args, validatedResults, queryTime);

      // Calculate quality score
      const qualityScore = await this.calculateQualityScore(validatedResults);
      
      // Create response data
      const responseData: Context7QueryResult = {
        success: true,
        data: {
          results: validatedResults,
          source: args.source || 'multiple',
          cached: false, // WebDocumentationResult doesn't have cached property
          totalResults: validatedResults.length,
          queryTime,
          metadata: {
            queryType: 'documentation',
            sourcesQueried: args.source ? 1 : this.context7Integration.getAvailableWebSources().length,
            cacheHitRatio: 0, // Will be implemented with getCacheMetrics
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
  private async validateResults(results: WebDocumentationResult[], originalQuery: string): Promise<WebDocumentationResult[]> {
    const validatedResults: WebDocumentationResult[] = [];

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

      } catch (_error) {
        // Constitutional AI: Transparency - log validation errors
        console.warn(`Context7 result validation failed: ${_error instanceof Error ? _error.message : 'Unknown error'}`);
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
      /\b(password|secret|token|api[_-]?key)\s*[:=]\s*\S+/i,
      /\b(private|confidential|internal)\s+(key|token|secret)/i,
      /\bDO\s+NOT\s+(SHARE|DISTRIBUTE|COPY)/i
    ];

    return unsafePatterns.some(pattern => pattern.test(content));
  }

  /**
   * Check if result is helpful for the original query
   */
  private async isHelpfulForQuery(result: WebDocumentationResult, query: string): Promise<boolean> {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentWords = result.content.toLowerCase().split(/\s+/);
    const titleWords = result.title.toLowerCase().split(/\s+/);

    // Calculate relevance based on word overlap
    const titleMatches = queryWords.filter(word => titleWords.some((tw: string) => tw.includes(word) || word.includes(tw)));
    const contentMatches = queryWords.filter(word => contentWords.some((cw: string) => cw.includes(word) || word.includes(cw)));

    // Require minimum relevance threshold
    const relevanceRatio = (titleMatches.length * 2 + contentMatches.length) / (queryWords.length * 3);
    return relevanceRatio >= 0.3; // 30% relevance threshold
  }

  /**
   * Store learning and context in memory
   */
  private async storeLearning(params: Context7QueryParams, results: WebDocumentationResult[], queryTime: number): Promise<void> {
    try {
      const learning: Context7Learning = {
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
            sourcesCovered: results.map(r => r.technology).filter((s, i, arr) => arr.indexOf(s) === i).length,
            cached: 0 // WebDocumentationResult doesn't have cached property
          },
          topResults: results.slice(0, 3).map(r => ({
            title: r.title,
            source: r.technology,
            relevanceScore: r.relevanceScore,
            url: r.sourceUrl
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
      await this.memorySystem.addMemory({
        ...learning,
        type: 'learnings'
      });
    } catch (error) {
      // Non-critical error - log but don't fail the main operation
      console.warn(`Failed to store Context7 learning: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate quality score for the results
   */
  private async calculateQualityScore(results: WebDocumentationResult[]): Promise<number> {
    if (results.length === 0) {
      return 0;
    }

    // Base score from result count and relevance
    const avgRelevance = results.reduce((sum, r) => sum + r.relevanceScore, 0) / results.length;
    const countScore = Math.min(results.length / 5, 1); // Normalize to max 5 results
    
    // Bonus for diverse sources
    const uniqueSources = new Set(results.map(r => r.technology)).size;
    const diversityBonus = Math.min(uniqueSources / 3, 0.2); // Max 20% bonus for 3+ sources

    // Cache efficiency bonus
    const cacheRatio = 0; // WebDocumentationResult doesn't have cached property
    const cacheBonus = cacheRatio * 0.1; // Max 10% bonus for full cache hits

    // Calculate final score (0-100)
    const finalScore = (avgRelevance * 60 + countScore * 20 + diversityBonus * 100 + cacheBonus * 100);
    
    return Math.round(Math.min(finalScore, 100));
  }

  /**
   * Get available documentation sources
   */
  public getAvailableSources(): string[] {
    return this.context7Integration.getAvailableWebSources().map((s: WebDevelopmentSource) => s.name);
  }

  /**
   * Get Context7 performance metrics
   */
  public getPerformanceMetrics() {
    return this.context7Integration.getCacheMetrics();
  }
}
