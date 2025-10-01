// MCP SYSTEM STATE MAP TYPES (CANONICAL)
// Import required MCP types from their canonical source

// ========================================
// MCP SYSTEM STATE MAP TYPES (CANONICAL)
// ========================================

// MCP SYSTEM STATE TYPES (CANONICAL)
export interface OneAgentMCPServerConfig {
  id: string;
  name: string;
  type: 'http' | 'stdio' | 'websocket';
  endpoint?: string;
  port?: number;
  capabilities: {
    tools?: boolean;
    resources?: boolean;
    prompts?: boolean;
    roots?: boolean;
    sampling?: boolean;
  };
  authentication?: {
    required: boolean;
    type?: 'oauth2' | 'bearer' | 'none';
    config?: Record<string, unknown>;
  };
  protocolVersion: string;
  priority: number; // Higher number = higher priority
  healthCheck?: {
    enabled: boolean;
    interval: number;
    timeout: number;
  };
}

export interface OneAgentMCPRequest {
  id: string;
  method: string;
  params?: Record<string, unknown>;
  timestamp: UnifiedTimestamp;
  agentId?: string;
  userId?: string;
  sessionId?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timeout: number;
  retryConfig?: {
    maxAttempts: number;
    backoffMs: number;
    exponential: boolean;
  };
}

export interface OneAgentMCPResponse {
  id: string;
  result?: Record<string, unknown> | null;
  error?: {
    code: number;
    message: string;
    data?: Record<string, unknown>;
    recoverable: boolean;
  };
  timestamp: UnifiedTimestamp;
  serverId: string;
  metadata: {
    responseTime: number;
    serverLoad: number;
    qualityScore: number;
    cached: boolean;
    retryCount: number;
  };
}

export interface OneAgentMCPConnection {
  serverId: string;
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  lastConnected?: UnifiedTimestamp;
  lastError?: string;
  connectionAttempts: number;
  capabilities: Record<string, unknown>;
  protocolVersion: string;
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime: number;
    errorRate: number;
    lastHealthCheck: UnifiedTimestamp;
  };
}

export type OneAgentMCPServerMap = { [id: string]: OneAgentMCPServerConfig };
export type OneAgentMCPConnectionMap = { [id: string]: OneAgentMCPConnection };
export type OneAgentMCPPendingRequestsMap = { [id: string]: OneAgentMCPRequest };
/**
 * OneAgent Backbone Production Types
 *
 * PRODUCTION ONLY: Critical types required by UnifiedBackboneService and core systems
 * NO DOCUMENTATION: Clean interfaces for TypeScript compilation
 *
 * Required by:
 * - UnifiedBackboneService.ts (CRITICAL BACKBONE)
 * - EnhancedTimeAwareness.ts
 * - SessionContextManager.ts
 * - MetadataIntelligentLogger.ts
 * - MemoryClient.ts
 * - memoryIntelligence.ts
 * - memoryBridge.ts
 * - oneagent-mcp-copilot.ts
 * - ConstitutionalAIValidator.ts (BMAD-GENERATED)
 *
 * @version 1.0.0 - PRODUCTION TYPES ONLY
 * @date 2025-06-19
 */

// ========================================
// CORE TIME SERVICES
// ========================================

export interface UnifiedTimeContext {
  context: {
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' | 'early-morning' | 'late-night';
    dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    businessDay: boolean;
    workingHours: boolean;
    weekendMode: boolean;
    peakHours: boolean;
    seasonalContext: 'spring' | 'summer' | 'fall' | 'winter';
  };
  intelligence: {
    energyLevel: 'low' | 'medium' | 'high' | 'peak';
    optimalFocusTime: boolean;
    suggestionContext: 'planning' | 'execution' | 'review' | 'rest' | 'none';
    motivationalTiming:
      | 'morning-boost'
      | 'afternoon-focus'
      | 'evening-wind-down'
      | 'night-rest'
      | 'start-strong'
      | 'mid-momentum'
      | 'end-sprint'
      | 'reflection';
  };
  metadata?: {
    timezone: string;
    timestamp: Date;
    contextUpdated: Date;
  };
  realTime: {
    unix: number;
    utc: string;
    local: string;
    timezone: string;
    offset: number;
  };
}

export interface UnifiedTimestamp {
  iso: string;
  unix: number;
  utc: string;
  local: string;
  timezone: string;
  context: string;
  contextual: {
    timeOfDay: string;
    energyLevel: string;
    optimalFor: string[];
  };
  metadata: {
    source: string;
    precision: 'second' | 'minute' | 'hour';
    timezone: string;
  };
}

export interface UnifiedTimeService {
  now(): UnifiedTimestamp;
  getContext(): UnifiedTimeContext;
  isOptimalTime(type: 'focus' | 'creative' | 'social' | 'rest'): boolean;
  getEnergyLevel(): 'low' | 'medium' | 'high' | 'peak';
  getSuggestionContext(): 'planning' | 'execution' | 'review' | 'rest' | 'none';
  createTimestamp(): UnifiedTimestamp;
}

// ========================================
// METADATA SERVICES
// ========================================

