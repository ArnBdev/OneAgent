/**
 * Gemini Model Registry - TypeScript Configuration
 * Comprehensive registry of all available Gemini models (June 2025)
 * Enhanced with Intelligent Tier System for Optimal Model Selection
 */

export interface GeminiModelSpec {
  name: string;
  alias?: string;
  description: string;
  knowledgeCutoff: string;
  pricing: {
    inputPer1M: number;
    outputPer1M: number;
    outputPer1MThinking?: number; // For models with thinking capabilities
    hasVariablePricing?: boolean; // For models with different pricing tiers
  };
  rateLimits: {
    free?: {
      rpm: number;
      requestsPerDay: number;
    };
    paid?: {
      rpm: number;
    };
  };
  features: string[];
  bestFor: string[];
  status: 'recommended' | 'stable' | 'experimental' | 'legacy' | 'deprecated';
  tier: 'free' | 'paid' | 'both';
  
  // NEW: Intelligent Tier System
  modelTier: 'economy' | 'standard' | 'premium';
  taskOptimization: {
    reasoning: 'excellent' | 'good' | 'basic';
    coding: 'excellent' | 'good' | 'basic';
    bulk: 'excellent' | 'good' | 'basic';
    realtime: 'excellent' | 'good' | 'basic';
    multimodal: 'excellent' | 'good' | 'basic';
    agentic: 'excellent' | 'good' | 'basic';
  };
  recommendedFor: {
    agentTypes: string[];
    taskTypes: string[];
    scenarios: string[];
  };
}

