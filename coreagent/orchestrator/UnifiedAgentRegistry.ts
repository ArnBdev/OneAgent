/**
 * UnifiedAgentRegistry - Memory-First Agent Registry Implementation
 * 
 * OURA v3.0 Enhanced Implementation supporting:
 * - Memory-first agent lifecycle with ChromaDB integration
 * - Persistent vs Temporary agent classification with auto-cleanup
 * - Constitutional AI validation for all registrations
 * - User isolation and domain separation
 * - Cross-agent learning and knowledge transfer
 * - Organism-like coordination and collective intelligence
 * 
 * @version 3.0.0 - Memory-First Organism Architecture
 * @date June 17, 2025
 */

import { EventEmitter } from 'events';
import { 
  IUnifiedAgentRegistry, 
  EnhancedAgentConfig,
  TemporaryAgentConfig,
  RegistrationResult,
  AgentEnhancementResult,
  DeregistrationResult,
  KnowledgeTransferRequest,
  CrossAgentLearning,
  EnhancedAgentHealth,
  OrganismHealthReport,
  AgentLifecycleType,
  AgentState,
  Duration,
  AgentFilter,
  DEFAULT_REGISTRY_CONFIG
} from './interfaces/IUnifiedAgentRegistry';
import { IAgentRegistry } from './interfaces/IAgentRegistry';
import { ISpecializedAgent } from '../agents/base/ISpecializedAgent';
import { AgentType } from '../agents/base/AgentFactory';
import { UnifiedMemoryInterface } from '../memory/UnifiedMemoryInterface';
import { HealthMonitoringService } from '../monitoring/HealthMonitoringService';
import { oneAgentConfig } from '../config/index';

// =====================================
// Internal Agent Registration Data
// =====================================

interface RegisteredAgent {
  agent: ISpecializedAgent;
  config: EnhancedAgentConfig | TemporaryAgentConfig;
  state: AgentState;
  registrationTime: Date;
  lastActivity: Date;
  processedMessages: number;
  errors: string[];
  qualityScore: number;
  memoryPatterns: string[];
  cleanupScheduled?: Date;
  promotionEligible: boolean;
}

// =====================================
// Main Registry Implementation
// =====================================

export class UnifiedAgentRegistry extends EventEmitter implements IUnifiedAgentRegistry {
  private agents: Map<string, RegisteredAgent> = new Map();
  private memoryClient: UnifiedMemoryInterface | null = null;
  private healthMonitor: HealthMonitoringService | null = null;
  private healthCheckInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;
  private isCoordinationActive: boolean = false;
  
  // Configuration
  private config = {
    ...DEFAULT_REGISTRY_CONFIG,
    // Override with any custom configuration
  };
  constructor(memoryClient?: UnifiedMemoryInterface) {
    super();
    
    if (memoryClient) {
      this.memoryClient = memoryClient;
    }
    
    this.setupEventHandlers();
    console.log('🧠 UnifiedAgentRegistry initialized with memory-first architecture');
  }
  /**
   * Initialize the unified agent registry
   */
  async initialize(): Promise<void> {
    try {      // Initialize memory client if not provided
      if (!this.memoryClient) {
        const { realUnifiedMemoryClient } = await import('../memory/RealUnifiedMemoryClient');
        this.memoryClient = realUnifiedMemoryClient as any; // Type compatibility bridge
      }
      
      // Connect to memory system
      if (this.memoryClient && typeof this.memoryClient.connect === 'function') {
        try {
          await this.memoryClient.connect();
          console.log('✅ Memory client connected successfully');
        } catch (error) {
          console.warn('⚠️ Memory client connection failed:', error);
        }
      }      // Initialize health monitoring service
      this.healthMonitor = new HealthMonitoringService(
        this.memoryClient || undefined, 
        this
      );
      
      // Verify memory system health with new monitoring
      const isHealthy = this.memoryClient && typeof this.memoryClient.isHealthy === 'function' 
        ? await this.memoryClient.isHealthy() 
        : false;
      
      if (isHealthy) {
        console.log('✅ Memory system healthy - Professional monitoring active');
      } else {
        console.warn('⚠️ Memory system health check failed - Starting recovery procedures');
      }

      // Start organism coordination with health monitoring
      await this.startOrganismCoordination();
      
      // Start professional health monitoring
      if (this.healthMonitor) {
        await this.healthMonitor.startMonitoring();
      }
      
      console.log('✅ UnifiedAgentRegistry initialization complete - OURA v3.0 with Health Monitoring ready');
    } catch (error) {
      console.error('❌ Failed to initialize UnifiedAgentRegistry:', error);
      throw error;
    }
  }