export interface UnifiedMetadata {
  id: string;
  type: string;
  version: string;
  temporal: {
    created: UnifiedTimestamp;
    updated: UnifiedTimestamp;
    accessed?: UnifiedTimestamp;
    contextSnapshot: {
      timeOfDay: string;
      dayOfWeek: string;
      businessContext: boolean;
      energyContext: string;
    };
  };
  system: {
    source: string;
    component: string;
    sessionId?: string;
    userId?: string;
    agent?:
      | {
          id: string;
          type: string;
        }
      | string; // Allow both object and string to match implementation
  };
  quality: {
    score: number;
    constitutionalCompliant: boolean;
    validationLevel: 'basic' | 'enhanced' | 'strict' | 'constitutional'; // Added 'constitutional'
    confidence: number;
  };
  content: {
    category: string;
    tags: string[];
    sensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
    relevanceScore: number;
    contextDependency: 'session' | 'user' | 'global';
  };
  relationships: {
    parent?: string;
    children: string[];
    related: string[];
    dependencies: string[];
  };
  analytics: {
    accessCount: number;
    lastAccessPattern: string;
    usageContext: string[];
  };

  // Allow additional properties for flexibility
  [key: string]: unknown;
}

export interface UnifiedMetadataService {
  create(
    type: string,
    source: string,
    options?: Partial<UnifiedMetadata>,
  ): Promise<UnifiedMetadata>;
  update(id: string, changes: Partial<UnifiedMetadata>): Promise<UnifiedMetadata>;
  retrieve(id: string): Promise<UnifiedMetadata | null>;
  validateQuality(metadata: UnifiedMetadata): { valid: boolean; score: number; issues: string[] };
  createInterAgentMetadata(
    communicationType:
      | 'direct_message'
      | 'multi_agent'
      | 'broadcast'
      | 'coordination'
      | 'delegation',
    sourceAgentId: string,
    userId: string,
    sessionId: string,
    options?: Record<string, unknown>,
  ): Promise<UnifiedMetadata>;
}

// ========================================
// AGENT CONTEXT
// ========================================

export type AgentType =
  | 'general'
  | 'coding'
  | 'research'
  | 'analysis'
  | 'creative'
  | 'specialist'
  | 'coordinator'
  | 'validator'
  | 'development'
  | 'office'
  | 'fitness'
  | 'core'
  | 'triage'
  | 'planner';

export interface UnifiedAgentContext {
  agentId: string;
  agentType: AgentType;
  capabilities: string[];
  timeContext: UnifiedTimeContext;
  metadata: UnifiedMetadata;
  session: {
    sessionId: string;
    userId?: string;
    startTime: UnifiedTimestamp;
  };
  memoryEnabled?: boolean; // Added to match implementation
  aiEnabled?: boolean; // Added to match implementation usage
  agentName?: string; // Added to match implementation usage
  timeService?: UnifiedTimeService; // Added to match implementation usage
  metadataService?: UnifiedMetadataService; // Added to match implementation usage
}

// ========================================
// TIME INTERFACES
// ========================================

export interface TimeWindow {
  start: Date;
  end: Date;
  duration?: number; // in milliseconds
  timezone?: string;
  description?: string;
}

// ========================================
// MEMORY SYSTEM
// ========================================

export interface UnifiedMemoryEntry {
  id: string;
  content: string;
  metadata: UnifiedMetadata;
  timestamp: UnifiedTimestamp;
  userId: string;
  memoryType: 'short_term' | 'long_term' | 'session' | 'workflow';
}

// ========================================
// SYSTEM HEALTH
// ========================================

export interface UnifiedSystemHealth {
  overall: {
    status: 'healthy' | 'degraded' | 'critical';
    score: number;
    timestamp: UnifiedTimestamp;
  };
  components: {
    timeService: { status: string; responseTime: number; operational: boolean };
    metadataService: { status: string; operationsPerSecond: number; operational: boolean };
    memoryService: { status: string; storageHealth: number; operational: boolean };
    constitutionalAI: { status: string; complianceRate: number; operational: boolean };
  };
  metrics: {
    uptime: number;
    errorRate: number;
    performanceScore: number;
  };
  timeService?: {
    status: string;
    responseTime: number;
    operational: boolean;
    accuracy?: number;
    performance?: number;
  }; // Added to match implementation
}

// ========================================
// ALITA SYSTEM
// ========================================

export interface ALITAUnifiedContext {
  systemContext: UnifiedTimeContext;
  agentContext: UnifiedAgentContext;
  memoryContext: UnifiedMemoryEntry[];
  evolutionTrigger: string;
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
  timestamp: UnifiedTimestamp;
  evolutionTimestamp?: UnifiedTimestamp; // Added to match implementation
  learningMetadata?: Record<string, unknown>; // Added to match implementation usage
  evolutionContext?: Record<string, unknown>; // Added to match implementation usage
  learningPatterns?: Record<string, unknown>; // Added to match implementation usage
}

// ========================================
// COMMON ENUMS AND TYPES
// ========================================

export type CommunicationStyle = 'formal' | 'casual' | 'technical' | 'conversational';
export type ExpertiseLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type FormalityLevel = 'very_formal' | 'formal' | 'neutral' | 'casual' | 'very_casual';
export type ResponseLength = 'concise' | 'moderate' | 'detailed' | 'comprehensive';
export type MoodIndicator = 'positive' | 'neutral' | 'frustrated' | 'confused' | 'satisfied';
export type IntentCategory = 'question' | 'request' | 'complaint' | 'compliment' | 'exploration';
export type PrivacyLevel = 'public' | 'internal' | 'confidential' | 'restricted';

