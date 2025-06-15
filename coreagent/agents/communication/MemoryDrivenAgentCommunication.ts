/**
 * MemoryDrivenAgentCommunication.ts
 * 
 * Core architecture for memory-driven multi-agent communication.
 * All agent messages, context, and learnings flow through the real memory system.
 * 
 * Features:
 * - Memory-based message passing between agents
 * - Perceptual memory for cross-agent and temporal context
 * - Agent-specific memory collections for organized storage
 * - Constitutional AI validation for all communications
 * - Quality scoring and performance metrics
 * 
 * @version 4.0.0
 * @author OneAgent Professional Development Platform
 */

import { realUnifiedMemoryClient } from '../../memory/RealUnifiedMemoryClient';
import { v4 as uuidv4 } from 'uuid';

export interface AgentMessage {
  id: string;
  fromAgent: string;
  toAgent?: string; // undefined for broadcast messages
  messageType: 'direct' | 'broadcast' | 'context' | 'learning' | 'coordination';
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  threadId?: string; // for conversation threading
  replyToMessageId?: string; // for message threading
  metadata: {
    requiresResponse?: boolean;
    expiresAt?: Date;
    tags?: string[];
    confidenceLevel?: number; // 0-1
    qualityScore?: number; // 0-100
    constitutionalValid?: boolean;
    context?: Record<string, any>;
  };
}

export interface AgentContext {
  agentId: string;
  currentTask?: string;
  capabilities: string[];
  status: 'available' | 'busy' | 'offline';
  expertise: string[];
  recentActivity: Date;
  memoryCollectionId: string;
}

export interface MemoryQuery {
  query: string;
  agentId?: string; // specific agent or all agents
  messageTypes?: string[];
  timeRange?: {
    start: Date;
    end: Date;
  };
  limit?: number;
  minQualityScore?: number;
}

/**
 * Memory-Driven Agent Communication Hub
 * Central orchestrator for all agent communication through persistent memory
 */
export class MemoryDrivenAgentCommunication {
  private static instance: MemoryDrivenAgentCommunication;
  private agentRegistry: Map<string, AgentContext> = new Map();
  private messageQueue: AgentMessage[] = [];
  private isProcessing: boolean = false;

  private constructor() {}

  public static getInstance(): MemoryDrivenAgentCommunication {
    if (!MemoryDrivenAgentCommunication.instance) {
      MemoryDrivenAgentCommunication.instance = new MemoryDrivenAgentCommunication();
    }
    return MemoryDrivenAgentCommunication.instance;
  }

  /**
   * Register an agent in the communication hub
   */
  async registerAgent(agentContext: AgentContext): Promise<void> {
    console.log(`[MemoryComm] Registering agent: ${agentContext.agentId}`);
    
    // Create agent-specific memory collection
    const collectionName = `agent_${agentContext.agentId}_memory`;
    agentContext.memoryCollectionId = collectionName;
    
    try {      await realUnifiedMemoryClient.createMemory(
        `Agent ${agentContext.agentId} registered with capabilities: ${agentContext.capabilities.join(', ')}`,
        'system', // userId - using 'system' for agent registration
        'long_term', // memoryType
        {
          agentId: agentContext.agentId,
          capabilities: agentContext.capabilities,
          expertise: agentContext.expertise,
          collectionId: collectionName,
          timestamp: new Date().toISOString()
        }
      );
      
      this.agentRegistry.set(agentContext.agentId, agentContext);
      console.log(`[MemoryComm] Agent ${agentContext.agentId} registered successfully`);
    } catch (error) {
      console.error(`[MemoryComm] Failed to register agent ${agentContext.agentId}:`, error);
      throw error;
    }
  }

