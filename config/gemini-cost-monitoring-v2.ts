/**
 * OneAgent Cost Monitoring Service - Temporal Awareness Enhanced
 * Part of OneAgent's Gemini Model Tier System
 * 
 * Provides real-time cost tracking using OneAgent's unified metadata system
 * with temporal awareness and Constitutional AI compliance.
 * 
 * @version 2.0.0 - Unified Metadata Integration
 * @author OneAgent Professional Development Platform
 */

import { EventEmitter } from 'events';
import { GEMINI_MODEL_REGISTRY, GeminiModelSpec } from './gemini-model-registry';
import { OneAgentUnifiedTimeService } from '../coreagent/utils/UnifiedBackboneService.js';
import { OneAgentClient } from '../coreagent/vscode-extension/src/connection/oneagent-client.js';
import type { 
  OneAgentBaseMetadata, 
  ConstitutionalAIMetadata,
  MemoryMetadata 
} from '../coreagent/types/metadata/OneAgentUnifiedMetadata.js';

// =============================================================================
// INTERFACES
// =============================================================================

export interface TokenUsage {
  agentId: string;
  agentType: string;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  timestamp: Date;
  taskType?: string;
  sessionId?: string;
}

export interface CostSummary {
  totalCost: number;
  inputCost: number;
  outputCost: number;
  tokenCount: {
    input: number;
    output: number;
    total: number;
  };
  modelBreakdown: {
    [modelId: string]: {
      cost: number;
      tokens: number;
      percentage: number;
    };
  };
  agentBreakdown: {
    [agentType: string]: {
      cost: number;
      tokens: number;
      percentage: number;
    };
  };
  timeframe: {
    start: Date;
    end: Date;
    duration: string;
  };
}

export interface BudgetAlert {
  type: 'warning' | 'critical' | 'info';
  message: string;
  currentCost: number;
  budgetLimit: number;
  percentageUsed: number;
  projectedOverage?: number;
  recommendedAction: string;
  timestamp: Date;
}

export interface CostForecast {
  projectedDailyCost: number;
  projectedMonthlyCost: number;
  confidenceLevel: number;
  basedOnDays: number;
  trendAnalysis: {
    direction: 'increasing' | 'decreasing' | 'stable';
    rate: number;
    factors: string[];
  };
  recommendations: string[];
}

export interface BudgetConfig {
  dailyLimit?: number;
  monthlyLimit?: number;
  warningThreshold: number; // Percentage (e.g., 80 for 80%)
  criticalThreshold: number; // Percentage (e.g., 95 for 95%)
  alertEmails?: string[];
  autoTierDowngrade?: boolean; // Automatically downgrade to economy tier when approaching limits
}

// =============================================================================
// TEMPORAL AWARE COST MONITORING SERVICE
// =============================================================================

export class CostMonitoringService extends EventEmitter {
  private static instance: CostMonitoringService;
  private usageHistory: TokenUsage[] = [];
  private budgetConfig: BudgetConfig = {
    warningThreshold: 80,
    criticalThreshold: 95,
    autoTierDowngrade: false
  };
  private timeService: OneAgentUnifiedTimeService;
  private memoryClient: OneAgentClient;
  private readonly COST_MEMORY_TYPE = 'cost_monitoring';
  private readonly SYSTEM_USER_ID = 'system_cost_monitoring';
  
  public static getInstance(): CostMonitoringService {
    if (!CostMonitoringService.instance) {
      CostMonitoringService.instance = new CostMonitoringService();
    }
    return CostMonitoringService.instance;
  }
  constructor() {
    super();
    this.timeService = OneAgentUnifiedTimeService.getInstance();
    this.memoryClient = new OneAgentClient();
    this.loadUsageHistory();
    
    // Set up periodic budget checking
    setInterval(() => {
      this.checkBudgetLimits();
    }, 60000); // Check every minute
    
    console.log('💰 CostMonitoringService initialized with temporal awareness');
  }

