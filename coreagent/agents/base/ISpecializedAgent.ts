/**
 * ISpecializedAgent - Interface for Specialized Agent Implementation
 * 
 * This interface defines the contract for all specialized agents in the OneAgent ecosystem.
 * Specialized agents extend the base agent functionality with domain-specific capabilities.
 */

import { AgentConfig, AgentContext, AgentResponse, AgentAction } from './BaseAgent';

export interface ISpecializedAgent {
  /** Unique identifier for the agent */
  id: string;
  
  /** Agent configuration */
  config: AgentConfig;
  
  /** Initialize the specialized agent */
  initialize(): Promise<void>;
  
  /** Process a user message and generate a response */
  processMessage(context: AgentContext, message: string): Promise<AgentResponse>;
  
  /** Get available actions for this agent */
  getAvailableActions(): AgentAction[];
  
  /** Execute a specific action */
  executeAction(action: AgentAction, context: AgentContext): Promise<any>;
    /** Get agent status and health */
  getStatus(): AgentStatus;
  
  /** Get agent name */
  getName(): string;
  
  /** Get detailed health status */
  getHealthStatus(): Promise<AgentHealthStatus>;
  
  /** Cleanup resources */
  cleanup(): Promise<void>;
}

export interface AgentStatus {
  isHealthy: boolean;
  lastActivity: Date;
  memoryCount: number;
  processedMessages: number;
  errors: string[];
}

export interface AgentHealthStatus {
  status: 'healthy' | 'degraded' | 'critical' | 'offline';
  uptime: number;
  memoryUsage: number;
  responseTime: number;
  errorRate: number;
}

export interface AgentCapability {
  name: string;
  description: string;
  category: 'behavior' | 'memory' | 'action' | 'dialogue';
  parameters?: Record<string, any>;
}

export interface AgentPersonality {
  name: string;
  traits: PersonalityTraits;
  responseStyle: ResponseStyle;
  expertise: string[];
}

export interface PersonalityTraits {
  helpfulness: number;      // 0-1 scale
  formality: number;        // 0-1 scale
  creativity: number;       // 0-1 scale
  patience: number;         // 0-1 scale
  assertiveness: number;    // 0-1 scale
  empathy: number;          // 0-1 scale
}

export type ResponseStyle = 'formal' | 'casual' | 'professional' | 'friendly' | 'expert' | 'coaching';

export interface AgentMemoryContext {
  sessionId: string;
  conversationHistory: any[];
  relevantMemories: any[];
  contextWindow: string[];
}