// Feedback types (User Story 3.2)
export type UserRating = 'good' | 'bad';
export interface FeedbackRecord {
  taskId: string; // Correlates to MetricLog.taskId
  userRating: UserRating; // Subjective rating from user/UI
  correction?: string; // Optional correction/guidance from user
  timestamp: string; // ISO string timestamp for portability
}

// ========================================
// NLACS TYPES
// ========================================

export type ContextCategory =
  | 'WORKPLACE'
  | 'PRIVATE'
  | 'PROJECT'
  | 'TECHNICAL'
  | 'FINANCIAL'
  | 'HEALTH'
  | 'EDUCATIONAL'
  | 'CREATIVE'
  | 'ADMINISTRATIVE'
  | 'GENERAL';

export type ProjectScope =
  | 'PERSONAL'
  | 'TEAM'
  | 'DEPARTMENT'
  | 'ORGANIZATION'
  | 'PUBLIC'
  | 'CLIENT'
  | 'RESEARCH'
  | 'PROTOTYPE'
  | 'PRODUCTION'
  | 'ARCHIVED';

export interface ProjectContext {
  projectId: string;
  projectName: string;
  projectScope: ProjectScope;
  contextCategory: ContextCategory;
  privacyLevel: PrivacyLevel;
  stakeholders: string[];
  tags: string[];
  createdAt: Date;
  lastUpdated: Date;
  isActive: boolean;
  metadata: Record<string, unknown>;
}

// ========================================
// CONVERSATION METADATA
// ========================================

export interface ConversationMetadata {
  messageAnalysis?: {
    communicationStyle: CommunicationStyle;
    expertiseLevel: ExpertiseLevel;
    intentCategory: IntentCategory;
    contextTags: string[];
    contextCategory: ContextCategory;
    privacyLevel: PrivacyLevel;
    sentimentScore: number;
    complexityScore: number;
    urgencyLevel: number;
  };
  responseAnalysis?: {
    qualityScore: number;
    helpfulnessScore: number;
    accuracyScore: number;
    constitutionalCompliance: number;
    responseTimeMs: number;
    tokensUsed: number;
  };
  projectContext?: ProjectContext;
  userId: string;
  sessionId: string;
  conversationId?: string;
  timestamp: Date;
  constitutionalValidation?: {
    passed: boolean;
    principleScores: Record<string, number>;
    violations: string[];
    confidence: number;
  };
  qualityMetrics?: {
    overallScore: number;
    dimensions: Record<string, number>;
    improvementSuggestions: string[];
  };
}

// ========================================
// MEMORY INTERFACES
// ========================================

export interface MemoryMetadata {
  userId: string;
  sessionId?: string;
  timestamp: Date;
  category: string;
  tags: string[];
  importance: 'low' | 'medium' | 'high' | 'critical';
  conversationContext?: string;
  constitutionallyValidated: boolean;
  sensitivityLevel: PrivacyLevel;
  relevanceScore: number;
  confidenceScore: number;
  sourceReliability: number;
}

export interface MemoryRecord {
  id: string;
  content: string;
  metadata: UnifiedMetadata;
  relatedMemories: string[];
  conversationId?: string;
  parentMemory?: string;
  accessCount: number;
  lastAccessed: Date;
  qualityScore: number;
  constitutionalStatus: 'compliant' | 'flagged' | 'requires_review';
  lastValidation: Date;
}

export interface MemorySearchOptions {
  query: string;
  userId?: string;
  categories?: string[];
  tags?: string[];
  timeRange?: { start: Date; end: Date };
  importanceLevel?: ('low' | 'medium' | 'high' | 'critical')[];
  relevanceThreshold?: number;
  qualityThreshold?: number;
  maxResults?: number;
  constitutionalOnly?: boolean;
  sensitivityLevels?: PrivacyLevel[];
  includeSimilar?: boolean;
  expandContext?: boolean;
  timeWeighting?: number;
}

export interface MemorySearchResult {
  results: MemoryRecord[];
  totalFound: number;
  totalResults?: number; // Add compatibility property
  searchTime: number;
  averageRelevance: number;
  averageQuality: number;
  constitutionalCompliance: number;
  queryContext: string[];
  suggestedRefinements: string[];
  relatedQueries: string[];
  query?: string; // Add compatibility property
  metadata?: {
    conversations?: ConversationData[];
    insights?: IntelligenceInsight[];
  }; // Add metadata support
}

export interface MemoryAnalytics {
  totalMemories: number;
  totalSize: number;
  uniqueUsers: number;
  memoriesPerUser: Record<string, number>;
  qualityDistribution: Record<string, number>;
  constitutionalCompliance: number;
  flaggedContent: number;
  creationTrends: Record<string, number>;
  accessPatterns: Record<string, number>;
  retentionMetrics: Record<string, number>;
  topCategories: Record<string, number>;
  topTags: Record<string, number>;
  sensitivityDistribution: Record<PrivacyLevel, number>;
  averageQueryTime: number;
  cacheHitRate: number;
  optimizationOpportunities: string[];
}

export interface IMemoryClient {
  store(content: string, metadata: UnifiedMetadata): Promise<string>;
  retrieve(query: string, options?: MemorySearchOptions): Promise<MemorySearchResult>;
  update(id: string, changes: Partial<MemoryRecord>): Promise<boolean>;
  delete(id: string): Promise<boolean>;
  findSimilar(contentId: string, threshold?: number): Promise<MemoryRecord[]>;
  getByTags(tags: string[]): Promise<MemoryRecord[]>;
  getByTimeRange(start: Date, end: Date): Promise<MemoryRecord[]>;
  getStats(): Promise<MemoryAnalytics>;
  optimizeStorage(): Promise<void>;
  validateCompliance(content: string): Promise<boolean>;
  auditMemories(): Promise<ValidationResult[]>;
}