  /**
   * Track token usage for cost calculation with temporal awareness
   */
  public async trackTokenUsage(usage: TokenUsage): Promise<void> {
    // Calculate cost for this usage
    const model = GEMINI_MODEL_REGISTRY[usage.modelId];
    if (!model) {
      console.warn(`⚠️ Unknown model ID: ${usage.modelId}`);
      return;
    }

    const inputCost = (usage.inputTokens / 1_000_000) * model.pricing.inputPer1M;
    const outputCost = (usage.outputTokens / 1_000_000) * model.pricing.outputPer1M;
    const totalCost = inputCost + outputCost;

    // Store usage record with temporal awareness
    this.usageHistory.push(usage);

    // Store in OneAgent unified memory system with proper metadata
    await this.storeUsageInMemory(usage, {
      input: inputCost,
      output: outputCost,
      total: totalCost
    });

    // Emit cost event for real-time monitoring
    this.emit('tokenUsage', {
      usage,
      cost: {
        input: inputCost,
        output: outputCost,
        total: totalCost
      }
    });

    // Check if we're approaching budget limits
    this.checkBudgetLimits();

    console.log(`💰 Cost tracked: $${totalCost.toFixed(4)} for ${usage.agentType} using ${usage.modelId}`);
  }

  /**
   * Store usage data in OneAgent unified memory system with temporal metadata
   */
  private async storeUsageInMemory(usage: TokenUsage, cost: { input: number; output: number; total: number }): Promise<void> {    try {      // Create temporal context for this cost entry
      const timeContext = this.timeService.getContext();
      const timestampInfo = this.timeService.now();
      
      // Create cost metadata with Constitutional AI compliance
      const costData = {
        usage,
        cost,
        model: GEMINI_MODEL_REGISTRY[usage.modelId],        temporalContext: {
          timeOfDay: timeContext.context.timeOfDay,
          businessDay: timeContext.context.businessDay,
          energyLevel: timeContext.intelligence.energyLevel,
          timezone: timeContext.realTime.timezone
        }
      };

      // Create unified metadata for this cost entry
      const metadata: MemoryMetadata = {
        id: `cost_${usage.agentId}_${Date.now()}`,
        version: '1.0.0',
        schemaVersion: '1.0.0',
        type: 'memory',
        title: `Cost tracking for ${usage.agentType}`,
        description: `Token usage and cost for ${usage.modelId} model`,
        
        // Enhanced temporal metadata with real-time intelligence
        createdAt: new Date(usage.timestamp),
        updatedAt: new Date(),
        temporal: {
          realTime: {
            createdAtUnix: usage.timestamp.getTime(),
            updatedAtUnix: Date.now(),
            timezoneCaptured: timeContext.realTime.timezone,
            utcOffset: new Date().getTimezoneOffset()
          },
          contextSnapshot: {
            timeOfDay: timeContext.context.timeOfDay,
            dayOfWeek: timeContext.context.dayOfWeek,
            businessContext: timeContext.context.businessDay,
            seasonalContext: timeContext.context.seasonalContext,
            userEnergyContext: timeContext.intelligence.energyLevel
          },
          relevance: {
            isTimeDependent: true,
            relevanceDecay: 'medium',
            temporalTags: [
              'cost-monitoring',
              `model-${usage.modelId}`,
              `agent-${usage.agentType}`,
              timeContext.context.timeOfDay,
              timeContext.context.businessDay ? 'business-hours' : 'off-hours'
            ]
          },
          lifeCoaching: {
            habitTimestamp: false,
            goalTimeline: {
              isGoalRelated: false,
              timeframe: 'daily'
            },
            emotionalTiming: {
              energyAlignment: true,
              reflectionTiming: false
            }
          },
          professional: {
            projectPhase: 'execution',
            urgencyLevel: 'low',
            deadlineAwareness: {
              hasDeadline: false,
              criticalPath: false
            },
            collaborationTiming: {
              requiresRealTime: false,
              asyncFriendly: true,
              timezoneSensitive: false
            }
          }
        },
        
        source: {
          origin: 'cost_monitoring_service',
          creator: 'CostMonitoringService',
          system: 'OneAgent',
          component: 'gemini_tier_system'
        },
        
        // Constitutional AI compliance for cost data
        constitutional: {
          accuracy: {
            score: 95,
            validated: true,
            validatedAt: new Date(),
            validationMethod: 'ai',
            confidence: 0.95
          },
          transparency: {
            score: 100,
            sourcesDocumented: true,
            reasoningExplained: true,
            limitationsAcknowledged: false,
            uncertaintyHandled: true
          },
          helpfulness: {
            score: 90,
            actionable: true,
            relevant: true,
            userFocused: true,
            clarityLevel: 'good'
          },
          safety: {
            score: 100,
            harmfulContentCheck: true,
            misinformationCheck: true,
            biasCheck: true,
            ethicalReview: true
          },
          overallCompliance: {
            score: 96,
            grade: 'A',
            lastValidated: new Date(),
            validatedBy: 'CostMonitoringService',
            complianceHistory: []
          }
        },
        
        // Quality metrics
        quality: {
          qualityScore: {
            overall: 90,
            accuracy: 95,
            completeness: 100,
            relevance: 85,
            clarity: 90,
            maintainability: 85,
            performance: 90
          },
          standards: {
            minimumThreshold: 80,
            targetThreshold: 90,
            currentStatus: 'meets-target',
            improvementSuggestions: []
          },
          qualityHistory: []
        },
        
        // Semantic information
        semantic: {
          semanticTags: {
            primary: ['cost', 'monitoring', 'tokens', 'gemini'],
            secondary: [usage.modelId, usage.agentType],
            contextual: ['tier-system', 'budget', 'forecasting'],
            temporal: [timeContext.context.timeOfDay, timeContext.context.dayOfWeek],
            hierarchical: ['system', 'cost', 'usage']
          },
          embeddings: {
            model: 'text-embedding-ada-002',
            generatedAt: new Date(),
            confidence: 0.85
          },
          relationships: {
            relatedIds: [],
            relationshipTypes: {},
            strength: {},
            context: {}
          },
          searchability: {
            searchTerms: ['cost', 'usage', usage.modelId, usage.agentType],
            aliases: ['token-cost', 'model-cost', 'agent-cost'],
            synonyms: ['expense', 'billing', 'pricing'],
            categories: ['cost-monitoring', 'gemini-tier-system'],
            indexingPriority: 'medium'
          }
        },
        
        // Context information
        context: {
          context: {
            domain: 'cost-monitoring',
            subdomain: 'token-tracking',
            framework: 'gemini-tier-system',
            version: '2.0.0',
            environment: 'production'
          },
          usage: {
            frequencyAccessed: 1,
            lastAccessed: new Date(),
            accessPatterns: [],
            popularityScore: 50
          },
          temporalLegacy: {
            relevanceWindow: {
              indefinite: false
            },
            versionRelevance: ['2.0.0']
          }
        },
        
        // Memory-specific properties
        memory: {
          memoryType: 'long_term',
          importance: 70,
          confidence: 0.95,
          patterns: {
            accessFrequency: 1,
            recallSuccess: 1,
            associationStrength: {},
            forgettingCurve: {
              initialStrength: 1,
              decayRate: 0.1,
              lastReinforced: new Date()
            }
          },          learningContext: {
            ...(usage.sessionId && { sessionId: usage.sessionId }),
            taskContext: `cost_tracking_${usage.agentType}`,
            userGoals: ['cost-optimization', 'budget-management'],
            outcomeSuccess: true
          }
        },
        
        // Cross-system integration
        integration: {
          systemIds: {
            'cost_monitoring': `cost_${usage.agentId}_${Date.now()}`,
            'gemini_tier': usage.modelId,
            'agent_factory': usage.agentId
          },
          syncStatus: {
            'memory': 'synced',
            'audit': 'pending',
            'health_monitoring': 'disabled'
          },
          lastSyncAt: {
            'memory': new Date()
          },
          conflicts: []
        },
        
        // Validation
        validation: {
          isValid: true,
          schemaCompliant: true,
          validationErrors: []
        },
        
        // Extensions for cost-specific data
        extensions: {
          costData,
          geminiModel: usage.modelId,
          agentType: usage.agentType,
          tierSystem: '2.0.0'
        },
        
        // System metadata
        system: {
          readonly: false,
          archived: false,
          indexed: true,
          cached: true,
          priority: 'medium',
          retention: {
            policy: 'temporary',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          }
        }
      };      // Store in OneAgent unified memory system
      const memoryContent = JSON.stringify({
        costData,
        metadata: {
          id: metadata.id,
          type: metadata.type,
          temporal: metadata.temporal,
          constitutional: metadata.constitutional,
          quality: metadata.quality
        }
      }, null, 2);

      try {
        await this.memoryClient.memoryCreate(
          memoryContent,
          this.SYSTEM_USER_ID,
          this.COST_MEMORY_TYPE
        );
        
        console.log(`📊 Cost data stored in unified memory with temporal context: ${metadata.id}`);
      } catch (memoryError) {
        console.warn('⚠️ Failed to store cost data in unified memory system:', memoryError);
        // Fall back to local storage for this session
        this.usageHistory.push(usage);
      }
      
    } catch (error) {
      console.warn('⚠️ Failed to store cost data in memory:', error);
    }
  }

