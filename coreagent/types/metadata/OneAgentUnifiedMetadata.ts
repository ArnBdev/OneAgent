/**
 * OneAgent Unified Metadata System
 * Single Source of Truth for All Metadata
 * 
 * This is the foundational metadata system that serves as the base for all
 * OneAgent components, incorporating Context7 enhancements, Constitutional AI
 * validation, and cross-system compatibility.
 * 
 * Version: 1.0.0
 * Created: 2024-06-18
 */

// =====================================
// CONSTITUTIONAL AI METADATA
// =====================================

export interface ConstitutionalAIMetadata {
  // Constitutional AI Compliance
  accuracy: {
    score: number; // 0-100
    validated: boolean;
    validatedAt?: Date;
    validationMethod: 'manual' | 'ai' | 'peer-review';
    confidence: number; // 0-1
  };
  
  transparency: {
    score: number; // 0-100
    sourcesDocumented: boolean;
    reasoningExplained: boolean;
    limitationsAcknowledged: boolean;
    uncertaintyHandled: boolean;
  };
  
  helpfulness: {
    score: number; // 0-100
    actionable: boolean;
    relevant: boolean;
    userFocused: boolean;
    clarityLevel: 'poor' | 'fair' | 'good' | 'excellent';
  };
  
  safety: {
    score: number; // 0-100
    harmfulContentCheck: boolean;
    misinformationCheck: boolean;
    biasCheck: boolean;
    ethicalReview: boolean;
  };
  
  overallCompliance: {
    score: number; // 0-100
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    lastValidated: Date;
    validatedBy: string;
    complianceHistory: Array<{
      timestamp: Date;
      score: number;
      validator: string;
    }>;
  };
}

// =====================================
// QUALITY METADATA
// =====================================

export interface QualityMetadata {
  // Quality Scoring
  qualityScore: {
    overall: number; // 0-100
    accuracy: number;
    completeness: number;
    relevance: number;
    clarity: number;
    maintainability: number;
    performance: number;
  };
  
  // Quality Standards
  standards: {
    minimumThreshold: number; // Default: 80
    targetThreshold: number; // Default: 90
    currentStatus: 'below-minimum' | 'meets-minimum' | 'meets-target' | 'exceeds-target';
    improvementSuggestions: string[];
  };
  
  // Quality History
  qualityHistory: Array<{
    timestamp: Date;
    score: number;
    measuredBy: string;
    improvements: string[];
    degradations: string[];
  }>;
}

// =====================================
// SEMANTIC METADATA
// =====================================

export interface SemanticMetadata {
  // Semantic Tags
  semanticTags: {
    primary: string[]; // Main concepts
    secondary: string[]; // Supporting concepts
    contextual: string[]; // Contextual concepts
    temporal: string[]; // Time-based concepts
    hierarchical: string[]; // Parent-child relationships
  };
  
  // Embeddings
  embeddings: {
    vector?: number[]; // 768-dimensional vector
    model: string; // e.g., 'text-embedding-ada-002'
    generatedAt: Date;
    confidence: number;
  };
  
  // Relationships
  relationships: {
    relatedIds: string[];
    relationshipTypes: Record<string, 'parent' | 'child' | 'sibling' | 'reference' | 'similar'>;
    strength: Record<string, number>; // 0-1
    context: Record<string, string>;
  };
  
  // Searchability
  searchability: {
    searchTerms: string[];
    aliases: string[];
    synonyms: string[];
    categories: string[];
    indexingPriority: 'low' | 'medium' | 'high' | 'critical';
  };
}

// =====================================
// CONTEXT METADATA
// =====================================

export interface ContextMetadata {
  // Context Information
  context: {
    domain: string; // e.g., 'typescript', 'nodejs', 'react'
    subdomain?: string; // e.g., 'performance', 'testing', 'configuration'
    framework?: string; // e.g., 'Next.js', 'Express', 'Vite'
    version?: string; // e.g., 'v22', '5.7', 'latest'
    environment: 'development' | 'staging' | 'production' | 'testing';
  };
  
