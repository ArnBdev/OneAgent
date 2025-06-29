/**
 * Performance Analyzer for ALITA Evolution Engine
 * Analyzes conversation performance patterns to drive evolution decisions
 * 
 * @version 1.0.0
 * @date 2025-06-15
 */

import { PerformanceMonitor } from '../../monitoring/PerformanceMonitor';
import { ConversationData } from '../../types/oneagent-backbone-types';

export interface SuccessMetrics {
  overallScore: number;
  satisfactionRate: number;
  completionRate: number;
  responseTime: number;
  constitutionalCompliance: number;
  userEngagement: number;
}

export interface PerformancePattern {
  patternType: string;
  frequency: number;
  impact: number;
  contexts: string[];
  successIndicators: string[];
}

export interface BaselineMetrics {
  baselineScore: number;
  establishedDate: Date;
  sampleSize: number;
  metricBreakdown: Record<string, number>;
}

export class PerformanceAnalyzer {
  constructor(private performanceMonitor: PerformanceMonitor) {}

  /**
   * Calculate comprehensive success metrics from conversation data
   * WHY: Quantified metrics enable data-driven evolution decisions
   */
  async calculateSuccessMetrics(conversations: ConversationData[]): Promise<SuccessMetrics> {
    const startTime = Date.now();

    try {
      if (conversations.length === 0) {
        throw new Error('Cannot calculate metrics from empty conversation set');
      }

      // Calculate satisfaction rate
      const satisfactionRate = conversations
        .filter(c => c.userSatisfaction >= 0.8)
        .length / conversations.length;

      // Calculate completion rate
      const completionRate = conversations
        .filter(c => c.taskCompleted)
        .length / conversations.length;      // Calculate average response time
      const averageResponseTime = conversations
        .reduce((sum, c) => sum + (c.responseTime || 0), 0) / conversations.length;

      // Calculate constitutional compliance rate
      const complianceRate = conversations
        .filter(c => c.constitutionalCompliant)
        .length / conversations.length;      // Calculate engagement score (based on message count)
      const averageEngagement = conversations
        .reduce((sum, c) => sum + (c.messageCount || c.conversationLength || 1), 0) / conversations.length;
      const engagementScore = Math.min(averageEngagement / 10, 1.0); // Normalize to 0-1

      // Calculate overall score (weighted average)
      const overallScore = (
        satisfactionRate * 0.3 +
        completionRate * 0.25 +
        (1 - Math.min(averageResponseTime / 5000, 1)) * 0.2 + // Faster = better
        complianceRate * 0.15 +
        engagementScore * 0.1
      );

      const metrics: SuccessMetrics = {
        overallScore,
        satisfactionRate,
        completionRate,
        responseTime: averageResponseTime,
        constitutionalCompliance: complianceRate,
        userEngagement: engagementScore
      };

      await this.performanceMonitor.recordLatency('calculate_success_metrics', Date.now() - startTime);
      return metrics;

    } catch (error) {
      await this.performanceMonitor.recordError('calculate_success_metrics', error as Error);
      throw error;
    }
  }

  /**
   * Identify performance patterns in conversation data
   * WHY: Patterns reveal what works and what doesn't across different contexts
   */
  async identifyPerformancePatterns(data: ConversationData[]): Promise<PerformancePattern[]> {
    const startTime = Date.now();

    try {
      const patterns: PerformancePattern[] = [];

      // Analyze patterns by communication style
      const stylePatterns = this.analyzeByDimension(data, 'communicationStyle');
      patterns.push(...stylePatterns);

      // Analyze patterns by technical level
      const levelPatterns = this.analyzeByDimension(data, 'technicalLevel');
      patterns.push(...levelPatterns);

      // Analyze patterns by domain
      const domainPatterns = this.analyzeByDimension(data, 'domain');
      patterns.push(...domainPatterns);

      // Analyze temporal patterns
      const temporalPatterns = this.analyzeTemporalPatterns(data);
      patterns.push(...temporalPatterns);

      await this.performanceMonitor.recordLatency('identify_performance_patterns', Date.now() - startTime);
      return patterns;

    } catch (error) {
      await this.performanceMonitor.recordError('identify_performance_patterns', error as Error);
      throw error;
    }
  }

