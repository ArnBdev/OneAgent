/**
 * SelfImprovementSystem.ts - Agent Self-Evaluation and Improvement
 * 
 * Provides systematic self-improvement capabilities:
 * - Performance tracking and analysis
 * - Constitutional AI validation feedback
 * - Quality score monitoring
 * - Automatic persona optimization
 * - Learning from interaction patterns
 */

import { EventEmitter } from 'events';
import { personaLoader, PersonaConfig } from './PersonaLoader';
import { realUnifiedMemoryClient } from '../../memory/RealUnifiedMemoryClient';

export interface PerformanceMetrics {
  agentId: string;
  timestamp: string;
  interactionCount: number;
  averageQualityScore: number;
  constitutionalCompliance: number;
  userSatisfactionScore: number;
  responseTime: number;
  errorRate: number;
  capabilityUtilization: Record<string, number>;
}

export interface ImprovementSuggestion {
  category: 'prompt' | 'capability' | 'communication' | 'quality';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  proposedChange: any;
  expectedImprovement: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface SelfEvaluationResult {
  agentId: string;
  timestamp: string;
  currentMetrics: PerformanceMetrics;
  improvements: ImprovementSuggestion[];
  overallHealth: 'excellent' | 'good' | 'needs_attention' | 'critical';
  recommendedActions: string[];
}

/**
 * Self-improvement system for agent optimization
 */
export class SelfImprovementSystem extends EventEmitter {
  private static instance: SelfImprovementSystem;
  private performanceHistory: Map<string, PerformanceMetrics[]> = new Map();
  private evaluationSchedule: Map<string, NodeJS.Timeout> = new Map();
  private isActive = false;

  private constructor() {
    super();
  }

  public static getInstance(): SelfImprovementSystem {
    if (!SelfImprovementSystem.instance) {
      SelfImprovementSystem.instance = new SelfImprovementSystem();
    }
    return SelfImprovementSystem.instance;
  }

  /**
   * Initialize the self-improvement system
   */
  public async initialize(): Promise<void> {
    if (this.isActive) {
      return;
    }

    console.log('[SelfImprovementSystem] Initializing...');
    
    // Load historical performance data
    await this.loadPerformanceHistory();
    
    // Schedule periodic evaluations for all agents
    await this.scheduleEvaluations();
    
    this.isActive = true;
    this.emit('initialized');
    
    console.log('[SelfImprovementSystem] Initialized successfully');
  }

  /**
   * Register an agent for self-improvement tracking
   */
  public async registerAgent(agentId: string): Promise<void> {
    if (!this.performanceHistory.has(agentId)) {
      this.performanceHistory.set(agentId, []);
    }
    
    // Schedule regular evaluation (every 24 hours)
    this.scheduleAgentEvaluation(agentId, 24 * 60 * 60 * 1000);
    
    console.log(`[SelfImprovementSystem] Registered agent: ${agentId}`);
  }

  /**
   * Record performance metrics for an agent
   */
  public async recordPerformance(metrics: PerformanceMetrics): Promise<void> {
    const history = this.performanceHistory.get(metrics.agentId) || [];
    history.push(metrics);
    
    // Keep only last 100 entries per agent
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
    
    this.performanceHistory.set(metrics.agentId, history);
    
    // Store in memory for persistence
    await realUnifiedMemoryClient.createMemory({
      content: `Performance metrics for ${metrics.agentId}: Quality ${metrics.averageQualityScore}%, Compliance ${metrics.constitutionalCompliance}%`,
      metadata: {
        type: 'performance_metrics',
        agentId: metrics.agentId,
        timestamp: metrics.timestamp,
        metrics: metrics
      },
      userId: 'system'
    });
    
    // Check if immediate evaluation is needed
    if (this.needsImmediateAttention(metrics)) {
      await this.performSelfEvaluation(metrics.agentId);
    }
  }