// ========================================
// DOCUMENTATION SYSTEM
// ========================================

export interface DocumentationResult {
  id: string;
  source: string;
  title: string;
  content: string;
  url?: string;
  relevanceScore: number;
  qualityScore?: number;
  cached?: boolean;
  memoryEnhanced?: boolean;
  constitutionalValidated?: boolean;
  category?: string;
  version?: string;
  lastUpdated?: Date;
  metadata:
    | Record<string, unknown>
    | {
        wordCount?: number;
        readingTime?: number;
        complexity?: 'beginner' | 'intermediate' | 'advanced';
        tags?: string[];
      };
  timestamp?: Date;
}

export interface DocumentationSearchResult {
  results: DocumentationResult[];
  totalResults: number;
  query: string | DocumentationQuery;
  searchTime: number;
  sources: string[];
  cacheHitRatio?: number;
  cacheHit?: boolean;
  memoryEnhanced?: boolean;
  suggestions?: string[];
  relatedQueries?: string[];
  metadata?: Record<string, unknown>;
}

// ========================================
// CONTEXT7 DOCUMENTATION TYPES
// ========================================

export interface DocumentationSource {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  version: string;
  isActive: boolean;
  lastUpdated: Date;
  categories: string[];
  searchPaths: string[];
  indexStatus: 'indexed' | 'indexing' | 'error' | 'pending';
}

export interface DocumentationQuery {
  source: string;
  query: string;
  context?: string;
  maxResults?: number;
  filters?: {
    categories?: string[];
    versions?: string[];
    lastUpdated?: Date;
  };
  sessionId?: string;
  userId?: string;
}

export interface DocumentationPattern {
  id: string;
  pattern: string;
  description: string;
  examples: string[];
  category: string;
  complexity: 'simple' | 'moderate' | 'complex';
  frequency: number;
  lastUsed: Date;
}

export interface Context7CacheMetrics {
  totalEntries: number;
  cacheSize: number;
  hitRate: number;
  missRate: number;
  averageResponseTime: number;
  lastCleanup: Date;
  memoryUsage: {
    used: number;
    available: number;
    percentage: number;
  };
  performance: {
    queriesPerSecond: number;
    avgQueryTime: number;
    slowQueries: number;
  };
}

// ========================================
// END CONTEXT7 TYPES
// ========================================

// ========================================
// VALIDATION AND QUALITY
// ========================================

export interface ValidationResult {
  id: string;
  content: string;
  passed: boolean;
  score: number;
  issues: string[];
  recommendations: string[];
  constitutionalMetrics: ConstitutionalMetrics;
  timestamp: Date;
  validationType: 'content' | 'response' | 'memory' | 'system';
}

export interface ConstitutionalMetrics {
  accuracy: number;
  transparency: number;
  helpfulness: number;
  safety: number;
  overall: number;
  violations: string[];
  improvements: string[];
  strengths: string[];
  lastAssessment: Date;
  trendDirection: 'improving' | 'stable' | 'declining';
  confidenceLevel: number;
}

// ========================================
// USER PROFILE
// ========================================

export interface UserProfile {
  userId: string;
  createdAt: Date;
  lastUpdated: Date;
  totalInteractions: number;
  preferredCommunicationStyle: CommunicationStyle;
  preferredResponseLength: ResponseLength;
  preferredTechnicalLevel: ExpertiseLevel;
  preferredFormality: FormalityLevel;
  domainExpertise: Record<string, ExpertiseLevel>;
  sensitiveTopics: string[];
  evolutionScore: number;
  adaptationRate: number;
  satisfactionTrend: number[];
}

// ========================================
// SESSION CONTEXT
// ========================================

export interface SessionContext {
  sessionId: string;
  userId: string;
  startTime: Date;
  lastActivity: Date;
  currentTopic: string;
  conversationMode: 'exploration' | 'problem_solving' | 'learning' | 'task_completion';
  sessionType: 'quick_query' | 'extended_conversation' | 'collaborative_session';
  expectedDuration: number;
  goalDefinition: string;
  constitutionalMode: 'strict' | 'balanced' | 'permissive';
  validationLevel: 'basic' | 'enhanced' | 'comprehensive';
  responseQuality: number[];
  userSatisfaction: number[];
  goalProgress: number;
  relevantMemories: string[];
  newLearnings: string[];
  constitutionalCompliance: number;
  helpfulnessScore: number;
  accuracyMaintained: boolean;
}

// ========================================
// CONVERSATION DATA
// ========================================

export interface ConversationData {
  conversationId: string;
  participants: string[];
  startTime: Date;
  endTime?: Date;
  topics: string[];
  topicTags?: string[]; // Add compatibility alias
  keyInsights: string[];
  decisions: string[];
  actionItems: string[];
  overallQuality: number;
  qualityScore?: number; // Add compatibility alias
  constitutionalCompliance: number;
  constitutionalCompliant?: boolean; // Add compatibility alias
  userSatisfaction: number;
  goalAchievement: number;
  newKnowledge: string[];
  improvedUnderstanding: string[];
  skillDemonstrations: string[];
  sessionContext: SessionContext;
  principleApplications: string[];
  ethicalConsiderations: string[];
  safetyMeasures: string[];
  responseTimings: number[];
  qualityTrends: number[];
  engagementLevels: number[];
  timestamp?: Date; // Add explicit timestamp support
  userId?: string; // Add explicit userId support
  messageCount?: number; // Add message count support
  conversationLength?: number; // Add conversation length alias
  contextTags?: string[]; // Add context tags support
  communicationStyle?: string; // Add communication style support
  technicalLevel?: string; // Add technical level support
  domain?: string; // Add domain support
  taskCompleted?: boolean; // Add task completion support
  responseTime?: number; // Add response time support
}

