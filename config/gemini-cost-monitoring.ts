/**
 * Real-Time Cost Monitoring Service for Gemini Model Tier System
 * Part of OneAgent's Advanced Enhancement Phase 3A
 * 
 * Provides real-time cost tracking, budget alerts, and cost forecasting
 * for intelligent cost optimization across the tier system.
 */

import { EventEmitter } from 'events';
import { GEMINI_MODEL_REGISTRY, GeminiModelSpec } from './gemini-model-registry';

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
// COST MONITORING SERVICE
// =============================================================================

export class CostMonitoringService extends EventEmitter {
  private static instance: CostMonitoringService;
  private usageHistory: TokenUsage[] = [];
  private budgetConfig: BudgetConfig = {
    warningThreshold: 80,
    criticalThreshold: 95,
    autoTierDowngrade: false
  };
  
  private readonly STORAGE_KEY = 'oneagent_cost_monitoring';
  
  public static getInstance(): CostMonitoringService {
    if (!CostMonitoringService.instance) {
      CostMonitoringService.instance = new CostMonitoringService();
    }
    return CostMonitoringService.instance;
  }

  constructor() {
    super();
    this.loadUsageHistory();
    
    // Set up periodic budget checking
    setInterval(() => {
      this.checkBudgetLimits();
    }, 60000); // Check every minute
  }

  /**
   * Track token usage for cost calculation
   */
  public trackTokenUsage(usage: TokenUsage): void {
    // Calculate cost for this usage
    const model = GEMINI_MODEL_REGISTRY[usage.modelId];
    if (!model) {
      console.warn(`⚠️ Unknown model ID: ${usage.modelId}`);
      return;
    }    const inputCost = (usage.inputTokens / 1_000_000) * model.pricing.inputPer1M;
    const outputCost = (usage.outputTokens / 1_000_000) * model.pricing.outputPer1M;
    const totalCost = inputCost + outputCost;

    // Store usage record
    this.usageHistory.push(usage);

    // Emit cost event for real-time monitoring
    this.emit('tokenUsage', {
      usage,
      cost: {
        input: inputCost,
        output: outputCost,
        total: totalCost
      }
    });

    // Save to persistent storage
    this.saveUsageHistory();

    // Check if we're approaching budget limits
    this.checkBudgetLimits();

    console.log(`💰 Cost tracked: $${totalCost.toFixed(4)} for ${usage.agentType} using ${usage.modelId}`);
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

    // Check monthly budget
    if (this.budgetConfig.monthlyLimit) {
      const monthlyPercentage = (monthlyCost.totalCost / this.budgetConfig.monthlyLimit) * 100;
      
      if (monthlyPercentage >= this.budgetConfig.criticalThreshold) {
        alerts.push({
          type: 'critical',
          message: `Critical: Monthly budget usage at ${monthlyPercentage.toFixed(1)}%`,
          currentCost: monthlyCost.totalCost,
          budgetLimit: this.budgetConfig.monthlyLimit,
          percentageUsed: monthlyPercentage,
          recommendedAction: 'Immediate cost optimization required',
          timestamp: new Date()
        });
      }
    }

    return alerts;
  }

  /**
   * Forecast costs based on usage patterns
   */
  public forecastCosts(days: number = 7): CostForecast {
    if (this.usageHistory.length < 24) { // Need at least 24 hours of data
      return {
        projectedDailyCost: 0,
        projectedMonthlyCost: 0,
        confidenceLevel: 0,
        basedOnDays: 0,
        trendAnalysis: {
          direction: 'stable',
          rate: 0,
          factors: ['Insufficient data for forecasting']
        },
        recommendations: ['Collect more usage data for accurate forecasting']
      };
    }

    const recentUsage = this.usageHistory.slice(-days * 24); // Rough approximation
    const recentCost = this.calculateCostSummary(recentUsage, 
      new Date(Date.now() - days * 24 * 60 * 60 * 1000), 
      new Date()
    );

    const dailyAverage = recentCost.totalCost / days;
    const projectedMonthlyCost = dailyAverage * 30;

    // Simple trend analysis
    const firstHalf = recentUsage.slice(0, recentUsage.length / 2);
    const secondHalf = recentUsage.slice(recentUsage.length / 2);
    
    const firstHalfCost = this.calculateCostSummary(firstHalf, 
      firstHalf[0]?.timestamp || new Date(), 
      firstHalf[firstHalf.length - 1]?.timestamp || new Date()
    ).totalCost;
    
    const secondHalfCost = this.calculateCostSummary(secondHalf,
      secondHalf[0]?.timestamp || new Date(),
      secondHalf[secondHalf.length - 1]?.timestamp || new Date()
    ).totalCost;

    const trendRate = ((secondHalfCost - firstHalfCost) / firstHalfCost) * 100;
    const trendDirection = trendRate > 5 ? 'increasing' : trendRate < -5 ? 'decreasing' : 'stable';

    const recommendations = this.generateCostRecommendations(recentCost, trendDirection, trendRate);

    return {
      projectedDailyCost: dailyAverage,
      projectedMonthlyCost,
      confidenceLevel: Math.min(days / 7, 1) * 100, // Higher confidence with more data
      basedOnDays: days,
      trendAnalysis: {
        direction: trendDirection,
        rate: Math.abs(trendRate),
        factors: this.identifyTrendFactors(recentCost)
      },
      recommendations
    };
  }

