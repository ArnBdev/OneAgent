/**
 * Gemini Model Registry - TypeScript Configuration
 * Comprehensive registry of all available Gemini models (June 2025)
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
}

export const GEMINI_MODEL_REGISTRY: Record<string, GeminiModelSpec> = {
  // =============================================================================
  // LATEST 2025 MODELS (RECOMMENDED)
  // =============================================================================
  
  'gemini-2.5-flash-preview-05-20': {
    name: 'gemini-2.5-flash-preview-05-20',
    description: 'Latest Gemini 2.5 Flash with thinking capabilities',
    knowledgeCutoff: 'Jan 2025',
    pricing: {
      inputPer1M: 0.15,
      outputPer1M: 0.60,
      outputPer1MThinking: 3.50
    },
    rateLimits: {
      free: { rpm: 10, requestsPerDay: 500 },
      paid: { rpm: 1000 }
    },
    features: [
      'Thinking process visualization',
      'Native tool calling',
      'PDF processing',
      'Complex reasoning',
      'Agentic workflows'
    ],
    bestFor: [
      'Large scale processing',
      'Multiple PDFs',
      'Low latency tasks requiring thinking',
      'Agentic use cases'
    ],
    status: 'experimental',
    tier: 'both'
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
    tier: 'both'
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
    tier: 'both'
  },

  'gemini-2.5-pro-preview-06-05': {
    name: 'gemini-2.5-pro-preview-06-05',
    description: 'Most advanced reasoning and coding model',
    knowledgeCutoff: 'Jan 2025',
    pricing: {
      inputPer1M: 1.25, // Under 200K tokens
      outputPer1M: 10.00, // Under 200K tokens
      hasVariablePricing: true // Different pricing for >200K tokens
    },
    rateLimits: {
      paid: { rpm: 150 }
    },
    features: [
      'Advanced reasoning',
      'Complex coding',
      'Long context analysis',
      'STEM problems',
      'Codebase analysis',
      'Large dataset processing'
    ],
    bestFor: [
      'Complex coding tasks',
      'Advanced reasoning',
      'Large datasets',
      'STEM problems'
    ],
    status: 'stable',
    tier: 'paid'
  },

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
    tier: 'both'
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
    tier: 'both'
  }
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function getRecommendedModel(useCase: 'production' | 'development' | 'high-volume' | 'premium' | 'experimental'): string {
  switch (useCase) {
    case 'production':
      return 'gemini-2.0-flash';
    case 'development':
      return 'gemini-2.0-flash';
    case 'high-volume':
      return 'gemini-2.0-flash-lite';
    case 'premium':
      return 'gemini-2.5-pro-preview-06-05';
    case 'experimental':
      return 'gemini-2.5-flash-preview-05-20';
    default:
      return 'gemini-2.0-flash';
  }
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

export function getModelSpec(modelName: string): GeminiModelSpec | undefined {
  return GEMINI_MODEL_REGISTRY[modelName];
}

export function getAllModelNames(): string[] {
  return Object.keys(GEMINI_MODEL_REGISTRY);
}

// =============================================================================
// QUICK REFERENCE
// =============================================================================

export const QUICK_REFERENCE = {
  // Most reliable for production
  PRODUCTION_STABLE: 'gemini-2.0-flash',
  
  // Highest throughput for multi-agent systems
  HIGH_THROUGHPUT: 'gemini-2.0-flash-lite',
  
  // Latest features (experimental)
  CUTTING_EDGE: 'gemini-2.5-flash-preview-05-20',
  
  // Most powerful (requires billing)
  PREMIUM: 'gemini-2.5-pro-preview-06-05',
  
  // Safe fallback
  FALLBACK: 'gemini-1.5-flash'
} as const;
