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
      } = args;      // Simple conversation retrieval from logs and memory
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const conversations: any[] = [];
      let message = 'Conversation retrieval completed';
      
      try {
        // Check OneAgent memory log
        const memoryLogPath = path.join(process.cwd(), 'oneagent_memory.log');
        try {
          const memoryLog = await fs.readFile(memoryLogPath, 'utf-8');
          const logEntries = memoryLog.split('\n').filter(line => line.trim());
          
          for (const entry of logEntries.slice(-maxResults)) {
            if (entry.includes('conversation') || entry.includes('agent')) {
              conversations.push({
                timestamp: new Date().toISOString(),
                type: 'memory_log',
                content: entry.substring(0, 200),
                sessionId: sessionId || 'unknown'
              });
            }
          }
        } catch (error) {
          // Memory log not found, continue
        }
        
        // Check for other log files
        const logsDir = path.join(process.cwd(), 'logs');
        try {
          const logFiles = await fs.readdir(logsDir);
          for (const logFile of logFiles.slice(0, 5)) { // Limit to 5 files
            if (logFile.includes('conversation') || logFile.includes('agent')) {
              const logPath = path.join(logsDir, logFile);
              const logContent = await fs.readFile(logPath, 'utf-8');
              conversations.push({
                timestamp: new Date().toISOString(),
                type: 'log_file',
                file: logFile,
                content: logContent.substring(0, 500),
                sessionId: sessionId || 'unknown'
              });
            }
          }
        } catch (error) {
          // Logs directory not found, continue
        }
        
      } catch (error) {
        message = `Partial conversation retrieval: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }

      const result = {
        success: true,
        conversations: conversations.slice(0, maxResults),
        totalFound: conversations.length,
        message,
        timestamp: new Date().toISOString()
      };

      return {
        success: result.success,
        data: {
          ...result,
          toolName: 'oneagent_conversation_retrieve',
          timestamp: new Date().toISOString(),
          metadata: {
            conversationRetrieval: true,
            toolFramework: 'unified_mcp_v1.0',
            constitutionalLevel: 'enhanced',
            fullLogsIncluded: includeFullLogs
          }
        }
      };

    } catch (error) {
      console.error('[ConversationRetrievalTool] Failed to retrieve conversations:', error);
      
      return {
        success: false,
        data: {
          success: false,
          conversations: [],
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Failed to retrieve conversation history',
          timestamp: new Date().toISOString()
        }
      };
    }
  }
}