  // Usage Context
  usage: {
    frequencyAccessed: number;
    lastAccessed: Date;
    accessPatterns: Array<{
      timestamp: Date;
      userId: string;
      context: string;
      outcome: 'success' | 'partial' | 'failure';
    }>;
    popularityScore: number; // 0-100
  };
    // Temporal Context (Enhanced - integrated into main temporal section above)
  temporalLegacy: {
    relevanceWindow: {
      start?: Date;
      end?: Date;
      indefinite: boolean;
    };
    versionRelevance: string[];
    deprecationStatus?: {
      deprecated: boolean;
      deprecatedAt?: Date;
      replacement?: string;
      migrationGuide?: string;
    };
  };
}

// =====================================
// BASE METADATA INTERFACE
// =====================================

export interface OneAgentBaseMetadata {
  // Core Identity
  id: string;
  version: string;
  schemaVersion: string; // Metadata schema version
  
  // Core Properties
  type: string; // e.g., 'conversation', 'memory', 'documentation', 'user-profile'
  title: string;
  description?: string;
    // Timestamps (Enhanced with Real-time Intelligence)
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt?: Date;
  
  // Enhanced temporal metadata
  temporal: {
    // Real-time tracking
    realTime: {
      createdAtUnix: number;
      updatedAtUnix: number;
      lastAccessedUnix?: number;
      timezoneCaptured: string;
      utcOffset: number;
    };
    
    // Context at creation
    contextSnapshot: {
      timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' | 'early-morning' | 'late-night';
      dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
      businessContext: boolean;
      seasonalContext: 'spring' | 'summer' | 'fall' | 'winter';
      userEnergyContext?: 'low' | 'medium' | 'high' | 'peak';
    };
    
    // Temporal relevance and intelligence
    relevance: {
      isTimeDependent: boolean;
      relevanceDecay: 'none' | 'slow' | 'medium' | 'fast';
      temporalTags: string[]; // e.g., 'morning-routine', 'quarterly-review'
      futureRelevance?: {
        relevantAt: Date[];
        reminderTiming: 'before' | 'during' | 'after';
        contextNeeded: string[];
      };
    };
    
    // Life coaching temporal features
    lifeCoaching: {
      habitTimestamp: boolean;
      goalTimeline: {
        isGoalRelated: boolean;
        timeframe: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'lifetime';
        milestoneTiming?: Date[];
      };
      emotionalTiming: {
        emotionalState?: 'positive' | 'neutral' | 'challenging' | 'breakthrough';
        energyAlignment: boolean;
        reflectionTiming: boolean;
      };
    };
    
    // Professional timing intelligence
    professional: {
      projectPhase: 'planning' | 'execution' | 'review' | 'maintenance';
      urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
      deadlineAwareness: {
        hasDeadline: boolean;
        deadline?: Date;
        bufferTime?: number;
        criticalPath: boolean;
      };
      collaborationTiming: {
        requiresRealTime: boolean;
        asyncFriendly: boolean;
        timezoneSensitive: boolean;
      };
    };
  };
  
  // Source Information
  source: {
    origin: string; // Where this metadata originated
    creator: string; // Who/what created it
    system: string; // Which OneAgent system
    component?: string; // Specific component
  };
  
  // Constitutional AI Compliance
  constitutional: ConstitutionalAIMetadata;
  
  // Quality Metrics
  quality: QualityMetadata;
  
  // Semantic Information
  semantic: SemanticMetadata;
  
  // Context Information
  context: ContextMetadata;
  
  // Cross-System Integration
  integration: {
    systemIds: Record<string, string>; // e.g., { 'context7': 'ctx7_123', 'memory': 'mem_456' }
    syncStatus: Record<string, 'synced' | 'pending' | 'error' | 'disabled'>;
    lastSyncAt: Record<string, Date>;
    conflicts: Array<{
      system: string;
      field: string;
      localValue: unknown;
      remoteValue: unknown;
      resolvedAt?: Date;
      resolution?: 'local' | 'remote' | 'merge' | 'manual';
    }>;
  };
  
  // Validation
  validation: {
    isValid: boolean;
    validatedAt?: Date;
    validationErrors: Array<{
      field: string;
      error: string;
      severity: 'error' | 'warning' | 'info';
    }>;
    schemaCompliant: boolean;
  };
  
  // Extension Points
  extensions: Record<string, unknown>; // For domain-specific extensions
  
