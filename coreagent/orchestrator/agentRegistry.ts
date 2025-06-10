/**
 * AgentRegistry - Implementation of agent registry management
 * 
 * This class manages the registration, discovery, and health monitoring
 * of specialized agents in the OneAgent system.
 */

import { IAgentRegistry, AgentHealthReport, AgentRegistryConfig, AgentMatchCriteria } from './interfaces/IAgentRegistry';
import { ISpecializedAgent } from '../agents/base/ISpecializedAgent';
import { AgentType } from '../agents/base/AgentFactory';

export class AgentRegistry implements IAgentRegistry {
  private agents: Map<string, ISpecializedAgent> = new Map();
  private agentTypes: Map<string, AgentType> = new Map();
  private matchingCriteria: Map<AgentType, AgentMatchCriteria> = new Map();
  private config: AgentRegistryConfig;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(config?: Partial<AgentRegistryConfig>) {
    this.config = {
      maxAgents: 10,
      healthCheckInterval: 60000, // 1 minute
      autoCleanup: true,
      ...config
    };

    this.initializeMatchingCriteria();
    this.startHealthMonitoring();
  }

  /**
   * Register a new agent
   */
  async registerAgent(agent: ISpecializedAgent): Promise<void> {
    if (this.agents.size >= this.config.maxAgents) {
      throw new Error(`Maximum number of agents (${this.config.maxAgents}) reached`);
    }

    if (this.agents.has(agent.id)) {
      throw new Error(`Agent with ID ${agent.id} already registered`);
    }

    // Determine agent type from capabilities
    const agentType = this.determineAgentType(agent);
    
    this.agents.set(agent.id, agent);
    this.agentTypes.set(agent.id, agentType);

    console.log(`Agent ${agent.id} registered successfully as ${agentType}`);
  }

  /**
   * Unregister an agent
   */
  async unregisterAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    await agent.cleanup();
    this.agents.delete(agentId);
    this.agentTypes.delete(agentId);

