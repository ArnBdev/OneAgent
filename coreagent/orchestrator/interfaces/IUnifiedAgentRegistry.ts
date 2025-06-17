/**
 * IUnifiedAgentRegistry - Enhanced Memory-First Agent Registry Interface
 * 
 * OURA v3.0 Enhanced Interface supporting:
 * - Memory-first agent lifecycle with ChromaDB integration
 * - Persistent vs Temporary agent classification
 * - Constitutional AI validation for all registrations
 * - User isolation and domain separation
 * - Cross-agent learning and knowledge transfer
 * 
 * @version 3.0.0 - Memory-First Organism Architecture
 * @date June 17, 2025
 */

import { ISpecializedAgent } from '../../agents/base/ISpecializedAgent';
import { AgentType } from '../../agents/base/AgentFactory';
import { UnifiedMemoryInterface } from '../../memory/UnifiedMemoryInterface';

// =====================================
// Core Agent Lifecycle Types
// =====================================

export type AgentLifecycleType = 'persistent' | 'temporary' | 'task_specific';

export type AgentState = 
  | 'registering'           // Initial registration in progress
  | 'active_persistent'     // Core daily-use agent
  | 'active_temporary'      // Task-specific agent with TTL
  | 'memory_enhancing'      // Loading knowledge from memory
  | 'degraded'             // Quality below threshold
  | 'cleanup_scheduled'     // Marked for removal
  | 'deregistered';        // Removed from system

// =====================================
// Enhanced Configuration Types
// =====================================

export interface EnhancedAgentConfig {
  // Core agent information
  agent: ISpecializedAgent;
  lifecycleType: AgentLifecycleType;
  
  // Memory integration
  memoryConfig: {
    enableMemoryInheritance: boolean;
    inheritancePattern?: string;
    domainContexts: string[];
    userIsolation: boolean;
  };
  
  // Lifecycle management
  lifecycle: {
    maxDuration?: Duration;
    autoCleanup: boolean;
    knowledgePreservation: boolean;
    promotionEligible?: boolean;
  };
  
  // Constitutional AI compliance
  constitutional: {
    qualityThreshold: number;
    safetyLevel: 'strict' | 'balanced' | 'permissive';
    validationRequired: boolean;
  };
  
  // User and domain isolation
  isolation: {
    userId: string;
    domain: string;
    privacyLevel: 'public' | 'internal' | 'confidential' | 'restricted';
    crossDomainLearning: boolean;
  };
  
  // Optional metadata
  metadata?: Record<string, any>;
}

export interface TemporaryAgentConfig extends EnhancedAgentConfig {
  // Task-specific configuration
  taskSpecific: {
    taskType: string;
    estimatedDuration: Duration;
    requiredCapabilities: string[];
    parentTaskId?: string;
  };
  
  // Auto-cleanup configuration
  cleanup: {
    triggerConditions: ('task_completion' | 'timeout' | 'quality_degradation')[];
    preserveKnowledge: boolean;
    transferLearnings: boolean;
  };
}

// =====================================
// Memory-First Registry Results
// =====================================

export interface RegistrationResult {
  success: boolean;
  agentId: string;
  registrationTimestamp: Date;
  memoryEnhancementApplied: boolean;
  constitutionalValidation: {
    passed: boolean;
    qualityScore: number;
    safetyScore: number;
    violations: string[];
  };
  inheritedCapabilities: string[];
  error?: string;
}

export interface AgentEnhancementResult {
  agentId: string;
  enhancementApplied: boolean;
  patternsLoaded: number;
  capabilitiesAdded: string[];
  qualityImprovement: number;
  memorySourceCount: number;
}

export interface DeregistrationResult {
  success: boolean;
  agentId: string;
  knowledgePreserved: boolean;
  learningPatternsStored: number;
  error?: string;
}

// =====================================
// Cross-Agent Learning Types
// =====================================

export interface KnowledgeTransferRequest {
  sourceAgentId?: string;
  targetAgentId: string;
  userId: string;
  domain?: string;
  learningPattern: string;
  transferType: 'capability' | 'pattern' | 'experience' | 'optimization';
}

