/**
 * OneAgent Unified Metadata Architecture
 * Single Source of Truth Implementation - ENHANCED WITH CONTEXT7
 * 
 * This architecture unifies all OneAgent metadata systems into a coherent,
 * efficient, and extensible framework that serves as the foundation for
 * all user data, learnings, and knowledge management.
 * 
 * BMAD ANALYSIS INTEGRATION: Addresses fragmentation, enables synergies
 * CONTEXT7 ENHANCEMENT: Documentation intelligence with semantic search
 * CONSTITUTIONAL AI: Built-in validation and quality assurance
 * 
 * @version 2.0.0 - Unified Architecture with Context7 Integration
 * @date June 18, 2025
 * @integrates Context7 Enhanced Metadata + Constitutional AI + Cross-Agent Intelligence
 */

// =====================================
// CORE UNIFIED METADATA SCHEMA
// =====================================

/**
 * Base metadata interface that all OneAgent metadata inherits from
 * Provides common fields and Constitutional AI integration
 */
export interface OneAgentBaseMetadata {
  // === IDENTITY & TEMPORAL ===
  id: string;
  entityType: MetadataEntityType;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // agentId or userId
  
  // === CONSTITUTIONAL AI INTEGRATION ===
  constitutional: {
    validated: boolean;
    validatedAt?: Date;
    principleScores: {
      accuracy: number;      // 0-1 preference for truth over speculation
      transparency: number;  // 0-1 explicit reasoning and limitations
      helpfulness: number;   // 0-1 actionable, relevant guidance
      safety: number;        // 0-1 avoidance of harmful recommendations
    };
    overallScore: number;    // 0-1 weighted average
    violations: string[];    // List of principle violations
    confidence: number;      // 0-1 validation confidence
  };

  // === QUALITY METRICS ===
  quality: {
    relevanceScore: number;     // 0-1 relevance to context
    freshnessScore: number;     // 0-1 based on recency and updates
    authorityScore: number;     // 0-1 source credibility
    usageScore: number;         // 0-1 based on usage patterns
    overallQuality: number;     // 0-1 composite quality score
    lastQualityCheck: Date;
    qualityTrend: 'improving' | 'stable' | 'declining';
  };

  // === SEMANTIC ENRICHMENT ===
  semantics: {
    primaryTags: string[];      // Main categorization tags
    secondaryTags: string[];    // Related/contextual tags
    keywordDensity: Record<string, number>; // Term frequency mapping
    semanticVector?: number[];  // AI-generated embedding vector
    relatedEntities: EntityReference[]; // Cross-references
    synonyms: string[];         // Alternative terminology
  };

  // === EXTENSIBLE METADATA ===
  extensions: Record<string, unknown>; // Domain-specific extensions
  
  // === CHANGE TRACKING ===
  changeHistory: MetadataChange[];
  
  // === VALIDATION RULES ===
  validationRules?: ValidationRule[];
  validationStatus: 'valid' | 'invalid' | 'pending' | 'unknown';
  validationErrors?: string[];
}

// =====================================
// ENTITY TYPES AND REFERENCES
// =====================================

export type MetadataEntityType = 
  | 'conversation'
  | 'user_profile' 
  | 'learning_pattern'
  | 'documentation'
  | 'session_context'
  | 'agent_memory'
  | 'cross_reference'
  | 'quality_metric'
  | 'constitutional_validation';

export interface EntityReference {
  id: string;
  entityType: MetadataEntityType;
  relationshipType: 'prerequisite' | 'follow_up' | 'related' | 'alternative' | 'conflicting';
  relevanceScore: number; // 0-1
  description?: string;
}

export interface MetadataChange {
  timestamp: Date;
  changeType: 'create' | 'update' | 'delete' | 'merge';
  changedBy: string;
  changedFields: string[];
  previousValues?: Record<string, unknown>;
  changeReason?: string;
}

export interface ValidationRule {
  ruleId: string;
  description: string;
  validator: (metadata: OneAgentBaseMetadata) => boolean;
  errorMessage: string;
  severity: 'error' | 'warning' | 'info';
}

// =====================================
// DOMAIN-SPECIFIC METADATA EXTENSIONS
// =====================================

/**
 * Conversation-specific metadata extension
 * Integrates ConversationMetadata from unified.ts with enhanced features
 */