export const GEMINI_MODEL_REGISTRY: Record<string, GeminiModelSpec> = {
  // =============================================================================
  // GEMINI 2.5 FAMILY - STABLE RELEASES (RECOMMENDED)
  // =============================================================================
  
  'gemini-2.5-pro': {
    name: 'gemini-2.5-pro',
    description: 'Flagship 2.5 model with state-of-the-art reasoning and 1M token context',
    knowledgeCutoff: 'Jan 2025',
    pricing: {
      inputPer1M: 1.25, // <=200K tokens
      outputPer1M: 10.00, // <=200K tokens  
      hasVariablePricing: true // >200K tokens: $2.50 input, $15.00 output
    },
    rateLimits: {
      paid: { rpm: 150 }
    },
    features: [
      '1M token context window',
      'Advanced reasoning',
      'Complex coding',
      'Multimodal understanding',
      'Large dataset analysis',
      'STEM problem solving'
    ],
    bestFor: [
      'Complex coding tasks',
      'Advanced reasoning',
      'Large datasets',
      'STEM problems',
      'Codebase analysis'
    ],
    status: 'stable',
    tier: 'paid',
    
    // NEW: Tier System Metadata
    modelTier: 'premium',
    taskOptimization: {
      reasoning: 'excellent',
      coding: 'excellent', 
      bulk: 'good',
      realtime: 'good',
      multimodal: 'excellent',
      agentic: 'excellent'
    },
    recommendedFor: {
      agentTypes: ['DevAgent', 'AdvancedAnalysisAgent'],
      taskTypes: ['complex-reasoning', 'coding', 'analysis', 'research'],
      scenarios: ['high-value-tasks', 'complex-problems', 'architectural-decisions']
    }
  },

  'gemini-2.5-flash': {
    name: 'gemini-2.5-flash',
    description: 'Optimized for speed and cost with 1M token context - ideal for high-volume tasks',
    knowledgeCutoff: 'Jan 2025',
    pricing: {
      inputPer1M: 0.30,
      outputPer1M: 2.50
    },
    rateLimits: {
      free: { rpm: 10, requestsPerDay: 500 },
      paid: { rpm: 1000 }
    },
    features: [
      '1M token context window',
      'High-speed processing',
      'Native tool calling',
      'Agentic workflows',
      'Large scale processing',
      'Thinking process capability'
    ],
    bestFor: [
      'High-volume chatbots',
      'Content generation',
      'Data processing',
      'Agentic use cases',
      'General purpose tasks'
    ],
    status: 'stable',
    tier: 'both',
    
    // NEW: Tier System Metadata
    modelTier: 'standard',
    taskOptimization: {
      reasoning: 'good',
      coding: 'good',
      bulk: 'excellent',
      realtime: 'excellent', 
      multimodal: 'good',
      agentic: 'excellent'
    },
    recommendedFor: {
      agentTypes: ['TriageAgent', 'FitnessAgent', 'OfficeAgent'],
      taskTypes: ['general-purpose', 'routing', 'content-generation', 'automation'],
      scenarios: ['high-volume', 'cost-sensitive', 'speed-critical']
    }
  },

  'gemini-2.5-flash-lite-preview-06-17': {
    name: 'gemini-2.5-flash-lite-preview-06-17',
    description: 'Ultra-optimized for extreme scale, lowest cost, and highest throughput',
    knowledgeCutoff: 'Jan 2025',
    pricing: {
      inputPer1M: 0.10,
      outputPer1M: 0.40
    },
    rateLimits: {
      free: { rpm: 15, requestsPerDay: 500 },
      paid: { rpm: 4000 }
    },
    features: [
      '1M token context window',
      'Lowest cost',
      'Highest rate limits (4000 RPM)',
      'Massive data processing',
      'Real-time analytics',
      'Translation pipelines'
    ],
    bestFor: [
      'Massive data processing',
      'High-frequency operations',
      'Content moderation at scale',
      'Translation pipelines',
      'Real-time analytics'
    ],
    status: 'experimental',
    tier: 'both',
    
    // NEW: Tier System Metadata
    modelTier: 'economy',
    taskOptimization: {
      reasoning: 'good',
      coding: 'basic',
      bulk: 'excellent',
      realtime: 'excellent',
      multimodal: 'basic',
      agentic: 'good'
    },
    recommendedFor: {
      agentTypes: ['BulkProcessingAgent', 'MemoryAgent', 'DataTransformAgent'],
      taskTypes: ['bulk-processing', 'data-transformation', 'memory-operations'],
      scenarios: ['ultra-high-volume', 'cost-minimization', 'real-time-processing']
    }
  },
  'gemini-2.0-flash': {
    name: 'gemini-2.0-flash',
    alias: 'gemini-2.0-flash-001',
    description: 'Stable multimodal model with realtime capabilities',
    knowledgeCutoff: 'Aug 2024',
    pricing: {
      inputPer1M: 0.10,
      outputPer1M: 0.40
    },
    rateLimits: {
      free: { rpm: 15, requestsPerDay: 1500 },
      paid: { rpm: 2000 }
    },
    features: [
      'Multimodal understanding',
      'Realtime streaming',
      'Native tool use',
      'Code processing (10K+ lines)',
      'Image/video streaming'
    ],
    bestFor: [
      'Multimodal understanding',
      'Realtime streaming',
      'Native tool use',
      'Code analysis'
    ],
    status: 'recommended',
    tier: 'both',
    
    // NEW: Tier System Metadata
    modelTier: 'standard',
    taskOptimization: {
      reasoning: 'good',
      coding: 'good',
      bulk: 'good',
      realtime: 'excellent',
      multimodal: 'excellent',
      agentic: 'good'
    },
    recommendedFor: {
      agentTypes: ['MultimodalAgent', 'RealtimeAgent', 'ToolUseAgent'],
      taskTypes: ['multimodal', 'realtime', 'tool-use', 'streaming'],
      scenarios: ['interactive-applications', 'real-time-analysis', 'multimodal-processing']
    }
  },
  'gemini-2.0-flash-lite': {
    name: 'gemini-2.0-flash-lite',
    alias: 'gemini-2.0-flash-lite-001',
    description: 'Lightweight version optimized for high throughput',
    knowledgeCutoff: 'Aug 2024',
    pricing: {
      inputPer1M: 0.075,
      outputPer1M: 0.30
    },
    rateLimits: {
      free: { rpm: 30, requestsPerDay: 1500 },
      paid: { rpm: 4000 }
    },
    features: [
      'Highest rate limits',
      'Cost effective',
      'Long context',
      'Native tool calling',
      'Realtime streaming'
    ],
    bestFor: [
      'High volume tasks',
      'Long context processing',
      'Cost-sensitive applications',
      'Real-time applications'
    ],
    status: 'recommended',
    tier: 'both',
    
    // NEW: Tier System Metadata
    modelTier: 'economy',
    taskOptimization: {
      reasoning: 'good',
      coding: 'basic',
      bulk: 'excellent',
      realtime: 'excellent',
      multimodal: 'basic',
      agentic: 'good'
    },
    recommendedFor: {
      agentTypes: ['BulkProcessingAgent', 'HighVolumeAgent', 'CostOptimizedAgent'],      taskTypes: ['bulk-processing', 'high-volume', 'cost-optimization', 'streaming'],
      scenarios: ['high-throughput', 'cost-sensitive', 'long-context-processing']
    }
  },

  // =============================================================================
  // LEGACY MODELS (Still Working)
  // =============================================================================
  // LEGACY MODELS (Still Working)
  // =============================================================================
  'gemini-1.5-flash': {
    name: 'gemini-1.5-flash',
    description: 'Legacy flash model - reliable but older',
    knowledgeCutoff: 'Apr 2024',
    pricing: {
      inputPer1M: 0.35,
      outputPer1M: 1.05
    },
    rateLimits: {
      free: { rpm: 15, requestsPerDay: 1500 }
    },
    features: ['Basic text generation', 'Legacy reliability'],
    bestFor: ['Simple tasks', 'Testing', 'Fallback option'],
    status: 'legacy',
    tier: 'both',
    
    // NEW: Tier System Metadata (Legacy - Use 2.5-flash instead)
    modelTier: 'standard',
    taskOptimization: {
      reasoning: 'basic',
      coding: 'basic',
      bulk: 'good',
      realtime: 'basic',
      multimodal: 'basic',
      agentic: 'basic'
    },
    recommendedFor: {
      agentTypes: ['LegacyAgent', 'TestAgent'],
      taskTypes: ['simple-tasks', 'testing', 'fallback'],
      scenarios: ['legacy-compatibility', 'basic-functionality']
    }
  },

  'gemini-1.5-pro': {
    name: 'gemini-1.5-pro',
    description: 'Legacy pro model - often rate limited',
    knowledgeCutoff: 'Apr 2024',
    pricing: {
      inputPer1M: 3.50,
      outputPer1M: 10.50
    },
    rateLimits: {
      free: { rpm: 2, requestsPerDay: 50 }
    },
    features: ['Advanced reasoning', 'Long context'],
    bestFor: ['Complex tasks when quota available'],
    status: 'legacy',
    tier: 'both',
    
    // NEW: Tier System Metadata (Legacy - Use 2.5-pro instead)
    modelTier: 'premium',
    taskOptimization: {
      reasoning: 'good',
      coding: 'good',
      bulk: 'basic',
      realtime: 'basic',
      multimodal: 'basic',
      agentic: 'basic'
    },
    recommendedFor: {
      agentTypes: ['LegacyAgent', 'FallbackAgent'],
      taskTypes: ['complex-legacy', 'fallback-reasoning'],
      scenarios: ['legacy-compatibility', 'quota-limited']
    }
  }
};

