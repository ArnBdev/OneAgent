/**
 * OneAgent Unified Type Definitions
 * 
 * PURPOSE: Centralized, comprehensive interfaces supporting Constitutional AI and advanced metadata
 * WHY: Eliminates duplicate interfaces and ensures consistency across the entire system
 * CONSTITUTIONAL REQUIREMENT: All interfaces must support quality scoring and compliance tracking
 * 
 * @version 1.0.0 - Professional Grade
 * @date 2025-06-16
 */

// ========================================
// CORE ENUM DEFINITIONS
// ========================================

export type CommunicationStyle = 'formal' | 'casual' | 'technical' | 'conversational';
export type ExpertiseLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type FormalityLevel = 'very_formal' | 'formal' | 'neutral' | 'casual' | 'very_casual';
export type ResponseLength = 'concise' | 'moderate' | 'detailed' | 'comprehensive';
export type MoodIndicator = 'positive' | 'neutral' | 'frustrated' | 'confused' | 'satisfied';
export type IntentCategory = 'question' | 'request' | 'complaint' | 'compliment' | 'exploration';
export type PrivacyLevel = 'public' | 'internal' | 'confidential' | 'restricted';
export type AgentType = 'core' | 'enhanced-development' | 'development' | 'office' | 'fitness' | 'general' | 'coach' | 'advisor' | 'template';

// ========================================
// INTER-AGENT COMMUNICATION METADATA
// ========================================

export interface InterAgentMetadata {
  // Communication Context
  communicationType: 'direct_message' | 'multi_agent' | 'broadcast' | 'coordination' | 'delegation';
  sourceAgentId: string;
  targetAgentId?: string; // undefined for broadcast/multi-agent
  messageType: 'request' | 'response' | 'notification' | 'coordination' | 'status';
  
  // Project & Topic Context
  projectContext?: string; // Project identifier for context isolation
  topicContext?: string; // Topic/domain for context organization
  workflowId?: string; // Workflow identifier for multi-step processes
  parentMessageId?: string; // For message threading
  
  // User Privacy & Isolation
  userId: string; // CRITICAL: Ensures user privacy isolation
  sessionId: string; // Session-specific context
  privacyLevel: PrivacyLevel; // Controls data access levels
  userDataScope: 'global' | 'session' | 'project' | 'restricted'; // Data access boundaries
  
  // Quality & Compliance
  qualityThreshold: number; // Minimum quality requirement for this communication
  constitutionalCompliance: boolean; // Constitutional AI validation required
  priorityLevel: 'low' | 'medium' | 'high' | 'urgent'; // Message priority
  
  // Traceability
  timestamp: Date;
  correlationId?: string; // For cross-agent tracing
  requestId?: string; // For request/response correlation
}

export interface AgentCommunicationContext {
  // Enhanced context for inter-agent messaging
  metadata: InterAgentMetadata;
  conversationHistory?: Array<{
    agentId: string;
    message: string;
    timestamp: Date;
    metadata: InterAgentMetadata;
  }>;
  
  // User Context (with privacy isolation)
  userContext: {
    userId: string;
    sessionId: string;
    projectId?: string;
    accessLevel: 'full' | 'limited' | 'read_only';
    preferences: Record<string, any>;
  };
  
  // Agent Capabilities Context
  availableAgents?: Array<{
    agentId: string;
    capabilities: string[];
    qualityScore: number;
    availability: 'online' | 'busy' | 'offline';
  }>;
}

// ========================================
// ADVANCED METADATA INTERFACES
// ========================================

export interface ConversationMetadata {
  messageAnalysis?: {
    communicationStyle: CommunicationStyle;
    expertiseLevel: ExpertiseLevel;
    intentCategory: IntentCategory;
    contextTags: string[];
    privacyLevel: PrivacyLevel;
    sentimentScore: number; // -1 to 1
    complexityScore: number; // 0 to 1
    urgencyLevel: number; // 0 to 1
  };
  responseAnalysis?: {
    qualityScore: number; // 0 to 1
    helpfulnessScore: number; // 0 to 1
    accuracyScore: number; // 0 to 1
    constitutionalCompliance: number; // 0 to 1
    responseTimeMs: number;
    tokensUsed: number;
  };
  userId: string;
  sessionId: string;
  conversationId?: string;
  timestamp: Date;
  