export interface ConversationMetadataExtension {
  // === USER INTERACTION ANALYSIS ===
  userAnalysis: {
    communicationStyle: 'formal' | 'casual' | 'technical' | 'conversational';
    expertiseLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    intentCategory: 'question' | 'request' | 'complaint' | 'compliment' | 'exploration';
    emotionalState: {
      primary: 'positive' | 'neutral' | 'frustrated' | 'confused' | 'satisfied';
      intensity: number; // 0-1
      confidence: number; // 0-1
    };
    contextComplexity: number; // 0-1
    urgencyLevel: number; // 0-1
  };

  // === RESPONSE ANALYSIS ===
  responseAnalysis: {
    responseTimeMs: number;
    tokensUsed: number;
    codeExamplesProvided: boolean;
    stepByStepBreakdown: boolean;
    followUpSuggestions: string[];
    constitutionalCompliance: number; // 0-1
  };

  // === LEARNING EXTRACTION ===
  learningOpportunities: {
    patternsIdentified: string[];
    improvementSuggestions: string[];
    knowledgeGaps: string[];
    successIndicators: string[];
  };

  // === SESSION CONTINUITY ===
  sessionContext: {
    sessionId: string;
    messageCount: number;
    topicProgression: string[];
    contextCarryover: Record<string, unknown>;
  };
}

/**
 * Documentation-specific metadata extension
 * Integrates Context7 Enhanced Metadata with unified system
 */
export interface DocumentationMetadataExtension {
  // === SEARCH OPTIMIZATION ===
  searchOptimization: {
    primaryTechnology: string[];    // [nodejs, typescript, react]
    technologyVersions: Record<string, string>; // { "nodejs": "22.x" }
    useCase: 'setup' | 'troubleshooting' | 'optimization' | 'migration' | 'feature';
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    prerequisites: string[];
    estimatedReadTime: number; // minutes
  };

  // === CONTENT ANALYSIS ===
  contentAnalysis: {
    codeExamples: number;
    hasStepByStep: boolean;
    hasWarnings: boolean;
    hasAlternatives: boolean;
    completenessScore: number; // 0-1
    practicalityScore: number; // 0-1
  };

  // === SOURCE AUTHORITY ===
  sourceAuthority: {
    isOfficialDocumentation: boolean;
    sourceUrl?: string;
    authorCredibility: number; // 0-1
    lastVerified: Date;
    verificationMethod: 'manual' | 'automated' | 'crowd_sourced';
  };

  // === USAGE PATTERNS ===
  usagePatterns: {
    accessCount: number;
    lastAccessed: Date;
    averageSessionDuration: number; // seconds
    userSatisfactionScore: number; // 0-1
    problemSolutionRate: number; // 0-1
    peakUsageTimes: string[]; // ['morning', 'project_start']
  };

  // === CROSS-REFERENCES ===
  documentationRelationships: {
    dependsOn: EntityReference[];
    enablesAccess: EntityReference[];
    conflicts: EntityReference[];
    supersedes: EntityReference[];
    isSupersededBy: EntityReference[];
  };
}

/**
 * User profile metadata extension
 * Enhanced user profiling with learning analytics
 */
export interface UserProfileMetadataExtension {
  // === LEARNING ANALYTICS ===
  learningAnalytics: {
    totalLearningEvents: number;
    learningVelocity: number; // concepts per day
    retentionRate: number; // 0-1
    preferredLearningStyle: 'visual' | 'textual' | 'interactive' | 'example_driven';
    masteryProgression: Record<string, number>; // technology -> mastery (0-1)
  };

  // === INTERACTION PATTERNS ===
  interactionPatterns: {
    averageSessionLength: number; // minutes
    preferredInteractionTimes: string[]; // ['morning', 'evening']
    questionPatterns: string[]; // Common question types
    successfulInteractionPatterns: string[];
    problematicPatterns: string[];
  };

  // === PREFERENCES & BOUNDARIES ===
  preferences: {
    communicationStyle: 'formal' | 'casual' | 'technical' | 'conversational';
    responseLength: 'concise' | 'moderate' | 'detailed' | 'comprehensive';
    technicalLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    codeExamplePreference: 'minimal' | 'annotated' | 'comprehensive';
    privacyLevel: 'public' | 'internal' | 'confidential' | 'restricted';
  };

