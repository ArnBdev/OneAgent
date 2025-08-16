/**
 * AgentFactory - Factory for creating specialized agents
 *
 * This factory provides a centralized way to create and configure
 * different types of specialized agents in the OneAgent ecosystem.
 */

import { BaseAgent, AgentConfig } from './BaseAgent';
import { ISpecializedAgent } from './ISpecializedAgent';
import { PromptConfig, AgentPersona } from './PromptEngine';
import { OfficeAgent } from '../specialized/OfficeAgent';
import { FitnessAgent } from '../specialized/FitnessAgent';
import { DevAgent } from '../specialized/DevAgent';
import { CoreAgent } from '../specialized/CoreAgent';
import { TriageAgent } from '../specialized/TriageAgent';
import { PlannerAgent } from '../specialized/PlannerAgent';
import { ValidationAgent } from '../specialized/ValidationAgent';
import { unifiedBackbone, createUnifiedId } from '../../utils/UnifiedBackboneService';
// Fix: Use canonical AgentType from coreagent/types/oneagent-backbone-types
import type { AgentType as CanonicalAgentType } from '../../types/oneagent-backbone-types';

// NEW: Import tier system for intelligent model selection
import {
  ModelTierSelector,
  ModelSelectionCriteria,
  ModelSelection,
} from '../../config/gemini-model-tier-selector';
import { loadYamlDirectory, loadYamlFile } from './yamlLoader';
import * as path from 'path';

export interface AgentFactoryConfig {
  type: CanonicalAgentType;
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

  /**
   * Enable or disable NLACS (Natural Language Agent Coordination System) for this agent.
   * Defaults to true. Set to false to opt out for temporary or legacy agents.
   */
  nlacsEnabled?: boolean;

  /**
   * Optional: Override persona/quality/reasoning YAMLs for this agent
   */
  personaYaml?: string; // Path to persona YAML file
  qualityYaml?: string; // Path to quality YAML file
  reasoningYaml?: string; // Path to reasoning YAML file (future)
}

// --- Centralized YAML loading ---
const QUALITY_YAML_DIR = path.resolve(process.cwd(), 'prompts/quality');
const PERSONA_YAML_DIR = path.resolve(process.cwd(), 'prompts/persona');
// (Future) const REASONING_YAML_DIR = path.resolve(process.cwd(), 'prompts/reasoning');

// Load all YAMLs at module load (can be refactored to lazy-load or hot-reload in future)
const qualityYamls = loadYamlDirectory(QUALITY_YAML_DIR);
const personaYamls = loadYamlDirectory(PERSONA_YAML_DIR);
// (Future) const reasoningYamls = loadYamlDirectory(REASONING_YAML_DIR);

// Map agent types to their dedicated persona YAMLs
const AGENT_TYPE_PERSONA_MAP: Record<string, string> = {
  core: path.resolve(process.cwd(), 'prompts/personas/core-agent.yaml'),
  development: path.resolve(process.cwd(), 'prompts/personas/dev-agent.yaml'),
  office: path.resolve(process.cwd(), 'prompts/personas/office-agent.yaml'),
  fitness: path.resolve(process.cwd(), 'prompts/personas/fitness-agent.yaml'),
  triage: path.resolve(process.cwd(), 'prompts/personas/triage-agent.yaml'),
  planner: path.resolve(process.cwd(), 'prompts/personas/planner-agent.yaml'),
  validator: path.resolve(process.cwd(), 'prompts/personas/validation-agent.yaml'),
  validation: path.resolve(process.cwd(), 'prompts/personas/validation-agent.yaml'),
};