  // Inter-Agent Communication Enhancement
  interAgentMetadata?: InterAgentMetadata;
  agentCommunicationContext?: AgentCommunicationContext;
  
  // Constitutional AI Metadata
  constitutionalValidation?: {
    passed: boolean;
    principleScores: Record<string, number>;
    violations: string[];
    confidence: number;
  };
  // Quality Assurance
  qualityMetrics?: {
    overallScore: number;
    dimensions: Record<string, number>;
    improvementSuggestions: string[];
  };
}

// ========================================
// USER PROFILE - COMPREHENSIVE DEFINITION
// ========================================

export interface UserProfile {
  userId: string;
  createdAt: Date;
  lastUpdated: Date;
  totalInteractions: number;
  
  // Communication Preferences
  preferredCommunicationStyle: CommunicationStyle;
  preferredResponseLength: ResponseLength;
  preferredTechnicalLevel: ExpertiseLevel;
  preferredFormality: FormalityLevel;
  
  // Expertise Tracking
  domainExpertise: Record<string, ExpertiseLevel>;
  learningProgression: LearningProgression[];
  
  // Interaction Patterns
  successfulPatterns: InteractionPattern[];
  unsuccessfulPatterns: InteractionPattern[];
  averageSessionLength: number;
  preferredInteractionTimes: TimePattern[];
  
  // Privacy Boundaries
  privacyBoundaries: PrivacyBoundaries;
  sensitiveTopics: string[];
  
  // Evolution Metrics
  evolutionScore: number;
  adaptationRate: number;
  satisfactionTrend: number[];
  
  // Constitutional AI Profile
  constitutionalPreferences: {
    safetyThreshold: number;
    transparencyLevel: ExpertiseLevel;
    helpfulnessWeight: number;
    accuracyRequirement: number;
  };
}

export interface LearningProgression {
  domain: string;
  startLevel: ExpertiseLevel;
  currentLevel: ExpertiseLevel;
  progressRate: number;
  milestonesAchieved: string[];
  nextMilestone: string;
}

export interface InteractionPattern {
  patternId: string;
  description: string;
  frequency: number;
  successRate: number;
  contextIndicators: string[];
  responseCharacteristics: ResponseCharacteristics;
}

export interface TimePattern {
  dayOfWeek: number; // 0-6
  hourRange: [number, number];
  preference: number; // 0-1
}

export interface PrivacyBoundaries {
  dataRetentionDays: number;
  shareAnalytics: boolean;
  allowPersonalization: boolean;
  sensitivityLevel: PrivacyLevel;
  explicitConsent: string[];
}

// ========================================
// SESSION CONTEXT - ENHANCED
// ========================================

export interface SessionContext {
  sessionId: string;
  userId: string;
  startTime: Date;
  lastActivity: Date;
  isActive: boolean;
  
  // Context Data
  conversationHistory: ConversationEntry[];
  currentTopic: string;
  topicProgression: TopicTransition[];
  
  // User State
  currentMood: MoodIndicator;
  currentExpertiseLevel: ExpertiseLevel;
  currentIntentCategory: IntentCategory;
  
  // Session Metrics
  messageCount: number;
  averageResponseTime: number;
  satisfactionScore: number;
  
  // Privacy Context
  activePolicyViolations: string[];
  privacyModeActive: boolean;
  
  // Constitutional Context
  constitutionalMode: 'strict' | 'balanced' | 'permissive';
  qualityThreshold: number;
  
  // Advanced Context
  semanticContext: Record<string, any>;
  emotionalState: EmotionalState;
  cognitiveLoad: number; // 0-1
}

export interface ConversationEntry {
  messageId: string;
  timestamp: Date;
  role: 'user' | 'assistant';
  content: string;
  metadata: ConversationMetadata;
}

export interface TopicTransition {
  fromTopic: string;
  toTopic: string;
  timestamp: Date;
  transitionReason: string;
  contextualRelevance: number;
}

export interface EmotionalState {
  primary: MoodIndicator;
  intensity: number; // 0-1
  confidence: number; // 0-1
  trajectory: 'improving' | 'stable' | 'declining';
}

// ========================================
// CONVERSATION DATA - ALITA COMPATIBLE
// ========================================

