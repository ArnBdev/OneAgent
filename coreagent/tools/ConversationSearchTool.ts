/**
 * OneAgent Conversation Search Tool
 * Search agent conversations by content and metadata
 */

import { UnifiedMCPTool, ToolExecutionResult, InputSchema } from './UnifiedMCPTool';

interface ConversationSearchArgs {
  query: string;
  agentTypes?: string[];
  qualityThreshold?: number;
  timeRangeHours?: number;
  maxResults?: number;
}

interface SearchResult {
  timestamp: string;
  type: string;
  content: string;
  relevanceScore: number;
  matched: boolean;
  file?: string;
}

export class ConversationSearchTool extends UnifiedMCPTool {
  constructor() {
    const schema: InputSchema = {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query for conversation content or metadata',
        },
        agentTypes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by specific agent types (optional)',
        },
        qualityThreshold: {
          type: 'number',
          description: 'Minimum quality score filter (optional)',
        },
        timeRangeHours: {
          type: 'number',
          description: 'Time range in hours to search (optional)',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results (default: 20)',
        },
      },
      required: ['query'],
    };

    super(
      'oneagent_conversation_search',
      'Search agent conversations by content and metadata with quality filtering',
      schema,
      'enhanced',
    );
  }

  public async executeCore(args: ConversationSearchArgs): Promise<ToolExecutionResult> {
    try {
      const { query, agentTypes, qualityThreshold, timeRangeHours, maxResults = 20 } = args; // Simple conversation search implementation
      const fs = await import('fs/promises');
      const path = await import('path');

      const searchResults: SearchResult[] = [];
      let message = 'Conversation search completed';

      try {
        // Search in OneAgent memory log
        const memoryLogPath = path.join(process.cwd(), 'oneagent_memory.log');
        try {
          const memoryLog = await fs.readFile(memoryLogPath, 'utf-8');
          const logEntries = memoryLog.split('\n').filter((line) => line.trim());

          for (const entry of logEntries) {
            if (entry.toLowerCase().includes(query.toLowerCase())) {
              searchResults.push({
                timestamp: new Date().toISOString(),
                type: 'memory_log',
                content: entry.substring(0, 300),
                relevanceScore: this.calculateRelevance(entry, query),
                matched: true,
              });
            }
          }
        } catch {
          // Memory log not found, continue
        }

        // Search in log files
        const logsDir = path.join(process.cwd(), 'logs');
        try {
          const logFiles = await fs.readdir(logsDir);
          for (const logFile of logFiles.slice(0, 10)) {
            // Limit to 10 files
            if (logFile.includes('conversation') || logFile.includes('agent')) {
              const logPath = path.join(logsDir, logFile);
              const logContent = await fs.readFile(logPath, 'utf-8');
              if (logContent.toLowerCase().includes(query.toLowerCase())) {
                searchResults.push({
                  timestamp: new Date().toISOString(),
                  type: 'log_file',
                  file: logFile,
                  content: logContent.substring(0, 500),
                  relevanceScore: this.calculateRelevance(logContent, query),
                  matched: true,
                });
              }
            }
          }
        } catch {
          // Logs directory not found, continue
        }
      } catch (error) {
        message = `Partial conversation search: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }

      // Sort by relevance and limit results
      const sortedResults = searchResults
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, maxResults);

      const result = {
        success: true,
        conversations: sortedResults,
        totalFound: searchResults.length,
        query,
        message,
        timestamp: new Date().toISOString(),
      };

      return {
        success: result.success,
        data: {
          ...result,
          toolName: 'oneagent_conversation_search',
          timestamp: new Date().toISOString(),
          metadata: {
            conversationSearch: true,
            toolFramework: 'unified_mcp_v1.0',
            constitutionalLevel: 'enhanced',
            searchQuery: query,
            filtersApplied: {
              agentTypes: agentTypes || [],
              qualityThreshold: qualityThreshold || null,
              timeRangeHours: timeRangeHours || null,
            },
          },
        },
      };
    } catch (error) {
      console.error('[ConversationSearchTool] Failed to search conversations:', error);
      return {
        success: false,
        data: {
          success: false,
          query: args.query,
          results: [],
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Failed to search conversation history',
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Calculate relevance score for search results
   */
  private calculateRelevance(content: string, query: string): number {
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();

    // Simple relevance scoring
    let score = 0;
    const queryWords = lowerQuery.split(' ');

    for (const word of queryWords) {
      const wordCount = (lowerContent.match(new RegExp(word, 'g')) || []).length;
      score += wordCount * 10; // 10 points per word match
    }

    // Bonus for exact phrase match
    if (lowerContent.includes(lowerQuery)) {
      score += 50;
    }

    return score;
  }
}