function buildPromptConfig(factoryConfig: AgentFactoryConfig): PromptConfig | undefined {
  try {
    // Load persona YAML (override or mapped default)
    // Use unknown then refine
    let personaRaw: unknown;
    if (factoryConfig.personaYaml) {
      personaRaw = loadYamlFile(factoryConfig.personaYaml);
    } else if (factoryConfig.type && AGENT_TYPE_PERSONA_MAP[factoryConfig.type]) {
      personaRaw = loadYamlFile(AGENT_TYPE_PERSONA_MAP[factoryConfig.type]);
    } else if (Object.keys(personaYamls).length > 0) {
      personaRaw = personaYamls[Object.keys(personaYamls)[0]];
    }

    // Load quality YAML (override or default)
    let qualityRaw: unknown;
    if (factoryConfig.qualityYaml) {
      qualityRaw = loadYamlFile(factoryConfig.qualityYaml);
    } else if (qualityYamls['constitutional-ai']) {
      qualityRaw = qualityYamls['constitutional-ai'];
    }

    if (!personaRaw || !qualityRaw) return undefined; // fallback to defaults

    // Map persona YAML -> AgentPersona
    interface PersonaRaw {
      [k: string]: unknown;
      role?: string;
      name?: string;
      style?: string;
      core_principles?: string[];
      coreStrength?: string;
      communication_style?: { tone?: string };
      frameworks?: { primary?: string; secondary?: string };
      principles?: string[];
      capabilities?: { frameworks?: string[] };
      quality_standards?: { minimum_score?: number };
    }
    const pRaw = personaRaw as PersonaRaw | undefined; // limited scope
    const agentPersona: AgentPersona = {
      role: pRaw?.role || pRaw?.name || `${factoryConfig.type} agent`,
      style: pRaw?.style || pRaw?.communication_style?.tone || 'professional',
      coreStrength:
        (pRaw?.core_principles && Array.isArray(pRaw.core_principles) && pRaw.core_principles[0]) ||
        pRaw?.coreStrength ||
        'multi-domain reasoning',
      principles: Array.isArray(pRaw?.core_principles)
        ? pRaw!.core_principles
        : pRaw?.principles || [],
      frameworks: (() => {
        const primary = pRaw?.frameworks?.primary;
        const secondary = pRaw?.frameworks?.secondary;
        const arr: string[] = [];
        if (primary) arr.push(primary as string);
        if (secondary) arr.push(secondary as string);
        return arr;
      })(),
    };

    // Map quality YAML -> constitutional principles + threshold
    interface QualityRaw {
      [k: string]: unknown;
      principles?: Record<
        string,
        { name?: string; description?: string; validation_rules?: string[]; severity?: string }
      >;
      scoring_criteria?: Record<string, { weight?: number }>;
      validation_process?: { quality_threshold?: number };
    }
    const qRaw = qualityRaw as QualityRaw | undefined;
    const principlesSection = qRaw?.principles || {};
    const scoring = qRaw?.scoring_criteria || {};
    const validationProcess = qRaw?.validation_process || {};

    const allowedCategories = new Set(['accuracy', 'transparency', 'helpfulness', 'safety']);
    const constitutionalPrinciples = Object.keys(principlesSection)
      .filter((k) => allowedCategories.has(k))
      .map((key: string) => {
        const entry = (
          principlesSection as Record<
            string,
            { name?: string; description?: string; validation_rules?: string[]; severity?: string }
          >
        )[key];
        const weight = scoring[key]?.weight ? Number(scoring[key].weight) / 10 : 1; // normalize
        return {
          id: key,
          name: entry.name || key,
          description: entry.description || '',
          category: key as 'accuracy' | 'transparency' | 'helpfulness' | 'safety',
          weight: weight || 1,
          isViolated: false,
          confidence: 1,
          validationRule: Array.isArray(entry.validation_rules)
            ? entry.validation_rules.join('; ')
            : 'content.length > 0',
          severityLevel: (entry.severity || 'medium') as 'low' | 'medium' | 'high' | 'critical',
        };
      });

    if (constitutionalPrinciples.length === 0) return undefined;

    const qualityThreshold =
      Number(
        (pRaw?.quality_standards && pRaw.quality_standards.minimum_score) ||
          validationProcess.quality_threshold,
      ) || 85;

    const enabledFrameworks: string[] = [];
    if (Array.isArray(pRaw?.capabilities?.frameworks)) {
      enabledFrameworks.push(...pRaw.capabilities.frameworks);
    }
    if (Array.isArray(agentPersona.frameworks)) enabledFrameworks.push(...agentPersona.frameworks);

    // Build PromptConfig
    const promptConfig: PromptConfig = {
      agentPersona,
      constitutionalPrinciples,
      enabledFrameworks: Array.from(new Set(enabledFrameworks)),
      enableCoVe: true, // default enable advanced verification
      enableRAG: true, // enable retrieval context
      qualityThreshold,
    };
    return promptConfig;
  } catch (err) {
    console.warn('Failed to build prompt config from YAML:', err);
    return undefined;
  }
}