export interface ConversationData {
  conversationId: string;
  userId: string;
  timestamp: Date;
  userSatisfaction: number;
  taskCompleted: boolean;
  qualityScore: number;
  responseTime: number;
  topicTags: string[];
  conversationLength: number;
  successMetrics: {
    goalAchieved: boolean;
    userReturnRate: number;
    systemPerformance: number;
  };
  constitutionalCompliant: boolean;
  
  // ALITA Evolution Properties
  communicationStyle?: CommunicationStyle;
  technicalLevel?: ExpertiseLevel;
  messageCount?: number;
  contextTags?: string[];
  domain?: string;
  
  // Constitutional AI Properties
  constitutionalScore?: number;
  safetyRating?: number;
  transparencyScore?: number;
  helpfulnessScore?: number;
  
  // Advanced Analytics
  semanticComplexity?: number;
  emotionalResonance?: number;
  cognitiveLoad?: number;
  
  // Legacy fields for backward compatibility
  id?: string;
  userSatisfactionScore?: number;
  taskCompletionRate?: number;
  responseTimeMs?: number;
}

export interface TimeWindow {
  startDate: Date;
  endDate: Date;
  minimumSamples?: number;
  qualityThreshold?: number;
  includeConstitutionalData?: boolean;
}

// ========================================
// RESPONSE CHARACTERISTICS
// ========================================

export interface ResponseCharacteristics {
  averageLength: number;
  technicalLevel: ExpertiseLevel;
  communicationStyle: CommunicationStyle;
  examplePatterns: string[];
  codeExamples: boolean;
  stepByStepBreakdown: boolean;
  contextualReferences: boolean;
  
  // Constitutional AI Characteristics
  constitutionalAlignment: number;
  safetyConsiderations: string[];
  transparencyLevel: number;
  helpfulnessIndicators: string[];
}

// ========================================
// UNIFIED MEMORY CLIENT INTERFACE
// ========================================

export interface IMemoryClient {
  // Core Storage Operations
  storeConversationMetadata(metadata: ConversationMetadata): Promise<string>;
  getConversationsInWindow(timeWindow: TimeWindow): Promise<ConversationData[]>;
  
  // User Profile Management
  getUserProfile(userId: string): Promise<UserProfile | null>;
  createUserProfile(userId: string, profile: UserProfile): Promise<void>;
  updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<void>;
  
  // Session Management
  getSessionContext(sessionId: string): Promise<SessionContext | null>;
  createSession(sessionId: string, context: SessionContext): Promise<void>;
  updateSessionContext(sessionId: string, context: Partial<SessionContext>): Promise<void>;
  
  // Advanced Query Operations
  searchConversationsByMetadata(query: ConversationQuery): Promise<ConversationData[]>;
  getConstitutionalMetrics(userId: string, timeWindow: TimeWindow): Promise<ConstitutionalMetrics>;
  
  // System Health
  healthCheck(): Promise<{ connected: boolean; latency?: number; qualityScore?: number }>;
}

export interface ConversationQuery {
  userId?: string;
  timeWindow?: TimeWindow;
  qualityThreshold?: number;
  constitutionalCompliant?: boolean;
  topicTags?: string[];
  communicationStyle?: CommunicationStyle;
  limit?: number;
  offset?: number;
}

export interface ConstitutionalMetrics {
  overallCompliance: number;
  principleBreakdown: Record<string, number>;
  improvementAreas: string[];
  trend: 'improving' | 'stable' | 'declining';
  recommendations: string[];
}

// ========================================
// VALIDATION AND QUALITY INTERFACES
// ========================================

export interface ValidationResult {
  isValid: boolean;
  safetyScore: number; // 0-100
  regressionRisk: number; // 0-1 (0 = no risk)
  performanceProjection: PerformanceProjection;
  constitutionalCompliance: boolean;
  requiredSafeguards: string[];
  validatedAt: Date;
  validatorSignature: string;
  
  // Enhanced Validation Properties
  qualityScore: number;
  confidenceLevel: number;
  improvementSuggestions: string[];
  complianceDetails: Record<string, any>;
}

export interface PerformanceProjection {
  expectedImprovement: number;
  confidenceLevel: number;
  projectedMetrics: Record<string, number>;
  uncertaintyRange: [number, number];
}

// ========================================
// MEMORY SYSTEM INTERFACES
// ========================================