  // === CONSTITUTIONAL PREFERENCES ===
  constitutionalPreferences: {
    safetyThreshold: number; // 0-1 minimum safety score
    transparencyRequirement: number; // 0-1 required transparency level
    accuracyStandard: number; // 0-1 minimum accuracy requirement
    helpfulnessWeight: number; // 0-1 helpfulness vs accuracy balance
  };
}

/**
 * Learning pattern metadata extension
 * Enhanced pattern recognition and application tracking
 */
export interface LearningPatternMetadataExtension {
  // === PATTERN ANALYSIS ===
  patternAnalysis: {
    patternType: 'behavioral' | 'functional' | 'error' | 'success' | 'optimization';
    applicabilityScope: 'user_specific' | 'technology_specific' | 'universal';
    confidenceLevel: number; // 0-1
    strengthTrend: 'increasing' | 'stable' | 'decreasing';
    lastReinforcement: Date;
  };

  // === APPLICATION TRACKING ===
  applicationTracking: {
    totalApplications: number;
    successfulApplications: number;
    failedApplications: number;
    successRate: number; // 0-1
    averageImpact: number; // 0-1
    lastSuccessfulApplication: Date;
  };

  // === CROSS-AGENT INTELLIGENCE ===
  crossAgentIntelligence: {
    applicableAgents: string[]; // Agent IDs where pattern is useful
    agentSuccessRates: Record<string, number>; // agentId -> success rate
    collaborativeConfidence: number; // 0-1 cross-agent consensus
    transferability: number; // 0-1 how well pattern transfers
  };

  // === EVOLUTION TRACKING ===
  evolutionTracking: {
    generationsApplied: number;
    mutationRate: number; // 0-1 how much pattern changes
    stabilityScore: number; // 0-1 pattern consistency
    evolutionHistory: PatternEvolution[];
  };
}

export interface PatternEvolution {
  generation: number;
  timestamp: Date;
  changes: string[];
  performanceImpact: number; // -1 to 1
  stabilityImpact: number; // -1 to 1
  adoptionRate: number; // 0-1
}

// =====================================
// UNIFIED METADATA REPOSITORY
// =====================================

/**
 * Central repository for all OneAgent metadata
 * Provides unified access, querying, and management
 */
export interface OneAgentMetadataRepository {
  // === CORE CRUD OPERATIONS ===
  create<T extends OneAgentBaseMetadata>(metadata: T): Promise<string>;
  read<T extends OneAgentBaseMetadata>(id: string): Promise<T | null>;
  update<T extends OneAgentBaseMetadata>(id: string, updates: Partial<T>): Promise<void>;
  delete(id: string): Promise<void>;

  // === UNIFIED QUERYING ===
  query<T extends OneAgentBaseMetadata>(query: UnifiedMetadataQuery): Promise<MetadataQueryResult<T>>;
  semanticSearch(query: string, options?: SemanticSearchOptions): Promise<MetadataQueryResult<OneAgentBaseMetadata>>;

  // === CONSTITUTIONAL AI INTEGRATION ===
  validateConstitutional(metadata: OneAgentBaseMetadata): Promise<ConstitutionalValidationResult>;
  batchValidateConstitutional(metadataIds: string[]): Promise<Record<string, ConstitutionalValidationResult>>;

  // === QUALITY MANAGEMENT ===
  updateQualityMetrics(id: string): Promise<void>;
  getQualityTrends(entityType?: MetadataEntityType, timeRange?: DateRange): Promise<QualityTrendReport>;

  // === SEMANTIC ENRICHMENT ===
  enrichSemantics(id: string): Promise<void>;
  generateEmbeddings(content: string): Promise<number[]>;
  findSimilar(id: string, options?: SimilaritySearchOptions): Promise<EntityReference[]>;

  // === CROSS-SYSTEM INTEGRATION ===
  syncWithLegacySystems(): Promise<SyncReport>;
  migrateFromLegacySystem(systemName: string): Promise<MigrationReport>;

  // === ANALYTICS & INSIGHTS ===
  getUsageAnalytics(timeRange: DateRange): Promise<UsageAnalyticsReport>;
  generateInsights(entityType: MetadataEntityType): Promise<MetadataInsights>;
}

// =====================================
// QUERY AND SEARCH INTERFACES
// =====================================

