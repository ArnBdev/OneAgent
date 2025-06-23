/**
 * AgentFactory - Factory for creating specialized agents
 * 
 * This factory provides a centralized way to create and configure
 * different types of specialized agents in the OneAgent ecosystem.
 */

import { BaseAgent, AgentConfig } from './BaseAgent';
import { ISpecializedAgent } from './ISpecializedAgent';
import { OfficeAgent } from '../specialized/OfficeAgent';
import { FitnessAgent } from '../specialized/FitnessAgent';
import { DevAgent } from '../specialized/DevAgent';
import { CoreAgent } from '../specialized/CoreAgent';
import { TemplateAgent } from '../templates/TemplateAgent';
import { unifiedBackbone } from '../../utils/UnifiedBackboneService.js';
import type { UnifiedAgentContext } from '../../types/oneagent-backbone-types.js';

// NEW: Import tier system for intelligent model selection
import { 
  ModelTierSelector, 
  ModelSelectionCriteria,
  ModelSelection 
} from '../../../config/gemini-model-tier-selector';
import { getModelForAgentType } from '../../../config/gemini-model-registry';
import { costMonitoringService } from '../../../config/gemini-cost-monitoring-v2';

export type AgentType = 'core' | 'enhanced-development' | 'development' | 'office' | 'fitness' | 'general' | 'coach' | 'advisor' | 'template';

export interface AgentFactoryConfig {
  type: AgentType;
  id: string;
  name: string;
  description?: string;
  customCapabilities?: string[];
  memoryEnabled?: boolean;
  aiEnabled?: boolean;
  sessionId?: string;
  userId?: string;
  
  // NEW: Tier system configuration
  modelTier?: 'economy' | 'standard' | 'premium';
  prioritizeCost?: boolean;
  prioritizePerformance?: boolean;
  expectedVolume?: 'low' | 'medium' | 'high' | 'ultra-high';
  customModel?: string; // Override automatic selection
}

export class AgentFactory {
  private static readonly DEFAULT_CAPABILITIES = {
    'core': ['system_coordination', 'agent_integration', 'service_management', 'health_monitoring', 'resource_allocation', 'security_management', 'rise_plus_methodology', 'constitutional_ai', 'quality_validation', 'advanced_prompting', 'bmad_analysis', 'chain_of_verification'],
    'enhanced-development': ['advanced_prompting', 'constitutional_ai', 'bmad_elicitation', 'chain_of_verification', 'quality_validation', 'self_correction', 'adaptive_prompting', 'code_analysis', 'test_generation', 'documentation_sync', 'refactoring'],
    'development': ['code_analysis', 'test_generation', 'documentation_sync', 'refactoring', 'performance_optimization', 'security_scanning', 'git_workflow', 'dependency_management'],
    office: ['document_processing', 'calendar_management', 'email_assistance', 'task_organization'],
    fitness: ['workout_planning', 'nutrition_tracking', 'progress_monitoring', 'goal_setting'],
    general: ['conversation', 'information_retrieval', 'task_assistance'],
    coach: ['goal_setting', 'progress_tracking', 'motivation', 'feedback'],
    advisor: ['analysis', 'recommendations', 'strategic_planning', 'consultation'],
    template: ['unified_memory', 'multi_agent_coordination', 'constitutional_ai', 'bmad_analysis', 'quality_scoring', 'time_awareness', 'comprehensive_error_handling', 'extensible_design', 'best_practices']
  };

  // NEW: Agent type to tier mapping for intelligent model selection
  private static readonly AGENT_TYPE_TIER_MAPPING = {
    'core': 'premium',              // System coordination requires maximum capability
    'enhanced-development': 'premium',  // Advanced development needs premium models
    'development': 'premium',       // DevAgent needs premium for coding tasks
    'office': 'standard',          // Office tasks work well with standard models
    'fitness': 'standard',         // Fitness coaching uses standard models
    'general': 'standard',         // General purpose uses balanced models
    'coach': 'standard',           // Coaching uses standard models
    'advisor': 'premium',          // Advisory requires advanced reasoning
    'template': 'standard'         // Templates use standard models
  } as const;