  /**
   * Get baseline performance metrics for comparison
   * WHY: Baseline enables measurement of improvement over time
   */
  async getBaselinePerformance(): Promise<BaselineMetrics> {
    // In a real implementation, this would retrieve stored baseline metrics
    // For now, return a default baseline
    return {
      baselineScore: 0.75,
      establishedDate: new Date('2025-06-01'),
      sampleSize: 1000,
      metricBreakdown: {
        satisfaction: 0.72,
        completion: 0.78,
        responseTime: 2500,
        compliance: 0.85,
        engagement: 0.65
      }
    };
  }

  /**
   * Analyze performance patterns by a specific dimension
   */
  private analyzeByDimension(data: ConversationData[], dimension: keyof ConversationData): PerformancePattern[] {
    const groups = new Map<string, ConversationData[]>();
    
    // Group conversations by dimension value
    for (const conversation of data) {
      const key = String(conversation[dimension]);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(conversation);
    }

    const patterns: PerformancePattern[] = [];

    for (const [value, conversations] of groups) {
      if (conversations.length < 5) continue; // Need minimum sample size

      const successRate = conversations.filter(c => c.userSatisfaction >= 0.8).length / conversations.length;
      const completionRate = conversations.filter(c => c.taskCompleted).length / conversations.length;
      
      patterns.push({
        patternType: `${dimension}_${value}`,
        frequency: conversations.length / data.length,
        impact: (successRate + completionRate) / 2,
        contexts: this.extractContexts(conversations),
        successIndicators: this.identifySuccessIndicators(conversations)
      });
    }

    return patterns;
  }

  /**
   * Analyze temporal patterns in conversation performance
   */
  private analyzeTemporalPatterns(data: ConversationData[]): PerformancePattern[] {
    const patterns: PerformancePattern[] = [];
    
    // Group by hour of day
    const hourGroups: Map<number, ConversationData[]> = new Map();
    for (const conversation of data) {
      if (!conversation.timestamp) continue;
      const hour = conversation.timestamp.getHours();
      if (!hourGroups.has(hour)) {
        hourGroups.set(hour, []);
      }
      hourGroups.get(hour)!.push(conversation);
    }

    // Analyze performance by hour
    for (const [hour, conversations] of hourGroups) {
      if (conversations.length < 3) continue;
      const avgSatisfaction = conversations.reduce((sum: number, c: any) => sum + c.userSatisfaction, 0) / conversations.length;
      
      patterns.push({
        patternType: `time_hour_${hour}`,
        frequency: conversations.length / data.length,
        impact: avgSatisfaction,
        contexts: [`hour_${hour}`],
        successIndicators: avgSatisfaction > 0.8 ? ['high_satisfaction'] : ['low_satisfaction']
      });
    }

    return patterns;
  }

  /**
   * Extract context information from conversations
   */
  private extractContexts(conversations: ConversationData[]): string[] {
    const contexts = new Set<string>();    
    for (const conversation of conversations) {
      if (conversation.domain) {
        contexts.add(conversation.domain);
      }
      conversation.contextTags?.forEach(tag => contexts.add(tag));
      conversation.topicTags?.forEach(tag => contexts.add(tag));
    }
    
    return Array.from(contexts);
  }

  /**
   * Identify success indicators from high-performing conversations
   */
  private identifySuccessIndicators(conversations: ConversationData[]): string[] {
    const indicators: string[] = [];
    
    const highPerformers = conversations.filter(c => c.userSatisfaction >= 0.9);
      if (highPerformers.length > 0) {
      const avgResponseTime = highPerformers.reduce((sum, c) => sum + (c.responseTime || 0), 0) / highPerformers.length;
      
      if (avgResponseTime < 2000) {
        indicators.push('fast_response');
      }
      
      if (highPerformers.every(c => c.taskCompleted)) {
        indicators.push('high_completion');
      }
      
      if (highPerformers.every(c => c.constitutionalCompliant)) {
        indicators.push('constitutional_compliant');
      }
    }
    
    return indicators;
  }
}

export default PerformanceAnalyzer;
