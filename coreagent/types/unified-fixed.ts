/**
 * ⚠️ DUAL PURPOSE FILE: PRODUCTION TYPES + CANONICAL DOCUMENTATION ⚠️
 * 
 * OneAgent Unified Type Definitions
 * 
 * CRITICAL: This file serves TWO purposes:
 * 1. PRODUCTION TYPES: Required by UnifiedBackboneService and 8+ other systems
 * 2. CANONICAL DOCUMENTATION: Central reference for all OneAgent interfaces
 * 
 * ⚠️ DO NOT REMOVE TYPES WITHOUT CHECKING IMPORTS ⚠️
 * Systems that import from this file:
 * - UnifiedBackboneService.ts (CRITICAL BACKBONE)
 * - EnhancedTimeAwareness.ts
 * - SessionContextManager.ts  
 * - MetadataIntelligentLogger.ts
 * - MemoryClient.ts
 * - memoryIntelligence.ts
 * - memoryBridge.ts
 * - oneagent-mcp-copilot.ts
 * 
 * @version 1.0.0 - PRODUCTION + DOCUMENTATION
 * @date 2025-06-19
 * @status DUAL_PURPOSE_PRODUCTION_FILE
 */

// ========================================
// 🚨 CRITICAL PRODUCTION TYPES (Required by UnifiedBackboneService)
// ========================================

export interface UnifiedTimeContext {
  context: {
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    dayOfWeek: string;
    businessDay: boolean;
    workingHours: boolean;
    weekendMode: boolean;
    peakHours: boolean;
  };
  intelligence: {
    energyLevel: 'low' | 'medium' | 'high' | 'peak';
    optimalFocusTime: boolean;
    suggestionContext: 'planning' | 'execution' | 'review' | 'rest';
    motivationalTiming: 'morning-boost' | 'afternoon-focus' | 'evening-wind-down' | 'night-rest';
  };
  metadata: {
    timezone: string;
    timestamp: Date;
    contextUpdated: Date;
  };
}

export interface UnifiedTimestamp {
  iso: string;
  unix: number;
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
    agent?: {
      id: string;
      type: string;
    };
  };
  quality: {
    score: number;
    constitutionalCompliant: boolean;
    validationLevel: 'basic' | 'enhanced' | 'strict';
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
}

export interface UnifiedTimeService {
  now(): UnifiedTimestamp;
  getContext(): UnifiedTimeContext;
  isOptimalTime(type: 'focus' | 'creative' | 'social' | 'rest'): boolean;
  getEnergyLevel(): 'low' | 'medium' | 'high' | 'peak';
  getSuggestionContext(): 'planning' | 'execution' | 'review' | 'rest';
  createTimestamp(): UnifiedTimestamp;
}

export interface UnifiedMetadataService {
  create(type: string, source: string, options?: Partial<UnifiedMetadata>): UnifiedMetadata;
  update(id: string, changes: Partial<UnifiedMetadata>): UnifiedMetadata;
  retrieve(id: string): UnifiedMetadata | null;
  validateQuality(metadata: UnifiedMetadata): { valid: boolean; score: number; issues: string[] };
}

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
}

export interface UnifiedMemoryEntry {
  id: string;
  content: string;
  metadata: UnifiedMetadata;
  timestamp: UnifiedTimestamp;
  userId: string;
  memoryType: 'short_term' | 'long_term' | 'session' | 'workflow';
}

export interface UnifiedSystemHealth {
  overall: {
    status: 'healthy' | 'degraded' | 'critical';
    score: number;
    timestamp: UnifiedTimestamp;
  };
  components: {
    timeService: { status: string; responseTime: number };
    metadataService: { status: string; operationsPerSecond: number };
    memoryService: { status: string; storageHealth: number };
    constitutionalAI: { status: string; complianceRate: number };
  };
  metrics: {
    uptime: number;
    errorRate: number;
    performanceScore: number;
  };
}