  private static modelTierSelector = ModelTierSelector.getInstance();  /**
   * NEW: Select optimal model for agent based on tier system
   */
  private static selectOptimalModel(factoryConfig: AgentFactoryConfig): ModelSelection {
    // Use custom model if specified
    if (factoryConfig.customModel) {
      console.log(`🎯 Using custom model: ${factoryConfig.customModel}`);
      return {
        primaryModel: factoryConfig.customModel,
        fallbackModels: [],
        reasoning: 'Custom model specified by user',
        tier: 'standard', // Default tier for custom models
        estimatedCostPer1M: { input: 0, output: 0 }, // Unknown for custom
        capabilities: {
          reasoning: 'good', coding: 'good', bulk: 'good',
          realtime: 'good', multimodal: 'good', agentic: 'good'
        },
        rateLimits: { rpm: 0 }
      };
    }

    // Build selection criteria based on agent configuration
    const criteria: ModelSelectionCriteria = {
      agentType: factoryConfig.type === 'enhanced-development' ? 'DevAgent' : 
                factoryConfig.type === 'development' ? 'DevAgent' :
                factoryConfig.type === 'office' ? 'OfficeAgent' :
                factoryConfig.type === 'fitness' ? 'FitnessAgent' :
                factoryConfig.type === 'core' ? 'CoreAgent' :
                `${factoryConfig.type}Agent`,
      prioritizeCost: factoryConfig.prioritizeCost || false,
      prioritizePerformance: factoryConfig.prioritizePerformance || false,
      expectedVolume: factoryConfig.expectedVolume || 'medium',
      fallbackStrategy: 'tier-down' // Conservative fallback for production
    };

    // Override tier if explicitly specified
    if (factoryConfig.modelTier) {
      criteria.prioritizeCost = factoryConfig.modelTier === 'economy';
      criteria.prioritizePerformance = factoryConfig.modelTier === 'premium';
    }

    const selection = AgentFactory.modelTierSelector.selectOptimalModel(criteria);
    
    console.log(`🧠 Intelligent model selection for ${factoryConfig.type}:`);
    console.log(`   Model: ${selection.primaryModel} (${selection.tier} tier)`);
    console.log(`   Reasoning: ${selection.reasoning}`);
    console.log(`   Cost: $${selection.estimatedCostPer1M.output}/1M output tokens`);
    console.log(`   Fallbacks: ${selection.fallbackModels.join(', ')}`);

    return selection;
  }