  /**
   * Configure budget limits and alerts
   */
  public configureBudget(config: Partial<BudgetConfig>): void {
    this.budgetConfig = { ...this.budgetConfig, ...config };
    console.log(`💰 Budget configuration updated:`, this.budgetConfig);
    
    // Immediately check if we're over new limits
    this.checkBudgetLimits();
  }

  /**
   * Get current budget configuration
   */
  public getBudgetConfig(): BudgetConfig {
    return { ...this.budgetConfig };
  }

  /**
   * Clear usage history (for testing or reset)
   */
  public clearUsageHistory(): void {
    this.usageHistory = [];
    this.saveUsageHistory();
    console.log(`🧹 Cost monitoring history cleared`);
  }

  /**
   * Get detailed usage analytics
   */
  public getUsageAnalytics(timeframe: 'day' | 'week' | 'month') {
    const costSummary = this.getCurrentCost(timeframe);
    const forecast = this.forecastCosts();
    const alerts = this.getBudgetAlerts();

    return {
      summary: costSummary,
      forecast,
      alerts,
      insights: {
        mostCostlyAgent: this.getMostCostlyAgent(timeframe),
        mostCostlyModel: this.getMostCostlyModel(timeframe),
        costEfficiencyTrend: this.getCostEfficiencyTrend(timeframe),
        optimizationOpportunities: this.getOptimizationOpportunities(costSummary)
      }
    };
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
      if (!model) return;      const inputCost = (record.inputTokens / 1_000_000) * model.pricing.inputPer1M;
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
    const totalTokens = totalInputTokens + totalOutputTokens;

    // Calculate percentages
    Object.keys(modelBreakdown).forEach(key => {
      modelBreakdown[key].percentage = (modelBreakdown[key].cost / totalCost) * 100;
    });

    Object.keys(agentBreakdown).forEach(key => {
      agentBreakdown[key].percentage = (agentBreakdown[key].cost / totalCost) * 100;
    });

    return {
      totalCost,
      inputCost: totalInputCost,
      outputCost: totalOutputCost,
      tokenCount: {
        input: totalInputTokens,
        output: totalOutputTokens,
        total: totalTokens
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

  private generateCostRecommendations(costSummary: CostSummary, trend: string, rate: number): string[] {
    const recommendations: string[] = [];

    if (trend === 'increasing' && rate > 10) {
      recommendations.push('Consider switching high-volume agents to economy tier');
      recommendations.push('Review agent task complexity to ensure optimal model selection');
    }

    // Find most expensive model
    const mostExpensiveModel = Object.entries(costSummary.modelBreakdown)
      .sort(([,a], [,b]) => b.cost - a.cost)[0];
    
    if (mostExpensiveModel && mostExpensiveModel[1].percentage > 50) {
      recommendations.push(`${mostExpensiveModel[0]} accounts for ${mostExpensiveModel[1].percentage.toFixed(1)}% of costs - consider tier optimization`);
    }

    return recommendations;
  }

  private identifyTrendFactors(costSummary: CostSummary): string[] {
    const factors: string[] = [];
    
    // Analyze model distribution
    const premiumUsage = Object.entries(costSummary.modelBreakdown)
      .filter(([modelId]) => GEMINI_MODEL_REGISTRY[modelId]?.modelTier === 'premium')
      .reduce((sum, [, breakdown]) => sum + breakdown.percentage, 0);

    if (premiumUsage > 70) {
      factors.push('High premium tier usage');
    }

    return factors;
  }

  private getMostCostlyAgent(timeframe: string) {
    const costs = this.getCurrentCost(timeframe as any);
    return Object.entries(costs.agentBreakdown)
      .sort(([,a], [,b]) => b.cost - a.cost)[0];
  }

  private getMostCostlyModel(timeframe: string) {
    const costs = this.getCurrentCost(timeframe as any);
    return Object.entries(costs.modelBreakdown)
      .sort(([,a], [,b]) => b.cost - a.cost)[0];
  }
  private getCostEfficiencyTrend(_timeframe: string): string {
    // Simplified implementation - would analyze efficiency trends over time
    return 'stable';
  }

  private getOptimizationOpportunities(costSummary: CostSummary): string[] {
    const opportunities: string[] = [];
    
    // Check for premium model overuse
    const premiumCost = Object.entries(costSummary.modelBreakdown)
      .filter(([modelId]) => GEMINI_MODEL_REGISTRY[modelId]?.modelTier === 'premium')
      .reduce((sum, [, breakdown]) => sum + breakdown.cost, 0);

    if (premiumCost / costSummary.totalCost > 0.6) {
      opportunities.push('Consider migrating some premium tier usage to standard tier');
    }

    return opportunities;
  }

  private formatDuration(ms: number): string {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} days`;
    if (hours > 0) return `${hours} hours`;
    return `${Math.floor(ms / (1000 * 60))} minutes`;
  }

  private loadUsageHistory(): void {
    try {
      const stored = localStorage?.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.usageHistory = data.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
      }
    } catch (error) {
      console.warn('Failed to load usage history:', error);
    }
  }

  private saveUsageHistory(): void {
    try {
      // Keep only last 10,000 records to prevent excessive storage
      const recentHistory = this.usageHistory.slice(-10000);
      localStorage?.setItem(this.STORAGE_KEY, JSON.stringify(recentHistory));
    } catch (error) {
      console.warn('Failed to save usage history:', error);
    }
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const costMonitoringService = CostMonitoringService.getInstance();