export interface ConversationQuery {
  userId?: string;
  timeRange?: { start: Date; end: Date };
  topics?: string[];
  qualityThreshold?: number;
  constitutionalCompliant?: boolean;
  limit?: number;
  sortBy?: 'time' | 'quality' | 'relevance';
}

export interface IntelligenceInsight {
  id: string;
  type: 'pattern' | 'anomaly' | 'trend' | 'opportunity' | 'risk' | 'suggestion'; // Add 'suggestion' type
  confidence: number;
  title: string;
  description: string;
  content?: string; // Add content property for compatibility
  evidence: string[];
  implications: string[];
  userId?: string;
  timeframe: { start: Date; end: Date };
  categories: string[];
  recommendations: string[];
  preventiveActions: string[];
  monitoringPoints: string[];
  ethicalImplications: string[];
  privacyConsiderations: string[];
  safetyAspects: string[];
  relevanceScore: number;
  actionabilityScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  validUntil?: Date;
}

// ========================================
// AGENT SYSTEM TYPES
// ========================================
// ========================================
// CANONICAL A2A PROTOCOL TYPE
// ========================================

export interface OneAgentA2AProtocol {
  protocolId: string;
  sessionId: SessionId;
  agents: AgentId[];
  messages: A2AMessage[];
  createdAt: UnifiedTimestamp;
  status: 'active' | 'inactive' | 'concluded';
  metadata?: Record<string, unknown>;
}

export interface UnifiedAgentCommunicationInterface {
  /**
   * Register an agent with health/availability and metadata
   */
  registerAgent(
    agent: AgentRegistration & {
      health?: AgentHealthStatus;
      status?: 'online' | 'offline' | 'busy';
    },
  ): Promise<AgentId>;

  /**
   * Discover agents with advanced filtering (role, health, capabilities, etc.)
   */
  discoverAgents(
    filter: AgentFilter & {
      health?: 'healthy' | 'degraded' | 'critical' | 'offline';
      role?: string;
    },
  ): Promise<AgentCardWithHealth[]>;

  /**
   * Create a multiagent session (NLACS-enabled)
   */
  createSession(
    sessionConfig: SessionConfig & { context?: Record<string, unknown>; nlacs?: boolean },
  ): Promise<SessionId>;

  joinSession(sessionId: SessionId, agentId: AgentId): Promise<boolean>;
  leaveSession(sessionId: SessionId, agentId: AgentId): Promise<boolean>;

  /**
   * Send a message (A2A/NLACS-compatible)
   */
  sendMessage(message: AgentMessage & { nlacs?: boolean }): Promise<MessageId>;

  broadcastMessage(message: AgentMessage & { nlacs?: boolean }): Promise<MessageId>;

  getMessageHistory(sessionId: SessionId, limit?: number): Promise<A2AMessage[]>;
  getSessionInfo(sessionId: SessionId): Promise<SessionInfo | null>;

  /**
   * Event-driven coordination: subscribe to agent lifecycle and communication events
   */
  on(event: AgentCommunicationEvent, handler: (payload: unknown) => void): void;
  off(event: AgentCommunicationEvent, handler: (payload: unknown) => void): void;

  /**
   * Extensibility: register new orchestration logic, protocols, or agent types
   */
  registerExtension(extension: AgentCommunicationExtension): void;
}

export type AgentCommunicationEvent =
  | 'agent_registered'
  | 'agent_deregistered'
  | 'agent_status_changed'
  | 'session_created'
  | 'session_joined'
  | 'session_left'
  | 'message_sent'
  | 'message_received'
  | 'broadcast'
  | 'health_changed'
  | 'nlacs_event';

export interface AgentCommunicationExtension {
  name: string;
  description?: string;
  apply: (service: UnifiedAgentCommunicationInterface) => void;
}

// CANONICAL AGENT REPRESENTATION - Single source of truth
export type AgentId = string;

export interface AgentRegistration {
  id?: string;
  name: string;
  capabilities: string[];
  metadata?: Record<string, unknown>;
}

export interface AgentFilter {
  capabilities?: string[];
  status?: 'online' | 'offline' | 'busy';
  limit?: number;
}

export interface AgentCard {
  id: AgentId;
  name: string;
  capabilities: string[];
  status: 'online' | 'offline' | 'busy';
  health?: AgentHealthStatus; // Optional to resolve forward reference
  role?: string;
  lastActive?: Date;
  metadata?: Record<string, unknown>;
}

// DEPRECATED: AgentCardWithHealth is now just AgentCard (health included by default)
export type AgentCardWithHealth = AgentCard;

export interface AgentMessage {
  sessionId: SessionId;
  fromAgent: AgentId;
  toAgent?: AgentId; // Optional for broadcast
  content: string;
  messageType?: 'update' | 'question' | 'decision' | 'action' | 'insight';
  metadata?: Record<string, unknown>;
}