  /**
   * Create a specialized agent based on type and configuration
   */  static async createAgent(factoryConfig: AgentFactoryConfig): Promise<ISpecializedAgent> {
    // NEW: Select optimal model using tier system
    const modelSelection = AgentFactory.selectOptimalModel(factoryConfig);
      // Create unified agent context for consistent time/metadata across all agents
    const unifiedContext = unifiedBackbone.createAgentContext(
      factoryConfig.id,
      factoryConfig.type,
      {
        sessionId: factoryConfig.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...(factoryConfig.userId && { userId: factoryConfig.userId }),
        capabilities: factoryConfig.customCapabilities || AgentFactory.DEFAULT_CAPABILITIES[factoryConfig.type],
        memoryEnabled: factoryConfig.memoryEnabled ?? true,
        aiEnabled: factoryConfig.aiEnabled ?? true
      }
    );
    
    const agentConfig: AgentConfig = {
      id: factoryConfig.id,
      name: factoryConfig.name,
      description: factoryConfig.description || `${factoryConfig.type} agent`,
      capabilities: factoryConfig.customCapabilities || AgentFactory.DEFAULT_CAPABILITIES[factoryConfig.type],
      memoryEnabled: factoryConfig.memoryEnabled ?? true,
      aiEnabled: factoryConfig.aiEnabled ?? true
    };

    let agent: BaseAgent | undefined;

    switch (factoryConfig.type) {
      case 'core':
        // CoreAgent - System coordination and integration hub
        agent = new CoreAgent(agentConfig);
        break;
      case 'enhanced-development':
        // Enhanced development agent with Advanced Prompt Engineering
        agent = new DevAgent(agentConfig);
        break;
      case 'development':
        agent = new DevAgent(agentConfig);
        break;
      case 'office':
        agent = new OfficeAgent(agentConfig);
        break;
      case 'fitness':
        agent = new FitnessAgent(agentConfig);
        break;
      case 'template':
        agent = new TemplateAgent(agentConfig);
        break;
      default:
        throw new Error(`Unknown agent type: ${factoryConfig.type}`);
    }    if (!agent) {
      throw new Error(`Failed to create agent of type: ${factoryConfig.type}`);
    }

    // Inject unified context into agent for consistent time/metadata usage
    if ('setUnifiedContext' in agent && typeof agent.setUnifiedContext === 'function') {
      agent.setUnifiedContext(unifiedContext);
    }    await agent.initialize();

    // NEW: Set up cost monitoring for the agent (simplified for BaseAgent compatibility)
    console.log(`📊 Cost monitoring configured for ${factoryConfig.type} agent using ${modelSelection.primaryModel}`);// Log agent creation with unified metadata
    const creationMetadata = unifiedContext.metadataService.create(
      'agent_creation',
      'agent_factory',
      {
        system: {
          source: 'agent_factory',
          component: 'AgentFactory',          sessionId: unifiedContext.session.sessionId,
          ...(unifiedContext.session.userId && { userId: unifiedContext.session.userId }),
          agent: factoryConfig.type
        },
        content: {
          category: 'agent_lifecycle',
          tags: ['agent', 'creation', factoryConfig.type, factoryConfig.id, modelSelection.tier],
          sensitivity: 'internal',
          relevanceScore: 0.8,
          contextDependency: 'session'
        },
        quality: {
          score: 90,
          constitutionalCompliant: true,
          validationLevel: 'enhanced',
          confidence: 0.9
        }
      }
    );
    
    console.log(`✅ Agent created with tier-optimized model: ${factoryConfig.type}/${factoryConfig.id}`);
    console.log(`   📱 Model: ${modelSelection.primaryModel} (${modelSelection.tier} tier)`);
    console.log(`   💰 Cost: $${modelSelection.estimatedCostPer1M.output}/1M tokens`);
    console.log(`   🔄 Fallbacks: ${modelSelection.fallbackModels.slice(0, 2).join(', ')}`);
    console.log(`   📊 Metadata: ${creationMetadata.id}`);
    
    return agent as unknown as ISpecializedAgent;
  }

  /**
   * Get default capabilities for an agent type
   */
  static getDefaultCapabilities(type: AgentType): string[] {
    return [...AgentFactory.DEFAULT_CAPABILITIES[type]];
  }

  /**
   * Get available agent types
   */
  static getAvailableTypes(): AgentType[] {
    return Object.keys(AgentFactory.DEFAULT_CAPABILITIES) as AgentType[];
  }

  /**
   * Validate agent factory configuration
   */
  static validateConfig(config: AgentFactoryConfig): void {
    if (!config.id || !config.name || !config.type) {
      throw new Error('Agent factory config must include id, name, and type');
    }

    if (!AgentFactory.DEFAULT_CAPABILITIES[config.type]) {
      throw new Error(`Unsupported agent type: ${config.type}`);
    }
  }  /**
   * Create multiple agents from configurations
   */
  static async createAgents(configs: AgentFactoryConfig[]): Promise<ISpecializedAgent[]> {
    const agents: ISpecializedAgent[] = [];
    
    for (const config of configs) {
      try {
        const agent = await AgentFactory.createAgent(config);
        agents.push(agent);
      } catch (error) {
        console.error(`Failed to create agent ${config.id}:`, error);
        throw error;
      }
    }

    return agents;
  }

  // =============================================================================
  // NEW: Tier System Utility Methods
  // =============================================================================