  // System Metadata
  system: {
    readonly: boolean;
    archived: boolean;
    indexed: boolean;
    cached: boolean;
    priority: 'low' | 'medium' | 'high' | 'critical';
    retention: {
      policy: 'indefinite' | 'temporary' | 'session' | 'custom';
      expiresAt?: Date;
      archiveAfter?: Date;
    };
  };
}

// =====================================
// SPECIALIZED METADATA INTERFACES
// =====================================

// Documentation Metadata (Context7 Enhanced)
export interface DocumentationMetadata extends OneAgentBaseMetadata {
  type: 'documentation';
  
  // Documentation-specific properties
  documentation: {
    sourceType: 'official' | 'community' | 'internal' | 'generated';
    sourceUrl?: string;
    lastChecked?: Date;
    verificationStatus: 'verified' | 'unverified' | 'outdated' | 'deprecated';
    
    // Content Structure
    structure: {
      format: 'markdown' | 'html' | 'pdf' | 'text' | 'code';
      sections: string[];
      codeExamples: number;
      hasImages: boolean;
      hasVideos: boolean;
      interactiveElements: boolean;
    };
    
    // Learning Metadata
    learning: {
      difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
      prerequisites: string[];
      learningObjectives: string[];
      estimatedReadTime: number; // minutes
      practicalValue: number; // 0-100
    };
    
    // Best Practices
    bestPractices: {
      identified: string[];
      antiPatterns: string[];
      recommendations: string[];
      warningsAndCaveats: string[];
    };
  };
}

// Memory Metadata
export interface MemoryMetadata extends OneAgentBaseMetadata {
  type: 'memory';
  
  // Memory-specific properties
  memory: {
    memoryType: 'short_term' | 'long_term' | 'workflow' | 'session';
    importance: number; // 0-100
    confidence: number; // 0-1
    
    // Memory Patterns
    patterns: {
      accessFrequency: number;
      recallSuccess: number; // 0-1
      associationStrength: Record<string, number>;
      forgettingCurve: {
        initialStrength: number;
        decayRate: number;
        lastReinforced: Date;
      };
    };
    
    // Learning Context
    learningContext: {
      sessionId?: string;
      conversationId?: string;
      taskContext?: string;
      userGoals: string[];
      outcomeSuccess: boolean;
    };
  };
}

// Conversation Metadata
export interface ConversationMetadata extends OneAgentBaseMetadata {
  type: 'conversation';
  
  // Conversation-specific properties
  conversation: {
    participants: Array<{
      id: string;
      role: 'user' | 'assistant' | 'system';
      name?: string;
    }>;
    
    // Conversation Flow
    flow: {
      messageCount: number;
      turnCount: number;
      avgResponseTime: number;
      complexity: 'simple' | 'moderate' | 'complex' | 'expert';
      completionStatus: 'ongoing' | 'completed' | 'abandoned' | 'transferred';
    };
    
    // Conversation Intelligence
    intelligence: {
      mainTopics: string[];
      resolvedIssues: string[];
      pendingItems: string[];
      actionItems: string[];
      learningOpportunities: string[];
      satisfactionScore?: number; // 0-100
    };
    
    // Session Context
    session: {
      sessionId: string;
      startTime: Date;
      endTime?: Date;
      userGoals: string[];
      achievedGoals: string[];
      contextContinuity: number; // 0-1
    };
  };
}

// NLACS MULTI-AGENT CONVERSATION METADATA
// =====================================

export interface NLACSConversationMetadata extends Omit<ConversationMetadata, 'type'> {
  type: 'nlacs-conversation';
  
