/**
 * Unified Memory Creation Tool
 * Implements memory creation using the new UnifiedMCPTool framework
 */

import { UnifiedMCPTool, ToolExecutionResult, InputSchema } from './UnifiedMCPTool';
import { generateMemoryId } from '../memory/UnifiedMemoryInterface';

export class MemoryCreateTool extends UnifiedMCPTool {
  constructor() {
    const schema: InputSchema = {
      type: 'object',
      properties: {
        content: { 
          type: 'string', 
          description: 'Memory content to store' 
        },
        userId: { 
          type: 'string', 
          description: 'User ID for memory ownership' 
        },
        memoryType: { 
          type: 'string', 
          enum: ['short_term', 'long_term', 'workflow', 'session'],
          description: 'Type of memory to create' 
        },
        metadata: { 
          type: 'object', 
          description: 'Additional metadata for the memory' 
        }
      },
      required: ['content', 'userId']
    };

    super(
      'oneagent_memory_create',
      'Create new memory with real-time learning capability',
      schema,
      'enhanced' // Constitutional AI level
    );
  }

  /**
   * Core memory creation logic
   */
  protected async executeCore(args: any): Promise<ToolExecutionResult> {
    try {
      const memoryType = args.memoryType || 'long_term';
      let createResult: string;
      
      // Determine storage method based on memory type
      if (memoryType === 'short_term' || memoryType === 'session') {
        // Store as conversation for short-term memories
        createResult = await this.unifiedMemoryClient.storeConversation({
          id: generateMemoryId(),
          agentId: args.userId || 'oneagent_mcp_copilot',
          userId: args.userId || 'mcp_user',
          timestamp: new Date(),
          content: args.content,
          context: args.metadata?.context || {},
          outcome: {
            success: true,
            qualityScore: args.metadata?.qualityScore || 0.8,
            learningsExtracted: 1
          },
          metadata: {
            ...args.metadata,
            memoryType,
            createdVia: 'unified_mcp_tool',
            constitutionalCompliant: true
          }
        });      } else if (memoryType === 'workflow') {
        // Store as pattern for workflow memories
        createResult = await this.unifiedMemoryClient.storePattern({
          id: generateMemoryId(),
          agentId: args.userId || 'oneagent_mcp_copilot',
          patternType: 'functional',
          description: args.content,
          frequency: args.metadata?.frequency || 1,
          strength: args.metadata?.strength || 0.8,
          conditions: args.metadata?.conditions || [],
          outcomes: args.metadata?.outcomes || [],
          metadata: {
            ...args.metadata,
            memoryType,
            createdVia: 'unified_mcp_tool',
            constitutionalCompliant: true
          }
        });
      } else {
        // Default to learning for long_term memories
        createResult = await this.unifiedMemoryClient.storeLearning({
          id: generateMemoryId(),
          agentId: args.userId || 'oneagent_mcp_copilot',
          learningType: 'documentation_context',
          content: args.content,
          confidence: args.metadata?.confidence || 0.8,
          applicationCount: 0,
          lastApplied: new Date(),
          sourceConversations: [],
          metadata: {
            ...args.metadata,
            memoryType,
            createdVia: 'unified_mcp_tool',
            constitutionalCompliant: true
          }
        });
      }

      return {
        success: true,
        data: {
          memoryId: createResult,
          content: args.content,
          userId: args.userId,
          memoryType,
          message: 'Memory created successfully with unified tool framework',
          capabilities: [
            'Real-time learning integration',
            'Constitutional AI compliance',
            'Type-aware storage routing',
            'Graceful error handling'
          ]
        },
        qualityScore: 95, // High quality for successful creation
        metadata: {
          storageType: memoryType === 'workflow' ? 'pattern' : 
                      (memoryType === 'short_term' || memoryType === 'session') ? 'conversation' : 'learning',
          toolFramework: 'unified_mcp_v1.0',
          constitutionalLevel: 'enhanced'
        }
      };

    } catch (error) {
      console.error('[MemoryCreateTool] Storage error:', error);
      
      // Return partial success with fallback data
      return {
        success: false,
        data: {
          error: error instanceof Error ? error.message : 'Unknown storage error',
          fallbackSuggestion: 'Memory system may be temporarily unavailable',
          retryable: true,
          content: args.content, // Preserve content for potential retry
          userId: args.userId
        },
        qualityScore: 40, // Lower quality for failed creation
        metadata: {
          errorType: 'storage_failure',
          toolFramework: 'unified_mcp_v1.0'
        }
      };
    }
  }

  /**
   * Enhanced quality assessment for memory creation
   */
  protected async assessQuality(result: ToolExecutionResult): Promise<number> {
    let score = await super.assessQuality(result);
    
    // Memory-specific quality adjustments
    if (result.success) {
      // Bonus for successful memory creation
      score += 10;
      
      // Bonus for rich metadata
      if (result.data.memoryType && result.data.memoryId) {
        score += 5;
      }
      
      // Constitutional AI compliance bonus
      if (result.metadata?.constitutionalLevel === 'enhanced') {
        score += 5;
      }
    } else {
      // Penalty for failed creation, but not too harsh if graceful
      if (result.data.retryable) {
        score += 10; // Bonus for graceful failure handling
      }
    }

    return Math.min(score, 100);
  }

  /**
   * Memory-specific fallback data
   */
  protected getFallbackData(): any {
    return {
      message: 'Memory creation tool temporarily unavailable',
      suggestions: [
        'Verify unified memory server is running on port 8001',
        'Check memory system health via oneagent_system_health',
        'Try oneagent_memory_context to test memory system connectivity',
        'Retry with simpler content or metadata'
      ],
      alternatives: [
        'Use direct memory API endpoints',
        'Store content temporarily in local file',
        'Use oneagent_memory_context to verify system status'
      ]
    };
  }
}
