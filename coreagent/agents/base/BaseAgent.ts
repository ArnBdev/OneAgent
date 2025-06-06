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
  protected memoryClient?: Mem0Client;
  protected aiClient?: GeminiClient;
  protected isInitialized: boolean = false;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  /**
   * Initialize the agent with necessary clients and resources
   */
  async initialize(): Promise<void> {
    try {
      // Initialize memory client if enabled
      if (this.config.memoryEnabled) {
        this.memoryClient = new Mem0Client();
        await this.memoryClient.initialize();
      }

      // Initialize AI client if enabled
      if (this.config.aiEnabled) {
        this.aiClient = new GeminiClient();
        await this.aiClient.initialize();
      }

      this.isInitialized = true;
    } catch (error) {
      console.error(`Failed to initialize agent ${this.config.id}:`, error);
      throw error;
    }
  }

  /**
   * Process a user message and generate a response
   */
  abstract processMessage(context: AgentContext, message: string): Promise<AgentResponse>;

  /**
   * Add memory for the user
   */
  protected async addMemory(userId: string, content: string, metadata?: Record<string, any>): Promise<void> {
    if (!this.memoryClient) {
      throw new Error('Memory client not initialized');
    }

    await this.memoryClient.addMemory(userId, content, metadata);
  }

  /**
   * Search for relevant memories
   */
  protected async searchMemories(userId: string, query: string, limit: number = 10): Promise<any[]> {
    if (!this.memoryClient) {
      return [];
    }

    const results = await this.memoryClient.searchMemory(userId, query, limit);
    return results;
  }

  /**
   * Generate AI response using Gemini
   */
  protected async generateResponse(prompt: string, context?: any[]): Promise<string> {
    if (!this.aiClient) {
      throw new Error('AI client not initialized');
    }

    return await this.aiClient.generateResponse(prompt, context);
  }

  /**
   * Get agent configuration
   */
  getConfig(): AgentConfig {
    return { ...this.config };
  }

  /**
   * Check if agent is properly initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Override in specialized agents if needed
    this.isInitialized = false;
  }

  /**
   * Validate agent context
   */
  protected validateContext(context: AgentContext): void {
    if (!context.user || !context.sessionId) {
      throw new Error('Invalid agent context: missing user or sessionId');
    }
  }

  /**
   * Create a standardized response object
   */
  protected createResponse(content: string, actions?: AgentAction[], memories?: any[]): AgentResponse {
    return {
      content,
      actions: actions || [],
      memories: memories || [],
      metadata: {
        agentId: this.config.id,
        timestamp: new Date().toISOString(),
      },
    };
  }
}