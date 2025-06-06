/**
 * BaseAgent - Core Agent Implementation for OneAgent
 * 
 * This is the foundational agent class that provides common functionality
 * for all specialized agents in the OneAgent ecosystem.
 */

import { Mem0Client } from '../../tools/mem0Client';
import { GeminiClient } from '../../tools/geminiClient';
import { User } from '../../types/user';

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  memoryEnabled: boolean;
  aiEnabled: boolean;
}

export interface AgentContext {
  user: User;
  sessionId: string;
  conversationHistory: Message[];
  memoryContext?: any[];
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AgentResponse {
  content: string;
  actions?: AgentAction[];
  memories?: any[];
  metadata?: Record<string, any>;
}

export interface AgentAction {
  type: string;
  description: string;
  parameters: Record<string, any>;
}

/**
 * Base Agent class providing common functionality for all OneAgent agents
 */
export abstract class BaseAgent {
  protected config: AgentConfig;
  protected mem0Client?: Mem0Client;
  protected geminiClient?: GeminiClient;
  protected isInitialized: boolean = false;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  /**
   * Initialize the agent with required services
   */
  async initialize(mem0Client?: Mem0Client, geminiClient?: GeminiClient): Promise<void> {
    if (this.config.memoryEnabled && mem0Client) {
      this.mem0Client = mem0Client;
    }
    
    if (this.config.aiEnabled && geminiClient) {
      this.geminiClient = geminiClient;
    }
    
    await this.onInitialize();
    this.isInitialized = true;
  }

  /**
   * Override in specialized agents for custom initialization
   */
  protected async onInitialize(): Promise<void> {
    // Default implementation - can be overridden
  }

  /**
   * Process a message from the user
   */
  async processMessage(message: string, context: AgentContext): Promise<AgentResponse> {
    if (!this.isInitialized) {
      throw new Error(`Agent ${this.config.name} is not initialized`);
    }

    // Get memory context if enabled
    let memoryContext: any[] = [];
    if (this.config.memoryEnabled && this.mem0Client) {
      const memoryResult = await this.mem0Client.searchMemories({
        userId: context.user.id,
        query: message,
        limit: 5
      });
      
      if (memoryResult.success && memoryResult.data) {
        memoryContext = memoryResult.data;
      }
    }

    // Process the message using specialized agent logic
    const response = await this.processSpecializedMessage(message, {
      ...context,
      memoryContext
    });

    // Store interaction in memory if enabled
    if (this.config.memoryEnabled && this.mem0Client) {
      await this.mem0Client.storeAgentInteraction(
        this.config.id,
        `User: ${message}\nAgent: ${response.content}`,
        {
          agentType: this.config.name,
          userId: context.user.id,
          sessionId: context.sessionId
        },
        context.user.id
      );
    }

    return response;
  }

  /**
   * Abstract method to be implemented by specialized agents
   */
  protected abstract processSpecializedMessage(
    message: string, 
    context: AgentContext
  ): Promise<AgentResponse>;

  /**
   * Get agent configuration
   */
  getConfig(): AgentConfig {
    return { ...this.config };
  }

  /**
   * Check if agent can handle a specific task type
   */
  abstract canHandle(taskType: string): boolean;

  /**
   * Get available capabilities
   */
  getCapabilities(): string[] {
    return [...this.config.capabilities];
  }

  /**
   * Generate AI response using Gemini if available
   */
  protected async generateAIResponse(
    prompt: string, 
    context?: Record<string, any>
  ): Promise<string> {
    if (!this.geminiClient) {
      throw new Error('AI client not available');
    }

    try {
      const response = await this.geminiClient.generateText({
        prompt,
        temperature: 0.7,
        maxTokens: 1000
      });

      return response.text || 'I apologize, but I could not generate a response.';
    } catch (error) {
      console.error('AI generation error:', error);
      return 'I encountered an error while processing your request.';
    }
  }

  /**
   * Store memory if memory client is available
   */
  protected async storeMemory(
    content: string, 
    metadata?: Record<string, any>, 
    userId?: string
  ): Promise<void> {
    if (this.mem0Client && this.config.memoryEnabled) {
      await this.mem0Client.createMemory(
        content,
        {
          ...metadata,
          agentId: this.config.id,
          agentType: this.config.name
        },
        userId,
        this.config.id
      );
    }
  }

  /**
   * Search memories if memory client is available
   */
  protected async searchMemories(
    query: string, 
    userId?: string, 
    limit: number = 5
  ): Promise<any[]> {
    if (!this.mem0Client || !this.config.memoryEnabled) {
      return [];
    }

    try {
      const result = await this.mem0Client.searchMemories({
        userId,
        agentId: this.config.id,
        query,
        limit
      });

      return result.success && result.data ? result.data : [];
    } catch (error) {
      console.error('Memory search error:', error);
      return [];
    }
  }
}