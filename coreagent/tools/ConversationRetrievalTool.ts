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

  protected async executeCore(args: any): Promise<ToolExecutionResult> {
    try {
      const { 
        sessionId, 
        agentType, 
        timeRangeHours, 
        includeFullLogs = true,
        maxResults = 50
      } = args;

      // Search for NLACS conversations in memory
      const { MemorySearchTool } = await import('./MemorySearchTool');
      const memorySearch = new MemorySearchTool();
      
      // Build search query
      let searchQuery = 'NLACS_CONVERSATION';
      if (agentType) {
        searchQuery += ` ${agentType}`;
      }
      if (sessionId) {
        searchQuery += ` ${sessionId}`;
      }
      
      // Search memory for conversations
      const memoryResults = await memorySearch.execute(
        {
          query: searchQuery,
          userId: 'arne', // TODO: Get from context
          memoryType: 'session',
          limit: maxResults
        },
        {} // Empty context
      );
      
      let conversations: any[] = [];
      
      if (memoryResults.success && memoryResults.data?.searchResults?.results) {
        conversations = memoryResults.data.searchResults.results
          .filter((result: any) => 
            result.content && 
            result.content.includes('NLACS_CONVERSATION') &&
            (!agentType || result.content.includes(agentType))
          )
          .map((result: any) => {
            // Extract conversation data from memory content
            const lines = result.content.split('\n');
            const topicLine = lines.find((line: string) => line.startsWith('NLACS_CONVERSATION:'));
            const participantsLine = lines.find((line: string) => line.startsWith('Participants:'));
            const conversationIdLine = lines.find((line: string) => line.startsWith('Conversation ID:'));
            const fullDataStart = lines.findIndex((line: string) => line.startsWith('Full Data:'));
            
            let fullData = null;
            if (fullDataStart >= 0 && includeFullLogs) {
              try {
                const jsonData = lines.slice(fullDataStart + 1).join('\n');
                fullData = JSON.parse(jsonData);
              } catch (e) {
                // If JSON parsing fails, include raw data
                fullData = { rawContent: lines.slice(fullDataStart + 1).join('\n') };
              }
            }
            
            return {
              conversationId: conversationIdLine?.split('Conversation ID: ')[1] || 'unknown',
              topic: topicLine?.split('NLACS_CONVERSATION: ')[1] || 'Unknown Topic',
              participants: participantsLine?.split('Participants: ')[1]?.split(', ') || [],
              timestamp: result.timestamp || new Date().toISOString(),
              memoryId: result.id,
              relevance: result.relevance || 0,
              fullData: includeFullLogs ? fullData : null,
              sessionId: sessionId || 'unknown'
            };
          });
      }
      
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
            constitutionalLevel: this.constitutionalLevel,
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