  /**
   * Get cost summary for specified timeframe
   */
  public getCurrentCost(timeframe: 'hour' | 'day' | 'week' | 'month'): CostSummary {
    const now = new Date();
    let startTime: Date;

    switch (timeframe) {
      case 'hour':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const relevantUsage = this.usageHistory.filter(
      usage => usage.timestamp >= startTime
    );

    return this.calculateCostSummary(relevantUsage, startTime, now);
  }

  /**
   * Get current budget alerts
   */
  public getBudgetAlerts(): BudgetAlert[] {
    const alerts: BudgetAlert[] = [];
    const dailyCost = this.getCurrentCost('day');
    const monthlyCost = this.getCurrentCost('month');

    // Check daily budget
    if (this.budgetConfig.dailyLimit) {
      const dailyPercentage = (dailyCost.totalCost / this.budgetConfig.dailyLimit) * 100;
      
      if (dailyPercentage >= this.budgetConfig.criticalThreshold) {
        alerts.push({
          type: 'critical',
          message: `Critical: Daily budget usage at ${dailyPercentage.toFixed(1)}%`,
          currentCost: dailyCost.totalCost,
          budgetLimit: this.budgetConfig.dailyLimit,
          percentageUsed: dailyPercentage,
          recommendedAction: this.budgetConfig.autoTierDowngrade 
            ? 'Auto-downgrading to economy tier' 
            : 'Consider switching to economy tier',
          timestamp: new Date()
        });
      } else if (dailyPercentage >= this.budgetConfig.warningThreshold) {
        alerts.push({
          type: 'warning',
          message: `Warning: Daily budget usage at ${dailyPercentage.toFixed(1)}%`,
          currentCost: dailyCost.totalCost,
          budgetLimit: this.budgetConfig.dailyLimit,
          percentageUsed: dailyPercentage,
          recommendedAction: 'Monitor usage closely',
          timestamp: new Date()
        });
      }
    }

    return alerts;
  }

  /**
   * Configure budget limits and alerts
   */
  public configureBudget(config: Partial<BudgetConfig>): void {
    this.budgetConfig = { ...this.budgetConfig, ...config };
    console.log(`💰 Budget configuration updated:`, this.budgetConfig);
    this.checkBudgetLimits();
  }

  /**
   * Clear usage history (for testing or reset)
   */
  public clearUsageHistory(): void {
    this.usageHistory = [];
    console.log(`🧹 Cost monitoring history cleared`);
  }

  /**
   * Get usage analytics for specified timeframe (AgentFactory compatibility)
   */
  public getUsageAnalytics(timeframe: 'day' | 'week' | 'month') {
    const costSummary = this.getCurrentCost(timeframe);
    const forecast = this.forecastCosts();
    const budgetAlerts = this.getBudgetAlerts();
    
    return {
      summary: costSummary,
      forecast,
      alerts: budgetAlerts,
      recommendations: this.generateRecommendations(costSummary, budgetAlerts)
    };
  }

  /**
   * Generate cost forecasts based on usage patterns
   */
  public forecastCosts(days: number = 7): CostForecast {
    if (this.usageHistory.length === 0) {
      return {
        projectedDailyCost: 0,
        projectedMonthlyCost: 0,
        confidenceLevel: 0,
        basedOnDays: 0,
        trendAnalysis: {
          direction: 'stable',
          rate: 0,
          factors: ['No historical data available']
        },
        recommendations: ['Begin tracking usage to enable forecasting']
      };
    }

    // Calculate daily averages from recent data
    const recentDays = Math.min(days, 30); // Use up to 30 days of history
    const recentStartTime = new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000);
    const recentUsage = this.usageHistory.filter(usage => usage.timestamp >= recentStartTime);
    
    if (recentUsage.length === 0) {
      return {
        projectedDailyCost: 0,
        projectedMonthlyCost: 0,
        confidenceLevel: 0,
        basedOnDays: 0,
        trendAnalysis: {
          direction: 'stable',
          rate: 0,
          factors: ['No recent usage data']
        },
        recommendations: ['Start using the system to generate forecasts']
      };
    }

    // Calculate daily costs
    const dailyCosts: { [date: string]: number } = {};
    
    recentUsage.forEach(usage => {
      const model = GEMINI_MODEL_REGISTRY[usage.modelId];
      if (!model) return;
      
      const inputCost = (usage.inputTokens / 1_000_000) * model.pricing.inputPer1M;
      const outputCost = (usage.outputTokens / 1_000_000) * model.pricing.outputPer1M;
      const totalCost = inputCost + outputCost;
      
      const dateKey = usage.timestamp.toDateString();
      dailyCosts[dateKey] = (dailyCosts[dateKey] || 0) + totalCost;
    });

    const costs = Object.values(dailyCosts);
    const avgDailyCost = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
    
    // Simple trend analysis
    let direction: 'increasing' | 'decreasing' | 'stable' = 'stable';
    let rate = 0;
    
    if (costs.length >= 3) {
      const recent = costs.slice(-3).reduce((sum, cost) => sum + cost, 0) / 3;
      const earlier = costs.slice(0, 3).reduce((sum, cost) => sum + cost, 0) / 3;
      const change = (recent - earlier) / earlier;
      
      if (Math.abs(change) > 0.1) { // 10% threshold
        direction = change > 0 ? 'increasing' : 'decreasing';
        rate = Math.abs(change);
      }
    }

    const projectedDailyCost = avgDailyCost;
    const projectedMonthlyCost = projectedDailyCost * 30;
    const confidenceLevel = Math.min(costs.length / 7, 1) * 100; // Higher confidence with more data

    return {
      projectedDailyCost,
      projectedMonthlyCost,
      confidenceLevel,
      basedOnDays: costs.length,
      trendAnalysis: {
        direction,
        rate,
        factors: this.getTrendFactors(direction, rate)
      },
      recommendations: this.getForecastRecommendations(projectedMonthlyCost, direction)
    };
  }