  /**
   * Perform comprehensive self-evaluation for an agent
   */
  public async performSelfEvaluation(agentId: string): Promise<SelfEvaluationResult> {
    console.log(`[SelfImprovementSystem] Performing self-evaluation for ${agentId}`);
    
    const currentPersona = personaLoader.getPersona(agentId);
    if (!currentPersona) {
      throw new Error(`No persona found for agent: ${agentId}`);
    }
    
    const history = this.performanceHistory.get(agentId) || [];
    const recentMetrics = history.slice(-10); // Last 10 interactions
    
    if (recentMetrics.length === 0) {
      throw new Error(`No performance data available for agent: ${agentId}`);
    }
    
    const currentMetrics = this.calculateAverageMetrics(recentMetrics);
    const improvements = await this.generateImprovementSuggestions(agentId, currentPersona, recentMetrics);
    const overallHealth = this.assessOverallHealth(currentMetrics);
    const recommendedActions = this.generateRecommendedActions(improvements, overallHealth);
    
    const evaluation: SelfEvaluationResult = {
      agentId,
      timestamp: new Date().toISOString(),
      currentMetrics,
      improvements,
      overallHealth,
      recommendedActions
    };
    
    // Store evaluation results
    await realUnifiedMemoryClient.createMemory({
      content: `Self-evaluation for ${agentId}: ${overallHealth} health, ${improvements.length} improvement suggestions`,
      metadata: {
        type: 'self_evaluation',
        agentId,
        evaluation,
        timestamp: evaluation.timestamp
      },
      userId: 'system'
    });
    
    // Apply high-priority improvements automatically
    await this.applyAutomaticImprovements(agentId, improvements);
    
    this.emit('evaluationCompleted', evaluation);
    
    return evaluation;
  }

  /**
   * Generate improvement suggestions based on performance analysis
   */
  private async generateImprovementSuggestions(
    agentId: string, 
    persona: PersonaConfig, 
    metrics: PerformanceMetrics[]
  ): Promise<ImprovementSuggestion[]> {
    const suggestions: ImprovementSuggestion[] = [];
    const avgMetrics = this.calculateAverageMetrics(metrics);
    
    // Quality score improvements
    if (avgMetrics.averageQualityScore < persona.quality_standards.minimum_score) {
      suggestions.push({
        category: 'quality',
        priority: 'high',
        description: `Quality score (${avgMetrics.averageQualityScore}%) below minimum standard (${persona.quality_standards.minimum_score}%)`,
        proposedChange: {
          quality_standards: {
            ...persona.quality_standards,
            minimum_score: Math.min(persona.quality_standards.minimum_score + 5, 95)
          }
        },
        expectedImprovement: 'Stricter quality validation will improve response quality',
        riskLevel: 'low'
      });
    }
    
    // Constitutional compliance improvements
    if (avgMetrics.constitutionalCompliance < 95) {
      suggestions.push({
        category: 'prompt',
        priority: 'high',
        description: `Constitutional compliance (${avgMetrics.constitutionalCompliance}%) needs improvement`,
        proposedChange: {
          constitutional_details: {
            ...persona.constitutional_details,
            accuracy: 'Verify all information thoroughly and prefer uncertainty to incorrect statements',
            transparency: 'Explain reasoning clearly and acknowledge limitations explicitly',
            helpfulness: 'Provide actionable guidance while maintaining accuracy',
            safety: 'Prioritize user safety and follow best practices consistently'
          }
        },
        expectedImprovement: 'Enhanced constitutional guidance will improve compliance',
        riskLevel: 'low'
      });
    }
    
    // Response time improvements
    if (avgMetrics.responseTime > 5000) { // 5 seconds
      suggestions.push({
        category: 'capability',
        priority: 'medium',
        description: `Response time (${avgMetrics.responseTime}ms) exceeds optimal threshold`,
        proposedChange: {
          communication_style: {
            ...persona.communication_style,
            approach: 'Efficient and focused responses with key insights prioritized'
          }
        },
        expectedImprovement: 'Streamlined communication will reduce response time',
        riskLevel: 'low'
      });
    }
    
    // Capability utilization analysis
    for (const [capability, utilization] of Object.entries(avgMetrics.capabilityUtilization)) {
      if (utilization < 0.1) { // Less than 10% usage
        suggestions.push({
          category: 'capability',
          priority: 'low',
          description: `Capability "${capability}" underutilized (${Math.round(utilization * 100)}%)`,
          proposedChange: {
            capabilities: {
              ...persona.capabilities,
              primary: persona.capabilities.primary.filter(cap => cap !== capability)
            }
          },
          expectedImprovement: 'Removing unused capabilities will improve focus',
          riskLevel: 'medium'
        });
      }
    }
    
    return suggestions;
  }