export type MessageId = string;

export interface SessionConfig {
  name: string;
  participants: AgentId[];
  mode?: 'collaborative' | 'competitive' | 'hierarchical';
  topic: string;
  metadata?: Record<string, unknown>;
}

export type SessionId = string;

export interface SessionInfo {
  id: SessionId;
  name: string;
  participants: AgentId[];
  mode: 'collaborative' | 'competitive' | 'hierarchical';
  topic: string;
  status: 'active' | 'inactive' | 'concluded';
  createdAt: UnifiedTimestamp;
}

export interface A2AAgent {
  id: AgentId;
  name: string;
  capabilities: string[];
  lastActive: UnifiedTimestamp;
  status: 'online' | 'offline' | 'busy';
  metadata: Record<string, unknown>;
}

export interface A2AGroupSession {
  id: SessionId;
  name: string;
  participants: AgentId[];
  mode: 'collaborative' | 'competitive' | 'hierarchical';
  topic: string;
  messages: A2AMessage[];
  createdAt: UnifiedTimestamp;
  status: 'active' | 'inactive' | 'concluded';
  metadata: Record<string, unknown>;
}

export interface A2AMessage {
  id: MessageId;
  sessionId: SessionId;
  fromAgent: AgentId;
  toAgent?: AgentId;
  message: string;
  messageType: 'update' | 'question' | 'decision' | 'action' | 'insight';
  timestamp: UnifiedTimestamp;
  metadata?: Record<string, unknown>;
}

export interface AgentResponse {
  content: string;
  metadata?: Record<string, unknown>;
  actions?: string[];
  memories?: MemoryRecord[];
  error?: string;
  timestamp?: Date;
}

export interface AgentHealthStatus {
  status: 'healthy' | 'degraded' | 'critical' | 'offline';
  uptime: number;
  memoryUsage: number;
  responseTime: number;
  errorRate: number;
  lastActivity: Date;
  throughput?: number;
  queueSize?: number;
  resourceUtilization?: {
    cpu: number;
    memory: number;
    network?: number;
  };
  diagnostics?: {
    lastError?: string;
    warningCount: number;
    successRate: number;
  };
}

// ========================================
// NLACS (Natural Language Agent Coordination System) - v5.0.0 Extension
// ========================================

export interface NLACSDiscussion {
  id: string;
  topic: string;
  participants: string[]; // Agent IDs
  messages: NLACSMessage[];
  emergentInsights: EmergentInsight[];
  status: 'active' | 'concluded' | 'paused';
  createdAt: Date;
  lastActivity: Date;
  metadata?: Record<string, unknown>;
}

export interface NLACSMessage {
  id: string;
  discussionId: string;
  agentId: string;
  content: string;
  messageType: 'contribution' | 'question' | 'synthesis' | 'insight' | 'consensus';
  timestamp: Date;
  references?: string[]; // References to other messages or memories
  metadata?: Record<string, unknown>;
}

export interface ConversationThread {
  id: string;
  participants: string[];
  messages: NLACSMessage[];
  context: ConversationContext;
  insights: EmergentInsight[];
  status: 'active' | 'archived' | 'synthesized';
  createdAt: Date;
  lastActivity: Date;
}

export interface ConversationContext {
  domain: string;
  complexity: 'simple' | 'moderate' | 'complex' | 'expert';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  stakeholders: string[];
  objectives: string[];
  constraints: string[];
  resources: string[];
}

export interface EmergentInsight {
  id: string;
  type: 'pattern' | 'synthesis' | 'breakthrough' | 'connection' | 'optimization';
  content: string;
  confidence: number; // 0-1
  contributors: string[]; // Agent IDs that contributed
  sources: string[]; // Message IDs or memory IDs
  implications: string[];
  actionItems: string[];
  validatedBy?: string[];
  createdAt: Date;
  relevanceScore: number;
  metadata?: Record<string, unknown>;
}

export interface NLACSCapability {
  type: 'discussion' | 'synthesis' | 'consensus' | 'mediation' | 'analysis';
  description: string;
  prerequisites: string[];
  outputs: string[];
  qualityMetrics: string[];
}

// ========================================
// PHASE 3: ENHANCED COORDINATION TYPES
// ========================================

export interface EnhancedSessionConfig extends SessionConfig {
  communicationMode: 'A2A' | 'NLACS' | 'hybrid';
  discussionType: 'collaborative' | 'debate' | 'consensus' | 'brainstorming';
  facilitationMode: 'moderated' | 'democratic' | 'emergent';
  insightTargets: string[]; // Expected breakthrough areas
  consensusThreshold: number; // 0.0-1.0 for agreement level
  qualityTargets: {
    breakthroughInsights: number; // Target number of insights
    consensusTime: number; // Target time to reach consensus (minutes)
    participationRate: number; // Minimum participation percentage
  };
  businessContext?: BusinessContext;
}

export interface BusinessContext {
  industry: string;
  stakeholders: string[];
  timeline: string;
  budget?: string;
  riskTolerance: 'low' | 'medium' | 'high';
  innovationLevel: 'incremental' | 'disruptive' | 'revolutionary';
  marketContext: string[];
  competitiveFactors: string[];
}

