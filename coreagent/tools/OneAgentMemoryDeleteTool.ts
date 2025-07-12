// Canonical OneAgent Memory Delete Tool for MCP
// This is the only standard, best-practice memory delete tool for OneAgent (MCP 2025-06-18)
// Integrates with backbone metadata, temporal/canonic methods, and intelligence system where applicable
import { UnifiedMCPTool, ToolExecutionResult } from './UnifiedMCPTool';
import { OneAgentMemory } from '../memory/OneAgentMemory';

interface MemoryDeleteArgs {
  memoryId: string;
  userId?: string;
}

export class OneAgentMemoryDeleteTool extends UnifiedMCPTool {
  private memoryClient: OneAgentMemory;

  constructor(memoryClient: OneAgentMemory) {
    super(
      'oneagent_memory_delete',
      'Delete a canonical memory item from OneAgent memory by ID. Integrates with backbone metadata and canonic/temporal methods.',
      {
        type: 'object',
        properties: {
          memoryId: { type: 'string', description: 'ID of the memory item to delete (required)' },
          userId: { type: 'string', description: 'User ID (optional)' }
        },
        required: ['memoryId']
      },
      'memory_context',
      'critical'
    );
    this.memoryClient = memoryClient;
  }

  async executeCore(args: MemoryDeleteArgs): Promise<ToolExecutionResult> {
    // Runtime input validation
    if (!args || typeof args.memoryId !== 'string' || !args.memoryId.trim()) {
      return { success: false, data: { error: 'Invalid input: memoryId (string) is required' } };
    }
    try {
      const { memoryId, userId } = args;
      const result = await this.memoryClient.deleteMemory(memoryId, userId || 'default-user');
      // Structured, typed output
      return {
        success: true,
        data: {
          id: memoryId,
          userId: userId || 'default-user',
          deleted: result?.success === true,
          message: result?.message || 'Memory deleted successfully',
          error: result?.error || null,
          timestamp: result?.timestamp || new Date().toISOString()
        }
      };
    } catch (error) {
      return { success: false, data: { error: error instanceof Error ? error.message : String(error) } };
    }
  }
}