  /**
   * Apply automatic improvements for high-priority, low-risk suggestions
   */
  private async applyAutomaticImprovements(agentId: string, suggestions: ImprovementSuggestion[]): Promise<void> {
    const autoApplyable = suggestions.filter(s => 
      s.priority === 'high' && 
      s.riskLevel === 'low' && 
      s.category !== 'capability' // Don't auto-remove capabilities
    );
    
    for (const suggestion of autoApplyable) {
      try {
        await personaLoader.updatePersona(agentId, suggestion.proposedChange);
        
        console.log(`[SelfImprovementSystem] Auto-applied improvement for ${agentId}: ${suggestion.description}`);
        
        // Record the improvement
        await realUnifiedMemoryClient.createMemory({
          content: `Auto-applied improvement: ${suggestion.description}`,
          metadata: {
            type: 'auto_improvement',
            agentId,
            suggestion,
            timestamp: new Date().toISOString()
          },
          userId: 'system'
        });
        
      } catch (error) {
        console.error(`[SelfImprovementSystem] Failed to apply improvement for ${agentId}:`, error);
      }
    }
  }

  /**
   * Calculate average metrics from performance history
   */
  private calculateAverageMetrics(metrics: PerformanceMetrics[]): PerformanceMetrics {
    if (metrics.length === 0) {
      throw new Error('No metrics to calculate average from');
    }
    
    const totals = metrics.reduce((acc, metric) => ({
      interactionCount: acc.interactionCount + metric.interactionCount,
      averageQualityScore: acc.averageQualityScore + metric.averageQualityScore,
      constitutionalCompliance: acc.constitutionalCompliance + metric.constitutionalCompliance,
      userSatisfactionScore: acc.userSatisfactionScore + metric.userSatisfactionScore,
      responseTime: acc.responseTime + metric.responseTime,
      errorRate: acc.errorRate + metric.errorRate,
      capabilityUtilization: this.mergeCapabilityUtilization(acc.capabilityUtilization, metric.capabilityUtilization)
    }), {
      interactionCount: 0,
      averageQualityScore: 0,
      constitutionalCompliance: 0,
      userSatisfactionScore: 0,
      responseTime: 0,
      errorRate: 0,
      capabilityUtilization: {}
    });
    
    return {
      agentId: metrics[0].agentId,
      timestamp: new Date().toISOString(),
      interactionCount: totals.interactionCount,
      averageQualityScore: totals.averageQualityScore / metrics.length,
      constitutionalCompliance: totals.constitutionalCompliance / metrics.length,
      userSatisfactionScore: totals.userSatisfactionScore / metrics.length,
      responseTime: totals.responseTime / metrics.length,
      errorRate: totals.errorRate / metrics.length,
      capabilityUtilization: this.averageCapabilityUtilization(totals.capabilityUtilization, metrics.length)
    };
  }

  /**
   * Merge capability utilization maps
   */
  private mergeCapabilityUtilization(acc: Record<string, number>, current: Record<string, number>): Record<string, number> {
    const result = { ...acc };
    for (const [key, value] of Object.entries(current)) {
      result[key] = (result[key] || 0) + value;
    }
    return result;
  }

