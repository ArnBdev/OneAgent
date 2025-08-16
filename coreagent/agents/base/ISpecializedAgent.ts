/**
 * ISpecializedAgent - Enhanced Interface for Specialized Agent Implementation
 *
 * This interface defines the contract for all specialized agents in the OneAgent ecosystem.
 * Supports dependency injection, action systems, and comprehensive health monitoring.
 */

import { AgentConfig, AgentContext, AgentResponse, AgentAction } from './BaseAgent';

export { AgentConfig, AgentContext, AgentResponse, AgentAction } from './BaseAgent';

export interface ISpecializedAgent {
  /** Unique identifier for the agent */
  readonly id: string;

  /** Agent configuration */
  readonly config: AgentConfig;

  /** Initialize the specialized agent */
  initialize(): Promise<void>;

  /** Process a user message and generate a response */
  processMessage(context: AgentContext, message: string): Promise<AgentResponse>;

  /** Get available actions for this agent */
  getAvailableActions(): AgentAction[];

  /** Execute a specific action */
  executeAction(
    action: string | AgentAction,
    params: Record<string, unknown>,
    context?: AgentContext,
  ): Promise<unknown>;
  /** Get agent status and health (BaseAgent compatibility) */
  getStatus(): {
    agentId: string;
    name: string;
    description: string;
    initialized: boolean;
    capabilities: string[];
    memoryEnabled: boolean;
    aiEnabled: boolean;
    lastActivity?: Date;
    isHealthy: boolean;
    processedMessages: number;
    errors: number;
  };

  /** Get agent name */
  getName(): string;

  /** Get detailed health status */
  getHealthStatus(): Promise<AgentHealthStatus>;

  /** Cleanup resources */
  cleanup(): Promise<void>;
}

export interface AgentHealthStatus {
  status: 'healthy' | 'degraded' | 'critical' | 'offline';
  uptime: number;
  memoryUsage: number;
  responseTime: number;
  errorRate: number;
  lastActivity?: Date;
  errors?: string[];
}

export interface AgentCapability {
  name: string;
  description: string;
  category: 'behavior' | 'memory' | 'action' | 'dialogue';
  parameters?: Record<string, unknown>;
}

export interface AgentPersonality {
  name: string;
  traits: PersonalityTraits;
  responseStyle: ResponseStyle;
  expertise: string[];
}

export interface PersonalityTraits {
  helpfulness: number; // 0-1 scale
  formality: number; // 0-1 scale
  creativity: number; // 0-1 scale
  patience: number; // 0-1 scale
  assertiveness: number; // 0-1 scale
  empathy: number; // 0-1 scale
}

export type ResponseStyle =
  | 'formal'
  | 'casual'
  | 'professional'
  | 'friendly'
  | 'expert'
  | 'coaching';

export interface AgentMemoryContext {
  sessionId: string;
  conversationHistory: unknown[];
  relevantMemories: unknown[];
  contextWindow: string[];
}

// Task and system interfaces for specialized agents
export interface Task {
  id: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedAgent?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  context: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemHealthReport {
  systemStatus: 'healthy' | 'degraded' | 'critical';
  agentCount: number;
  activeTasks: number;
  memorySystemStatus: 'connected' | 'degraded' | 'offline';
  timestamp: Date;
}

export interface AgentStatus {
  isHealthy: boolean;
  lastActivity: Date;
  memoryCount: number;
  processedMessages: number;
  errors: string[];
}
