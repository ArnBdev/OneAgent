import { Request, Response } from 'express';
import { CoreAgent } from '../main';
import { MemoryUserService } from '../orchestrator/userService';
import { UnifiedMemoryClient } from '../memory/UnifiedMemoryClient';

interface ChatRequest {
  message: string;
  userId: string;
  agentType?: string;
  memoryContext?: any;
}

interface ChatResponse {
  response: string;
  agentType: string;
  memoryContext?: {
    relevantMemories: number;
    searchTerms?: string[];
  } | undefined;
  error?: string;
}

export class ChatAPI {
  private coreAgent: CoreAgent;
  private userService: MemoryUserService;  private unifiedMemoryClient: UnifiedMemoryClient;

  constructor(coreAgent: CoreAgent, userService: MemoryUserService, unifiedMemoryClient: UnifiedMemoryClient) {    this.coreAgent = coreAgent;
    this.userService = userService;
    this.unifiedMemoryClient = unifiedMemoryClient;
  }

  /**
   * Handle chat message endpoint
   */
  async handleChatMessage(req: Request, res: Response): Promise<void> {
    try {
      const { message, userId, agentType = 'general', memoryContext }: ChatRequest = req.body;

      // Validate input
      if (!message || !userId) {
        res.status(400).json({
          error: 'Missing required fields: message and userId'
        });
        return;
      }      // Get or create user
      let user = await this.userService.getUserById(userId);
      if (!user) {
        user = await this.userService.createUser({
          name: `User ${userId}`,
          email: `${userId}@oneagent.ai`,
          customInstructions: 'Be helpful and concise.',
          preferences: { language: 'en', timezone: 'UTC' }
        });
      }      // Store user message in memory using unified client
      await this.unifiedMemoryClient.createMemory(
        `User message: ${message}`,
        userId,
        'session',
        {
          source: 'chat',
          role: 'user',
          timestamp: Date.now(),
          agentType
        }
      );

      // Process the message through CoreAgent
      const agentResponse = await this.coreAgent.processMessage(message, userId);      // Store agent response in memory
      await this.unifiedMemoryClient.createMemory(
        `Agent response: ${agentResponse.content}`,
        userId,
        'session',
        {
          source: 'chat',
          role: 'assistant',
          timestamp: Date.now(),
          agentType,
          confidence: agentResponse.metadata?.confidence || 0.8
        }      );
      
      // Get relevant memory context for response
      const relevantMemories = memoryContext ? 
        (await this.unifiedMemoryClient.getMemoryContext(message, userId, 3)).entries : 
        [];
        
      const response: ChatResponse = {
        response: agentResponse.content,
        agentType: agentResponse.metadata?.agentType || agentType,        memoryContext: relevantMemories.length > 0 ? {
          relevantMemories: relevantMemories.length,
          searchTerms: [message]
        } : undefined
      };

      res.json(response);

    } catch (error) {
      console.error('Chat API error:', error);
      
      const errorResponse: ChatResponse = {
        response: 'I apologize, but I encountered an error processing your message. Please try again.',
        agentType: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      res.status(500).json(errorResponse);
    }
  }

  /**
   * Get chat history for a user
   */
  async getChatHistory(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      if (!userId) {
        res.status(400).json({ error: 'Missing userId parameter' });
        return;
      }      // Search for chat messages in memory
      const memoryResult = await this.unifiedMemoryClient.getMemoryContext(
        'chat message',
        userId,
        parseInt(limit as string)
      );
      const memories = memoryResult.entries;

      // Filter and format chat messages
      const chatHistory = memories.length > 0 ? 
        memories
          .filter((memory: any) => memory.metadata?.source === 'chat')
          .map((memory: any) => ({
            id: memory.id,
            content: memory.content,
            role: memory.metadata?.role,
            timestamp: memory.metadata?.timestamp,
            agentType: memory.metadata?.agentType
          }))
          .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        : [];

      res.json({
        messages: chatHistory,
        total: chatHistory.length,
        userId
      });

    } catch (error) {
      console.error('Get chat history error:', error);
      res.status(500).json({
        error: 'Failed to retrieve chat history',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Clear chat history for a user
   */
  async clearChatHistory(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({ error: 'Missing userId parameter' });
        return;
      }

      // Note: Mem0Client doesn't have a direct delete by metadata method
      // This would need to be implemented based on the specific memory system
      // For now, we'll just return success
      console.log(`Chat history clear requested for user: ${userId}`);

      res.json({
        message: 'Chat history clear requested',
        userId,
        note: 'Individual message deletion not yet implemented in memory system'
      });

    } catch (error) {
      console.error('Clear chat history error:', error);
      res.status(500).json({
        error: 'Failed to clear chat history',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