// =============================================================================
// UTILITY FUNCTIONS - Enhanced with Tier System Support
// =============================================================================

export function getRecommendedModel(useCase: 'production' | 'development' | 'high-volume' | 'premium' | 'experimental'): string {
  switch (useCase) {
    case 'production':
      return 'gemini-2.5-flash'; // Updated to stable 2.5
    case 'development':
      return 'gemini-2.5-flash'; // Updated to stable 2.5
    case 'high-volume':
      return 'gemini-2.5-flash-lite-preview-06-17'; // Ultra-high throughput
    case 'premium':
      return 'gemini-2.5-pro'; // Stable flagship model
    case 'experimental':
      return 'gemini-2.5-flash-lite-preview-06-17'; // Latest experimental features
    default:
      return 'gemini-2.5-flash';
  }
}

// NEW: Tier-based model selection
export function getModelByTier(tier: 'economy' | 'standard' | 'premium'): string {
  switch (tier) {
    case 'economy':
      return 'gemini-2.5-flash-lite-preview-06-17'; // Lowest cost, highest throughput
    case 'standard':
      return 'gemini-2.5-flash'; // Balanced performance and cost
    case 'premium':
      return 'gemini-2.5-pro'; // Highest capability
    default:
      return 'gemini-2.5-flash';
  }
}

// NEW: Agent-type based model selection
export function getModelForAgentType(agentType: string): string {
  const agentMappings: Record<string, string> = {
    'DevAgent': 'gemini-2.5-pro',
    'AdvancedAnalysisAgent': 'gemini-2.5-pro',
    'TriageAgent': 'gemini-2.5-flash',
    'FitnessAgent': 'gemini-2.5-flash',
    'OfficeAgent': 'gemini-2.5-flash',
    'BulkProcessingAgent': 'gemini-2.5-flash-lite-preview-06-17',
    'MemoryAgent': 'gemini-2.5-flash-lite-preview-06-17',
    'DataTransformAgent': 'gemini-2.5-flash-lite-preview-06-17',
    'MultimodalAgent': 'gemini-2.0-flash',
    'RealtimeAgent': 'gemini-2.0-flash',
    'ToolUseAgent': 'gemini-2.0-flash'
  };
  
  return agentMappings[agentType] || 'gemini-2.5-flash'; // Default to standard tier
}

// NEW: Task-optimized model selection
export function getModelForTask(taskType: string): string {
  const taskMappings: Record<string, string> = {
    'complex-reasoning': 'gemini-2.5-pro',
    'coding': 'gemini-2.5-pro',
    'analysis': 'gemini-2.5-pro',
    'research': 'gemini-2.5-pro',
    'general-purpose': 'gemini-2.5-flash',
    'routing': 'gemini-2.5-flash',
    'content-generation': 'gemini-2.5-flash',
    'automation': 'gemini-2.5-flash',
    'bulk-processing': 'gemini-2.5-flash-lite-preview-06-17',
    'data-transformation': 'gemini-2.5-flash-lite-preview-06-17',
    'memory-operations': 'gemini-2.5-flash-lite-preview-06-17',
    'multimodal': 'gemini-2.0-flash',
    'realtime': 'gemini-2.0-flash',
    'tool-use': 'gemini-2.0-flash',
    'streaming': 'gemini-2.0-flash'
  };
  
  return taskMappings[taskType] || 'gemini-2.5-flash'; // Default to standard tier
}

