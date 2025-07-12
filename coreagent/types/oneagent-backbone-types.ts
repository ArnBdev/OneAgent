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
    motivationalTiming: 'morning-boost' | 'afternoon-focus' | 'evening-wind-down' | 'night-rest' | 'start-strong' | 'mid-momentum' | 'end-sprint' | 'reflection';
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
    agent?: {
      id: string;
      type: string;
    } | string; // Allow both object and string to match implementation
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
}

export interface UnifiedMetadataService {
  create(type: string, source: string, options?: Partial<UnifiedMetadata>): UnifiedMetadata;
  update(id: string, changes: Partial<UnifiedMetadata>): UnifiedMetadata;
  retrieve(id: string): UnifiedMetadata | null;
  validateQuality(metadata: UnifiedMetadata): { valid: boolean; score: number; issues: string[] };
  createInterAgentMetadata(
    communicationType: 'direct_message' | 'multi_agent' | 'broadcast' | 'coordination' | 'delegation',
    sourceAgentId: string,
    userId: string,
    sessionId: string,
    options?: Record<string, unknown>
  ): UnifiedMetadata; // Updated to match actual implementation
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
  | 'triage';

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
  timeService?: { status: string; responseTime: number; operational: boolean; accuracy?: number; performance?: number }; // Added to match implementation
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
  metadata: MemoryMetadata;
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
  store(content: string, metadata: MemoryMetadata): Promise<string>;
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
  metadata: Record<string, unknown> | {
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
// END OF CANONICAL TYPES
// ========================================