export interface ALITAUnifiedContext {
  systemContext: UnifiedTimeContext;
  agentContext: UnifiedAgentContext;
  memoryContext: UnifiedMemoryEntry[];
  evolutionTrigger: string;
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
  timestamp: UnifiedTimestamp;
}

export type AgentType = 
  | 'general'
  | 'coding'
  | 'research'
  | 'analysis'
  | 'creative'
  | 'specialist'
  | 'coordinator'
  | 'validator';

// ========================================
// 🚨 END CRITICAL PRODUCTION TYPES
// ========================================

// ========================================
// CORE ENUM DEFINITIONS (DOCUMENTATION + SOME PRODUCTION USE)
// ========================================

export type CommunicationStyle = 'formal' | 'casual' | 'technical' | 'conversational';
export type ExpertiseLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type FormalityLevel = 'very_formal' | 'formal' | 'neutral' | 'casual' | 'very_casual';
export type ResponseLength = 'concise' | 'moderate' | 'detailed' | 'comprehensive';
export type MoodIndicator = 'positive' | 'neutral' | 'frustrated' | 'confused' | 'satisfied';
export type IntentCategory = 'question' | 'request' | 'complaint' | 'compliment' | 'exploration';
export type PrivacyLevel = 'public' | 'internal' | 'confidential' | 'restricted';

// ========================================
// UNIVERSAL CONTEXT CATEGORIZATION
// ========================================

export type ContextCategory = 
  | 'WORKPLACE'      // Professional, work-related contexts
  | 'PRIVATE'        // Personal, non-work contexts
  | 'PROJECT'        // Specific project-bound contexts
  | 'TECHNICAL'      // Technical documentation, coding
  | 'FINANCIAL'      // Financial planning, budgeting
  | 'HEALTH'         // Health, wellness, medical
  | 'EDUCATIONAL'    // Learning, training, research
  | 'CREATIVE'       // Creative projects, artistic endeavors
  | 'ADMINISTRATIVE' // Admin tasks, logistics, planning
  | 'GENERAL';       // General knowledge, uncategorized

export type ProjectScope = 
  | 'PERSONAL'       // Individual projects
  | 'TEAM'           // Small team collaboration
  | 'DEPARTMENT'     // Department-level projects
  | 'ORGANIZATION'   // Company-wide initiatives
  | 'PUBLIC'         // Open source, public projects
  | 'CLIENT'         // Client-specific work
  | 'RESEARCH'       // Research and development
  | 'PROTOTYPE'      // Experimental, proof-of-concept
  | 'PRODUCTION'     // Live, production systems
  | 'ARCHIVED';      // Completed, archived projects

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
  metadata: Record<string, any>;
}

// ========================================
// ADVANCED METADATA INTERFACES (DOCUMENTATION + SOME PRODUCTION USE)
// ========================================

export interface ConversationMetadata {
  messageAnalysis?: {
    communicationStyle: CommunicationStyle;
    expertiseLevel: ExpertiseLevel;
    intentCategory: IntentCategory;
    contextTags: string[];
    contextCategory: ContextCategory;
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
  projectContext?: ProjectContext;
  userId: string;
  sessionId: string;
  conversationId?: string;
  timestamp: Date;
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
// REST OF INTERFACES (DOCUMENTATION PRIMARILY)
// ========================================

// Note: The interfaces below are primarily for documentation but may be used by some systems

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
  
  // Constitutional AI Integration
  constitutionalPreferences: {
    strictMode: boolean;
    principleWeights: Record<string, number>;
    customPrinciples: string[];
  };
}

export interface LearningProgression {
  domain: string;
  startLevel: ExpertiseLevel;
  currentLevel: ExpertiseLevel;
  progressRate: number;
  milestones: string[];
  blockers: string[];
}

export interface InteractionPattern {
  pattern: string;
  frequency: number;
  successRate: number;
  contextTags: string[];
  timePattern: TimePattern;
}

export interface TimePattern {
  preferredTimes: string[];
  timezone: string;
  flexibilityScore: number;
}

export interface PrivacyBoundaries {
  dataRetentionDays: number;
  allowPersonalization: boolean;
  allowCrossDomainLearning: boolean;
  restrictedTopics: string[];
  minimumAnonymization: boolean;
}

// Session and Conversation Management
export interface SessionContext {
  sessionId: string;
  userId: string;
  startTime: Date;
  lastActivity: Date;
  
