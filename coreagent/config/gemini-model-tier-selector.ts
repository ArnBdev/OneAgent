// Gemini Model Tier Selector for OneAgent
// MCP 2025-06-18 compliant, modular, and extensible
// Uses canonical GEMINI_MODELS registry

import { GEMINI_MODELS, GeminiModel } from './gemini-model-registry';

export interface ModelSelectionCriteria {
  agentType: string;
  requiredTier?: string;
  prioritizeCost?: boolean;
  prioritizePerformance?: boolean;
  taskType?: string;
  scenario?: string;
  expectedVolume?: string;
  fallbackStrategy?: string;
}

export interface ModelSelection {
  modelName: string;
  primaryModel: string;
  tier: string;
  reasoning: string;
  estimatedCostPer1K: number;
  fallbackModels: string[];
  capabilities: Record<string, string>;
  rateLimits?: { rpm: number };
}

export class ModelTierSelector {
  private static _instance: ModelTierSelector;

  static selectTier(agentType: string): string {
    switch (agentType) {
      case 'advanced':
        return 'premium';
      case 'flash':
        return 'flash';
      case 'pro':
        return 'standard';
      default:
        return 'standard';
    }
  }

  static getInstance(): ModelTierSelector {
    if (!ModelTierSelector._instance) {
      ModelTierSelector._instance = new ModelTierSelector();
    }
    return ModelTierSelector._instance;
  }

  selectOptimalModel(criteria: ModelSelectionCriteria): ModelSelection {
    // Find all models matching the required tier (or all if not specified)
    const models: GeminiModel[] = Object.values(GEMINI_MODELS).filter(
      (m) => !criteria.requiredTier || m.tier === criteria.requiredTier,
    );
    // Sort by cost or performance as requested
    let sorted = models;
    if (criteria.prioritizeCost) {
      sorted = models.sort((a, b) => a.pricingUSDper1Ktokens - b.pricingUSDper1Ktokens);
    } else if (criteria.prioritizePerformance) {
      sorted = models.sort((a, b) => (b.outputLimitTokens || 0) - (a.outputLimitTokens || 0));
    }
    const primary = sorted[0] || GEMINI_MODELS['gemini-pro'];
    const fallbackModels = sorted.slice(1, 3).map((m) => m.name);
    return {
      modelName: primary.name,
      primaryModel: primary.name,
      tier: primary.tier,
      reasoning: `Selected based on criteria: ${JSON.stringify(criteria)}`,
      estimatedCostPer1K: primary.pricingUSDper1Ktokens,
      fallbackModels,
      capabilities: {
        reasoning: 'good',
        coding: 'good',
        bulk: 'good',
        realtime: 'good',
        multimodal: 'good',
        agentic: 'good',
      },
      rateLimits: { rpm: 60 },
    };
  }
}