export interface MemoryMetadata {
  userId: string;
  timestamp: Date;
  tags?: string[];
  category?: string;
  importance?: number;
  [key: string]: any;
}

export interface MemoryRecord {
  id: string;
  content: string;
  metadata: MemoryMetadata;
  userId: string;
  timestamp: Date;
  lastAccessed: Date;
  accessCount: number;
  embedding?: number[];
  relevanceScore?: number;
}

export interface MemorySearchOptions {
  limit?: number;
  threshold?: number;
  includeMetadata?: boolean;
  sortBy?: 'relevance' | 'timestamp' | 'accessCount';
  filters?: Record<string, any>;
}

export interface MemorySearchQuery {
  text: string;
  options?: MemorySearchOptions;
  userId: string;
}

export interface MemorySearchResult {
  results: MemoryRecord[];
  totalResults: number;
  query: string;
  searchTime: number;
  metadata?: Record<string, any>;
}

export interface MemoryAnalytics {
  totalMemories: number;
  averageRelevance: number;
  searchPerformance: number;
  memoryGrowthRate: number;
  userActivity: Record<string, any>;
}

export interface IntelligenceInsight {
  type: 'pattern' | 'trend' | 'anomaly' | 'suggestion';
  content: string;
  confidence: number;
  metadata: Record<string, any>;
}

export interface AgentHealthReport {
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
}

// ========================================
// CONTEXT7 DOCUMENTATION SYSTEM INTERFACES
// ========================================

export interface DocumentationSource {
  name: string;
  type: 'library' | 'framework' | 'api' | 'language' | 'internal';
  endpoint?: string;
  version?: string;
  lastUpdated?: Date;
  quality: number;
  constitutionalCompliant: boolean;
}

export interface DocumentationQuery {
  source: string;
  query: string;
  context?: string;
  maxResults?: number;
  userId: string;
  sessionId?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface DocumentationResult {
  id: string;
  source: string;
  title: string;
  content: string;
  url?: string;
  relevanceScore: number;
  qualityScore: number;
  cached: boolean;
  memoryEnhanced?: boolean;
  constitutionalValidated: boolean;
  metadata: Record<string, any>;
  timestamp: Date;
}

export interface DocumentationSearchResult {
  results: DocumentationResult[];
  totalResults: number;
  query: string;
  searchTime: number;
  sources: string[];
  cacheHitRatio: number;
  memoryEnhanced: boolean;
  metadata?: Record<string, any>;
}

export interface DocumentationPattern {
  id: string;
  queryPattern: string;
  commonSources: string[];
  successfulResults: number;
  userSatisfaction: number;
  averageRelevance: number;
  lastUsed: Date;
  constitutionalCompliant: boolean;
  metadata: Record<string, any>;
}

export interface Context7CacheMetrics {
  totalQueries: number;
  cacheHits: number;
  cacheMisses: number;
  memoryHits: number;
  averageResponseTime: number;
  qualityScore: number;
  constitutionalCompliance: number;
  lastCacheCleanup: Date;
}

// ========================================
// ONEAGENT UNIFIED PLATFORM INTERFACES
// ========================================

/**
 * OneAgent Constitutional AI Validation Interface
 * Used by: oneagent_constitutional_validate tool
 */
export interface OneAgentConstitutionalValidation {
  content: string;
  userMessage: string;
  validationResult: {
    isValid: boolean;
    score: number;
    violations: string[];
    suggestions: string[];
    constitutionalPrinciples: string[];
  };
  timestamp: Date;
  qualityGrade: 'A' | 'B' | 'C' | 'D' | 'F';
}

/**
 * OneAgent BMAD Framework Analysis Interface
 * Used by: oneagent_bmad_analyze tool
 */
export interface OneAgentBMADAnalysis {
  task: string;
  analysis: {
    beliefAssessment: string;
    motivationMapping: string;
    authorityIdentification: string;
    dependencyMapping: string;
    constraintAnalysis: string;
    riskAssessment: string;
    successMetrics: string;
    timelineConsiderations: string;
    resourceRequirements: string;
  };
  framework: '9-point BMAD analysis';
  recommendations: string[];
  timestamp: Date;
  qualityScore: number;
}

/**
 * OneAgent Quality Scoring Interface
 * Used by: oneagent_quality_score tool
 */
export interface OneAgentQualityScore {
  content: string;
  criteria: string[];
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  breakdown: {
    accuracy: number;
    helpfulness: number;
    safety: number;
    transparency: number;
    constitutionalCompliance: number;
  };
  suggestions: string[];
  timestamp: Date;
  professionalStandard: boolean;
}

/**
 * OneAgent Engine Response Interface
 * Unified response format for all OneAgent operations
 */
export interface OneAgentEngineResponse {
  id: string;
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  constitutionalValidated: boolean;
  qualityScore: number;
  metadata: {
    processingTimeMs: number;
    memoryUsed: boolean;
    multiAgentInvolved: boolean;
    bmadAnalyzed: boolean;
  };
  timestamp: Date;
}

/**
 * OneAgent Tool Registry Interface
 * Canonical definition for all OneAgent tools
 */
export interface OneAgentToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
  constitutionalLevel: 'basic' | 'enhanced' | 'critical';
  qualityThreshold: number;
  category: 'constitutional' | 'bmad' | 'memory' | 'search' | 'agent' | 'system';
}