export interface UnifiedMetadataQuery {
  entityTypes?: MetadataEntityType[];
  tags?: string[];
  qualityThreshold?: number;
  constitutionalCompliance?: boolean;
  dateRange?: DateRange;
  semanticSimilarity?: {
    referenceId: string;
    threshold: number;
  };
  customFilters?: Record<string, unknown>;
  orderBy?: QueryOrderBy[];
  limit?: number;
  offset?: number;
}

export interface QueryOrderBy {
  field: string;
  direction: 'asc' | 'desc';
}

export interface MetadataQueryResult<T extends OneAgentBaseMetadata> {
  items: T[];
  totalCount: number;
  executionTimeMs: number;
  qualityScore: number;
  constitutionalCompliance: boolean;
}

export interface SemanticSearchOptions {
  entityTypes?: MetadataEntityType[];
  threshold?: number;
  limit?: number;
  includeSemanticScore?: boolean;
}

// =====================================
// CONSTITUTIONAL AI INTEGRATION
// =====================================

export interface ConstitutionalValidationResult {
  passed: boolean;
  overallScore: number;
  principleScores: {
    accuracy: number;
    transparency: number;
    helpfulness: number;
    safety: number;
  };
  violations: ConstitutionalViolation[];
  recommendations: string[];
  confidence: number;
  validatedAt: Date;
}

export interface ConstitutionalViolation {
  principle: 'accuracy' | 'transparency' | 'helpfulness' | 'safety';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestion: string;
  affectedFields: string[];
}

// =====================================
// ANALYTICS AND REPORTING
// =====================================

export interface QualityTrendReport {
  timeRange: DateRange;
  averageQuality: number;
  qualityTrend: 'improving' | 'stable' | 'declining';
  entityBreakdown: Record<MetadataEntityType, number>;
  topQualityItems: EntityReference[];
  qualityIssues: QualityIssue[];
}

export interface QualityIssue {
  entityId: string;
  issueType: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendedAction: string;
}

export interface UsageAnalyticsReport {
  timeRange: DateRange;
  totalAccesses: number;
  uniqueUsers: number;
  popularEntities: EntityReference[];
  usagePatterns: UsagePattern[];
  performanceMetrics: PerformanceMetrics;
}

export interface UsagePattern {
  pattern: string;
  frequency: number;
  associatedEntities: string[];
  timeDistribution: Record<string, number>;
}

export interface PerformanceMetrics {
  averageQueryTime: number;
  averageResponseSize: number;
  cacheHitRate: number;
  errorRate: number;
}

export interface MetadataInsights {
  entityType: MetadataEntityType;
  totalEntities: number;
  qualitySummary: QualityTrendReport;
  emergingPatterns: string[];
  optimizationOpportunities: string[];
  crossSystemSynergies: string[];
}

// =====================================
// SUPPORTING TYPES
// =====================================

export interface DateRange {
  start: Date;
  end: Date;
}

export interface SyncReport {
  systemName: string;
  entitiesSynced: number;
  conflictsResolved: number;
  errors: string[];
  duration: number; // milliseconds
}

export interface MigrationReport {
  systemName: string;
  entitiesMigrated: number;
  entitiesFailed: number;
  errors: string[];
  duration: number; // milliseconds
  rollbackPlan: string;
}

export interface SimilaritySearchOptions {
  threshold?: number;
  limit?: number;
  entityTypes?: MetadataEntityType[];
  includeScore?: boolean;
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. This unified architecture provides a single source of truth for all OneAgent metadata
 * 2. Constitutional AI is integrated at the core level, ensuring compliance across all systems
 * 3. Context7 enhanced metadata is seamlessly integrated as DocumentationMetadataExtension
 * 4. The extensible design allows for future domain-specific metadata without breaking changes
 * 5. Cross-system querying and analytics provide unprecedented insight into system behavior
 * 6. Quality metrics and semantic enrichment enable intelligent optimization and learning
 * 
 * MIGRATION STRATEGY:
 * 
 * 1. Implement OneAgentMetadataRepository with backward compatibility adapters
 * 2. Gradually migrate existing systems to use unified interfaces
 * 3. Provide migration tools and comprehensive documentation
 * 4. Maintain performance through intelligent caching and indexing
 * 5. Establish monitoring and alerting for quality and performance metrics
 */
