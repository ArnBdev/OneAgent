// Canonical OneAgent Memory Search Tool for MCP
// This is the only standard, best-practice memory search tool for OneAgent (MCP 2025-06-18)
// Integrates with backbone metadata, temporal/canonic methods, and intelligence system where applicable
import { UnifiedMCPTool, ToolExecutionResult } from './UnifiedMCPTool';
import { OneAgentMemory } from '../memory/OneAgentMemory';

interface MemorySearchArgs {
  query: string;
  userId?: string;
  limit?: number;
}

export class OneAgentMemorySearchTool extends UnifiedMCPTool {
  private memoryClient: OneAgentMemory;

  constructor(memoryClient: OneAgentMemory) {
    super(
      'oneagent_memory_search',
      'Search canonical OneAgent memory for relevant items using natural language queries. Integrates with backbone metadata, temporal/canonic methods, and intelligence system.',
      {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Natural language search query (required)' },
          userId: { type: 'string', description: 'User ID (optional)' },
          limit: { type: 'number', description: 'Max results (default 5)', default: 5 }
        },
        required: ['query']
      },
      'memory_context',
      'critical'
    );
    this.memoryClient = memoryClient;
  }

  async executeCore(args: MemorySearchArgs): Promise<ToolExecutionResult> {
    // Runtime input validation
    if (!args || typeof args.query !== 'string' || !args.query.trim()) {
      return { success: false, data: { error: 'Invalid input: query must be a non-empty string' } };
    }
    try {
      const { query, userId, limit } = args;
  const result = await this.memoryClient.searchMemory({ query, userId, limit });
      // Structured, typed output
      return {
        success: true,
        data: {
          results: result?.results || [],
          query,
          userId: userId || null,
          limit: limit || 5,
          message: 'Memory search completed',
          error: null,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return { success: false, data: { error: error instanceof Error ? error.message : String(error) } };
    }
  }
}