/**
 * OneAgent Memory Search Interface
 * Used by: oneagent_memory_search tool
 */
export interface OneAgentMemorySearch {
  query: string;
  userId: string;
  memoryType: 'short_term' | 'long_term' | 'workflow' | 'session' | 'all';
  limit: number;
  results: {
    id: string;
    content: string;
    relevance: number;
    timestamp: Date;
    memoryType: string;
    userId: string;
  }[];
  total: number;
  executionTime: string;
  searchType: 'semantic' | 'keyword' | 'hybrid';
}

/**
 * OneAgent Enhanced Search Interface
 * Used by: oneagent_enhanced_search tool
 */
export interface OneAgentEnhancedSearch {
  query: string;
  sources: string[];
  qualityThreshold: number;
  maxResults: number;
  results: {
    title: string;
    url: string;
    snippet: string;
    qualityScore: number;
    source: string;
    timestamp: Date;
    constitutionalCompliant: boolean;
  }[];
  totalResults: number;
  qualityFiltered: boolean;
  averageQuality: number;
  searchTime: string;
}

/**
 * OneAgent Agent Coordination Interface
 * Used by: oneagent_agent_coordinate tool
 */
export interface OneAgentAgentCoordination {
  task: string;
  preferredAgents: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  timeout: number;
  assignedAgents: {
    agentId: string;
    role: string;
    capabilities: string[];
    status: 'assigned' | 'active' | 'completed' | 'failed';
  }[];
  executionPlan: {
    steps: string[];
    estimatedTime: string;
    riskAssessment: 'low' | 'medium' | 'high';
  };
  coordinationId: string;
  status: 'initialized' | 'running' | 'completed' | 'failed';
}

/**
 * OneAgent System Health Interface
 * Used by: oneagent_system_health tool
 */
export interface OneAgentSystemHealth {
  overall: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    timestamp: Date;
    version: string;
  };
  components: {
    memory?: {
      status: string;
      usage: NodeJS.MemoryUsage;
      connectionStatus: string;
      operations: {
        successful: number;
        failed: number;
        successRate: string;
      };
    };
    agents?: {
      status: string;
      activeAgents: number;
      registeredAgents: string[];
      averageResponseTime: string;
      healthScore: number;
    };
    mcp?: {
      status: string;
      protocol: string;
      port: number;
      toolsAvailable: number;
      resourcesAvailable: number;
      promptsAvailable: number;
      requestsHandled: number;
      errorRate: string;
    };
    constitutional?: {
      status: string;
      principles: number;
      validationsPerformed: number;
      averageQualityScore: number;
      complianceRate: string;
      threshold: number;
    };
    performance?: {
      status: string;
      cpuUsage: string;
      responseTime: {
        average: string;
        p95: string;
        p99: string;
      };
      throughput: string;
      errorRate: string;
    };
  };
}

// ========================================
// UNIFIED TIME AWARENESS SYSTEM
// ========================================

export interface UnifiedTimeContext {
  // Real-time awareness
  realTime: {
    unix: number;
    utc: string;
    local: string;
    timezone: string;
    offset: number; // UTC offset in minutes
  };
  