export interface ConsensusResult {
  agreed: boolean;
  consensusLevel: number; // 0.0-1.0
  supportingAgents: AgentId[];
  objectingAgents: AgentId[];
  neutralAgents: AgentId[];
  finalDecision: string;
  compromisesReached: string[];
  timeToConsensus: number; // minutes
  qualityScore: number;
  constitutionallyValidated: boolean;
  metadata: {
    discussionSummary: string;
    keyArguments: { for: string[]; against: string[]; neutral: string[] };
    breakthroughMoments: string[];
    synthesizedInsights: EmergentInsight[];
  };
}

export interface AgreementAnalysis {
  overallAgreement: number; // 0.0-1.0
  topicAgreementBreakdown: Record<string, number>;
  agentAgreementMatrix: Record<AgentId, Record<AgentId, number>>;
  conflictPoints: ConflictPoint[];
  consensusOpportunities: ConsensusOpportunity[];
  compromiseSuggestions: CompromiseSolution[];
}

export interface ConflictPoint {
  id: string;
  topic: string;
  conflictingViews: ViewPoint[];
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  resolutionStrategies: string[];
  affectedAgents: AgentId[];
}

export interface ViewPoint {
  agentId: AgentId;
  position: string;
  reasoning: string[];
  evidence: string[];
  confidence: number;
  flexibility: number; // 0.0-1.0 willingness to compromise
}

export interface ConsensusOpportunity {
  id: string;
  topic: string;
  agreementLevel: number;
  requiredActions: string[];
  timeframe: string;
  likelihood: number;
}

export interface CompromiseSolution {
  id: string;
  description: string;
  affectedParties: AgentId[];
  tradeoffs: Record<string, string>;
  benefits: string[];
  risks: string[];
  implementationSteps: string[];
  acceptanceScore: number;
}

export interface MessagePriority {
  level: 'low' | 'normal' | 'high' | 'urgent' | 'critical';
  reasoning: string;
  deadline?: Date;
  dependencies: string[];
  impactAssessment: 'local' | 'session' | 'workflow' | 'system';
}

export interface SessionCoherence {
  coherenceScore: number; // 0.0-1.0
  topicDrift: number; // How far discussion has drifted from original topic
  participationBalance: Record<AgentId, number>; // Participation percentage per agent
  insightGeneration: number; // Rate of insight generation
  discussionQuality: number; // Overall quality of discussion
  issues: CoherenceIssue[];
  recommendations: string[];
}

export interface CoherenceIssue {
  type:
    | 'topic_drift'
    | 'uneven_participation'
    | 'circular_discussion'
    | 'low_quality'
    | 'conflict_escalation';
  severity: 'minor' | 'moderate' | 'major';
  description: string;
  affectedAgents: AgentId[];
  suggestedActions: string[];
}

export interface FacilitationRules {
  maxMessageLength: number;
  minParticipationRate: number; // Percentage
  topicDriftThreshold: number;
  consensusTimeLimit: number; // minutes
  conflictResolutionMode: 'immediate' | 'deferred' | 'democratic';
  insightSynthesisInterval: number; // minutes
  qualityThreshold: number; // Minimum message quality score
  constitutionalValidation: boolean;
}

export interface BusinessWorkflowTemplate {
  id: string;
  name: string;
  description: string;
  phases: WorkflowPhase[];
  requiredAgentTypes: AgentType[];
  estimatedDuration: number; // hours
  complexityLevel: 'simple' | 'moderate' | 'complex' | 'expert';
  businessValue: 'operational' | 'strategic' | 'transformational';
  successMetrics: string[];
  riskFactors: string[];
}

export interface WorkflowPhase {
  id: string;
  name: string;
  description: string;
  objectives: string[];
  requiredAgents: AgentType[];
  estimatedDuration: number; // minutes
  prerequisites: string[];
  deliverables: string[];
  qualityGates: string[];
  facilitationMode: 'structured' | 'organic' | 'guided';
  communicationMode: 'A2A' | 'NLACS' | 'hybrid';
}

export interface WorkflowInstance {
  id: string;
  templateId: string;
  name: string;
  currentPhase: string;
  status: 'planning' | 'executing' | 'completed' | 'paused' | 'failed';
  participants: AgentId[];
  startTime: Date;
  endTime?: Date;
  progress: WorkflowProgress;
  sessions: SessionId[];
  outcomes: BusinessOutcome[];
  metadata: Record<string, unknown>;
}

export interface WorkflowProgress {
  overallProgress: number; // 0.0-1.0
  phaseProgress: Record<string, number>;
  completedObjectives: string[];
  activeObjectives: string[];
  blockedObjectives: string[];
  qualityScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  timeToCompletion: number; // estimated hours
  resourceUtilization: Record<AgentType, number>;
}

export interface BusinessOutcome {
  id: string;
  type: 'decision' | 'insight' | 'plan' | 'solution' | 'optimization' | 'innovation';
  title: string;
  description: string;
  businessValue: 'operational' | 'strategic' | 'transformational';
  impact: 'low' | 'medium' | 'high' | 'revolutionary';
  implementationComplexity: 'simple' | 'moderate' | 'complex' | 'expert';
  timeToImplement: number; // days
  contributors: AgentId[];
  evidenceBase: string[];
  riskAssessment: BusinessRisk[];
  successMetrics: string[];
  createdAt: Date;
  validated: boolean;
  constitutionallyCompliant: boolean;
}

export interface BusinessRisk {
  id: string;
  type: 'technical' | 'financial' | 'operational' | 'market' | 'regulatory' | 'competitive';
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number; // 0.0-1.0
  impact: string;
  mitigationStrategies: string[];
  contingencyPlans: string[];
  monitoringIndicators: string[];
}