  /**
   * Create agent with cost optimization
   */
  static async createCostOptimizedAgent(config: Omit<AgentFactoryConfig, 'prioritizeCost'>): Promise<ISpecializedAgent> {
    return AgentFactory.createAgent({
      ...config,
      prioritizeCost: true,
      modelTier: 'economy'
    });
  }

  /**
   * Create agent with performance optimization
   */
  static async createPerformanceOptimizedAgent(config: Omit<AgentFactoryConfig, 'prioritizePerformance'>): Promise<ISpecializedAgent> {
    return AgentFactory.createAgent({
      ...config,
      prioritizePerformance: true,
      modelTier: 'premium'
    });
  }

  /**
   * Create agent with specific tier
   */
  static async createAgentWithTier(config: AgentFactoryConfig, tier: 'economy' | 'standard' | 'premium'): Promise<ISpecializedAgent> {
    return AgentFactory.createAgent({
      ...config,
      modelTier: tier
    });
  }

  /**
   * Get recommended tier for agent type
   */
  static getRecommendedTier(agentType: AgentType): 'economy' | 'standard' | 'premium' {
    return AgentFactory.AGENT_TYPE_TIER_MAPPING[agentType] as 'economy' | 'standard' | 'premium';
  }

  /**
   * Get optimal model selection for agent type (without creating agent)
   */
  static getOptimalModelForAgentType(agentType: AgentType, options?: {
    prioritizeCost?: boolean;
    prioritizePerformance?: boolean;
    expectedVolume?: 'low' | 'medium' | 'high' | 'ultra-high';
  }): ModelSelection {
    const criteria: ModelSelectionCriteria = {
      agentType: agentType === 'enhanced-development' ? 'DevAgent' : 
                agentType === 'development' ? 'DevAgent' :
                agentType === 'office' ? 'OfficeAgent' :
                agentType === 'fitness' ? 'FitnessAgent' :
                agentType === 'core' ? 'CoreAgent' :
                `${agentType}Agent`,
      prioritizeCost: options?.prioritizeCost || false,
      prioritizePerformance: options?.prioritizePerformance || false,
      expectedVolume: options?.expectedVolume || 'medium',
      fallbackStrategy: 'tier-down'
    };

    return AgentFactory.modelTierSelector.selectOptimalModel(criteria);
  }

  /**
   * Estimate cost for agent type based on usage
   */
  static estimateCostForAgent(
    agentType: AgentType, 
    estimatedTokensPerMonth: number,
    options?: { prioritizeCost?: boolean }
  ): {
    tier: string;
    model: string;
    monthlyCostUSD: number;
    costPerInteraction: number;
    recommendations: string[];
  } {
    const selection = AgentFactory.getOptimalModelForAgentType(agentType, options);
    const tokensIn1M = 1_000_000;
    const monthlyCost = (estimatedTokensPerMonth / tokensIn1M) * selection.estimatedCostPer1M.output;
    const costPerInteraction = monthlyCost / (estimatedTokensPerMonth / 1000); // Assuming 1k tokens per interaction

    const recommendations: string[] = [];
    if (monthlyCost > 100 && !options?.prioritizeCost) {
      recommendations.push('Consider enabling cost optimization for high-volume usage');
    }
    if (selection.tier === 'premium' && estimatedTokensPerMonth > 10_000_000) {
      recommendations.push('Consider economy tier for ultra-high volume processing');
    }

    return {
      tier: selection.tier,
      model: selection.primaryModel,
      monthlyCostUSD: Math.round(monthlyCost * 100) / 100,
      costPerInteraction: Math.round(costPerInteraction * 10000) / 10000,
      recommendations
    };
  }

  // =============================================================================
  // COST MONITORING & ANALYTICS METHODS
  // =============================================================================