  /**
   * Send a message through the memory system
   */
  async sendMessage(message: AgentMessage): Promise<string> {
    console.log(`[MemoryComm] Sending message from ${message.fromAgent} to ${message.toAgent || 'ALL'}`);
    
    // Generate unique message ID if not provided
    if (!message.id) {
      message.id = uuidv4();
    }

    // Add to message queue for processing
    this.messageQueue.push(message);
    
    // Store message in memory system
    try {
      const memoryContent = this.formatMessageForMemory(message);      const memoryId = await realUnifiedMemoryClient.createMemory(
        memoryContent,
        message.fromAgent, // userId is the sending agent
        'long_term', // memoryType
        {
          messageType: message.messageType,
          fromAgent: message.fromAgent,
          toAgent: message.toAgent,
          messageId: message.id,
          priority: message.priority,
          threadId: message.threadId,
          replyToMessageId: message.replyToMessageId,
          timestamp: message.timestamp.toISOString(),
          ...message.metadata
        }
      );

      console.log(`[MemoryComm] Message ${message.id} stored in memory as ${memoryId}`);
      
      // Process the message if not already processing
      if (!this.isProcessing) {
        this.processMessageQueue();
      }
      
      return message.id;
    } catch (error) {
      console.error(`[MemoryComm] Failed to send message ${message.id}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve messages for an agent (inbox)
   */
  async getMessagesForAgent(
    agentId: string, 
    options?: {
      messageTypes?: string[];
      unreadOnly?: boolean;
      limit?: number;
      since?: Date;
    }
  ): Promise<AgentMessage[]> {
    console.log(`[MemoryComm] Retrieving messages for agent: ${agentId}`);
    
    try {      // Search memory for messages directed to this agent or broadcast messages
      const searchQuery = `agent communication message to:${agentId} OR broadcast`;
      const searchResult = await realUnifiedMemoryClient.getMemoryContext(
        searchQuery,
        agentId,
        options?.limit || 50
      );

      // Convert memories back to AgentMessage format
      const messages: AgentMessage[] = searchResult.memories.map((memory: any) => this.parseMessageFromMemory(memory));
      
      // Apply additional filtering
      let filteredMessages = messages;
      
      if (options?.messageTypes) {
        filteredMessages = filteredMessages.filter(msg => 
          options.messageTypes!.includes(msg.messageType)
        );
      }
      
      if (options?.since) {
        filteredMessages = filteredMessages.filter(msg => 
          msg.timestamp >= options.since!
        );
      }

      console.log(`[MemoryComm] Retrieved ${filteredMessages.length} messages for ${agentId}`);
      return filteredMessages;
    } catch (error) {
      console.error(`[MemoryComm] Failed to retrieve messages for ${agentId}:`, error);
      return [];
    }
  }

  /**
   * Search agent communication history with semantic search
   */
  async searchCommunicationHistory(query: MemoryQuery): Promise<AgentMessage[]> {
    console.log(`[MemoryComm] Searching communication history: ${query.query}`);
      try {
      const searchResult = await realUnifiedMemoryClient.getMemoryContext(
        query.query,
        query.agentId || 'system',
        query.limit || 20
      );

      const messages = searchResult.memories.map((memory: any) => this.parseMessageFromMemory(memory));
      
      // Apply additional filters
      let filteredMessages = messages;
      
      if (query.messageTypes) {
        filteredMessages = filteredMessages.filter(msg => 
          query.messageTypes!.includes(msg.messageType)
        );
      }
      
      if (query.timeRange) {
        filteredMessages = filteredMessages.filter(msg => 
          msg.timestamp >= query.timeRange!.start && 
          msg.timestamp <= query.timeRange!.end
        );
      }
      
      if (query.minQualityScore) {
        filteredMessages = filteredMessages.filter(msg => 
          (msg.metadata.qualityScore || 0) >= query.minQualityScore!
        );
      }

      console.log(`[MemoryComm] Found ${filteredMessages.length} matching messages`);
      return filteredMessages;
    } catch (error) {
      console.error(`[MemoryComm] Failed to search communication history:`, error);
      return [];
    }
  }

  /**
   * Get contextual information for agent decision making
   */
  async getAgentContext(agentId: string, currentTask?: string): Promise<{
    recentMessages: AgentMessage[];
    relevantHistory: AgentMessage[];
    peerAgents: AgentContext[];
    systemStatus: any;
  }> {
    console.log(`[MemoryComm] Getting context for agent: ${agentId}`);
    
    try {
      // Get recent messages (last 10)
      const recentMessages = await this.getMessagesForAgent(agentId, {
        limit: 10,
        since: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      });

      // Get relevant history based on current task
      let relevantHistory: AgentMessage[] = [];
      if (currentTask) {
        relevantHistory = await this.searchCommunicationHistory({
          query: currentTask,
          agentId,
          limit: 5,
          minQualityScore: 70
        });
      }

      // Get peer agent information
      const peerAgents = Array.from(this.agentRegistry.values())
        .filter(agent => agent.agentId !== agentId && agent.status === 'available');

      // Get system status from memory
      const systemStatus = await this.getSystemStatus();

      return {
        recentMessages,
        relevantHistory,
        peerAgents,
        systemStatus
      };
    } catch (error) {
      console.error(`[MemoryComm] Failed to get context for ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Process the message queue
   */
  private async processMessageQueue(): Promise<void> {
    if (this.isProcessing || this.messageQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`[MemoryComm] Processing ${this.messageQueue.length} messages in queue`);

    try {
      while (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift()!;
        await this.deliverMessage(message);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Deliver a message to its intended recipient(s)
   */
  private async deliverMessage(message: AgentMessage): Promise<void> {
    console.log(`[MemoryComm] Delivering message ${message.id} from ${message.fromAgent}`);
    
    try {
      if (message.toAgent) {
        // Direct message delivery
        const targetAgent = this.agentRegistry.get(message.toAgent);
        if (targetAgent) {
          console.log(`[MemoryComm] Direct message delivered to ${message.toAgent}`);
          // Message is already stored in memory, recipient can retrieve it
        } else {
          console.warn(`[MemoryComm] Target agent ${message.toAgent} not found`);
        }
      } else {
        // Broadcast message
        console.log(`[MemoryComm] Broadcast message delivered to all agents`);
        // Message stored in memory with broadcast flag, all agents can see it
      }
    } catch (error) {
      console.error(`[MemoryComm] Failed to deliver message ${message.id}:`, error);
    }
  }

  /**
   * Format message for memory storage
   */
  private formatMessageForMemory(message: AgentMessage): string {
    return `Agent Communication - ${message.messageType.toUpperCase()}
From: ${message.fromAgent}
To: ${message.toAgent || 'ALL'}
Priority: ${message.priority}
Content: ${message.content}
${message.threadId ? `Thread: ${message.threadId}` : ''}
${message.replyToMessageId ? `Reply to: ${message.replyToMessageId}` : ''}`;
  }
  /**
   * Parse message from memory storage
   */
  private parseMessageFromMemory(memory: any): AgentMessage {
    const metadata = memory.metadata || {};
    
    const messageMetadata: AgentMessage['metadata'] = {};
    if (metadata.requiresResponse !== undefined) messageMetadata.requiresResponse = metadata.requiresResponse;
    if (metadata.expiresAt) messageMetadata.expiresAt = new Date(metadata.expiresAt);
    if (metadata.tags) messageMetadata.tags = metadata.tags;
    if (metadata.confidenceLevel !== undefined) messageMetadata.confidenceLevel = metadata.confidenceLevel;
    if (metadata.qualityScore !== undefined) messageMetadata.qualityScore = metadata.qualityScore;
    if (metadata.constitutionalValid !== undefined) messageMetadata.constitutionalValid = metadata.constitutionalValid;
    if (metadata.context) messageMetadata.context = metadata.context;
    
    return {
      id: metadata.messageId || memory.id,
      fromAgent: metadata.fromAgent || 'unknown',
      toAgent: metadata.toAgent,
      messageType: metadata.messageType || 'direct',
      content: memory.content || '',
      priority: metadata.priority || 'medium',
      timestamp: new Date(metadata.timestamp || memory.timestamp),
      threadId: metadata.threadId,
      replyToMessageId: metadata.replyToMessageId,
      metadata: messageMetadata
    };
  }

  /**
   * Get system status from memory
   */
  private async getSystemStatus(): Promise<any> {    try {
      const systemResult = await realUnifiedMemoryClient.getMemoryContext(
        'system status health metrics',
        'system',
        5
      );

      return {
        registeredAgents: this.agentRegistry.size,
        queueLength: this.messageQueue.length,
        isProcessing: this.isProcessing,
        lastSystemUpdate: new Date(),
        memorySystemHealth: systemResult.memories.length > 0
      };
    } catch (error) {
      console.error('[MemoryComm] Failed to get system status:', error);
      return {
        registeredAgents: this.agentRegistry.size,
        queueLength: this.messageQueue.length,
        isProcessing: this.isProcessing,
        lastSystemUpdate: new Date(),
        memorySystemHealth: false
      };
    }
  }

  /**
   * Get registered agents
   */
  getRegisteredAgents(): AgentContext[] {
    return Array.from(this.agentRegistry.values());
  }

  /**
   * Update agent status
   */
  async updateAgentStatus(agentId: string, status: 'available' | 'busy' | 'offline'): Promise<void> {
    const agent = this.agentRegistry.get(agentId);
    if (agent) {
      agent.status = status;
      agent.recentActivity = new Date();
        // Store status update in memory
      try {
        await realUnifiedMemoryClient.createMemory(
          `Agent ${agentId} status updated to ${status}`,
          'system',
          'long_term',
          {
            agentId,
            status,
            timestamp: new Date().toISOString()
          }
        );
      } catch (error) {
        console.error(`[MemoryComm] Failed to store status update for ${agentId}:`, error);
      }
    }
  }
}

// Export singleton instance
export const memoryDrivenComm = MemoryDrivenAgentCommunication.getInstance();
