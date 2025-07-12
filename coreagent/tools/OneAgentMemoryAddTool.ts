// Canonical OneAgent Memory Add Tool for MCP
// This is the only standard, best-practice memory add tool for OneAgent (MCP 2025-06-18)
// Integrates with backbone metadata, temporal/canonic methods, and intelligence system where applicable
import { UnifiedMCPTool, ToolExecutionResult } from './UnifiedMCPTool';
import { OneAgentMemory } from '../memory/OneAgentMemory';

interface MemoryAddArgs {
  content: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export class OneAgentMemoryAddTool extends UnifiedMCPTool {
  private memoryClient: OneAgentMemory;

  constructor(memoryClient: OneAgentMemory) {
    super(
      'oneagent_memory_add',
      'Add a new item to canonical OneAgent memory. Integrates with backbone metadata, temporal/canonic methods, and intelligence system.',
      {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'Content to store (required, non-empty string)' },
          userId: { type: 'string', description: 'User ID (optional)' },
          metadata: { type: 'object', description: 'Metadata (optional)' }
        },
        required: ['content']
      },
      'memory_context',
      'critical'
    );
    this.memoryClient = memoryClient;
  }

  async executeCore(args: MemoryAddArgs): Promise<ToolExecutionResult> {
    // Runtime input validation
    if (!args || typeof args.content !== 'string' || !args.content.trim()) {
      return { success: false, data: { error: 'Invalid input: content must be a non-empty string' } };
    }
    
    try {
      const { content, userId, metadata } = args;
      
      // Use optimized add method for better quota management
      const useBatch = content.length < 100; // Use batching for smaller content
      
      let result;
      if (useBatch) {
        // Queue for batch processing (reduces quota usage)
        await this.memoryClient.addMemoryBatch({ content, userId, metadata });
        result = { 
          message: 'Memory queued for batch processing',
          data: { content, userId, metadata, batched: true }
        };
      } else {
        // Direct add for larger content
        result = await this.memoryClient.addMemory({ content, userId, metadata });
      }
      
      // Structured, typed output
      return {
        success: true,
        data: {
          id: result?.data?.id || result?.id,
          content: result?.data?.content || content,
          userId: result?.data?.userId || userId,
          metadata: result?.data?.metadata || metadata || {},
          createdAt: result?.data?.createdAt,
          updatedAt: result?.data?.updatedAt,
          message: result?.message || 'Memory created successfully',
          error: result?.error || null,
          timestamp: result?.timestamp || new Date().toISOString(),
          batched: useBatch
        }
      };
    } catch (error) {
      return { success: false, data: { error: error instanceof Error ? error.message : String(error) } };
    }
  }
}