// Define supported agent types for mappings
const SUPPORTED_AGENT_TYPES = [
  'core',
  'development',
  'office',
  'fitness',
  'triage',
  'planner',
  'validator',
  'general',
] as const;
type SupportedAgentType = (typeof SUPPORTED_AGENT_TYPES)[number];
function isSupportedAgentType(type: string): type is SupportedAgentType {
  return SUPPORTED_AGENT_TYPES.includes(type as SupportedAgentType);
}

export class AgentFactory {
  // Remove unsupported agent types from DEFAULT_CAPABILITIES and AGENT_TYPE_TIER_MAPPING
  // Only include: 'core', 'development', 'office', 'fitness', 'general', 'triage', 'planner', 'validator'
  private static readonly DEFAULT_CAPABILITIES = {
    core: [
      'system_coordination',
      'agent_integration',
      'service_management',
      'health_monitoring',
      'resource_allocation',
      'security_management',
      'rise_plus_methodology',
      'constitutional_ai',
      'quality_validation',
      'advanced_prompting',
      'bmad_analysis',
      'chain_of_verification',
    ],
    development: [
      'code_analysis',
      'test_generation',
      'documentation_sync',
      'refactoring',
      'performance_optimization',
      'security_scanning',
      'git_workflow',
      'dependency_management',
    ],
    office: ['document_processing', 'calendar_management', 'email_assistance', 'task_organization'],
    fitness: ['workout_planning', 'nutrition_tracking', 'progress_monitoring', 'goal_setting'],
    triage: [
      'task_routing',
      'system_health',
      'load_balancing',
      'agent_coordination',
      'priority_assessment',
    ],
    planner: [
      'strategic_planning',
      'task_orchestration',
      'resource_allocation',
      'timeline_management',
      'goal_decomposition',
    ],
    validator: [
      'quality_validation',
      'constitutional_ai',
      'code_review',
      'compliance_checking',
      'security_analysis',
      'bmad_analysis',
    ],
    general: ['conversation', 'information_retrieval', 'task_assistance'],
  };

  private static readonly AGENT_TYPE_TIER_MAPPING = {
    core: 'premium',
    development: 'premium',
    office: 'standard',
    fitness: 'standard',
    triage: 'premium',
    planner: 'premium',
    validator: 'premium',
    general: 'standard',
  } as const;