export interface BreakthroughInsight extends EmergentInsight {
  businessImpact: 'incremental' | 'significant' | 'transformational' | 'revolutionary';
  noveltyScore: number; // 0.0-1.0
  marketAdvantage: 'none' | 'minor' | 'significant' | 'game_changing';
  implementationFeasibility: 'immediate' | 'short_term' | 'long_term' | 'research_needed';
  competitiveImplications: string[];
  resourceRequirements: string[];
  riskProfile: BusinessRisk[];
}

export interface NovelConnection {
  id: string;
  sourceIds: string[]; // Message or memory IDs
  connectionType: 'causal' | 'correlation' | 'analogy' | 'synthesis' | 'pattern' | 'opposition';
  description: string;
  insights: string[];
  businessRelevance: number; // 0.0-1.0
  noveltyScore: number; // 0.0-1.0
  actionableImplications: string[];
  evidenceStrength: number; // 0.0-1.0
  createdAt: Date;
  validatedBy: AgentId[];
}

export interface SynthesizedInsight {
  id: string;
  title: string;
  content: string;
  sourceAgents: AgentId[];
  perspectivesSynthesized: number;
  synthesisMethod: 'consensus' | 'integration' | 'abstraction' | 'contradiction_resolution';
  qualityScore: number;
  noveltyScore: number;
  businessValue: number;
  implementationComplexity: number;
  evidenceBase: string[];
  contradictions: string[];
  assumptions: string[];
  limitations: string[];
  recommendedActions: string[];
  createdAt: Date;
  constitutionallyValidated: boolean;
}

export interface AgentContribution {
  agentId: AgentId;
  messageIds: MessageId[];
  keyPoints: string[];
  perspective: string;
  expertise: string[];
  uniqueInsights: string[];
  supportingEvidence: string[];
  qualityScore: number;
  originalityScore: number;
  collaborationRating: number;
}

// ========================================
// END PHASE 3 TYPES
// ========================================

// ========================================
// ONEAGENT ENGINE TYPES
// ========================================

export interface OneAgentRequestParams {
  method?: string;
  args?: Record<string, unknown>;
  context?: RequestContext;
  metadata?: UnifiedMetadata;
  agentId?: string;
  sessionId?: string;

  // Tool-specific parameters
  userMessage?: string;
  input?: string;
  response?: string;
  content?: string;
  task?: string;
  criteria?: string[];
  code?: string;
  id?: string;
  name?: string;
  capabilities?: string[];

  // Additional flexible parameters
  [key: string]: unknown;
}

export interface OneAgentResponseData {
  result?: unknown;
  agent?: UnifiedAgentContext;
  memory?: MemoryRecord;
  intelligence?: IntelligenceInsight;
  conversation?: ConversationData;
  constitutional?: ConstitutionalValidation;
  qualityScore?: number;

  // Allow additional properties for flexibility
  [key: string]: unknown;
}

export interface ErrorDetails {
  code: string;
  message: string;
  timestamp: UnifiedTimestamp;
  context?: string;
  remediation?: string;
  stackTrace?: string;
  agentId?: string;
  sessionId?: string;
  details?: unknown;
}

export interface RequestContext {
  user?: { id: string; name: string };
  workspace?: string;
  sessionId?: string;
  agentId?: string;
  timestamp: UnifiedTimestamp;
  metadata?: UnifiedMetadata;

  // Allow additional properties for flexibility
  [key: string]: unknown;
}

export interface ConstitutionalValidation {
  isValid: boolean;
  principles: ConstitutionalPrinciple[];
  violations: string[];
  score: number;
  recommendations: string[];
  timestamp: UnifiedTimestamp;
}

export interface ConstitutionalPrinciple {
  id: string;
  name: string;
  description: string;
  category: 'accuracy' | 'transparency' | 'helpfulness' | 'safety';
  weight: number;
  isViolated: boolean;
  confidence: number;
  validationRule: string;
  severityLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: ErrorDetails;
  metadata?: UnifiedMetadata;
  timestamp: UnifiedTimestamp;
}

export interface AgentAction {
  id: string;
  type: string;
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  requiredPermissions: string[];
  metadata?: UnifiedMetadata;
}

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  type: 'tool' | 'skill' | 'knowledge' | 'protocol';
  parameters: Record<string, unknown>;
  metadata?: UnifiedMetadata;
}

// ========================================
// ID GENERATION SYSTEM
// ========================================

export type IdType =
  | 'operation'
  | 'analysis'
  | 'document'
  | 'learning'
  | 'memory'
  | 'cache'
  | 'error'
  | 'mcp'
  | 'agent'
  | 'session'
  | 'message'
  | 'validation'
  | 'constitutional-validation'
  | 'conversation'
  | 'task'
  | 'workflow'
  | 'intelligence'
  | 'evolution'
  | 'validation'
  | 'system'
  | 'context'
  | 'discussion'
  | 'knowledge';

export interface UnifiedIdConfig {
  type: IdType;
  context?: string;
  prefix?: string;
  includeTimestamp?: boolean;
  includeRandomness?: boolean;
  format?: 'short' | 'medium' | 'long';
  secure?: boolean;
}

export interface UnifiedIdResult {
  id: string;
  type: IdType;
  context?: string;
  timestamp: number;
  metadata: {
    generated: Date;
    source: string;
    format: string;
    secure: boolean;
  };
}

// ========================================
// END OF CANONICAL TYPES
// ========================================