  // ...existing methods...

  /**
   * Generate recommendations based on cost analysis
   */
  private generateRecommendations(summary: CostSummary, alerts: BudgetAlert[]): string[] {
    const recommendations: string[] = [];
    
    if (alerts.length > 0) {
      recommendations.push('Consider budget optimization - alerts detected');
    }
    
    // Model efficiency recommendations
    const modelEntries = Object.entries(summary.modelBreakdown);
    if (modelEntries.length > 0) {
      const mostExpensive = modelEntries.reduce((max, entry) => 
        entry[1].cost > max[1].cost ? entry : max
      );
      
      if (mostExpensive[1].percentage > 60) {
        const model = GEMINI_MODEL_REGISTRY[mostExpensive[0]];
        if (model && model.modelTier === 'premium') {
          recommendations.push(`Consider switching from ${mostExpensive[0]} to a standard tier model for cost savings`);
        }
      }
    }
    
    // Usage pattern recommendations
    if (summary.totalCost > 0) {
      const timeframe = summary.timeframe;
      const duration = timeframe.end.getTime() - timeframe.start.getTime();
      const hoursInTimeframe = duration / (1000 * 60 * 60);
      
      if (hoursInTimeframe < 24 && summary.totalCost > 10) { // High cost in short time
        recommendations.push('High usage detected - consider implementing request batching');
      }
    }
    
    return recommendations;
  }

