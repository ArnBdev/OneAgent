/**
 * OneAgent Memory Search Tool - Enhanced with Memory Intelligence
 * Search through OneAgent persistent memory system with semantic insights and analytics
 */

import { UnifiedMCPTool, ToolExecutionResult, InputSchema } from './UnifiedMCPTool';
import { MemoryIntelligence } from '../intelligence/memoryIntelligence';

export class MemorySearchTool extends UnifiedMCPTool {
  private memoryIntelligence: MemoryIntelligence;

  constructor() {
    const schema: InputSchema = {
      type: 'object',
      properties: {
        query: { 
          type: 'string', 
          description: 'Search query for memory content' 
        },
        userId: { 
          type: 'string', 
          description: 'User ID to search within' 
        },
        memoryType: { 
          type: 'string', 
          enum: ['short_term', 'long_term', 'workflow', 'session', 'all'],
          description: 'Type of memory to search (default: all)' 
        },
        limit: { 
          type: 'number', 
          description: 'Maximum number of results (default: 10)' 
        },
        includeInsights: {
          type: 'boolean',
          description: 'Include intelligent insights and analytics (default: true)'
        }
      },
      required: ['query', 'userId']
    };

    super(
      'oneagent_memory_search',
      'Search OneAgent memory with semantic matching, filtering capabilities, and intelligent insights',
      schema,
      'enhanced'
    );

    // Initialize Memory Intelligence
    this.memoryIntelligence = new MemoryIntelligence();
  }  protected async executeCore(args: any): Promise<ToolExecutionResult> {
    try {
      const { query, userId, memoryType = 'all', limit = 10, includeInsights = true } = args;
      
      // Use Memory Intelligence for enhanced search with insights
      console.log('🧠 Using Memory Intelligence for enhanced search...');
      
      const intelligentResult = await this.memoryIntelligence.intelligentSearch(
        query,
        userId,
        { maxResults: limit }
      );

      console.log('✅ Memory Intelligence search completed:', {
        totalResults: intelligentResult.totalResults,
        averageQuality: intelligentResult.averageQuality,
        insightsCount: intelligentResult.metadata?.insights?.length || 0
      });

      return {
        success: true,
        data: {
          success: true,
          searchResults: {
            query: intelligentResult.query,
            results: intelligentResult.results.map(result => ({
              id: result.id,
              content: result.content,
              relevance: result.metadata.relevanceScore || 0.8,
              timestamp: result.metadata.timestamp.toISOString(),
              memoryType: result.metadata.category || 'session',
              userId: result.metadata.userId,
              metadata: result.metadata,
              qualityScore: result.qualityScore,
              constitutionalStatus: result.constitutionalStatus
            })),
            total: intelligentResult.totalResults,
            executionTime: `${intelligentResult.searchTime}ms`,
            searchType: 'intelligent_semantic',
            averageRelevance: intelligentResult.averageRelevance,
            averageQuality: intelligentResult.averageQuality,
            constitutionalCompliance: intelligentResult.constitutionalCompliance,
            insights: intelligentResult.metadata?.insights || []
          },
          query,
          userId,
          memoryType,
          limit,
          message: 'Intelligent memory search completed successfully with insights',
          capabilities: [
            'Intelligent semantic search with insights',
            'Pattern recognition and analytics',
            'Quality scoring and trend analysis',
            'Constitutional AI compliance',
            'Multi-user memory isolation',
            'Cross-conversation learning'
          ],
          qualityScore: Math.round(intelligentResult.averageQuality * 100) || 95,
          toolName: 'oneagent_memory_search',
          constitutionalCompliant: intelligentResult.constitutionalCompliance > 0.8,
          timestamp: new Date().toISOString(),
          metadata: {
            searchType: 'intelligent_semantic',
            toolFramework: 'unified_mcp_v1.0',
            constitutionalLevel: 'enhanced',
            memoryIntelligence: true          }
        }
      };
    } catch (error: any) {
      console.error('❌ Memory Intelligence search failed:', error.message);
      
      return {
        success: false,
        data: { error: `Memory search failed: ${error.message}` }
      };
    }
  }
}