  // Current State
  currentTopic: string;
  conversationMode: 'exploration' | 'problem_solving' | 'learning' | 'task_completion';
  emotionalState: EmotionalState;
  
  // Session Metadata
  sessionType: 'quick_query' | 'extended_conversation' | 'collaborative_session';
  expectedDuration: number;
  goalDefinition: string;
  
  // Constitutional Context
  constitutionalMode: 'strict' | 'balanced' | 'permissive';
  validationLevel: 'basic' | 'enhanced' | 'comprehensive';
  
  // Performance Tracking
  responseQuality: number[];
  userSatisfaction: number[];
  goalProgress: number;
  
  // Memory Integration
  relevantMemories: string[];
  newLearnings: string[];
  
  // Context Continuity
  conversationHistory: ConversationEntry[];
  topicTransitions: TopicTransition[];
  
  // Adaptive Elements
  communicationAdjustments: string[];
  personalizedElements: string[];
  
  // Quality Metrics
  constitutionalCompliance: number;
  helpfulnessScore: number;
  accuracyMaintained: boolean;
}

export interface ConversationEntry {
  timestamp: Date;
  speaker: 'user' | 'assistant';
  content: string;
  contextTags: string[];
  qualityScore: number;
}

export interface TopicTransition {
  fromTopic: string;
  toTopic: string;
  transitionType: 'natural' | 'user_directed' | 'assistant_suggested';
  timestamp: Date;
  success: boolean;
}

export interface EmotionalState {
  primaryEmotion: MoodIndicator;
  intensity: number; // 0-1
  confidence: number; // 0-1
  triggers: string[];
  suggestedResponse: CommunicationStyle;
  constitutionalConsiderations: string[];
}

// Conversation Data Structures
export interface ConversationData {
  conversationId: string;
  participants: string[];
  startTime: Date;
  endTime?: Date;
  
  // Content Analysis
  topics: string[];
  keyInsights: string[];
  decisions: string[];
  actionItems: string[];
  
  // Quality Metrics
  overallQuality: number;
  constitutionalCompliance: number;
  userSatisfaction: number;
  goalAchievement: number;
  
  // Learning Extraction
  newKnowledge: string[];
  improvedUnderstanding: string[];
  skillDemonstrations: string[];
  
  // Context Evolution
  contextShifts: TopicTransition[];
  personalizations: string[];
  adaptations: string[];
  
  // Metadata
  sessionContext: SessionContext;
  responseCharacteristics: ResponseCharacteristics;
  timeWindows: TimeWindow[];
  
  // Constitutional AI Integration
  principleApplications: string[];
  ethicalConsiderations: string[];
  safetyMeasures: string[];
  
  // Performance Analytics
  responseTimings: number[];
  qualityTrends: number[];
  engagementLevels: number[];
}

export interface TimeWindow {
  start: Date;
  end: Date;
  activity: string;
  intensity: 'low' | 'medium' | 'high';
  quality: number;
  outcomes: string[];
  
  // Context
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  energyLevel: 'low' | 'medium' | 'high' | 'peak';
  optimalConditions: boolean;
}

export interface ResponseCharacteristics {
  averageLength: number;
  technicalLevel: ExpertiseLevel;
  formalityLevel: FormalityLevel;
  creativityScore: number;
  practicalityScore: number;
  
  // Constitutional Elements
  accuracyMaintained: boolean;
  transparencyLevel: number;
  helpfulnessScore: number;
  safetyCompliance: boolean;
  