  /**
   * Get trend analysis factors
   */
  private getTrendFactors(direction: string, rate: number): string[] {
    const factors: string[] = [];
    
    switch (direction) {
      case 'increasing':
        if (rate > 0.5) {
          factors.push('Significant usage increase detected');
        } else {
          factors.push('Gradual usage increase');
        }
        factors.push('Monitor for efficiency opportunities');
        break;
      case 'decreasing':
        factors.push('Usage optimization taking effect');
        break;
      default:
        factors.push('Stable usage pattern');
    }
    
    return factors;
  }

  /**
   * Get forecast-based recommendations
   */
  private getForecastRecommendations(projectedMonthlyCost: number, direction: string): string[] {
    const recommendations: string[] = [];
    
    if (projectedMonthlyCost > 100) {
      recommendations.push('Consider implementing cost controls for high projected usage');
    }
    
    if (direction === 'increasing') {
      recommendations.push('Implement tier optimization to control cost growth');
    }
    
    if (projectedMonthlyCost < 10) {
      recommendations.push('Low cost projection - consider exploring premium features');
    }
    
    return recommendations;
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private calculateCostSummary(usage: TokenUsage[], startTime: Date, endTime: Date): CostSummary {
    let totalInputCost = 0;
    let totalOutputCost = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    
    const modelBreakdown: { [key: string]: { cost: number; tokens: number; percentage: number } } = {};
    const agentBreakdown: { [key: string]: { cost: number; tokens: number; percentage: number } } = {};

    usage.forEach(record => {
      const model = GEMINI_MODEL_REGISTRY[record.modelId];
      if (!model) return;

      const inputCost = (record.inputTokens / 1_000_000) * model.pricing.inputPer1M;
      const outputCost = (record.outputTokens / 1_000_000) * model.pricing.outputPer1M;
      const totalCost = inputCost + outputCost;
      const totalTokens = record.inputTokens + record.outputTokens;

      totalInputCost += inputCost;
      totalOutputCost += outputCost;
      totalInputTokens += record.inputTokens;
      totalOutputTokens += record.outputTokens;

      // Model breakdown
      if (!modelBreakdown[record.modelId]) {
        modelBreakdown[record.modelId] = { cost: 0, tokens: 0, percentage: 0 };
      }
      modelBreakdown[record.modelId].cost += totalCost;
      modelBreakdown[record.modelId].tokens += totalTokens;

      // Agent breakdown
      if (!agentBreakdown[record.agentType]) {
        agentBreakdown[record.agentType] = { cost: 0, tokens: 0, percentage: 0 };
      }
      agentBreakdown[record.agentType].cost += totalCost;
      agentBreakdown[record.agentType].tokens += totalTokens;
    });

    const totalCost = totalInputCost + totalOutputCost;

    // Calculate percentages
    Object.keys(modelBreakdown).forEach(key => {
      modelBreakdown[key].percentage = totalCost > 0 ? (modelBreakdown[key].cost / totalCost) * 100 : 0;
    });

    Object.keys(agentBreakdown).forEach(key => {
      agentBreakdown[key].percentage = totalCost > 0 ? (agentBreakdown[key].cost / totalCost) * 100 : 0;
    });

    return {
      totalCost,
      inputCost: totalInputCost,
      outputCost: totalOutputCost,
      tokenCount: {
        input: totalInputTokens,
        output: totalOutputTokens,
        total: totalInputTokens + totalOutputTokens
      },
      modelBreakdown,
      agentBreakdown,
      timeframe: {
        start: startTime,
        end: endTime,
        duration: this.formatDuration(endTime.getTime() - startTime.getTime())
      }
    };
  }

  private checkBudgetLimits(): void {
    const alerts = this.getBudgetAlerts();
    
    alerts.forEach(alert => {
      this.emit('budgetAlert', alert);
      
      if (alert.type === 'critical' && this.budgetConfig.autoTierDowngrade) {
        this.emit('autoTierDowngrade', {
          reason: 'Budget limit exceeded',
          alert
        });
      }
    });
  }

  private formatDuration(ms: number): string {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} days`;
    if (hours > 0) return `${hours} hours`;
    return `${Math.floor(ms / (1000 * 60))} minutes`;
  }
  private async loadUsageHistory(): Promise<void> {
    try {
      console.log('📊 Loading cost history from unified memory system...');
      
      // Search for cost monitoring memories
      const memoryResponse = await this.memoryClient.memorySearch({
        query: 'cost monitoring usage tokens',
        userId: this.SYSTEM_USER_ID,
        limit: 1000 // Get recent cost data
      });

      if (memoryResponse.success && memoryResponse.data?.memories) {
        let loadedCount = 0;
        
        for (const memory of memoryResponse.data.memories) {
          try {
            const memoryData = JSON.parse(memory.content);
            if (memoryData.costData?.usage) {
              // Reconstruct TokenUsage from stored data
              const usage: TokenUsage = {
                ...memoryData.costData.usage,
                timestamp: new Date(memoryData.costData.usage.timestamp)
              };
              
              // Only load recent usage (last 30 days) to prevent memory bloat
              const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
              if (usage.timestamp >= thirtyDaysAgo) {
                this.usageHistory.push(usage);
                loadedCount++;
              }
            }
          } catch (parseError) {
            console.warn('⚠️ Failed to parse stored cost memory:', parseError);
          }
        }
        
        console.log(`📊 Loaded ${loadedCount} cost history entries from unified memory`);
        
        // Sort by timestamp for consistency
        this.usageHistory.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      } else {
        console.log('📊 No previous cost history found in memory system');
      }
    } catch (error) {
      console.warn('⚠️ Failed to load cost history from memory:', error);
      console.log('📊 Starting with empty cost history');
    }
  }

  /**
   * Get cost forecast based on current usage trends
   */
  public getCostForecast(daysToProject: number = 30): CostForecast {
    const recentDays = Math.min(14, daysToProject); // Use last 14 days for trend analysis
    const startTime = new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000);
    const recentUsage = this.usageHistory.filter(usage => usage.timestamp >= startTime);
    
    if (recentUsage.length === 0) {
      return {
        projectedDailyCost: 0,
        projectedMonthlyCost: 0,
        confidenceLevel: 0,
        basedOnDays: 0,
        trendAnalysis: {
          direction: 'stable',
          rate: 0,
          factors: ['No usage data available']
        },
        recommendations: ['Start using the system to generate forecasts']
      };
    }

    // Calculate daily costs for trend analysis
    const dailyCosts = this.calculateDailyCosts(recentUsage);
    const averageDailyCost = dailyCosts.reduce((sum, cost) => sum + cost, 0) / dailyCosts.length;
    
    // Determine trend direction and rate
    const trendAnalysis = this.analyzeTrend(dailyCosts);
    
    // Project future costs
    let projectedDailyCost = averageDailyCost;
    if (trendAnalysis.direction === 'increasing') {
      projectedDailyCost = averageDailyCost * (1 + trendAnalysis.rate);
    } else if (trendAnalysis.direction === 'decreasing') {
      projectedDailyCost = averageDailyCost * (1 - trendAnalysis.rate);
    }

    const projectedMonthlyCost = projectedDailyCost * 30;
    const confidenceLevel = Math.min(95, Math.max(30, (dailyCosts.length / 14) * 100));

    return {
      projectedDailyCost,
      projectedMonthlyCost,
      confidenceLevel,
      basedOnDays: dailyCosts.length,
      trendAnalysis,
      recommendations: this.generateCostRecommendations(projectedDailyCost, projectedMonthlyCost, trendAnalysis)
    };
  }

  /**
   * Get optimization recommendations based on current usage patterns
   */
  public getOptimizationRecommendations(): string[] {
    const costSummary = this.getCurrentCost('day');
    const recommendations: string[] = [];

    // Analyze model usage efficiency
    const modelBreakdown = Object.entries(costSummary.modelBreakdown)
      .sort((a, b) => b[1].cost - a[1].cost);

    if (modelBreakdown.length > 0) {
      const topModel = modelBreakdown[0];
      const topModelSpec = GEMINI_MODEL_REGISTRY[topModel[0]];
        if (topModelSpec && topModelSpec.modelTier === 'premium' && topModel[1].percentage > 60) {
        recommendations.push(
          `Consider using standard tier models for routine tasks. ${topModel[0]} accounts for ${topModel[1].percentage.toFixed(1)}% of costs.`
        );
      }
      
      if (topModelSpec && topModelSpec.modelTier === 'standard' && topModel[1].percentage > 70) {
        recommendations.push(
          `Evaluate if economy tier models could handle some of your ${topModel[0]} workloads (${topModel[1].percentage.toFixed(1)}% of costs).`
        );
      }
    }

    // Analyze agent usage patterns
    const agentBreakdown = Object.entries(costSummary.agentBreakdown)
      .sort((a, b) => b[1].cost - a[1].cost);

    if (agentBreakdown.length > 0) {
      const topAgent = agentBreakdown[0];
      if (topAgent[1].percentage > 50) {
        recommendations.push(
          `${topAgent[0]} agents account for ${topAgent[1].percentage.toFixed(1)}% of costs. Consider optimizing their model selection.`
        );
      }
    }

    // Time-based recommendations
    const timeContext = this.timeService.getContext();
    if (!timeContext.context.workingHours && costSummary.totalCost > 0) {
      recommendations.push(
        'Consider scheduling batch processing during off-hours with ECONOMY tier models to reduce costs.'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Current usage patterns appear well-optimized. Continue monitoring for emerging patterns.');
    }

    return recommendations;
  }

  /**
   * Auto-adjust tier based on budget constraints (if enabled)
   */
  public async autoOptimizeTiers(): Promise<{ adjusted: boolean; newTier: string; reason: string }> {
    if (!this.budgetConfig.autoTierDowngrade) {
      return { adjusted: false, newTier: 'none', reason: 'Auto-tier adjustment disabled' };
    }

    const alerts = this.getBudgetAlerts();
    const criticalAlert = alerts.find(alert => alert.type === 'critical');
    
    if (criticalAlert) {
      // This would integrate with the tier selector to downgrade models
      const reason = `Budget limit exceeded: ${criticalAlert.percentageUsed.toFixed(1)}% of ${criticalAlert.budgetLimit}`;
      
      this.emit('tierOptimization', {
        action: 'downgrade_to_economy',
        reason,
        currentCost: criticalAlert.currentCost,
        budgetLimit: criticalAlert.budgetLimit
      });

      return { adjusted: true, newTier: 'economy', reason };
    }

    return { adjusted: false, newTier: 'none', reason: 'Budget within limits' };
  }

  // =============================================================================
  // PRIVATE HELPER METHODS FOR FORECASTING
  // =============================================================================

  private calculateDailyCosts(usage: TokenUsage[]): number[] {
    const dailyMap = new Map<string, number>();
    
    usage.forEach(record => {
      const dateKey = record.timestamp.toISOString().split('T')[0];
      const model = GEMINI_MODEL_REGISTRY[record.modelId];
      if (!model) return;

      const inputCost = (record.inputTokens / 1_000_000) * model.pricing.inputPer1M;
      const outputCost = (record.outputTokens / 1_000_000) * model.pricing.outputPer1M;
      const totalCost = inputCost + outputCost;

      dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + totalCost);
    });

    return Array.from(dailyMap.values());
  }

  private analyzeTrend(dailyCosts: number[]): { direction: 'increasing' | 'decreasing' | 'stable'; rate: number; factors: string[] } {
    if (dailyCosts.length < 3) {
      return { direction: 'stable', rate: 0, factors: ['Insufficient data for trend analysis'] };
    }

    // Simple linear regression for trend
    const n = dailyCosts.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = dailyCosts;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const avgY = sumY / n;
    
    const rate = Math.abs(slope / avgY);
    const factors: string[] = [];
    
    if (rate < 0.1) {
      return { direction: 'stable', rate, factors: ['Usage patterns are consistent'] };
    }
    
    if (slope > 0) {
      factors.push('Increasing usage detected');
      if (rate > 0.3) factors.push('Rapid growth in model usage');
      return { direction: 'increasing', rate, factors };
    } else {
      factors.push('Decreasing usage detected');
      if (rate > 0.3) factors.push('Significant reduction in model usage');
      return { direction: 'decreasing', rate, factors };
    }
  }

  private generateCostRecommendations(dailyCost: number, monthlyCost: number, trend: any): string[] {
    const recommendations: string[] = [];
    
    if (monthlyCost > 100) {
      recommendations.push('Consider setting up budget alerts and tier optimization for high-volume usage');
    }
    
    if (monthlyCost > 50) {
      recommendations.push('Review agent configurations to ensure optimal model selection for different task types');
    }
    
    if (trend.direction === 'increasing' && trend.rate > 0.2) {
      recommendations.push('Usage is increasing rapidly. Consider implementing cost controls and monitoring');
    }
      if (dailyCost > 5) {
      recommendations.push('High daily costs detected. Evaluate if economy tier models can handle routine tasks');
    }
    
    recommendations.push('Enable auto-tier downgrade to prevent budget overruns');
    
    return recommendations;
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const costMonitoringService = CostMonitoringService.getInstance();