  /**
   * Calculate average capability utilization
   */
  private averageCapabilityUtilization(totals: Record<string, number>, count: number): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [key, value] of Object.entries(totals)) {
      result[key] = value / count;
    }
    return result;
  }

  /**
   * Assess overall health based on metrics
   */
  private assessOverallHealth(metrics: PerformanceMetrics): 'excellent' | 'good' | 'needs_attention' | 'critical' {
    let score = 0;
    
    // Quality score (30% weight)
    if (metrics.averageQualityScore >= 90) score += 30;
    else if (metrics.averageQualityScore >= 80) score += 25;
    else if (metrics.averageQualityScore >= 70) score += 15;
    else score += 5;
    
    // Constitutional compliance (25% weight)
    if (metrics.constitutionalCompliance >= 95) score += 25;
    else if (metrics.constitutionalCompliance >= 85) score += 20;
    else if (metrics.constitutionalCompliance >= 75) score += 10;
    else score += 0;
    
    // User satisfaction (20% weight)
    if (metrics.userSatisfactionScore >= 4.5) score += 20;
    else if (metrics.userSatisfactionScore >= 4.0) score += 15;
    else if (metrics.userSatisfactionScore >= 3.5) score += 10;
    else score += 5;
    
    // Response time (15% weight)
    if (metrics.responseTime <= 2000) score += 15;
    else if (metrics.responseTime <= 5000) score += 10;
    else if (metrics.responseTime <= 10000) score += 5;
    else score += 0;
    
    // Error rate (10% weight)
    if (metrics.errorRate <= 0.01) score += 10;
    else if (metrics.errorRate <= 0.05) score += 8;
    else if (metrics.errorRate <= 0.1) score += 5;
    else score += 0;
    
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'needs_attention';
    return 'critical';
  }

  /**
   * Generate recommended actions based on improvements
   */
  private generateRecommendedActions(improvements: ImprovementSuggestion[], health: string): string[] {
    const actions: string[] = [];
    
    if (health === 'critical') {
      actions.push('Immediate manual review required - multiple critical issues detected');
    }
    
    const highPriorityImprovements = improvements.filter(i => i.priority === 'high');
    if (highPriorityImprovements.length > 0) {
      actions.push(`Review ${highPriorityImprovements.length} high-priority improvement suggestions`);
    }
    
    const qualityImprovements = improvements.filter(i => i.category === 'quality');
    if (qualityImprovements.length > 0) {
      actions.push('Focus on quality improvement strategies');
    }
    
    const capabilityImprovements = improvements.filter(i => i.category === 'capability');
    if (capabilityImprovements.length > 0) {
      actions.push('Review capability utilization and optimization');
    }
    
    if (actions.length === 0) {
      actions.push('Continue current performance monitoring');
    }
    
    return actions;
  }

  /**
   * Check if metrics indicate need for immediate attention
   */
  private needsImmediateAttention(metrics: PerformanceMetrics): boolean {
    return (
      metrics.averageQualityScore < 60 ||
      metrics.constitutionalCompliance < 70 ||
      metrics.errorRate > 0.2 ||
      metrics.userSatisfactionScore < 2.0
    );
  }

  /**
   * Schedule periodic evaluations for an agent
   */
  private scheduleAgentEvaluation(agentId: string, intervalMs: number): void {
    // Clear existing schedule
    const existing = this.evaluationSchedule.get(agentId);
    if (existing) {
      clearInterval(existing);
    }
    
    // Schedule new evaluation
    const timer = setInterval(async () => {
      try {
        await this.performSelfEvaluation(agentId);
      } catch (error) {
        console.error(`[SelfImprovementSystem] Scheduled evaluation failed for ${agentId}:`, error);
      }
    }, intervalMs);
    
    this.evaluationSchedule.set(agentId, timer);
  }

  /**
   * Schedule evaluations for all registered agents
   */
  private async scheduleEvaluations(): Promise<void> {
    const personas = personaLoader.getAllPersonas();
    for (const persona of personas) {
      await this.registerAgent(persona.id);
    }
  }

  /**
   * Load historical performance data from memory
   */
  private async loadPerformanceHistory(): Promise<void> {
    try {
      const memories = await realUnifiedMemoryClient.searchMemories({
        query: 'performance_metrics',
        limit: 1000,
        userId: 'system'
      });
      
      for (const memory of memories) {
        if (memory.metadata?.type === 'performance_metrics' && memory.metadata?.metrics) {
          const metrics = memory.metadata.metrics as PerformanceMetrics;
          const history = this.performanceHistory.get(metrics.agentId) || [];
          history.push(metrics);
          this.performanceHistory.set(metrics.agentId, history);
        }
      }
      
      console.log(`[SelfImprovementSystem] Loaded performance history for ${this.performanceHistory.size} agents`);
    } catch (error) {
      console.error('[SelfImprovementSystem] Failed to load performance history:', error);
    }
  }

  /**
   * Get performance history for an agent
   */
  public getPerformanceHistory(agentId: string): PerformanceMetrics[] {
    return this.performanceHistory.get(agentId) || [];
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    for (const timer of this.evaluationSchedule.values()) {
      clearInterval(timer);
    }
    this.evaluationSchedule.clear();
    this.performanceHistory.clear();
    this.isActive = false;
  }
}

// Export singleton instance
export const selfImprovementSystem = SelfImprovementSystem.getInstance();