    console.log(`Agent ${agentId} unregistered successfully`);
  }

  /**
   * Get an agent by ID
   */
  getAgent(agentId: string): ISpecializedAgent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all registered agents
   */
  getAllAgents(): ISpecializedAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agents by type
   */
  getAgentsByType(type: AgentType): ISpecializedAgent[] {
    const result: ISpecializedAgent[] = [];
    
    for (const [agentId, agentType] of this.agentTypes.entries()) {
      if (agentType === type) {
        const agent = this.agents.get(agentId);
        if (agent) {
          result.push(agent);
        }
      }
    }

    return result;
  }

  /**
   * Find the best agent for a given request
   */
  async findBestAgent(request: string, _context?: any): Promise<ISpecializedAgent | undefined> {
    if (this.agents.size === 0) {
      return undefined;
    }

    const requestLower = request.toLowerCase();
    let bestAgent: ISpecializedAgent | undefined;
    let bestScore = 0;

    for (const [agentId, agent] of this.agents.entries()) {
      const agentType = this.agentTypes.get(agentId);
      if (!agentType) continue;

      const score = this.calculateMatchScore(requestLower, agentType, agent);
      
      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
      }
    }

    return bestScore > 0.3 ? bestAgent : undefined; // Minimum threshold
  }

  /**
   * Get agent count
   */
  getAgentCount(): number {
    return this.agents.size;
  }

  /**
   * Check if agent exists
   */
  hasAgent(agentId: string): boolean {
    return this.agents.has(agentId);
  }

  /**
   * Get agent health status
   */
  getAgentsHealth(): AgentHealthReport[] {
    const reports: AgentHealthReport[] = [];

    for (const [agentId, agent] of this.agents.entries()) {
      const agentType = this.agentTypes.get(agentId) || 'unknown';
      const status = agent.getStatus();

      reports.push({
        agentId,
        agentType,
        isHealthy: status.isHealthy,
        lastActivity: status.lastActivity,
        processedMessages: status.processedMessages,
        errors: status.errors
      });
    }

    return reports;
  }

  /**
   * Cleanup all agents
   */
  async cleanup(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    const cleanupPromises: Promise<void>[] = [];
    
    for (const agent of this.agents.values()) {
      cleanupPromises.push(agent.cleanup());
    }

    await Promise.all(cleanupPromises);
    
    this.agents.clear();
    this.agentTypes.clear();
    
    console.log('Agent registry cleanup completed');
  }  /**
   * Initialize matching criteria for different agent types
   */
  private initializeMatchingCriteria(): void {
    this.matchingCriteria.set('enhanced-development', {
      keywords: ['revolutionary', 'constitutional', 'bmad', 'quality', 'enhanced', 'advanced', 'code', 'develop', 'programming', 'debug', 'test', 'refactor', 'optimize', 'security', 'git', 'dependency', 'analyze', 'performance', 'documentation', 'technical', 'prompt', 'ai', 'verification'],
      requiredCapabilities: ['revolutionary_prompting', 'constitutional_ai', 'bmad_elicitation'],
      priority: 3  // Highest priority - revolutionary prompt engineering
    });

    this.matchingCriteria.set('development', {
      keywords: ['code', 'develop', 'programming', 'debug', 'test', 'refactor', 'optimize', 'security', 'git', 'dependency', 'analyze', 'performance', 'documentation', 'technical'],
      requiredCapabilities: ['code_analysis', 'test_generation', 'documentation_sync', 'refactoring'],
      priority: 2
    });

    this.matchingCriteria.set('office', {
      keywords: ['document', 'email', 'calendar', 'schedule', 'meeting', 'task', 'office', 'work'],
      requiredCapabilities: ['document_processing'],
      priority: 1
    });

    this.matchingCriteria.set('fitness', {
      keywords: ['workout', 'exercise', 'fitness', 'health', 'nutrition', 'diet', 'weight', 'training'],
      requiredCapabilities: ['workout_planning'],
      priority: 1
    });

    this.matchingCriteria.set('general', {
      keywords: ['help', 'question', 'information', 'chat', 'talk'],
      requiredCapabilities: ['conversation'],
      priority: 0
    });
  }  /**
   * Determine agent type from its capabilities
   */
  private determineAgentType(agent: ISpecializedAgent): AgentType {
    const capabilities = agent.config.capabilities;
    
    // Check for enhanced development capabilities first (highest priority - revolutionary prompt engineering)
    if (capabilities.includes('revolutionary_prompting') || 
        capabilities.includes('constitutional_ai') || 
        capabilities.includes('bmad_elicitation') || 
        capabilities.includes('chain_of_verification') ||
        capabilities.includes('quality_validation') ||
        capabilities.includes('self_correction') ||
        capabilities.includes('adaptive_prompting')) {
      return 'enhanced-development';
    }
    
    // Check for standard development capabilities (high priority)
    if (capabilities.includes('code_analysis') || 
        capabilities.includes('test_generation') || 
        capabilities.includes('refactoring') || 
        capabilities.includes('performance_optimization') ||
        capabilities.includes('security_scanning') ||
        capabilities.includes('git_workflow') ||
        capabilities.includes('dependency_management')) {
      return 'development';
    }
    
    if (capabilities.includes('document_processing') || capabilities.includes('calendar_management')) {
      return 'office';
    }
    
    if (capabilities.includes('workout_planning') || capabilities.includes('nutrition_tracking')) {
      return 'fitness';
    }
    
    return 'general';
  }

  /**
   * Calculate match score for an agent given a request
   */
  private calculateMatchScore(request: string, agentType: AgentType, agent: ISpecializedAgent): number {
    const criteria = this.matchingCriteria.get(agentType);
    if (!criteria) return 0;

    let score = 0;

    // Check keyword matches
    for (const keyword of criteria.keywords) {
      if (request.includes(keyword)) {
        score += 0.2;
      }
    }

    // Check capability matches
    for (const capability of criteria.requiredCapabilities) {
      if (agent.config.capabilities.includes(capability)) {
        score += 0.3;
      }
    }

    // Add priority bonus
    score += criteria.priority * 0.1;

    // Agent health bonus
    const status = agent.getStatus();
    if (status.isHealthy) {
      score += 0.1;
    }

    return Math.min(score, 1.0); // Cap at 1.0
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    if (this.config.healthCheckInterval > 0) {
      this.healthCheckInterval = setInterval(() => {
        this.performHealthCheck();
      }, this.config.healthCheckInterval);
    }
  }

  /**
   * Perform health check on all agents
   */
  private performHealthCheck(): void {
    const unhealthyAgents: string[] = [];

    for (const [agentId, agent] of this.agents.entries()) {
      const status = agent.getStatus();
      
      if (!status.isHealthy) {
        unhealthyAgents.push(agentId);
      }
    }

    if (unhealthyAgents.length > 0) {
      console.warn(`Health check found ${unhealthyAgents.length} unhealthy agents:`, unhealthyAgents);
      
      if (this.config.autoCleanup) {
        // Could implement auto-cleanup logic here
      }
    }
  }
}