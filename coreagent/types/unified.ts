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
// EXPORT ALL INTERFACES
// ========================================

export * from './user';
