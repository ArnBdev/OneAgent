/**
 * Gemini Model Tier Selector - Intelligent Model Selection Engine
 * Part of OneAgent's Tier System Implementation (Phase 2)
 * 
 * This module provides intelligent, cost-optimized model selection based on:
 * - Agent type and capabilities
 * - Task complexity and requirements
 * - Cost optimization goals
 * - Performance requirements
 * - Fallback logic for reliability
 */

import { 
  GeminiModelSpec, 
  GEMINI_MODEL_REGISTRY,
  getModelByTier,
  getModelForAgentType,
  getModelForTask,
  getModelsOptimizedFor,
  TIER_SYSTEM_GUIDE
} from './gemini-model-registry';

// =============================================================================
// INTERFACES
// =============================================================================

export interface ModelSelectionCriteria {
  agentType?: string;
  taskType?: string;
  scenario?: string;
  prioritizeCost?: boolean;
  prioritizePerformance?: boolean;
  prioritizeSpeed?: boolean;
  requireMultimodal?: boolean;
  requireRealtime?: boolean;
  expectedVolume?: 'low' | 'medium' | 'high' | 'ultra-high';
  maxCostPerMillionTokens?: number;
  minRequiredCapability?: 'basic' | 'good' | 'excellent';
  fallbackStrategy?: 'tier-down' | 'tier-up' | 'similar' | 'conservative';
}

export interface ModelSelection {
  primaryModel: string;
  fallbackModels: string[];
  reasoning: string;
  tier: 'economy' | 'standard' | 'premium';
  estimatedCostPer1M: {
    input: number;
    output: number;
  };
  capabilities: {
    reasoning: string;
    coding: string;
    bulk: string;
    realtime: string;
    multimodal: string;
    agentic: string;
  };  rateLimits: {
    rpm: number;
    dailyLimit?: number | undefined;
  };
}

export interface TierOptimizationResult {
  recommendedTier: 'economy' | 'standard' | 'premium';
  model: string;
  costSavings?: string;
  performanceImpact?: string;
  reasoning: string;
}

// =============================================================================
// MODEL TIER SELECTOR CLASS
// =============================================================================

export class ModelTierSelector {
  private static instance: ModelTierSelector;
  
  public static getInstance(): ModelTierSelector {
    if (!ModelTierSelector.instance) {
      ModelTierSelector.instance = new ModelTierSelector();
    }
    return ModelTierSelector.instance;
  }

  /**
   * Main entry point for intelligent model selection
   */
  public selectOptimalModel(criteria: ModelSelectionCriteria): ModelSelection {
    // 1. Determine optimal tier based on criteria
    const tier = this.determineTier(criteria);
    
    // 2. Get primary model recommendation
    const primaryModel = this.selectPrimaryModel(criteria, tier);
    
    // 3. Generate fallback strategy
    const fallbackModels = this.generateFallbackModels(primaryModel, criteria);
    
    // 4. Generate selection reasoning
    const reasoning = this.generateReasoning(criteria, tier, primaryModel);
    
    // 5. Get model specs for additional info
    const modelSpec = GEMINI_MODEL_REGISTRY[primaryModel];
    if (!modelSpec) {
      throw new Error(`Model specification not found for: ${primaryModel}`);
    }

    return {
      primaryModel,
      fallbackModels,
      reasoning,
      tier,
      estimatedCostPer1M: {
        input: modelSpec.pricing.inputPer1M,
        output: modelSpec.pricing.outputPer1M
      },
      capabilities: modelSpec.taskOptimization,
      rateLimits: {
        rpm: modelSpec.rateLimits.paid?.rpm || modelSpec.rateLimits.free?.rpm || 0,
        dailyLimit: modelSpec.rateLimits.free?.requestsPerDay
      }
    };
  }

  /**
   * Quick model selection for specific agent types
   */
  public selectForAgent(agentType: string, prioritizeCost: boolean = false): ModelSelection {
    return this.selectOptimalModel({
      agentType,
      prioritizeCost,
      fallbackStrategy: 'tier-down'
    });
  }

  /**
   * Quick model selection for specific task types
   */
  public selectForTask(taskType: string, expectedVolume: 'low' | 'medium' | 'high' | 'ultra-high' = 'medium'): ModelSelection {
    return this.selectOptimalModel({
      taskType,
      expectedVolume,
      prioritizeCost: expectedVolume === 'ultra-high',
      fallbackStrategy: 'similar'
    });
  }