  // Adaptation Evidence
  personalizedElements: string[];
  contextualAdjustments: string[];
  learningApplications: string[];
}

// Memory System Interfaces
export interface IMemoryClient {
  // Core Operations
  store(content: string, metadata: MemoryMetadata): Promise<string>;
  retrieve(query: string, options?: MemorySearchOptions): Promise<MemorySearchResult>;
  update(id: string, changes: Partial<MemoryRecord>): Promise<boolean>;
  delete(id: string): Promise<boolean>;
  
  // Advanced Operations
  findSimilar(contentId: string, threshold?: number): Promise<MemoryRecord[]>;
  getByTags(tags: string[]): Promise<MemoryRecord[]>;
  getByTimeRange(start: Date, end: Date): Promise<MemoryRecord[]>;
  
  // Analytics
  getStats(): Promise<MemoryAnalytics>;
  optimizeStorage(): Promise<void>;
  
  // Constitutional Integration
  validateCompliance(content: string): Promise<boolean>;
  auditMemories(): Promise<ValidationResult[]>;
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

export interface ConstitutionalMetrics {
  accuracy: number;      // 0-1
  transparency: number;  // 0-1
  helpfulness: number;   // 0-1
  safety: number;       // 0-1
  overall: number;      // 0-1
  
  violations: string[];
  improvements: string[];
  strengths: string[];
  
  lastAssessment: Date;
  trendDirection: 'improving' | 'stable' | 'declining';
  confidenceLevel: number;
}

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

// Performance and Evolution Interfaces
export interface PerformanceProjection {
  userId: string;
  timeframe: 'short_term' | 'medium_term' | 'long_term';
  
  predictedSatisfaction: number;
  expectedGrowthAreas: string[];
  potentialChallenges: string[];
  
  recommendedAdjustments: string[];
  constitutionalConsiderations: string[];
  qualityProjections: Record<string, number>;
}

export interface MemoryMetadata {
  userId: string;
  sessionId?: string;
  timestamp: Date;
  
  // Content Classification
  category: string;
  tags: string[];
  importance: 'low' | 'medium' | 'high' | 'critical';
  
  // Context
  conversationContext?: string;
  emotionalContext?: EmotionalState;
  temporalContext?: TimeWindow;
  
  // Constitutional Compliance
  constitutionallyValidated: boolean;
  sensitivityLevel: PrivacyLevel;
  
  // Quality Metrics
  relevanceScore: number;
  confidenceScore: number;
  sourceReliability: number;
}

export interface MemoryRecord {
  id: string;
  content: string;
  metadata: MemoryMetadata;
  
  // Relationships
  relatedMemories: string[];
  conversationId?: string;
  parentMemory?: string;
  
  // Evolution
  accessCount: number;
  lastAccessed: Date;
  qualityScore: number;
  
  // Constitutional Tracking
  constitutionalStatus: 'compliant' | 'flagged' | 'requires_review';
  lastValidation: Date;
}

export interface MemorySearchOptions {
  query: string;
  userId?: string;
  
  // Filtering
  categories?: string[];
  tags?: string[];
  timeRange?: { start: Date; end: Date };
  importanceLevel?: ('low' | 'medium' | 'high' | 'critical')[];
  
  // Ranking
  relevanceThreshold?: number;
  qualityThreshold?: number;
  maxResults?: number;
  
  // Constitutional Filtering
  constitutionalOnly?: boolean;
  sensitivityLevels?: PrivacyLevel[];
  
  // Advanced Options
  includeSimilar?: boolean;
  expandContext?: boolean;
  timeWeighting?: number;
}

export interface MemorySearchResult {
  results: MemoryRecord[];
  totalFound: number;
  searchTime: number;
  
  // Quality Metrics
  averageRelevance: number;
  averageQuality: number;
  constitutionalCompliance: number;
  
  // Context
  queryContext: string[];
  suggestedRefinements: string[];
  relatedQueries: string[];
}

export interface MemoryAnalytics {
  totalMemories: number;
  totalSize: number;
  
  // User Distribution
  uniqueUsers: number;
  memoriesPerUser: Record<string, number>;
  
