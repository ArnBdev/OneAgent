// Canonical OneAgent Memory Edit Tool for MCP
// This is the only standard, best-practice memory edit tool for OneAgent (MCP 2025-06-18)
// Integrates with backbone metadata, temporal/canonic methods, and intelligence system where applicable
import { UnifiedMCPTool, ToolExecutionResult } from './UnifiedMCPTool';
import { OneAgentMemory } from '../memory/OneAgentMemory';

interface MemoryEditArgs {
  memoryId: string;
  userId?: string;
  update: Record<string, unknown>;
}

export class OneAgentMemoryEditTool extends UnifiedMCPTool {
  private memoryClient: OneAgentMemory;

  constructor(memoryClient: OneAgentMemory) {
    super(
      'oneagent_memory_edit',
      'Edit (update) a canonical memory item in OneAgent memory by ID. Integrates with backbone metadata and canonic/temporal methods.',
      {
        type: 'object',
        properties: {
          memoryId: { type: 'string', description: 'ID of the memory item to update (required)' },
          userId: { type: 'string', description: 'User ID (optional)' },
          update: { type: 'object', description: 'Partial update object for the memory item (required)' }
        },
        required: ['memoryId', 'update']
      },
      'memory_context',
      'critical'
    );
    this.memoryClient = memoryClient;
  }

  async executeCore(args: MemoryEditArgs): Promise<ToolExecutionResult> {
    // Runtime input validation
    if (!args || typeof args.memoryId !== 'string' || !args.memoryId.trim() || typeof args.update !== 'object' || !args.update) {
      return { success: false, data: { error: 'Invalid input: memoryId (string) and update (object) are required' } };
    }
    try {
      const { memoryId, userId, update } = args;
      const patch: Record<string, unknown> = { ...update };
      if (userId) patch.userId = userId;
      const result = await this.memoryClient.patchMemory(memoryId, patch);
      // Structured, typed output
      return {
        success: true,
        data: {
          id: result?.data?.id || memoryId,
          updatedFields: Object.keys(update),
          userId: result?.data?.userId || userId,
          metadata: result?.data?.metadata || {},
          updatedAt: result?.data?.updatedAt,
          message: result?.message || 'Memory updated successfully',
          error: result?.error || null,
          timestamp: result?.timestamp || new Date().toISOString()
        }
      };
    } catch (error) {
      return { success: false, data: { error: error instanceof Error ? error.message : String(error) } };
    }
  }
}