  /**
   * Cost optimization analysis
   */
  public optimizeForCost(criteria: ModelSelectionCriteria): TierOptimizationResult {
    const currentSelection = this.selectOptimalModel(criteria);
    const economySelection = this.selectOptimalModel({ ...criteria, prioritizeCost: true });
    
    if (currentSelection.tier === 'economy') {
      return {
        recommendedTier: 'economy',
        model: currentSelection.primaryModel,
        reasoning: 'Already using most cost-effective tier'
      };
    }

    const costSavingsPercent = Math.round(
      ((currentSelection.estimatedCostPer1M.output - economySelection.estimatedCostPer1M.output) / 
       currentSelection.estimatedCostPer1M.output) * 100
    );

    return {
      recommendedTier: 'economy',
      model: economySelection.primaryModel,
      costSavings: `${costSavingsPercent}% reduction in costs`,
      performanceImpact: this.assessPerformanceImpact(currentSelection.tier, 'economy'),
      reasoning: `Switch to ${economySelection.primaryModel} for ${costSavingsPercent}% cost savings`
    };
  }

  /**
   * Performance optimization analysis
   */
  public optimizeForPerformance(criteria: ModelSelectionCriteria): TierOptimizationResult {
    const currentSelection = this.selectOptimalModel(criteria);
    const premiumSelection = this.selectOptimalModel({ ...criteria, prioritizePerformance: true });
    
    if (currentSelection.tier === 'premium') {
      return {
        recommendedTier: 'premium',
        model: currentSelection.primaryModel,
        reasoning: 'Already using highest performance tier'
      };
    }

    return {
      recommendedTier: 'premium',
      model: premiumSelection.primaryModel,
      performanceImpact: this.assessPerformanceImpact(currentSelection.tier, 'premium'),
      reasoning: `Upgrade to ${premiumSelection.primaryModel} for maximum performance`
    };
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  private determineTier(criteria: ModelSelectionCriteria): 'economy' | 'standard' | 'premium' {
    // Cost priority override
    if (criteria.prioritizeCost || criteria.expectedVolume === 'ultra-high') {
      return 'economy';
    }
    
    // Performance priority override
    if (criteria.prioritizePerformance || criteria.minRequiredCapability === 'excellent') {
      return 'premium';
    }

    // Agent-based tier mapping
    if (criteria.agentType) {
      const premiumAgents = ['DevAgent', 'AdvancedAnalysisAgent'];
      const economyAgents = ['BulkProcessingAgent', 'MemoryAgent', 'DataTransformAgent'];
      
      if (premiumAgents.includes(criteria.agentType)) return 'premium';
      if (economyAgents.includes(criteria.agentType)) return 'economy';
    }

    // Task-based tier mapping
    if (criteria.taskType) {
      const premiumTasks = ['complex-reasoning', 'coding', 'analysis', 'research'];
      const economyTasks = ['bulk-processing', 'data-transformation', 'memory-operations'];
      
      if (premiumTasks.includes(criteria.taskType)) return 'premium';
      if (economyTasks.includes(criteria.taskType)) return 'economy';
    }

    // Special capability requirements
    if (criteria.requireMultimodal || criteria.requireRealtime) {
      return 'standard'; // 2.0-flash models excel at these
    }

    // Volume-based optimization
    if (criteria.expectedVolume === 'high') return 'economy';
    if (criteria.expectedVolume === 'low' && !criteria.prioritizeCost) return 'premium';

    // Default to standard tier
    return 'standard';
  }

  private selectPrimaryModel(criteria: ModelSelectionCriteria, tier: 'economy' | 'standard' | 'premium'): string {
    // Special capability requirements override tier
    if (criteria.requireMultimodal || criteria.requireRealtime) {
      return 'gemini-2.0-flash'; // Best multimodal/realtime model
    }

    // Cost constraints
    if (criteria.maxCostPerMillionTokens && criteria.maxCostPerMillionTokens < 1.0) {
      return 'gemini-2.5-flash-lite-preview-06-17'; // Ultra-low cost
    }

    // Agent-specific selection
    if (criteria.agentType) {
      const agentModel = getModelForAgentType(criteria.agentType);
      const agentModelSpec = GEMINI_MODEL_REGISTRY[agentModel];
      
      // Verify tier compatibility
      if (agentModelSpec && agentModelSpec.modelTier === tier) {
        return agentModel;
      }
    }

    // Task-specific selection
    if (criteria.taskType) {
      const taskModel = getModelForTask(criteria.taskType);
      const taskModelSpec = GEMINI_MODEL_REGISTRY[taskModel];
      
      // Verify tier compatibility
      if (taskModelSpec && taskModelSpec.modelTier === tier) {
        return taskModel;
      }
    }

    // Default tier-based selection
    return getModelByTier(tier);
  }

  private generateFallbackModels(primaryModel: string, criteria: ModelSelectionCriteria): string[] {
    const fallbacks: string[] = [];
    const primarySpec = GEMINI_MODEL_REGISTRY[primaryModel];
    
    if (!primarySpec) return ['gemini-2.5-flash']; // Safe fallback

    const strategy = criteria.fallbackStrategy || 'tier-down';

    switch (strategy) {
      case 'tier-down':
        // Fall back to lower cost models
        if (primarySpec.modelTier === 'premium') {
          fallbacks.push('gemini-2.5-flash', 'gemini-2.5-flash-lite-preview-06-17');
        } else if (primarySpec.modelTier === 'standard') {
          fallbacks.push('gemini-2.5-flash-lite-preview-06-17', 'gemini-2.0-flash-lite');
        }
        break;
        
      case 'tier-up':
        // Fall back to higher capability models
        if (primarySpec.modelTier === 'economy') {
          fallbacks.push('gemini-2.5-flash', 'gemini-2.5-pro');
        } else if (primarySpec.modelTier === 'standard') {
          fallbacks.push('gemini-2.5-pro', 'gemini-2.0-flash');
        }
        break;
        
      case 'similar':
        // Fall back to models in same tier
        const similarModels = Object.entries(GEMINI_MODEL_REGISTRY)
          .filter(([name, spec]) => 
            name !== primaryModel && 
            spec.modelTier === primarySpec.modelTier &&
            spec.status !== 'deprecated'
          )
          .map(([name]) => name);
        fallbacks.push(...similarModels.slice(0, 2));
        break;
        
      case 'conservative':
        // Fall back to most stable models
        fallbacks.push('gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash');
        break;
    }

    // Always include a final conservative fallback
    if (!fallbacks.includes('gemini-2.5-flash')) {
      fallbacks.push('gemini-2.5-flash');
    }

    return fallbacks.slice(0, 3); // Limit to 3 fallbacks
  }

  private generateReasoning(
    criteria: ModelSelectionCriteria, 
    tier: 'economy' | 'standard' | 'premium', 
    model: string
  ): string {
    const parts: string[] = [];
    
    // Tier selection reasoning
    parts.push(`Selected ${tier.toUpperCase()} tier`);
    
    if (criteria.prioritizeCost) parts.push('for cost optimization');
    else if (criteria.prioritizePerformance) parts.push('for maximum performance');
    else if (criteria.agentType) parts.push(`optimized for ${criteria.agentType}`);
    else if (criteria.taskType) parts.push(`optimized for ${criteria.taskType} tasks`);
    
    // Model selection reasoning
    const modelSpec = GEMINI_MODEL_REGISTRY[model];
    if (modelSpec) {
      if (criteria.expectedVolume === 'ultra-high') {
        parts.push(`${model} selected for ultra-high throughput (${modelSpec.rateLimits.paid?.rpm || modelSpec.rateLimits.free?.rpm} RPM)`);
      } else if (criteria.requireMultimodal) {
        parts.push(`${model} selected for multimodal capabilities`);
      } else if (criteria.requireRealtime) {
        parts.push(`${model} selected for real-time processing`);
      } else {
        parts.push(`${model} provides optimal balance of cost ($${modelSpec.pricing.outputPer1M}/1M output tokens) and capability`);
      }
    }

    return parts.join('. ') + '.';
  }

  private assessPerformanceImpact(fromTier: string, toTier: string): string {
    if (fromTier === toTier) return 'No performance impact';
    
    const tierOrder = { economy: 1, standard: 2, premium: 3 };
    const fromLevel = tierOrder[fromTier as keyof typeof tierOrder];
    const toLevel = tierOrder[toTier as keyof typeof tierOrder];
    
    if (toLevel > fromLevel) {
      const improvement = ((toLevel - fromLevel) / fromLevel) * 100;
      return `~${Math.round(improvement)}% performance improvement expected`;
    } else {
      const reduction = ((fromLevel - toLevel) / fromLevel) * 100;
      return `~${Math.round(reduction)}% performance reduction (but significant cost savings)`;
    }
  }
}

// =============================================================================
// CONVENIENCE EXPORTS
// =============================================================================

export const modelSelector = ModelTierSelector.getInstance();

// Quick selection functions for common use cases
export const selectForDevAgent = () => modelSelector.selectForAgent('DevAgent');
export const selectForTriageAgent = () => modelSelector.selectForAgent('TriageAgent');
export const selectForBulkProcessing = () => modelSelector.selectForAgent('BulkProcessingAgent', true);
export const selectForCoding = () => modelSelector.selectForTask('coding');
export const selectForBulkOps = () => modelSelector.selectForTask('bulk-processing', 'ultra-high');

// Cost optimization helper
export const optimizeModelCosts = (criteria: ModelSelectionCriteria) => 
  modelSelector.optimizeForCost(criteria);

// Performance optimization helper  
export const optimizeModelPerformance = (criteria: ModelSelectionCriteria) => 
  modelSelector.optimizeForPerformance(criteria);