  // Context intelligence
  context: {
    dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    timeOfDay: 'early-morning' | 'morning' | 'afternoon' | 'evening' | 'late-night';
    workingHours: boolean;
    weekendMode: boolean;
    seasonalContext: 'spring' | 'summer' | 'fall' | 'winter';
    businessDay: boolean;
    peakHours: boolean; // 9-11 AM, 2-4 PM typically
  };
  
  // Intelligence features
  intelligence: {
    optimalFocusTime: boolean; // Based on circadian rhythms
    energyLevel: 'low' | 'medium' | 'high' | 'peak';
    suggestionContext: 'planning' | 'execution' | 'review' | 'rest';
    motivationalTiming: 'start-strong' | 'mid-momentum' | 'end-sprint' | 'reflection';
  };
}

export interface UnifiedTimestamp {
  unix: number;
  utc: string;
  local: string;
  timezone: string;
  context: string; // timeOfDay-dayOfWeek-businessContext
}

// ========================================
// UNIFIED METADATA SYSTEM
// ========================================

export interface UnifiedMetadata {
  // Core identification
  id: string;
  type: string;
  version: string;
  
  // Unified temporal data
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
  
  // System context
  system: {
    source: string; // 'agent' | 'user' | 'system' | 'memory' | 'context7' | 'alita'
    agent?: string; // AgentFactory type if applicable
    component: string; // specific component/service
    sessionId?: string;
    userId?: string;
  };
  
  // Quality and compliance
  quality: {
    score: number; // 0-100
    constitutionalCompliant: boolean;
    validationLevel: 'basic' | 'enhanced' | 'constitutional';
    confidence: number; // 0-1
  };
  
  // Content classification
  content: {
    category: string;
    tags: string[];
    sensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
    relevanceScore: number; // 0-1
    contextDependency: 'none' | 'session' | 'user' | 'global';
  };
  
  // Relationships and dependencies
  relationships: {
    parent?: string;
    children: string[];
    related: string[];
    dependencies: string[];
  };
  
  // Performance and analytics
  analytics: {
    accessCount: number;
    lastAccessPattern: string;
    performanceMetrics?: Record<string, number>;
    usageContext: string[];
  };
}

// ========================================
// UNIFIED SERVICE INTERFACES
// ========================================

export interface UnifiedTimeService {
  // Core time methods
  now(): UnifiedTimestamp;
  getContext(): UnifiedTimeContext;
  
  // Utility methods
  isOptimalTime(type: 'focus' | 'creative' | 'social' | 'rest'): boolean;
  getEnergyLevel(): 'low' | 'medium' | 'high' | 'peak';
  getSuggestionContext(): 'planning' | 'execution' | 'review' | 'rest';
  
  // Metadata integration
  createTimestamp(): UnifiedTimestamp;
  enhanceWithContext(basicTime: Date): UnifiedTimestamp;
}

export interface UnifiedMetadataService {
  // Core metadata methods
  create(type: string, source: string, options?: Partial<UnifiedMetadata>): UnifiedMetadata;
  update(id: string, changes: Partial<UnifiedMetadata>): UnifiedMetadata;
  retrieve(id: string): UnifiedMetadata | null;
  
  // Inter-agent communication metadata
  createInterAgentMetadata(
    communicationType: 'direct_message' | 'multi_agent' | 'broadcast' | 'coordination' | 'delegation',
    sourceAgentId: string,
    userId: string,
    sessionId: string,
    options?: {
      targetAgentId?: string;
      messageType?: 'request' | 'response' | 'notification' | 'coordination' | 'status';
      projectContext?: string;
      topicContext?: string;
      workflowId?: string;
      parentMessageId?: string;
      privacyLevel?: 'public' | 'internal' | 'confidential' | 'restricted';
      userDataScope?: 'global' | 'session' | 'project' | 'restricted';
      qualityThreshold?: number;
      priorityLevel?: 'low' | 'medium' | 'high' | 'urgent';
      correlationId?: string;
      requestId?: string;
    }
  ): UnifiedMetadata;
  
  // Quality and validation
  validateQuality(metadata: UnifiedMetadata): { valid: boolean; score: number; issues: string[] };
  ensureConstitutionalCompliance(metadata: UnifiedMetadata): boolean;
  
  // Analytics and insights
  getAnalytics(id: string): Record<string, any>;
  updateAccess(id: string, context: string): void;
}