export function getFreeTierModels(): GeminiModelSpec[] {
  return Object.values(GEMINI_MODEL_REGISTRY).filter(
    model => model.tier === 'free' || model.tier === 'both'
  );
}

export function getModelsByStatus(status: GeminiModelSpec['status']): GeminiModelSpec[] {
  return Object.values(GEMINI_MODEL_REGISTRY).filter(
    model => model.status === status
  );
}

// NEW: Get models by tier
export function getModelsByTier(tier: 'economy' | 'standard' | 'premium'): GeminiModelSpec[] {
  return Object.values(GEMINI_MODEL_REGISTRY).filter(
    model => model.modelTier === tier
  );
}

// NEW: Get models optimized for specific capabilities
export function getModelsOptimizedFor(capability: keyof GeminiModelSpec['taskOptimization'], level: 'excellent' | 'good' | 'basic' = 'good'): GeminiModelSpec[] {
  return Object.values(GEMINI_MODEL_REGISTRY).filter(
    model => {
      const capabilityLevel = model.taskOptimization[capability];
      if (level === 'excellent') return capabilityLevel === 'excellent';
      if (level === 'good') return capabilityLevel === 'excellent' || capabilityLevel === 'good';
      return capabilityLevel === 'excellent' || capabilityLevel === 'good' || capabilityLevel === 'basic';
    }
  );
}

export function getModelSpec(modelName: string): GeminiModelSpec | undefined {
  return GEMINI_MODEL_REGISTRY[modelName];
}

export function getAllModelNames(): string[] {
  return Object.keys(GEMINI_MODEL_REGISTRY);
}

// =============================================================================
// QUICK REFERENCE - Updated for Tier System
// =============================================================================

export const QUICK_REFERENCE = {
  // TIER-BASED RECOMMENDATIONS
  ECONOMY_TIER: 'gemini-2.5-flash-lite-preview-06-17',      // Ultra-low cost, high throughput
  STANDARD_TIER: 'gemini-2.5-flash',                         // Balanced performance and cost
  PREMIUM_TIER: 'gemini-2.5-pro',                           // Maximum capability
  
  // USE CASE OPTIMIZED
  PRODUCTION_STABLE: 'gemini-2.5-flash',                    // Most reliable for production
  HIGH_THROUGHPUT: 'gemini-2.5-flash-lite-preview-06-17',   // Highest throughput for multi-agent systems
  CODING_TASKS: 'gemini-2.5-pro',                           // Complex coding and reasoning
  MULTIMODAL: 'gemini-2.0-flash',                           // Multimodal understanding
  REALTIME: 'gemini-2.0-flash',                             // Real-time applications
  
  // AGENT TYPE OPTIMIZED
  DEV_AGENT: 'gemini-2.5-pro',                              // DevAgent, AdvancedAnalysisAgent
  TRIAGE_AGENT: 'gemini-2.5-flash',                         // TriageAgent, FitnessAgent, OfficeAgent
  BULK_AGENT: 'gemini-2.5-flash-lite-preview-06-17',       // BulkProcessingAgent, MemoryAgent
  
  // LEGACY SUPPORT
  FALLBACK: 'gemini-1.5-flash'                              // Safe legacy fallback
} as const;

// =============================================================================
// TIER SYSTEM SUMMARY
// =============================================================================

export const TIER_SYSTEM_GUIDE = {
  ECONOMY: {
    model: 'gemini-2.5-flash-lite-preview-06-17',
    cost: 'Ultra-low ($0.10/$0.40 per 1M tokens)',
    throughput: 'Highest (4000 RPM)',
    bestFor: 'Bulk processing, high-volume, cost optimization',
    agents: ['BulkProcessingAgent', 'MemoryAgent', 'DataTransformAgent']
  },
  STANDARD: {
    model: 'gemini-2.5-flash',
    cost: 'Moderate ($0.30/$2.50 per 1M tokens)',
    throughput: 'High (1000 RPM)',
    bestFor: 'General purpose, balanced performance',
    agents: ['TriageAgent', 'FitnessAgent', 'OfficeAgent']
  },
  PREMIUM: {
    model: 'gemini-2.5-pro',
    cost: 'Higher ($1.25/$10.00 per 1M tokens)',
    throughput: 'Medium (150 RPM)',
    bestFor: 'Complex reasoning, advanced coding, analysis',
    agents: ['DevAgent', 'AdvancedAnalysisAgent']
  }
} as const;