  // NLACS-specific properties
  nlacs: {
    // Multi-agent orchestration
    orchestration: {
      conversationId: string;
      orchestratorVersion: string;
      agentCount: number;
      agentTypes: string[];
      emergentInsightsCount: number;
      synthesesGenerated: number;
    };
    
    // Agent participation tracking
    agents: Array<{
      agentId: string;
      agentType: string;
      role: 'primary' | 'secondary' | 'observer';
      joinedAt: Date;
      messageCount: number;
      lastMessageAt?: Date;
      confidenceAverage: number;
      contributionQuality: number; // 0-100
    }>;
    
    // Message analysis
    messageAnalysis: {
      messageTypes: {
        question: number;
        response: number;
        insight: number;
        synthesis: number;
        challenge: number;
      };
      averageConfidence: number;
      crossReferences: number;
      emergentPatterns: string[];
    };
    
    // Context and privacy
    context: {
      domain: string; // e.g., 'finance', 'health', 'coding', 'career'
      contextTags: string[]; // e.g., ['budgeting', 'WORKPLACE'], ['investment', 'PRIVATE']
      privacyLevel: 'PRIVATE' | 'WORKPLACE' | 'PUBLIC' | 'CONFIDENTIAL';
      projectContext?: {
        projectId?: string;
        topicId?: string;
        additionalTags?: string[];
      };
    };
    
    // Emergent intelligence tracking
    emergentIntelligence: {
      breakthroughMoments: Array<{
        messageId: string;
        timestamp: Date;
        insight: string;
        contributingAgents: string[];
        confidenceScore: number;
      }>;
      crossDomainConnections: string[];
      novelSolutions: string[];
      workflowInnovations: string[];
      qualityScore: number; // Overall conversation quality 0-100
    };
    
    // Status and lifecycle
    lifecycle: {
      status: 'active' | 'concluded' | 'archived' | 'paused';
      conclusion?: {
        reason: 'goal-achieved' | 'consensus-reached' | 'user-concluded' | 'timeout';
        summary: string;
        actionItems: string[];
        followUpRecommendations: string[];
      };
    };
  };
}

// NLACS Domain Templates for common use cases
export interface NLACSDomainTemplate {
  domain: string;
  description: string;
  recommendedAgents: string[];
  commonContextTags: string[];
  privacyLevel: 'PRIVATE' | 'WORKPLACE' | 'PUBLIC';
  exampleTopics: string[];
  expectedOutcomes: string[];
}

export const NLACSDomainTemplates: Record<string, NLACSDomainTemplate> = {
  finance: {
    domain: 'finance',
    description: 'Financial planning, budgeting, and investment decisions',
    recommendedAgents: ['FinancialAnalyst', 'InvestmentAdvisor', 'TaxOptimizer', 'RiskAssessment'],
    commonContextTags: ['budgeting', 'investment', 'tax-planning', 'risk-management'],
    privacyLevel: 'PRIVATE',
    exampleTopics: ['Budget optimization', 'Investment strategy', 'Tax planning', 'Risk assessment'],
    expectedOutcomes: ['Optimized financial plans', 'Investment recommendations', 'Tax strategies', 'Risk mitigation']
  },
  
  health: {
    domain: 'health',
    description: 'Health, wellness, and medical decision support',
    recommendedAgents: ['HealthAdvisor', 'NutritionSpecialist', 'FitnessTrainer', 'MedicalResearcher'],
    commonContextTags: ['wellness', 'nutrition', 'fitness', 'preventive-care'],
    privacyLevel: 'PRIVATE',
    exampleTopics: ['Nutrition planning', 'Fitness optimization', 'Health monitoring', 'Preventive care'],
    expectedOutcomes: ['Personalized health plans', 'Nutrition strategies', 'Fitness routines', 'Health insights']
  },
  
  career: {
    domain: 'career',
    description: 'Professional development and career advancement',
    recommendedAgents: ['CareerCoach', 'SkillsAnalyst', 'NetworkingExpert', 'IndustryAnalyst'],
    commonContextTags: ['professional-development', 'skill-building', 'networking', 'career-growth'],
    privacyLevel: 'WORKPLACE',
    exampleTopics: ['Career planning', 'Skill development', 'Job search strategy', 'Leadership growth'],
    expectedOutcomes: ['Career roadmaps', 'Skill development plans', 'Networking strategies', 'Leadership insights']
  },
  
  coding: {
    domain: 'coding',
    description: 'Software development and technical architecture',
    recommendedAgents: ['SoftwareArchitect', 'CodeReviewer', 'PerformanceOptimizer', 'SecurityExpert'],
    commonContextTags: ['software-development', 'architecture', 'performance', 'security'],
    privacyLevel: 'WORKPLACE',
    exampleTopics: ['Architecture design', 'Code optimization', 'Security review', 'Performance tuning'],
    expectedOutcomes: ['Technical solutions', 'Architecture recommendations', 'Security improvements', 'Performance optimizations']
  }
};


