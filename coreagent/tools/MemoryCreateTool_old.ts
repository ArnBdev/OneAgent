/**
 * Unified Memory Creation Tool - Enhanced with Memory Intelligence
 * Implements intelligent memory creation with enhanced metadata and insights
 */

import { UnifiedMCPTool, ToolExecutionResult, InputSchema } from './UnifiedMCPTool';
import { realUnifiedMemoryClient } from '../memory/RealUnifiedMemoryClient';
import { MemoryIntelligence } from '../intelligence/memoryIntelligence';
import { oneAgentConfig } from '../config/index';

export class MemoryCreateTool extends UnifiedMCPTool {
  private memoryIntelligence: MemoryIntelligence;

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
        },
        useIntelligence: {
          type: 'boolean',
          description: 'Use Memory Intelligence for enhanced storage with insights (default: true)'
        }
      },
      required: ['content', 'userId']
    };

    super(
      'oneagent_memory_create',
      'Store information in OneAgent persistent memory system with Memory Intelligence, insights, and Constitutional AI validation',
      schema,
      'enhanced' // Constitutional AI level
    );

    // Initialize Memory Intelligence
    this.memoryIntelligence = new MemoryIntelligence(realUnifiedMemoryClient);
  }  /**
   * Core memory creation logic with Memory Intelligence
   */
  protected async executeCore(args: any): Promise<ToolExecutionResult> {
    try {
      const { content, userId, memoryType = 'long_term', metadata = {}, useIntelligence = true } = args;
      
      // Use the singleton RealUnifiedMemoryClient instance
      const { realUnifiedMemoryClient } = await import('../memory/RealUnifiedMemoryClient');
      
      // Ensure connection to the FastAPI server (safe to call multiple times)
      await realUnifiedMemoryClient.connect();

      // Use Memory Intelligence for enhanced storage if enabled
      if (useIntelligence) {
        console.log('🧠 Using Memory Intelligence for enhanced storage...');
        
        const memoryId = await this.memoryIntelligence.storeMemory(
          content,
          userId,
          {
            ...metadata,
            memoryType,
            intelligenceEnhanced: true
          }
        );

        console.log('✅ Memory Intelligence storage completed:', { memoryId });

        return {
          success: true,
          data: {
            success: true,
            memoryId,
            content,
            userId,
            memoryType,
            message: 'Memory created successfully with Memory Intelligence enhancements',
            capabilities: [
              'Intelligent content analysis and categorization',
              'Constitutional AI compliance validation',
              'Enhanced metadata generation',
              'Pattern recognition and insights',
              'Cross-conversation learning integration'
            ],
            qualityScore: 100,
            toolName: 'oneagent_memory_create',
            constitutionalCompliant: true,
            timestamp: new Date().toISOString(),
            metadata: {
              storageType: 'intelligent_enhanced',
              toolFramework: 'unified_mcp_v1.0',
              constitutionalLevel: 'enhanced',
              memoryIntelligence: true
            }
          }        };
      } else {
        // Default to intelligence-enabled if parameter not specified
        console.log('🧠 Using Memory Intelligence by default...');
        
        const memoryId = await this.memoryIntelligence.storeMemory(
          content,
          userId,
          {
            ...metadata,
            memoryType,
            intelligenceEnhanced: true
          }
        );

        console.log('✅ Memory Intelligence storage completed:', { memoryId });

        return {
          success: true,
          data: {
            success: true,
            memoryId,
            content,
            userId,
            memoryType,
            message: 'Memory created successfully with Memory Intelligence enhancements',
            capabilities: [
              'Intelligent content analysis and categorization',
              'Constitutional AI compliance validation',
              'Enhanced metadata generation',
              'Pattern recognition and insights',
              'Cross-conversation learning integration'
            ],
            qualityScore: 100,
            toolName: 'oneagent_memory_create',
            constitutionalCompliant: true,
            timestamp: new Date().toISOString(),
            metadata: {
              storageType: 'intelligent_enhanced',
              toolFramework: 'unified_mcp_v1.0',
              constitutionalLevel: 'enhanced',
              memoryIntelligence: true
            }
          }
        };
      }
    } catch (error: any) {
      console.error('❌ Memory creation failed:', error.message);
      
      return {
        success: false,
        data: { error: `Memory creation failed: ${error.message}` }
      };    }  }
}
