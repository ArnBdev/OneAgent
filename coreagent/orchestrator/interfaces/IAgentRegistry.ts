/**
 * IAgentRegistry - Interface for agent registry management
 * 
 * This interface defines the contract for managing multiple agents
 * in the OneAgent orchestrator system.
 */

import { ISpecializedAgent } from '../../agents/base/ISpecializedAgent';
import { AgentType } from '../../agents/base/AgentFactory';

export interface IAgentRegistry {
  /**
   * Register a new agent
   */
  registerAgent(agent: ISpecializedAgent): Promise<void>;

  /**
   * Unregister an agent
   */
  unregisterAgent(agentId: string): Promise<void>;

  /**
   * Get an agent by ID
   */
  getAgent(agentId: string): ISpecializedAgent | undefined;

  /**
   * Get all registered agents
   */
  getAllAgents(): ISpecializedAgent[];

  /**
   * Get agents by type
   */
  getAgentsByType(type: AgentType): ISpecializedAgent[];

  /**
   * Find the best agent for a given request
   */
  findBestAgent(request: string, context?: any): Promise<ISpecializedAgent | undefined>;

  /**
   * Get agent count
   */
  getAgentCount(): number;

  /**
   * Check if agent exists
   */
  hasAgent(agentId: string): boolean;

  /**
   * Get agent health status
   */
  getAgentsHealth(): AgentHealthReport[];

  /**
   * Cleanup all agents
   */
  cleanup(): Promise<void>;
}

export interface AgentHealthReport {
  agentId: string;
  agentType: string;
  isHealthy: boolean;
  lastActivity: Date;
  processedMessages: number;
  errors: string[];
}

export interface AgentRegistryConfig {
  maxAgents: number;
  healthCheckInterval: number;
  autoCleanup: boolean;
}

export interface AgentMatchCriteria {
  keywords: string[];
  requiredCapabilities: string[];
  priority: number;
}

// Additional type definitions for complete agent registry functionality
export interface AgentRegistrationRequest {
  agent: ISpecializedAgent;
  metadata?: Record<string, any>;
  priority?: number;
  capabilities?: string[];
}

export interface AgentStatus {
  id: string;
  type: string;
  isActive: boolean;
  lastActivity: Date;
  registrationTime: Date;
  processedRequests: number;
  averageResponseTime: number;
  successRate: number;
}

export interface RegistryStatistics {
  totalAgents: number;
  activeAgents: number;
  agentsByType: Record<string, number>;
  totalProcessedRequests: number;
  averageResponseTime: number;
  systemUptime: number;
  memoryUsage: number;
}

export interface AgentHealthCheck {
  agentId: string;
  timestamp: Date;
  isHealthy: boolean;
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  errorCount: number;
  lastError?: string;
}