  private static modelTierSelector = ModelTierSelector.getInstance(); /**
   * NEW: Select optimal model for agent based on tier system
   */
  private static selectOptimalModel(factoryConfig: AgentFactoryConfig): ModelSelection {
    // Use custom model if specified
    if (factoryConfig.customModel) {
      console.log(`🎯 Using custom model: ${factoryConfig.customModel}`);
      return {
        modelName: factoryConfig.customModel,
        primaryModel: factoryConfig.customModel,
        fallbackModels: [],
        reasoning: 'Custom model specified by user',
        tier: 'standard', // Default tier for custom models
        estimatedCostPer1K: 0, // Unknown for custom
        capabilities: {
          reasoning: 'good',
          coding: 'good',
          bulk: 'good',
          realtime: 'good',
          multimodal: 'good',
          agentic: 'good',
        },
        rateLimits: { rpm: 0 },
      };
    }

    // Build selection criteria based on agent configuration
    const criteria: ModelSelectionCriteria = {
      agentType:
        factoryConfig.type === 'office'
          ? 'OfficeAgent'
          : factoryConfig.type === 'fitness'
            ? 'FitnessAgent'
            : factoryConfig.type === 'core'
              ? 'CoreAgent'
              : `${factoryConfig.type}Agent`,
      prioritizeCost: factoryConfig.prioritizeCost || false,
      prioritizePerformance: factoryConfig.prioritizePerformance || false,
      expectedVolume: factoryConfig.expectedVolume || 'medium',
      fallbackStrategy: 'tier-down', // Conservative fallback for production
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
    console.log(`   Cost: $${selection.estimatedCostPer1K}/1K output tokens`);
    console.log(`   Fallbacks: ${selection.fallbackModels.join(', ')}`);

    return selection;
  }

  /**
   * Create a specialized agent based on type and configuration
   */ static async createAgent(factoryConfig: AgentFactoryConfig): Promise<ISpecializedAgent> {
    // NEW: Select optimal model using tier system
    const modelSelection = AgentFactory.selectOptimalModel(factoryConfig);
    // Create unified agent context for consistent time/metadata across all agents
    const backboneAgentType = factoryConfig.type;
    const unifiedContext = unifiedBackbone.createAgentContext(
      factoryConfig.id,
      backboneAgentType as CanonicalAgentType,
      {
        sessionId: factoryConfig.sessionId || createUnifiedId('session', backboneAgentType),
        ...(factoryConfig.userId && { userId: factoryConfig.userId }),
        capabilities:
          factoryConfig.customCapabilities ||
          (isSupportedAgentType(factoryConfig.type)
            ? AgentFactory.DEFAULT_CAPABILITIES[factoryConfig.type]
            : []),
        memoryEnabled: factoryConfig.memoryEnabled ?? true,
        aiEnabled: factoryConfig.aiEnabled ?? true,
      },
    );

    // Compose prompt config (persona, quality, reasoning)
    const promptConfig = buildPromptConfig(factoryConfig);

    const agentConfig: AgentConfig = {
      id: factoryConfig.id,
      name: factoryConfig.name,
      description: factoryConfig.description || `${factoryConfig.type} agent`,
      capabilities:
        factoryConfig.customCapabilities ||
        (isSupportedAgentType(factoryConfig.type)
          ? AgentFactory.DEFAULT_CAPABILITIES[factoryConfig.type]
          : []),
      memoryEnabled: factoryConfig.memoryEnabled ?? true,
      aiEnabled: factoryConfig.aiEnabled ?? true,
      // Canonical agent communication handled via UnifiedAgentCommunicationService and NLACS extensions only.
    };

    let agent: BaseAgent | undefined;

    switch (factoryConfig.type) {
      case 'core':
        agent = new CoreAgent(agentConfig, promptConfig);
        break;
      case 'development':
        agent = new DevAgent(agentConfig, promptConfig) as unknown as BaseAgent;
        break;
      case 'office':
        agent = new OfficeAgent(agentConfig, promptConfig);
        break;
      case 'fitness':
        agent = new FitnessAgent(agentConfig, promptConfig);
        break;
      case 'triage':
        agent = new TriageAgent(agentConfig, promptConfig);
        break;
      case 'planner':
        agent = new PlannerAgent(agentConfig, promptConfig);
        break;
      case 'validator':
        agent = new ValidationAgent(agentConfig);
        break;
      case 'general':
        // Optionally implement a GeneralAgent if needed, or throw for now
        throw new Error('General agent type is not implemented.');
      default:
        throw new Error(`Unknown agent type: ${factoryConfig.type}`);
    }
    if (!agent) {
      throw new Error(`Failed to create agent of type: ${factoryConfig.type}`);
    }

    // Inject unified context into agent for consistent time/metadata usage
    if ('setUnifiedContext' in agent && typeof agent.setUnifiedContext === 'function') {
      agent.setUnifiedContext(unifiedContext);
    }
    // --- NLACS/Collective Memory Integration ---
    // Ensure all agents are NLACS-capable by default (opt-in/out via config)
    // and have collective memory logging/querying enabled
    if ('nlacsEnabled' in agent) {
      // Default to true unless explicitly set false in config
      agent.setNLACSEnabled(
        Object.prototype.hasOwnProperty.call(factoryConfig, 'nlacsEnabled')
          ? Boolean(factoryConfig.nlacsEnabled)
          : true,
      );
    }
    await agent.initialize();

    // Log agent creation with unified metadata (canonical safe handling)
    if (unifiedContext.metadataService) {
      const creationMetadata = unifiedContext.metadataService.create(
        'agent_creation',
        'agent_factory',
        {
          system: {
            source: 'agent_factory',
            component: 'AgentFactory',
            sessionId: unifiedContext.session.sessionId,
            ...(unifiedContext.session.userId && { userId: unifiedContext.session.userId }),
            agent: factoryConfig.type,
          },
          content: {
            category: 'agent_lifecycle',
            tags: ['agent', 'creation', factoryConfig.type, factoryConfig.id, modelSelection.tier],
            sensitivity: 'internal',
            relevanceScore: 0.8,
            contextDependency: 'session',
          },
          quality: {
            score: 90,
            constitutionalCompliant: true,
            validationLevel: 'enhanced',
            confidence: 0.9,
          },
        },
      );

      console.log(
        `✅ Agent created with tier-optimized model: ${factoryConfig.type}/${factoryConfig.id}`,
      );
      console.log(`   📱 Model: ${modelSelection.primaryModel} (${modelSelection.tier} tier)`);
      console.log(`   💰 Cost: $${modelSelection.estimatedCostPer1K}/1K tokens`);
      console.log(`   🔄 Fallbacks: ${modelSelection.fallbackModels.slice(0, 2).join(', ')}`);
      console.log(`   📊 Metadata: ${creationMetadata.id}`);
    } else {
      console.log(
        `✅ Agent created (metadata service unavailable): ${factoryConfig.type}/${factoryConfig.id}`,
      );
    }

    return agent as unknown as ISpecializedAgent;
  }

  /**
   * Get default capabilities for an agent type
   */
  static getDefaultCapabilities(type: CanonicalAgentType): string[] {
    return isSupportedAgentType(type) ? [...AgentFactory.DEFAULT_CAPABILITIES[type]] : [];
  }

  /**
   * Get available agent types
   */
  static getAvailableTypes(): CanonicalAgentType[] {
    return Object.keys(AgentFactory.DEFAULT_CAPABILITIES) as CanonicalAgentType[];
  }

  /**
   * Validate agent factory configuration
   */
  static validateConfig(config: AgentFactoryConfig): void {
    if (!config.id || !config.name || !config.type) {
      throw new Error('Agent factory config must include id, name, and type');
    }

    if (!isSupportedAgentType(config.type)) {
      throw new Error(`Unsupported agent type: ${config.type}`);
    }
  } /**
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
  static async createCostOptimizedAgent(
    config: Omit<AgentFactoryConfig, 'prioritizeCost'>,
  ): Promise<ISpecializedAgent> {
    return AgentFactory.createAgent({
      ...config,
      prioritizeCost: true,
      modelTier: 'economy',
    });
  }

  /**
   * Create agent with performance optimization
   */
  static async createPerformanceOptimizedAgent(
    config: Omit<AgentFactoryConfig, 'prioritizePerformance'>,
  ): Promise<ISpecializedAgent> {
    return AgentFactory.createAgent({
      ...config,
      prioritizePerformance: true,
      modelTier: 'premium',
    });
  }

  /**
   * Create agent with specific tier
   */
  static async createAgentWithTier(
    config: AgentFactoryConfig,
    tier: 'economy' | 'standard' | 'premium',
  ): Promise<ISpecializedAgent> {
    return AgentFactory.createAgent({
      ...config,
      modelTier: tier,
    });
  }

  /**
   * Get recommended tier for agent type
   */
  static getRecommendedTier(agentType: CanonicalAgentType): 'economy' | 'standard' | 'premium' {
    return isSupportedAgentType(agentType)
      ? AgentFactory.AGENT_TYPE_TIER_MAPPING[agentType]
      : 'standard';
  }

  /**
   * Get optimal model selection for agent type (without creating agent)
   */
  static getOptimalModelForAgentType(
    agentType: CanonicalAgentType,
    options?: {
      prioritizeCost?: boolean;
      prioritizePerformance?: boolean;
      expectedVolume?: 'low' | 'medium' | 'high' | 'ultra-high';
    },
  ): ModelSelection {
    const criteria: ModelSelectionCriteria = {
      agentType:
        agentType === 'office'
          ? 'OfficeAgent'
          : agentType === 'fitness'
            ? 'FitnessAgent'
            : agentType === 'core'
              ? 'CoreAgent'
              : `${agentType}Agent`,
      prioritizeCost: options?.prioritizeCost || false,
      prioritizePerformance: options?.prioritizePerformance || false,
      expectedVolume: options?.expectedVolume || 'medium',
      fallbackStrategy: 'tier-down',
    };

    return AgentFactory.modelTierSelector.selectOptimalModel(criteria);
  }

  /**
   * Estimate cost for agent type based on usage
   */
  static estimateCostForAgent(
    agentType: CanonicalAgentType,
    estimatedTokensPerMonth: number,
    options?: { prioritizeCost?: boolean },
  ): {
    tier: string;
    model: string;
    monthlyCostUSD: number;
    costPerInteraction: number;
    recommendations: string[];
  } {
    const selection = AgentFactory.getOptimalModelForAgentType(agentType, options);
    const monthlyCost = (estimatedTokensPerMonth / 1000) * selection.estimatedCostPer1K;
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
      recommendations,
    };
  }
}