export interface CrossAgentLearning {
  id: string;
  sourceContext: string;
  targetAgentId: string;
  learningType: string;
  confidence: number;
  expectedImpact: string;
  memoryPatternId: string;
}

// =====================================
// Enhanced Health and Analytics
// =====================================

export interface EnhancedAgentHealth {
  agentId: string;
  agentType: string;
  lifecycleType: AgentLifecycleType;
  state: AgentState;
  isHealthy: boolean;
  
  // Memory integration health
  memoryIntegration: {
    connected: boolean;
    patternsLoaded: number;
    lastMemorySync: Date;
    memoryQualityScore: number;
  };
  
  // Constitutional AI health
  constitutional: {
    compliant: boolean;
    qualityScore: number;
    safetyScore: number;
    lastValidation: Date;
  };
  
  // Performance metrics
  performance: {
    lastActivity: Date;
    processedMessages: number;
    averageResponseTime: number;
    successRate: number;
    userSatisfactionScore: number;
  };
  
  // Lifecycle information
  lifecycle: {
    registrationTime: Date;
    estimatedEndTime?: Date;
    timeToLive?: number;
    promotionEligible: boolean;
  };
  
  errors: string[];
}

export interface OrganismHealthReport {
  totalAgents: number;
  persistentAgents: number;
  temporaryAgents: number;
  
  healthySummary: {
    healthy: number;
    degraded: number;
    unhealthy: number;
    enhancing: number;
  };
  
  memorySystem: {
    connected: boolean;
    totalPatterns: number;
    qualityScore: number;
    crossAgentLearnings: number;
  };
  
  constitutional: {
    overallCompliance: number;
    averageQualityScore: number;
    violationsCount: number;
  };
  
  performance: {
    averageResponseTime: number;
    systemSuccessRate: number;
    userSatisfactionAverage: number;
  };
  
  agentDetails: EnhancedAgentHealth[];
}

// =====================================
// Main Enhanced Registry Interface
// =====================================

export interface IUnifiedAgentRegistry {
  // =====================================
  // Core Registration Operations
  // =====================================
  
  /**
   * Register a persistent agent with memory enhancement
   */
  registerPersistentAgent(config: EnhancedAgentConfig): Promise<RegistrationResult>;
  
  /**
   * Register a temporary agent with auto-cleanup
   */
  registerTemporaryAgent(config: TemporaryAgentConfig): Promise<RegistrationResult>;
  
  /**
   * Deregister agent with knowledge preservation
   */
  deregisterAgent(agentId: string, preserveKnowledge: boolean): Promise<DeregistrationResult>;
  
  /**
   * Enhance agent with memory patterns
   */
  enhanceAgentFromMemory(agentId: string, userId: string): Promise<AgentEnhancementResult>;

  // =====================================
  // Agent Discovery and Management
  // =====================================
    /**
   * Get agent by ID with enhanced information
   */
  getAgent(agentId: string): Promise<ISpecializedAgent | null>;
    /**
   * Get all registered agents
   */
  getAllAgents(): Promise<ISpecializedAgent[]>;
  
  /**
   * Get agent count for statistics
   */
  getAgentCount(): number;
  
  /**
   * Simple agent registration (convenience method)
   */
  registerAgent(agent: ISpecializedAgent, userId?: string): Promise<RegistrationResult>;
  
  /**
   * Find best agent with memory-driven recommendations
   */
  findBestAgent(request: string, userId: string, domain?: string): Promise<ISpecializedAgent | null>;
  
  /**
   * Get agents by lifecycle type
   */
  getAgentsByLifecycle(lifecycleType: AgentLifecycleType): Promise<ISpecializedAgent[]>;
  
  /**
   * Get agents by user and domain
   */
  getUserDomainAgents(userId: string, domain?: string): Promise<ISpecializedAgent[]>;

  // =====================================
  // Temporary Agent Management
  // =====================================
  