// =====================================
// METADATA UTILITY TYPES
// =====================================

export type MetadataType = 
  | 'documentation' 
  | 'memory' 
  | 'conversation' 
  | 'user-profile' 
  | 'system' 
  | 'integration' 
  | 'custom';

export type AnyMetadata = 
  | DocumentationMetadata 
  | MemoryMetadata 
  | ConversationMetadata 
  | OneAgentBaseMetadata;

// =====================================
// METADATA FACTORY INTERFACE
// =====================================

export interface MetadataFactory {
  create<T extends AnyMetadata>(type: MetadataType, data: Partial<T>): T;
  validate<T extends AnyMetadata>(metadata: T): boolean;
  migrate<T extends AnyMetadata>(metadata: Record<string, unknown>, fromVersion: string, toVersion: string): T;
  merge<T extends AnyMetadata>(metadata1: T, metadata2: T): T;
}

// =====================================
// METADATA REPOSITORY INTERFACE
// =====================================

export interface MetadataRepository {
  // CRUD Operations
  create<T extends AnyMetadata>(metadata: T): Promise<T>;
  read<T extends AnyMetadata>(id: string): Promise<T | null>;
  update<T extends AnyMetadata>(id: string, updates: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
  
  // Query Operations
  query<T extends AnyMetadata>(criteria: MetadataQueryCriteria): Promise<T[]>;
  search<T extends AnyMetadata>(query: string, options?: SearchOptions): Promise<T[]>;
  
  // Relationship Operations
  getRelated<T extends AnyMetadata>(id: string, relationshipType?: string): Promise<T[]>;
  createRelationship(fromId: string, toId: string, relationshipType: string, strength?: number): Promise<boolean>;
  
  // Validation and Quality
  validate<T extends AnyMetadata>(metadata: T): Promise<ValidationResult>;
  scoreQuality<T extends AnyMetadata>(metadata: T): Promise<QualityScore>;
  
  // Constitutional AI
  validateConstitutional<T extends AnyMetadata>(metadata: T): Promise<ConstitutionalValidationResult>;
  
  // Synchronization
  sync(systemId: string, metadataId: string): Promise<SyncResult>;
  bulkSync(systemId: string, metadataIds: string[]): Promise<SyncResult[]>;
}

// =====================================
// SUPPORTING TYPES
// =====================================

export interface MetadataQueryCriteria {
  type?: MetadataType;
  tags?: string[];
  dateRange?: { start: Date; end: Date };
  qualityRange?: { min: number; max: number };
  constitutionalCompliance?: boolean;
  systems?: string[];
  archived?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchOptions {
  includeContent?: boolean;
  semanticSearch?: boolean;
  fuzzyMatch?: boolean;
  maxResults?: number;
  relevanceThreshold?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  warnings: string[];
  suggestions: string[];
}

export interface QualityScore {
  overall: number;
  breakdown: Record<string, number>;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  improvements: string[];
}

export interface ConstitutionalValidationResult {
  compliant: boolean;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  breakdown: {
    accuracy: number;
    transparency: number;
    helpfulness: number;
    safety: number;
  };
  violations: string[];
  recommendations: string[];
}

export interface SyncResult {
  success: boolean;
  metadataId: string;
  systemId: string;
  conflicts: Array<{
    field: string;
  localValue: unknown;
  remoteValue: unknown;
    resolved: boolean;
    resolution?: 'local' | 'remote' | 'merge';
  }>;
  syncedAt: Date;
}

/**
 * This unified metadata system provides:
 * 
 * 1. **Single Source of Truth**: All metadata follows OneAgentBaseMetadata
 * 2. **Constitutional AI Integration**: Built-in compliance tracking
 * 3. **Quality Assurance**: Comprehensive quality scoring and validation
 * 4. **Semantic Intelligence**: Rich semantic tagging and relationships
 * 5. **Cross-System Compatibility**: Unified integration across all OneAgent systems
 * 6. **Context7 Enhancement**: Enhanced documentation metadata for superior learning
 * 7. **Extensibility**: Clean extension points for domain-specific needs
 * 8. **Performance**: Optimized for indexing, searching, and retrieval
 * 
 * This foundation enables the OneAgent ecosystem to achieve true metadata
 * coherence while supporting advanced AI capabilities and quality standards.
 */
