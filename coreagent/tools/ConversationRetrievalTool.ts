/**
 * OneAgent Conversation Retrieval Tool
 * Retrieve and search agent conversation history and logs
 */

import { UnifiedMCPTool, ToolExecutionResult, InputSchema } from './UnifiedMCPTool';

export class ConversationRetrievalTool extends UnifiedMCPTool {
  constructor() {
    const schema: InputSchema = {
      type: 'object',
      properties: {
        sessionId: { 
          type: 'string', 
          description: 'Specific session ID to retrieve (optional)' 
        },
        agentType: { 
          type: 'string', 
          description: 'Filter by agent type (optional)' 
        },
        timeRangeHours: { 
          type: 'number', 
          description: 'Time range in hours to search (optional)' 
        },
        includeFullLogs: { 
          type: 'boolean', 
          description: 'Include full conversation logs (default: true)' 
        },
        maxResults: { 
          type: 'number', 
          description: 'Maximum number of conversations to retrieve (default: 50)' 
        }
      },
      required: []
    };

    super(
      'oneagent_conversation_retrieve',
      'Retrieve agent conversation history with full logging access',
      schema,
      'enhanced'
    );
  }

  public async executeCore(args: any): Promise<ToolExecutionResult> {
    try {
      const { 
        sessionId, 
        agentType, 
        timeRangeHours, 
        includeFullLogs = true,
        maxResults = 50
      } = args;

      // Build search query
      let searchQuery = 'NLACS_CONVERSATION';
      if (agentType) {
        searchQuery += ` ${agentType}`;
      }
      if (sessionId) {
        searchQuery += ` ${sessionId}`;
      }

      // TODO: Integrate with canonical memory search tool when available
      // For now, skip memoryResults logic and focus on NLACS orchestrator
      let conversations: any[] = [];

      // Also check NLACS orchestrator in-memory conversations
      try {
        const { UnifiedNLACSOrchestrator } = await import('../nlacs/UnifiedNLACSOrchestrator');
        const nlacs = UnifiedNLACSOrchestrator.getInstance();
        // Get active conversations from NLACS (privacy-respecting)
        const systemStatus = await nlacs.getSystemStatus();
        if (systemStatus.activeConversations > 0) {
          conversations.push({
            conversationId: 'active-sessions',
            topic: 'Active NLACS Sessions',
            participants: ['Multiple'],
            timestamp: new Date().toISOString(),
            memoryId: 'nlacs-active',
            relevance: 1.0,
            fullData: includeFullLogs ? {
              activeConversations: systemStatus.activeConversations,
              totalMessages: systemStatus.totalMessages,
              uptime: systemStatus.uptime
            } : null,
            sessionId: 'active'
          });
        }
      } catch (error) {
        console.warn('Could not access NLACS active conversations:', (error as Error).message);
      }

      return {
        success: true,
        data: {
          conversations: conversations.slice(0, maxResults),
          totalFound: conversations.length,
          message: 'Conversation retrieval completed',
          timestamp: new Date().toISOString(),
          toolName: this.name,
          metadata: {
            conversationRetrieval: true,
            toolFramework: 'unified_mcp_v1.0',
            fullLogsIncluded: includeFullLogs
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        data: {
          conversations: [],
          totalFound: 0,
          message: `Conversation retrieval failed: ${(error as Error).message}`,
          timestamp: new Date().toISOString(),
          toolName: this.name,
          error: (error as Error).message
        }
      };
    }
  }
}