  /**
   * Create multiple task-specific agents
   */
  createTaskSpecificAgents(
    taskType: string, 
    count: number, 
    userId: string, 
    config: Partial<TemporaryAgentConfig>
  ): Promise<RegistrationResult[]>;
  
  /**
   * Schedule agent cleanup with memory preservation
   */
  scheduleAgentCleanup(agentId: string, delay: Duration): Promise<boolean>;
  
  /**
   * Promote temporary agent to persistent
   */
  promoteAgent(agentId: string): Promise<boolean>;
  
  /**
   * Auto-cleanup completed temporary agents
   */
  performAutoCleanup(): Promise<string[]>;

  // =====================================
  // Cross-Agent Learning Operations
  // =====================================
  
  /**
   * Transfer learning between agents
   */
  transferKnowledge(request: KnowledgeTransferRequest): Promise<boolean>;
  
  /**
   * Discover relevant cross-agent learnings
   */
  discoverCrossAgentLearnings(agentId: string, userId: string): Promise<CrossAgentLearning[]>;
  
  /**
   * Apply collective learning to agent
   */
  applyCollectiveLearning(agentId: string, learningIds: string[]): Promise<AgentEnhancementResult>;

  // =====================================
  // Constitutional AI Operations
  // =====================================
  
  /**
   * Validate agent constitutional compliance
   */
  validateConstitutionalCompliance(agentId: string): Promise<boolean>;
  
  /**
   * Update agent quality score
   */
  updateQualityScore(agentId: string, score: number): Promise<boolean>;
  
  /**
   * Perform constitutional audit on all agents
   */
  performConstitutionalAudit(): Promise<Record<string, boolean>>;

  // =====================================
  // Health and Analytics
  // =====================================
  
  /**
   * Get comprehensive organism health
   */
  getOrganismHealth(): Promise<OrganismHealthReport>;
  
  /**
   * Get agent health with memory integration
   */
  getAgentHealth(agentId: string): Promise<EnhancedAgentHealth | null>;
  
  /**
   * Get system performance analytics
   */
  getPerformanceAnalytics(timeRange?: { start: Date; end: Date }): Promise<Record<string, any>>;

  // =====================================
  // Memory Integration
  // =====================================
  
  /**
   * Initialize memory connection
   */
  initializeMemoryIntegration(memoryClient: UnifiedMemoryInterface): Promise<boolean>;
  
  /**
   * Sync agent learnings to memory
   */
  syncAgentLearningsToMemory(agentId: string): Promise<boolean>;
  
  /**
   * Load memory patterns for agent
   */
  loadMemoryPatternsForAgent(agentId: string, userId: string): Promise<number>;

  // =====================================
  // System Management
  // =====================================
  
  /**
   * Start organism coordination
   */
  startOrganismCoordination(): Promise<boolean>;
  
  /**
   * Stop organism coordination
   */
  stopOrganismCoordination(): Promise<boolean>;
  
  /**
   * Perform system cleanup and optimization
   */
  performSystemOptimization(): Promise<boolean>;
  
  /**
   * Emergency shutdown with knowledge preservation
   */
  emergencyShutdown(): Promise<boolean>;
}

// =====================================
// Utility Types
// =====================================

export interface Duration {
  seconds?: number;
  minutes?: number;
  hours?: number;
  days?: number;
}

export interface AgentFilter {
  lifecycleType?: AgentLifecycleType;
  state?: AgentState;
  userId?: string;
  domain?: string;
  qualityThreshold?: number;
}

// =====================================
// Configuration and Constants
// =====================================

export const DEFAULT_REGISTRY_CONFIG = {
  maxPersistentAgents: 10,
  maxTemporaryAgents: 100,
  healthCheckInterval: 30000, // 30 seconds
  autoCleanupInterval: 300000, // 5 minutes
  memoryIntegrationEnabled: true,
  constitutionalValidationRequired: true,
  defaultQualityThreshold: 85,
  defaultSafetyLevel: 'balanced' as const,
  crossAgentLearningEnabled: true,
  userIsolationStrict: true
};