  // Quality Distribution
  qualityDistribution: Record<string, number>;
  constitutionalCompliance: number;
  flaggedContent: number;
  
  // Temporal Patterns
  creationTrends: Record<string, number>;
  accessPatterns: Record<string, number>;
  retentionMetrics: Record<string, number>;
  
  // Content Analysis
  topCategories: Record<string, number>;
  topTags: Record<string, number>;
  sensitivityDistribution: Record<PrivacyLevel, number>;
  
  // Performance
  averageQueryTime: number;
  cacheHitRate: number;
  optimizationOpportunities: string[];
}

export interface IntelligenceInsight {
  id: string;
  type: 'pattern' | 'anomaly' | 'trend' | 'opportunity' | 'risk';
  confidence: number;
  
  // Content
  title: string;
  description: string;
  evidence: string[];
  implications: string[];
  
  // Context
  userId?: string;
  timeframe: { start: Date; end: Date };
  categories: string[];
  
  // Actions
  recommendations: string[];
  preventiveActions: string[];
  monitoringPoints: string[];
  
  // Constitutional Considerations
  ethicalImplications: string[];
  privacyConsiderations: string[];
  safetyAspects: string[];
  
  // Quality
  relevanceScore: number;
  actionabilityScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  createdAt: Date;
  validUntil?: Date;
}

// Context7 Documentation System Interfaces
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
// NLACS - NATURAL LANGUAGE AGENT COMMUNICATION SYSTEM
// ========================================

export interface NLACSMessage {
  messageId: string;
  conversationId: string;
  agentId: string;
  agentType: string;
  content: string;
  messageType: 'response' | 'question' | 'insight' | 'synthesis' | 'challenge';
  timestamp: Date;
  userId: string; // Privacy isolation
  confidence: number;
  referencesTo: string[]; // IDs of messages this responds to
  contextCategory: ContextCategory;
  privacyLevel: PrivacyLevel;
  projectContext?: ProjectContext;
  metadata: ConversationMetadata;
}

export interface NLACSConversation {
  conversationId: string;
  userId: string; // Privacy: Every conversation belongs to specific user
  topic: string;
  contextCategory: ContextCategory;
  privacyLevel: PrivacyLevel;
  projectContext?: ProjectContext;
  participants: {
    agentId: string;
    agentType: string;
    role: 'primary' | 'secondary' | 'observer';
    joinedAt: Date;
  }[];
  messages: NLACSMessage[];
  status: 'active' | 'concluded' | 'archived';
  emergentInsights: string[];
  createdAt: Date;
  lastActivity: Date;
  metadata: ConversationMetadata;
}

export interface NLACSPrivacyControls {
  userId: string;
  allowedAgentTypes: string[];
  blockedAgentTypes: string[];
  contextCategoryPermissions: Record<ContextCategory, boolean>;
  projectAccessPermissions: Record<string, ProjectScope[]>;
  maxConversationLength: number;
  dataRetentionDays: number;
  allowCrossUserInsights: boolean;
  auditLogging: boolean;
}

export interface NLACSOrchestrator {
  startConversation(
    userId: string,
    topic: string,
    contextCategory: ContextCategory,
    projectContext?: ProjectContext,
    initialAgents?: string[]
  ): Promise<string>;
  
  addMessage(
    conversationId: string,
    agentId: string,
    content: string,
    messageType?: string
  ): Promise<string>;
  
  getConversation(conversationId: string): Promise<NLACSConversation | null>;
  getConversationsForUser(userId: string): Promise<NLACSConversation[]>;
  
  concludeConversation(conversationId: string, reason?: string): Promise<void>;
  extractInsights(conversationId: string): Promise<string[]>;
  
  // Privacy and compliance
  enforcePrivacy(userId: string, conversation: NLACSConversation): boolean;
  auditCompliance(conversationId: string): Promise<boolean>;
}

// ========================================
// EXPORT ALL INTERFACES
// ========================================

export * from './user';
