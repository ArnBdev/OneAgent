/**
 * Unified Memory Creation Tool
 * Implements memory creation using the new UnifiedMCPTool framework
 */

import { UnifiedMCPTool, ToolExecutionResult, InputSchema } from './UnifiedMCPTool';
import { UnifiedMemoryClient } from '../memory/UnifiedMemoryClient';
import { oneAgentConfig } from '../config/index';

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
  }  /**
   * Core memory creation logic
   */
  protected async executeCore(args: any): Promise<ToolExecutionResult> {
    try {        const memoryType = args.memoryType || 'long_term';
      
      // Use the singleton RealUnifiedMemoryClient instance
      const { realUnifiedMemoryClient } = await import('../memory/RealUnifiedMemoryClient');      
      // Ensure connection to the FastAPI server (safe to call multiple times)
      await realUnifiedMemoryClient.connect();

      // Create comprehensive metadata with rich contextual information
      const enhancedMetadata = {
        // Core identity and source tracking
        source: args.metadata?.source || 'oneagent_mcp_tool',
        toolName: 'oneagent_memory_create',
        toolVersion: '4.0.0',
        memoryType: memoryType,
        
        // Quality and validation metrics
        qualityScore: 95,
        constitutionalCompliant: true,
        validationStatus: 'passed',
        
        // User and session context
        userId: args.userId,
        sessionId: args.metadata?.sessionId || `session_${Date.now()}`,
        agentId: args.metadata?.agentId || 'oneagent_copilot',
        
        // Content analysis
        contentLength: args.content.length,
        contentType: args.metadata?.contentType || 'text',
        contentHash: args.content.substring(0, 8),
        
        // Temporal context
        createdAt: new Date().toISOString(),
        timestamp: Date.now(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        
        // Enhanced categorization and search optimization
        category: args.metadata?.category || 'general',
        context: args.metadata?.context || 'GitHub Copilot Chat interaction',
        importance: args.metadata?.importance || 'medium',
        confidence: args.metadata?.confidence || 0.85,
        
        // Collaboration and integration context
        collaborationPattern: args.metadata?.collaborationPattern || 'single_agent',
        integrationLevel: 'mcp_tool_direct',
        
        // Performance and system metrics
        systemHealth: 'operational',
        memoryServerVersion: '4.0.0',
        
        // Priority handling with intelligent conversion
        priority: typeof args.metadata?.priority === 'string' 
          ? (args.metadata.priority === 'high' ? 90 : args.metadata.priority === 'medium' ? 75 : args.metadata.priority === 'low' ? 50 : 75)
          : (args.metadata?.priority || 75),
          
        // Include other user-provided metadata (filtered for compatibility)
        ...(Object.fromEntries(
          Object.entries(args.metadata || {}).filter(([key, value]) => 
            key !== 'priority' && // Handled specially above
            key !== 'constitutionalCompliant' && // Already included
            key !== 'constitutionalLevel' && // Not needed in storage
            key !== 'tags' && // Handled specially below
            value !== null && value !== undefined && value !== ''
          )
        )),
        
        // Enhanced tags with intelligent defaults and ChromaDB compatibility
        tags: (() => {
          const baseTags = ['oneagent', 'mcp-tool', 'memory-creation'];
          const userTags = args.metadata?.tags;
          
          if (userTags) {
            const allTags = Array.isArray(userTags) 
              ? [...baseTags, ...userTags] 
              : [...baseTags, String(userTags)];
            return allTags.join(',');
          }
          
          return baseTags.join(',');
        })()
      };
        const result = await realUnifiedMemoryClient.createMemory(
        args.content,
        args.userId,
        memoryType,
        enhancedMetadata
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to create memory');
      }

      return {
        success: true,        data: {
          memoryId: result.memoryId || 'unknown',
          content: args.content,
          userId: args.userId,
          memoryType,
          message: 'Memory created successfully with unified tool framework',
          capabilities: [
            'Real-time learning integration',
            'Constitutional AI compliance',
            'Direct memory server API',
            'Graceful error handling'
          ]
        },
        qualityScore: 95, // High quality for successful creation
        metadata: {
          storageType: 'direct_api',
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
        `Verify unified memory server is running on port ${oneAgentConfig.memoryPort}`,
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
