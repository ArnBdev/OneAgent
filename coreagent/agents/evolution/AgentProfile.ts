/**
 * AgentProfile.ts - Dynamic Agent Configuration System
 * 
 * Core interface for ALITA self-evolving agent profiles.
 * Replaces static instruction files with dynamic, evolving configuration.
 */

export interface ProfileMetadata {
  name: string;
  description: string;
  version: string;
  created: string;
  lastEvolved: string;
  evolutionCount: number;
  baselineProfile?: string; // Reference to original profile
}

export interface PersonalityConfig {
  role: string;
  mission: string;
  communicationStyle: string;
  expertise: string[];
  behaviorTraits: string[];
  responsePatterns: {
    greeting: string;
    taskApproach: string;
    errorHandling: string;
    completion: string;
  };
}

export interface InstructionSet {
  coreCapabilities: string[];
  developmentRules: string[];
  workflowPatterns: string[];
  qualityStandards: string[];
  prohibitions: string[];
  specialInstructions: Record<string, string[]>;
}

export interface CapabilityDefinition {
  name: string;
  description: string;
  enabled: boolean;
  qualityThreshold: number;
  usage: {
    frequency: number;
    successRate: number;
    averageQuality: number;
    lastUsed?: string;
  };
  parameters?: Record<string, any>;
}

export interface FrameworkPreferences {
  systematicPrompting: string[];
  qualityValidation: string;
  analysisFramework: string;
  preferredFramework: string;
  frameworkUsage: Record<string, number>;
  frameworkSuccess: Record<string, number>;
}

export interface QualityConfig {
  minimumScore: number;
  constitutionalCompliance: number;
  performanceTarget: number;
  refinementThreshold: number;
  maxRefinementIterations: number;
  qualityDimensions: {
    accuracy: number;
    transparency: number;
    helpfulness: number;
    safety: number;
  };
}

export interface EvolutionRecord {
  timestamp: string;
  version: string;
  trigger: 'manual' | 'performance' | 'scheduled' | 'user_feedback';
  changes: EvolutionChange[];
  performanceImpact: {
    qualityScoreBefore: number;
    qualityScoreAfter: number;
    userSatisfactionBefore: number;
    userSatisfactionAfter: number;
    successMetrics: Record<string, number>;
  };
  validationResults: {
    constitutionalCompliance: boolean;
    bmadAnalysis: string;
    riskAssessment: 'low' | 'medium' | 'high';
    approvalStatus: 'approved' | 'rejected' | 'rollback';
  };
  rollbackData?: Partial<AgentProfile>;
}

export interface EvolutionChange {
  category: 'personality' | 'instructions' | 'capabilities' | 'frameworks' | 'quality';
  field: string;
  oldValue: any;
  newValue: any;
  reasoning: string;
  expectedImprovement: string;
  confidence: number;
}

/**
 * Core AgentProfile interface - Complete agent configuration
 */
export interface AgentProfile {
  metadata: ProfileMetadata;
  personality: PersonalityConfig;
  instructions: InstructionSet;
  capabilities: CapabilityDefinition[];
  frameworks: FrameworkPreferences;
  qualityThresholds: QualityConfig;
  evolutionHistory: EvolutionRecord[];
  
  // Memory integration
  memoryConfig: {
    userId: string;
    contextRetention: number;
    learningEnabled: boolean;
    memoryTypes: string[];
  };
  
  // Multi-agent integration
  multiAgentConfig: {
    networkParticipation: boolean;
    collaborationPreferences: string[];
    communicationStyle: string;
    trustLevel: number;
  };
}

/**
 * Profile validation schema
 */
export interface ProfileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  qualityScore: number;
  constitutionalCompliance: {
    accuracy: boolean;
    transparency: boolean;
    helpfulness: boolean;
    safety: boolean;
  };
}

/**
 * Evolution context for analysis
 */
export interface EvolutionContext {
  currentProfile: AgentProfile;
  recentConversations: any[];
  performanceMetrics: {
    qualityScores: number[];
    userSatisfaction: number[];
    errorRates: number[];
    responseTime: number[];
    capabilityUsage: Record<string, number>;
  };
  userFeedback: {
    positive: string[];
    negative: string[];
    suggestions: string[];
  };
  memoryInsights: {
    patterns: string[];
    successfulStrategies: string[];
    problematicAreas: string[];
  };
}