// ========================================
// AGENT UNIFIED INTERFACES
// ========================================

export interface UnifiedAgentContext {
  // Agent identification
  agentId: string;
  agentType: AgentType;
  agentName: string;
  
  // Unified services
  timeService: UnifiedTimeService;
  metadataService: UnifiedMetadataService;
  
  // Session context
  sessionId: string;
  userId?: string;
  
  // Capabilities context
  capabilities: string[];
  memoryEnabled: boolean;
  aiEnabled: boolean;
  
  // Current operation context
  currentOperation?: {
    type: string;
    startTime: UnifiedTimestamp;
    metadata: UnifiedMetadata;
  };
}

export interface UnifiedAgentAction {
  // Action identification
  actionId: string;
  actionType: string;
  
  // Unified metadata
  metadata: UnifiedMetadata;
  
  // Execution context
  execute(context: UnifiedAgentContext, input: any): Promise<any>;
  validate(context: UnifiedAgentContext, input: any): boolean;
  
  // Quality assurance
  getQualityScore(): number;
  isConstitutionalCompliant(): boolean;
}

// ========================================
// MEMORY UNIFIED INTERFACES
// ========================================

export interface UnifiedMemoryEntry {
  // Core data
  id: string;
  content: string;
  type: 'conversation' | 'learning' | 'context' | 'system' | 'user';
  
  // Unified metadata
  metadata: UnifiedMetadata;
  
  // Memory-specific context
  memoryContext: {
    relevanceScore: number;
    accessPattern: string;
    retentionPolicy: 'session' | 'short_term' | 'long_term' | 'permanent';
    encryptionLevel: 'none' | 'basic' | 'enhanced';
  };
  
  // Temporal intelligence
  temporalContext: {
    createdAt: UnifiedTimestamp;
    expiresAt?: UnifiedTimestamp;
    lastRelevantAt?: UnifiedTimestamp;
    optimalRetrievalTime?: string; // time pattern for best retrieval
  };
}

export interface UnifiedMemoryService {
  // Core operations
  store(entry: Omit<UnifiedMemoryEntry, 'id' | 'metadata'>): Promise<string>;
  retrieve(id: string): Promise<UnifiedMemoryEntry | null>;
  search(query: string, context?: any): Promise<UnifiedMemoryEntry[]>;
  
  // Context-aware operations
  getRelevantMemories(context: UnifiedAgentContext): Promise<UnifiedMemoryEntry[]>;
  storeWithContext(content: string, type: string, context: UnifiedAgentContext): Promise<string>;
  
  // Quality and maintenance
  validateMemoryQuality(entry: UnifiedMemoryEntry): boolean;
  cleanupExpiredMemories(): Promise<number>;
  updateRelevanceScores(): Promise<void>;
}

// ========================================
// ALITA UNIFIED INTEGRATION
// ========================================

export interface ALITAUnifiedContext {
  // Real-time evolution tracking
  evolutionTimestamp: UnifiedTimestamp;
  
  // Learning metadata
  learningMetadata: UnifiedMetadata;
  
  // Evolution context
  evolutionContext: {
    trigger: string; // what triggered the evolution
    confidence: number; // 0-1
    impact: 'minor' | 'moderate' | 'significant' | 'major';
    validationRequired: boolean;
  };
  
  // Temporal learning patterns
  learningPatterns: {
    optimalLearningTime: string; // when ALITA learns best
    evolutionFrequency: number; // evolutions per time period
    qualityTrend: number[]; // quality improvement over time
  };
}

// ========================================
// SYSTEM VALIDATION INTERFACES
// ========================================

export interface UnifiedSystemHealth {
  timeService: {
    operational: boolean;
    accuracy: number; // timezone/time accuracy score
    performance: number; // response time metrics
  };
  
  metadataService: {
    operational: boolean;
    qualityScore: number; // average metadata quality
    consistency: number; // metadata consistency across systems
  };
  
  agentSystems: {
    operational: boolean;
    unifiedCompliance: number; // % using unified services
    performanceImpact: number; // overhead from unified services
  };
  
  memorySystem: {
    operational: boolean;
    temporalAccuracy: number; // temporal metadata accuracy
    retrievalPerformance: number; // memory retrieval with unified context
  };
}

// ========================================
// EXPORT ALL INTERFACES
// ========================================

export * from './user';