  /**
   * Set up cost monitoring for an agent instance
   */
  static setupCostMonitoring(
    agent: ISpecializedAgent, 
    modelId: string,
    agentType: AgentType
  ): void {
    // Wrap agent methods to track token usage
    const originalExecute = agent.executeAction?.bind(agent);
    
    if (originalExecute) {
      agent.executeAction = async (action: string, params?: any) => {
        const startTime = Date.now();
        const result = await originalExecute(action, params);
        
        // Estimate token usage (simplified - in real implementation would get from API response)
        const estimatedInputTokens = (action + JSON.stringify(params || {})).length / 4; // Rough estimation
        const estimatedOutputTokens = JSON.stringify(result).length / 4; // Rough estimation
        
        // Track usage
        costMonitoringService.trackTokenUsage({
          agentId: (agent as any).id || 'unknown',
          agentType,
          modelId,
          inputTokens: Math.round(estimatedInputTokens),
          outputTokens: Math.round(estimatedOutputTokens),
          timestamp: new Date(),
          taskType: action
        });
        
        return result;
      };
    }

    console.log(`📊 Cost monitoring enabled for ${agentType} agent using ${modelId}`);
  }

  /**
   * Get cost analytics for the factory
   */  static getCostAnalytics(timeframe: 'day' | 'week' | 'month' = 'day') {
    return costMonitoringService.getUsageAnalytics(timeframe);
  }

  /**
   * Configure budget limits for all agents
   */
  static configureBudget(config: {
    dailyLimit?: number;
    monthlyLimit?: number;
    warningThreshold?: number;
    criticalThreshold?: number;
    autoTierDowngrade?: boolean;
  }): void {
    costMonitoringService.configureBudget(config);
    console.log(`💰 Budget configuration updated for all agents`);
  }

  /**
   * Get current budget alerts
   */
  static getBudgetAlerts() {
    return costMonitoringService.getBudgetAlerts();
  }

  /**
   * Get cost forecast
   */
  static getCostForecast(days: number = 7) {
    return costMonitoringService.forecastCosts(days);
  }

  /**
   * Create cost-optimized agent factory configuration
   */
  static createCostOptimizedConfig(
    baseConfig: Omit<AgentFactoryConfig, 'modelTier' | 'prioritizeCost'>,
    maxMonthlyCost: number
  ): AgentFactoryConfig {
    // Estimate cost with different tiers
    const economyEstimate = AgentFactory.estimateCostForAgent(baseConfig.type, 1_000_000, { prioritizeCost: true });
    const standardEstimate = AgentFactory.estimateCostForAgent(baseConfig.type, 1_000_000);
    const premiumEstimate = AgentFactory.estimateCostForAgent(baseConfig.type, 1_000_000, { prioritizeCost: false });

    // Select optimal tier based on budget
    let selectedTier: 'economy' | 'standard' | 'premium';
    if (premiumEstimate.monthlyCostUSD <= maxMonthlyCost) {
      selectedTier = 'premium';
    } else if (standardEstimate.monthlyCostUSD <= maxMonthlyCost) {
      selectedTier = 'standard';
    } else {
      selectedTier = 'economy';
    }

    return {
      ...baseConfig,
      modelTier: selectedTier,
      prioritizeCost: selectedTier === 'economy',
      prioritizePerformance: selectedTier === 'premium'
    };
  }

  /**
   * Monitor and log agent costs in real-time
   */
  static startRealTimeCostMonitoring(): void {
    // Set up event listeners for real-time cost monitoring
    costMonitoringService.on('tokenUsage', (event) => {
      console.log(`💰 Token usage: ${event.usage.agentType} - $${event.cost.total.toFixed(4)}`);
    });

    costMonitoringService.on('budgetAlert', (alert) => {
      console.warn(`🚨 Budget Alert: ${alert.message}`);
      if (alert.type === 'critical') {
        console.error(`🔴 CRITICAL: ${alert.recommendedAction}`);
      }
    });

    costMonitoringService.on('autoTierDowngrade', (event) => {
      console.warn(`⬇️ Auto tier downgrade triggered: ${event.reason}`);
    });

    console.log(`📊 Real-time cost monitoring started`);
  }
}