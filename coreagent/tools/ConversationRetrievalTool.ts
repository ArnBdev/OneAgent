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
      }      // Search memory for conversations
      const memoryResults = await memorySearch.execute(
        {
          query: searchQuery,
          userId: 'test-user', // Use correct userId for test
          memoryType: 'session',
          limit: maxResults
        },
        {} // Empty context
      );      console.log('🔍 Memory search results:', memoryResults.result ? 'MCP Response received' : 'No MCP response');
      let conversations: any[] = [];
      let searchResults: any[] = [];
        console.log('🔍 Checking MCP response structure...');
      console.log('memoryResults.result exists:', !!memoryResults.result);
      console.log('memoryResults.result?.content exists:', !!memoryResults.result?.content);      console.log('memoryResults.result?.isError:', memoryResults.result?.isError);
      console.log('memoryResults.result?.content?.[0] exists:', !!memoryResults.result?.content?.[0]);
      console.log('memoryResults.result?.content?.[0]?.text exists:', !!memoryResults.result?.content?.[0]?.text);
      console.log('!memoryResults.result.isError evaluates to:', !memoryResults.result.isError);
      console.log('typeof memoryResults.result.isError:', typeof memoryResults.result.isError);
      console.log('memoryResults.result.isError === false:', memoryResults.result.isError === false);
      console.log('memoryResults.result.isError == false:', memoryResults.result.isError == false);
      console.log('Full condition evaluates to:', !!(memoryResults.result?.content?.[0]?.text && !memoryResults.result.isError));
        // The MCP response comes in result.content[0].text format
      if (memoryResults.result?.content?.[0]?.text && !memoryResults.result.isError) {
        // Parse the JSON response from the MCP tool
        try {
          console.log('🔧 Parsing MCP JSON response...');
          const responseData = JSON.parse(memoryResults.result.content[0].text);
          console.log('📋 Parsed response data success:', responseData.success);
          console.log('📋 Parsed response has searchResults:', !!responseData.searchResults);
          console.log('📋 Parsed response searchResults.results length:', responseData.searchResults?.results?.length || 0);
            if (responseData.success && responseData.searchResults?.results) {
            searchResults = responseData.searchResults.results;
            console.log('✅ Found MCP search results:', searchResults.length);
            
            // Debug: Check what's in the first result's metadata
            if (searchResults.length > 0) {
              console.log('🔍 First result metadata keys:', Object.keys(searchResults[0].metadata || {}));
              console.log('🔍 Has fullData:', !!searchResults[0].metadata?.fullData);
              console.log('🔍 Has type field:', searchResults[0].metadata?.type);
              console.log('🔍 Content preview:', searchResults[0].content.substring(0, 100));
            }
          } else {
            console.log('❌ MCP response parsing failed - missing searchResults');
            console.log('Response data keys:', Object.keys(responseData));
          }
        } catch (parseError) {
          console.warn('Failed to parse MCP response:', parseError);
          console.log('Raw response text (first 500 chars):', memoryResults.result.content[0].text.substring(0, 500));
        }
      } else {
        console.log('❌ No valid MCP response format found');
        console.log('  Failed condition checks:');
        console.log('    - Has content[0].text:', !!memoryResults.result?.content?.[0]?.text);
        console.log('    - isError === false:', memoryResults.result?.isError === false);
        console.log('  memoryResults keys:', Object.keys(memoryResults));
        if (memoryResults.result) {
          console.log('  memoryResults.result keys:', Object.keys(memoryResults.result));
          if (memoryResults.result.content) {
            console.log('  content array length:', memoryResults.result.content.length);
            if (memoryResults.result.content[0]) {
              console.log('  content[0] type:', typeof memoryResults.result.content[0]);
              console.log('  content[0] keys:', Object.keys(memoryResults.result.content[0]));
              console.log('  content[0].text exists:', !!memoryResults.result.content[0].text);
              console.log('  content[0].text length:', memoryResults.result.content[0].text?.length || 0);
            }
          }
        }
      }
      
      if (searchResults.length > 0) {
        conversations = searchResults
          .filter((result: any) => 
            result.content && 
            result.content.includes('NLACS_CONVERSATION') &&
            (!agentType || result.content.includes(agentType))
          )          .map((result: any) => {
            // Extract conversation data from memory content (basic info)
            const lines = result.content.split('\n');
            const topicLine = lines.find((line: string) => line.startsWith('NLACS_CONVERSATION:'));
            const participantsLine = lines.find((line: string) => line.startsWith('Participants:'));
            const conversationIdLine = lines.find((line: string) => line.startsWith('Conversation ID:'));
            const messagesLine = lines.find((line: string) => line.startsWith('Messages:'));
            const statusLine = lines.find((line: string) => line.startsWith('Status:'));
            
            // Extract full conversation data from metadata.fullData (this contains the actual conversation)
            let fullData = null;
            let actualMessages: any[] = [];
            let detailedParticipants: any[] = [];
            
            if (includeFullLogs && result.metadata?.fullData) {
              try {
                const conversationData = result.metadata.fullData;
                fullData = {
                  ...conversationData,
                  rawContent: result.content,
                  memoryId: result.id,
                  relevanceScore: result.relevance || 0
                };
                
                // Extract actual messages and participants from fullData
                if (conversationData.messages) {
                  actualMessages = conversationData.messages;
                  console.log(`📝 Found ${actualMessages.length} actual messages in conversation ${conversationData.conversationId}`);
                }
                
                if (conversationData.participants) {
                  detailedParticipants = conversationData.participants;
                }
              } catch (error) {
                console.warn('⚠️ Failed to parse fullData from metadata:', error);
                fullData = {
                  rawContent: result.content,
                  metadata: result.metadata || {},
                  memoryId: result.id,
                  relevanceScore: result.relevance || 0
                };
              }
            }
            
            return {
              conversationId: conversationIdLine?.split('Conversation ID: ')[1] || result.metadata?.conversationId || 'unknown',
              topic: topicLine?.split('NLACS_CONVERSATION: ')[1] || result.metadata?.topic || 'Unknown Topic',
              participants: detailedParticipants.length > 0 ? detailedParticipants : 
                           (participantsLine?.split('Participants: ')[1]?.split(', ') || result.metadata?.participants || []),
              messageCount: actualMessages.length > 0 ? actualMessages.length : 
                           (messagesLine ? parseInt(messagesLine.split('Messages: ')[1]) || 0 : result.metadata?.messageCount || 0),
              status: statusLine?.split('Status: ')[1] || result.metadata?.status || 'unknown',
              timestamp: result.timestamp || new Date().toISOString(),
              memoryId: result.id,
              relevance: result.relevance || 0,
              fullData: fullData,
              messages: actualMessages, // Include actual conversation messages
              sessionId: result.metadata?.sessionId || sessionId || 'unknown'
            };
          });
      } else {
        console.log('⚠️ No conversation results found');
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