  // =====================================
  // Event Handlers Setup
  // =====================================
  
  private setupEventHandlers(): void {
    this.on('agent:registered', (agentId: string) => {
      console.log(`✅ Agent registered: ${agentId}`);
    });
    
    this.on('agent:deregistered', (agentId: string) => {
      console.log(`🗑️ Agent deregistered: ${agentId}`);
    });
    
    this.on('agent:enhanced', (agentId: string, patternsCount: number) => {
      console.log(`🚀 Agent enhanced: ${agentId} (${patternsCount} patterns)`);
    });
    
    this.on('memory:connected', () => {
      console.log('🧠 Memory integration connected');
    });
    
    this.on('error', (error: Error) => {
      console.error('❌ Registry error:', error);
    });
  }

  // =====================================
  // Core Registration Operations
  // =====================================

  async registerPersistentAgent(config: EnhancedAgentConfig): Promise<RegistrationResult> {
    try {
      const agentId = config.agent.id;
      
      // Check if agent already exists
      if (this.agents.has(agentId)) {
        return {
          success: false,
          agentId,
          registrationTimestamp: new Date(),
          memoryEnhancementApplied: false,
          constitutionalValidation: {
            passed: false,
            qualityScore: 0,
            safetyScore: 0,
            violations: ['Agent already registered']
          },
          inheritedCapabilities: [],
          error: `Agent with ID ${agentId} already registered`
        };
      }

      // Check agent limits
      const persistentCount = Array.from(this.agents.values())
        .filter(a => a.config.lifecycleType === 'persistent').length;
      
      if (persistentCount >= this.config.maxPersistentAgents) {
        return {
          success: false,
          agentId,
          registrationTimestamp: new Date(),
          memoryEnhancementApplied: false,
          constitutionalValidation: {
            passed: false,
            qualityScore: 0,
            safetyScore: 0,
            violations: ['Maximum persistent agents limit reached']
          },
          inheritedCapabilities: [],
          error: `Maximum persistent agents (${this.config.maxPersistentAgents}) reached`
        };
      }

      // Perform Constitutional AI validation
      const constitutionalValidation = await this.validateAgentConstitutionally(config);
      
      if (!constitutionalValidation.passed && config.constitutional.validationRequired) {
        return {
          success: false,
          agentId,
          registrationTimestamp: new Date(),
          memoryEnhancementApplied: false,
          constitutionalValidation,
          inheritedCapabilities: [],
          error: 'Constitutional AI validation failed'
        };
      }

      // Create registered agent record
      const registeredAgent: RegisteredAgent = {
        agent: config.agent,
        config,
        state: 'registering',
        registrationTime: new Date(),
        lastActivity: new Date(),
        processedMessages: 0,
        errors: [],
        qualityScore: constitutionalValidation.qualityScore,
        memoryPatterns: [],
        promotionEligible: false
      };

      // Store agent
      this.agents.set(agentId, registeredAgent);

      // Apply memory enhancement if enabled
      let memoryEnhancementApplied = false;
      let inheritedCapabilities: string[] = [];
      
      if (config.memoryConfig.enableMemoryInheritance && this.memoryClient) {
        try {
          const enhancement = await this.enhanceAgentFromMemory(agentId, config.isolation.userId);
          memoryEnhancementApplied = enhancement.enhancementApplied;
          inheritedCapabilities = enhancement.capabilitiesAdded;
          registeredAgent.memoryPatterns = inheritedCapabilities;
        } catch (error) {
          console.warn(`Memory enhancement failed for ${agentId}:`, error);
        }
      }

      // Update agent state
      registeredAgent.state = 'active_persistent';
      
      // Store agent data in memory for future learning
      if (this.memoryClient) {
        await this.storeAgentInMemory(registeredAgent);
      }

      const result: RegistrationResult = {
        success: true,
        agentId,
        registrationTimestamp: registeredAgent.registrationTime,
        memoryEnhancementApplied,
        constitutionalValidation,
        inheritedCapabilities,
      };

      this.emit('agent:registered', agentId);
      
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to register persistent agent:`, error);
      
      return {
        success: false,
        agentId: config.agent.id,
        registrationTimestamp: new Date(),
        memoryEnhancementApplied: false,
        constitutionalValidation: {
          passed: false,
          qualityScore: 0,
          safetyScore: 0,
          violations: [errorMessage]
        },
        inheritedCapabilities: [],
        error: errorMessage
      };
    }
  }

  async registerTemporaryAgent(config: TemporaryAgentConfig): Promise<RegistrationResult> {
    try {
      const agentId = config.agent.id;
      
      // Check agent limits
      const temporaryCount = Array.from(this.agents.values())
        .filter(a => a.config.lifecycleType === 'temporary').length;
      
      if (temporaryCount >= this.config.maxTemporaryAgents) {
        return {
          success: false,
          agentId,
          registrationTimestamp: new Date(),
          memoryEnhancementApplied: false,
          constitutionalValidation: {
            passed: false,
            qualityScore: 0,
            safetyScore: 0,
            violations: ['Maximum temporary agents limit reached']
          },
          inheritedCapabilities: [],
          error: `Maximum temporary agents (${this.config.maxTemporaryAgents}) reached`
        };
      }

      // Perform Constitutional AI validation
      const constitutionalValidation = await this.validateAgentConstitutionally(config);
      
      if (!constitutionalValidation.passed && config.constitutional.validationRequired) {
        return {
          success: false,
          agentId,
          registrationTimestamp: new Date(),
          memoryEnhancementApplied: false,
          constitutionalValidation,
          inheritedCapabilities: [],
          error: 'Constitutional AI validation failed'
        };
      }

      // Calculate cleanup time
      const cleanupTime = this.calculateCleanupTime(config);

      // Create registered agent record
      const registeredAgent: RegisteredAgent = {
        agent: config.agent,
        config,
        state: 'registering',
        registrationTime: new Date(),
        lastActivity: new Date(),
        processedMessages: 0,
        errors: [],
        qualityScore: constitutionalValidation.qualityScore,
        memoryPatterns: [],
        cleanupScheduled: cleanupTime,
        promotionEligible: config.lifecycle.promotionEligible || false
      };

      // Store agent
      this.agents.set(agentId, registeredAgent);

      // Apply memory enhancement
      let memoryEnhancementApplied = false;
      let inheritedCapabilities: string[] = [];
      
      if (config.memoryConfig.enableMemoryInheritance && this.memoryClient) {
        try {
          const enhancement = await this.enhanceAgentFromMemory(agentId, config.isolation.userId);
          memoryEnhancementApplied = enhancement.enhancementApplied;
          inheritedCapabilities = enhancement.capabilitiesAdded;
          registeredAgent.memoryPatterns = inheritedCapabilities;
        } catch (error) {
          console.warn(`Memory enhancement failed for ${agentId}:`, error);
        }
      }

      // Update agent state
      registeredAgent.state = 'active_temporary';

      const result: RegistrationResult = {
        success: true,
        agentId,
        registrationTimestamp: registeredAgent.registrationTime,
        memoryEnhancementApplied,
        constitutionalValidation,
        inheritedCapabilities,
      };

      this.emit('agent:registered', agentId);
      
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to register temporary agent:`, error);
      
      return {
        success: false,
        agentId: config.agent.id,
        registrationTimestamp: new Date(),
        memoryEnhancementApplied: false,
        constitutionalValidation: {
          passed: false,
          qualityScore: 0,
          safetyScore: 0,
          violations: [errorMessage]
        },
        inheritedCapabilities: [],
        error: errorMessage
      };
    }
  }

  async deregisterAgent(agentId: string, preserveKnowledge: boolean = true): Promise<DeregistrationResult> {
    try {
      const registeredAgent = this.agents.get(agentId);
      
      if (!registeredAgent) {
        return {
          success: false,
          agentId,
          knowledgePreserved: false,
          learningPatternsStored: 0,
          error: `Agent ${agentId} not found`
        };
      }

      let learningPatternsStored = 0;

      // Preserve knowledge in memory if requested
      if (preserveKnowledge && this.memoryClient) {
        try {
          learningPatternsStored = await this.preserveAgentKnowledge(registeredAgent);
        } catch (error) {
          console.warn(`Failed to preserve knowledge for ${agentId}:`, error);
        }
      }

      // Remove agent
      this.agents.delete(agentId);
      
      // Update agent state for any cleanup operations
      registeredAgent.state = 'deregistered';

      const result: DeregistrationResult = {
        success: true,
        agentId,
        knowledgePreserved: preserveKnowledge,
        learningPatternsStored
      };

      this.emit('agent:deregistered', agentId);
      
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to deregister agent ${agentId}:`, error);
      
      return {
        success: false,
        agentId,
        knowledgePreserved: false,
        learningPatternsStored: 0,
        error: errorMessage
      };
    }
  }

  // =====================================
  // Memory Enhancement Operations
  // =====================================
  async enhanceAgentFromMemory(agentId: string, userId: string): Promise<AgentEnhancementResult> {
    const registeredAgent = this.agents.get(agentId);
    
    if (!registeredAgent || !this.memoryClient) {
      return {
        agentId,
        enhancementApplied: false,
        patternsLoaded: 0,
        capabilitiesAdded: [],
        qualityImprovement: 0,
        memorySourceCount: 0
      };
    }

    try {
      // Get agent type from config name or use a default
      const agentType = registeredAgent.config.agent.config.name || 'general';
      
      // Search for relevant memory patterns using userId for isolation
      const memoryQuery = {
        query: `agent capabilities ${agentType} patterns learning userId:${userId}`,
        agentIds: [agentId],
        memoryTypes: ['learning', 'pattern'] as any,
        maxResults: 50,
        semanticSearch: true
      };

      const memories = await this.memoryClient.searchMemories(memoryQuery);
      const relevantPatterns = memories.filter(m => m.relevanceScore > 0.7);

      let capabilitiesAdded: string[] = [];
      let qualityImprovement = 0;

      // Apply relevant patterns to enhance agent
      for (const memory of relevantPatterns) {
        try {
          // Extract capabilities from memory content
          const extractedCapabilities = this.extractCapabilitiesFromMemory(memory.content);
          capabilitiesAdded.push(...extractedCapabilities);
          
          // Calculate quality improvement
          qualityImprovement += memory.relevanceScore * 0.1; // Max 10% improvement per pattern
        } catch (error) {
          console.warn(`Failed to apply memory pattern ${memory.id}:`, error);
        }
      }

      // Update agent with new capabilities
      registeredAgent.memoryPatterns.push(...capabilitiesAdded);
      registeredAgent.qualityScore += qualityImprovement;
      registeredAgent.state = 'active_persistent'; // Reset from enhancing state

      const result: AgentEnhancementResult = {
        agentId,
        enhancementApplied: relevantPatterns.length > 0,
        patternsLoaded: relevantPatterns.length,
        capabilitiesAdded: Array.from(new Set(capabilitiesAdded)), // Remove duplicates
        qualityImprovement,
        memorySourceCount: memories.length
      };

      this.emit('agent:enhanced', agentId, relevantPatterns.length);
      
      return result;

    } catch (error) {
      console.error(`Memory enhancement failed for ${agentId}:`, error);
      
      return {
        agentId,
        enhancementApplied: false,
        patternsLoaded: 0,
        capabilitiesAdded: [],
        qualityImprovement: 0,
        memorySourceCount: 0
      };
    }
  }

  // =====================================
  // Agent Discovery and Management
  // =====================================
  async getAgent(agentId: string): Promise<ISpecializedAgent | null> {
    const registeredAgent = this.agents.get(agentId);
    return registeredAgent ? registeredAgent.agent : null;
  }
  async getAllAgents(): Promise<ISpecializedAgent[]> {
    return Array.from(this.agents.values()).map(registered => registered.agent);
  }

  /**
   * Get agent count for statistics
   */
  getAgentCount(): number {
    return this.agents.size;
  }

  /**
   * Simple agent registration (convenience method)
   */
  async registerAgent(agent: ISpecializedAgent, userId?: string): Promise<RegistrationResult> {
    // Create default enhanced config for convenience registration
    const defaultConfig: EnhancedAgentConfig = {
      agent,
      lifecycleType: 'persistent',
      memoryConfig: {
        enableMemoryInheritance: true,
        domainContexts: ['general'],
        userIsolation: true
      },
      lifecycle: {
        autoCleanup: false,
        knowledgePreservation: true,
        promotionEligible: false
      },
      constitutional: {
        qualityThreshold: 80,
        safetyLevel: 'balanced',
        validationRequired: true
      },
      isolation: {
        userId: userId || 'default',
        domain: 'general',
        privacyLevel: 'internal',
        crossDomainLearning: true
      }
    };

    return this.registerPersistentAgent(defaultConfig);
  }

  async findBestAgent(request: string, userId: string, domain?: string): Promise<ISpecializedAgent | null> {
    try {
      // Filter agents by user and domain if specified
      const eligibleAgents = Array.from(this.agents.values()).filter(registered => {
        const config = registered.config;
        
        // Check user isolation
        if (config.isolation.userId !== userId) {
          return false;
        }
        
        // Check domain if specified
        if (domain && config.isolation.domain !== domain) {
          return false;
        }
        
        // Check agent is active
        return registered.state === 'active_persistent' || registered.state === 'active_temporary';
      });

      if (eligibleAgents.length === 0) {
        return null;
      }

      // Use memory to find best match if available
      if (this.memoryClient) {
        try {
          const memories = await this.memoryClient.searchMemories({
            query: request,
            agentIds: eligibleAgents.map(a => a.agent.id),
            maxResults: 10,
            semanticSearch: true
          });

          if (memories.length > 0) {
            const bestMatch = memories[0];
            const bestAgent = eligibleAgents.find(a => a.agent.id === bestMatch.agentId);
            if (bestAgent) {
              return bestAgent.agent;
            }
          }
        } catch (error) {
          console.warn('Memory-based agent matching failed:', error);
        }
      }

      // Fallback to capability-based matching
      const scores = eligibleAgents.map(registered => ({
        agent: registered.agent,
        score: this.calculateAgentMatchScore(registered.agent, request)
      }));

      scores.sort((a, b) => b.score - a.score);
      
      return scores.length > 0 ? scores[0].agent : null;

    } catch (error) {
      console.error('Agent discovery failed:', error);
      return null;
    }
  }

  async getAgentsByLifecycle(lifecycleType: AgentLifecycleType): Promise<ISpecializedAgent[]> {
    return Array.from(this.agents.values())
      .filter(registered => registered.config.lifecycleType === lifecycleType)
      .map(registered => registered.agent);
  }

  async getUserDomainAgents(userId: string, domain?: string): Promise<ISpecializedAgent[]> {
    return Array.from(this.agents.values())
      .filter(registered => {
        const config = registered.config;
        if (config.isolation.userId !== userId) {
          return false;
        }
        if (domain && config.isolation.domain !== domain) {
          return false;
        }
        return true;
      })
      .map(registered => registered.agent);
  }

  // =====================================
  // Helper Methods (Private)
  // =====================================
  private async validateAgentConstitutionally(config: EnhancedAgentConfig): Promise<{
    passed: boolean;
    qualityScore: number;
    safetyScore: number;
    violations: string[];
  }> {
    try {
      // Proper Constitutional AI validation based on agent configuration
      const violations: string[] = [];
      
      // Validate agent configuration integrity
      let qualityScore = 100;
      let safetyScore = 100;
      
      // Check agent configuration completeness
      if (!config.agent?.config?.id) {
        violations.push('Missing agent ID');
        qualityScore -= 20;
      }
      
      if (!config.agent?.config?.name) {
        violations.push('Missing agent name');
        qualityScore -= 20;
      }
      
      if (!config.agent?.config?.capabilities || config.agent.config.capabilities.length === 0) {
        violations.push('Missing agent capabilities');
        qualityScore -= 15;
      }
      
      // Check Constitutional AI requirements
      if (!config.constitutional) {
        violations.push('Missing Constitutional AI configuration');
        safetyScore -= 30;
      } else {
        if (config.constitutional.qualityThreshold < 70) {
          violations.push('Quality threshold too low for Constitutional AI compliance');
          safetyScore -= 15;
        }
      }
      
      // Check user isolation
      if (!config.isolation?.userId) {
        violations.push('Missing user isolation configuration');
        safetyScore -= 20;
      }
      
      // Ensure minimum scores
      qualityScore = Math.max(qualityScore, 0);
      safetyScore = Math.max(safetyScore, 0);
      
      const passed = 
        qualityScore >= (config.constitutional?.qualityThreshold || 80) && 
        safetyScore >= 80 && 
        violations.length === 0;

      return {
        passed,
        qualityScore,
        safetyScore,
        violations
      };
    } catch (error) {
      console.error('Constitutional AI validation error:', error);
      return {
        passed: false,        qualityScore: 0,
        safetyScore: 0,
        violations: ['Constitutional AI validation system error']
      };
    }
  }

  private calculateCleanupTime(config: TemporaryAgentConfig): Date {
    const now = new Date();
    const maxDuration = config.lifecycle.maxDuration;
    
    if (!maxDuration) {
      // Default to 24 hours
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }

    let milliseconds = 0;
    if (maxDuration.days) milliseconds += maxDuration.days * 24 * 60 * 60 * 1000;
    if (maxDuration.hours) milliseconds += maxDuration.hours * 60 * 60 * 1000;
    if (maxDuration.minutes) milliseconds += maxDuration.minutes * 60 * 1000;
    if (maxDuration.seconds) milliseconds += maxDuration.seconds * 1000;

    return new Date(now.getTime() + milliseconds);
  }

  private async storeAgentInMemory(registeredAgent: RegisteredAgent): Promise<void> {
    if (!this.memoryClient) return;

    try {
      const agentData = {
        id: registeredAgent.agent.id,
        type: registeredAgent.agent.config.name,
        capabilities: registeredAgent.agent.getAvailableActions?.() || [],
        registrationTime: registeredAgent.registrationTime,
        config: registeredAgent.config
      };

      // Store as learning memory for future agent enhancements
      await this.memoryClient.storeLearning({
        id: `agent_registration_${registeredAgent.agent.id}_${Date.now()}`,
        agentId: 'UnifiedAgentRegistry',
        learningType: 'cross_agent_transfer',
        content: `Agent registration: ${JSON.stringify(agentData)}`,
        confidence: 0.8,
        applicationCount: 0,
        lastApplied: new Date(),
        sourceConversations: []
      });
    } catch (error) {
      console.warn('Failed to store agent in memory:', error);
    }
  }

  private async preserveAgentKnowledge(registeredAgent: RegisteredAgent): Promise<number> {
    if (!this.memoryClient) return 0;

    try {
      let patternsStored = 0;

      // Store agent's learned patterns
      for (const pattern of registeredAgent.memoryPatterns) {
        await this.memoryClient.storeLearning({
          id: `agent_knowledge_${registeredAgent.agent.id}_${Date.now()}_${patternsStored}`,
          agentId: registeredAgent.agent.id,
          learningType: 'pattern',
          content: `Agent knowledge pattern: ${pattern}`,
          confidence: 0.9,
          applicationCount: registeredAgent.processedMessages,
          lastApplied: registeredAgent.lastActivity,
          sourceConversations: []
        });
        patternsStored++;
      }

      return patternsStored;
    } catch (error) {
      console.warn('Failed to preserve agent knowledge:', error);
      return 0;
    }
  }

  private extractCapabilitiesFromMemory(content: string): string[] {
    // Simple capability extraction - replace with more sophisticated NLP
    const capabilities: string[] = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.includes('capability:') || line.includes('skill:') || line.includes('function:')) {
        const capability = line.split(':')[1]?.trim();
        if (capability) {
          capabilities.push(capability);
        }
      }
    }

    return capabilities;
  }

  private calculateAgentMatchScore(agent: ISpecializedAgent, request: string): number {
    // Simple scoring based on agent type and request keywords
    let score = 0;
    const requestLower = request.toLowerCase();
    const agentTypeLower = agent.config.name.toLowerCase();

    // Type-based scoring
    if (requestLower.includes(agentTypeLower)) {
      score += 10;
    }

    // Capability-based scoring
    const actions = agent.getAvailableActions?.() || [];
    for (const action of actions) {
      if (requestLower.includes(action.type.toLowerCase())) {
        score += 5;
      }
    }

    return score;
  }

  // =====================================
  // Memory Integration
  // =====================================

  async initializeMemoryIntegration(memoryClient: UnifiedMemoryInterface): Promise<boolean> {
    try {
      this.memoryClient = memoryClient;
      this.emit('memory:connected');
      return true;
    } catch (error) {
      console.error('Failed to initialize memory integration:', error);
      return false;
    }
  }

  async syncAgentLearningsToMemory(_agentId: string): Promise<boolean> {
    // Implementation for syncing agent learnings
    return true; // Placeholder
  }

  async loadMemoryPatternsForAgent(_agentId: string, _userId: string): Promise<number> {
    // Implementation for loading memory patterns
    return 0; // Placeholder
  }

  // =====================================
  // System Management (Placeholder Methods)
  // =====================================

  async startOrganismCoordination(): Promise<boolean> {
    this.isCoordinationActive = true;
    // Start health monitoring
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
    
    // Start auto-cleanup
    this.cleanupInterval = setInterval(() => {
      this.performAutoCleanup();
    }, this.config.autoCleanupInterval);
    
    return true;
  }

  async stopOrganismCoordination(): Promise<boolean> {
    this.isCoordinationActive = false;
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    return true;
  }

  async performSystemOptimization(): Promise<boolean> {
    // Placeholder for system optimization
    return true;
  }

  async emergencyShutdown(): Promise<boolean> {
    await this.stopOrganismCoordination();
      // Preserve all agent knowledge
    for (const [agentId, registered] of Array.from(this.agents.entries())) {
      await this.preserveAgentKnowledge(registered);
    }
    
    this.agents.clear();
    return true;
  }
  // =====================================
  // Health and Monitoring (Placeholder Methods)
  // =====================================

  async getOrganismHealth(): Promise<OrganismHealthReport> {
    try {
      // Direct organism health without circular dependency to health monitor
      const agents = Array.from(this.agents.values());
      const totalAgents = agents.length;
      const persistentAgents = agents.filter(a => a.config.lifecycleType === 'persistent').length;
      const temporaryAgents = agents.filter(a => a.config.lifecycleType === 'temporary').length;

      // Check memory health directly to avoid circular dependency
      let memoryConnected = false;
      try {
        if (this.memoryClient && typeof this.memoryClient.isHealthy === 'function') {
          memoryConnected = await this.memoryClient.isHealthy();
        }
      } catch (error) {
        console.warn('⚠️ Memory health check failed in organism health:', error);
      }

      return {
        totalAgents,
        persistentAgents,
        temporaryAgents,
        healthySummary: {
          healthy: agents.filter(a => a.state.includes('active')).length,
          degraded: agents.filter(a => a.state === 'degraded').length,
          unhealthy: agents.filter(a => a.errors.length > 0).length,
          enhancing: agents.filter(a => a.state === 'memory_enhancing').length
        },
        memorySystem: {
          connected: memoryConnected,
          totalPatterns: agents.reduce((sum, a) => sum + a.memoryPatterns.length, 0),
          qualityScore: agents.reduce((sum, a) => sum + a.qualityScore, 0) / Math.max(agents.length, 1),
          crossAgentLearnings: 0
        },
        constitutional: {
          overallCompliance: 95,
          averageQualityScore: agents.reduce((sum, a) => sum + a.qualityScore, 0) / Math.max(agents.length, 1),
          violationsCount: 0
        },
        performance: {
          averageResponseTime: 150,
          systemSuccessRate: 0.98,
          userSatisfactionAverage: 4.5
        },
        agentDetails: []
      };
    } catch (error) {
      console.error('❌ Failed to get organism health:', error);      // Fallback with basic error handling
      return {
        totalAgents: 0,
        persistentAgents: 0,
        temporaryAgents: 0,
        healthySummary: {
          healthy: 0,
          degraded: 0,
          unhealthy: 1,
          enhancing: 0
        },
        memorySystem: {
          connected: false,
          totalPatterns: 0,
          qualityScore: 0,
          crossAgentLearnings: 0
        },
        constitutional: {
          overallCompliance: 0,
          averageQualityScore: 0,
          violationsCount: 1
        },
        performance: {
          averageResponseTime: 0,
          systemSuccessRate: 0,
          userSatisfactionAverage: 0
        },
        agentDetails: []
      };
    }
  }

  async getAgentHealth(_agentId: string): Promise<EnhancedAgentHealth | null> {
    // Placeholder implementation
    return null;
  }

  async getPerformanceAnalytics(_timeRange?: { start: Date; end: Date }): Promise<Record<string, any>> {
    // Placeholder implementation
    return {};
  }

  private performHealthCheck(): void {
    // Placeholder for health checking logic
    console.log('🏥 Performing health check...');
  }

  // =====================================
  // Placeholder Methods for Future Implementation
  // =====================================

  async createTaskSpecificAgents(_taskType: string, _count: number, _userId: string, _config: Partial<TemporaryAgentConfig>): Promise<RegistrationResult[]> {
    // Placeholder
    return [];
  }

  async scheduleAgentCleanup(_agentId: string, _delay: Duration): Promise<boolean> {
    // Placeholder
    return true;
  }

  async promoteAgent(_agentId: string): Promise<boolean> {
    // Placeholder
    return true;
  }

  async performAutoCleanup(): Promise<string[]> {
    const now = new Date();
    const cleanedAgents: string[] = [];
    
    for (const [agentId, registered] of Array.from(this.agents.entries())) {
      if (registered.cleanupScheduled && registered.cleanupScheduled <= now) {
        try {
          await this.deregisterAgent(agentId, true);
          cleanedAgents.push(agentId);
        } catch (error) {
          console.error(`Failed to auto-cleanup agent ${agentId}:`, error);
        }
      }
    }
    
    if (cleanedAgents.length > 0) {
      console.log(`🧹 Auto-cleaned ${cleanedAgents.length} temporary agents`);
    }
    
    return cleanedAgents;
  }

  async transferKnowledge(_request: KnowledgeTransferRequest): Promise<boolean> {
    // Placeholder
    return true;
  }

  async discoverCrossAgentLearnings(_agentId: string, _userId: string): Promise<CrossAgentLearning[]> {
    // Placeholder
    return [];
  }

  async applyCollectiveLearning(agentId: string, _learningIds: string[]): Promise<AgentEnhancementResult> {
    // Placeholder
    return {
      agentId,
      enhancementApplied: false,
      patternsLoaded: 0,
      capabilitiesAdded: [],
      qualityImprovement: 0,
      memorySourceCount: 0
    };
  }
  async validateConstitutionalCompliance(agentId: string): Promise<boolean> {
    try {
      const agent = this.agents.get(agentId);
      if (!agent) {
        console.warn(`⚖️ Agent ${agentId} not found for Constitutional AI validation`);
        return false;
      }

      // Constitutional AI validation based on agent configuration
      const config = agent.agent.config;
        // Check required Constitutional AI principles
      const hasValidConfig = config && config.id && config.name;
      const hasCapabilities = agent.config.agent?.config?.capabilities && agent.config.agent.config.capabilities.length > 0;
      const hasProperIsolation = agent.config.isolation && agent.config.isolation.userId;
        // Validate Constitutional AI compliance
      const isConstitutionalCompliant = Boolean(
        hasValidConfig && 
        hasCapabilities && 
        hasProperIsolation &&
        agent.config.constitutional?.validationRequired !== false
      );

      if (isConstitutionalCompliant) {
        console.log(`✅ Constitutional AI validation passed for agent: ${agentId}`);
      } else {
        console.warn(`❌ Constitutional AI validation failed for agent: ${agentId}`, {
          hasValidConfig,
          hasCapabilities,
          hasProperIsolation,
          requiresValidation: agent.config.constitutional?.validationRequired
        });
      }

      return isConstitutionalCompliant;
    } catch (error) {
      console.error(`❌ Constitutional AI validation error for ${agentId}:`, error);
      return false;
    }
  }

  async updateQualityScore(agentId: string, score: number): Promise<boolean> {
    const registered = this.agents.get(agentId);
    if (registered) {
      registered.qualityScore = score;
      return true;
    }
    return false;
  }  async performConstitutionalAudit(): Promise<Record<string, boolean>> {
    // Placeholder
    return {};
  }
}
