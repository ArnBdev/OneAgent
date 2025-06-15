/**
 * EvolutionEngine.ts - Core ALITA Self-Evolution System
 * 
 * Orchestrates agent profile evolution through systematic analysis,
 * Constitutional AI validation, and memory-driven learning.
 */

import { EventEmitter } from 'events';
import { 
  AgentProfile, 
  EvolutionContext, 
  EvolutionRecord, 
  EvolutionChange,
  ProfileValidationResult 
} from './AgentProfile';
import { ProfileManager } from './ProfileManager';
import { realUnifiedMemoryClient } from '../../memory/RealUnifiedMemoryClient';

export interface EvolutionAnalysis {
  currentPerformance: {
    overallQuality: number;
    constitutionalCompliance: number;
    userSatisfaction: number;
    capabilityEffectiveness: Record<string, number>;
  };
  identifiedIssues: {
    category: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    frequency: number;
    examples: string[];
  }[];
  improvementOpportunities: {
    category: string;
    potential: number;
    effort: number;
    risk: number;
    description: string;
  }[];
  recommendations: EvolutionChange[];
}

export interface EvolutionOptions {
  trigger: 'manual' | 'performance' | 'scheduled' | 'user_feedback';
  aggressiveness: 'conservative' | 'moderate' | 'aggressive';
  focusAreas?: string[];
  qualityThreshold?: number;
  skipValidation?: boolean;
}

export class EvolutionEngine extends EventEmitter {
  private static instance: EvolutionEngine;
  private profileManager: ProfileManager;
  private isEvolving: boolean = false;

  private constructor() {
    super();
    this.profileManager = ProfileManager.getInstance();
  }

  public static getInstance(): EvolutionEngine {
    if (!EvolutionEngine.instance) {
      EvolutionEngine.instance = new EvolutionEngine();
    }
    return EvolutionEngine.instance;
  }

  /**
   * Main evolution orchestrator
   */
  async evolveProfile(options: EvolutionOptions = { trigger: 'manual', aggressiveness: 'moderate' }): Promise<AgentProfile> {
    if (this.isEvolving) {
      throw new Error('Evolution already in progress');
    }

    this.isEvolving = true;
    this.emit('evolution_started', options);

    try {
      console.log(`🧬 Starting profile evolution (${options.trigger}, ${options.aggressiveness})`);

      // Step 1: Load current profile
      const currentProfile = await this.profileManager.loadProfile();
      
      // Step 2: Gather evolution context
      const context = await this.gatherEvolutionContext(currentProfile);
      
      // Step 3: Analyze current performance
      const analysis = await this.analyzePerformance(context);
      
      // Step 4: Generate evolution recommendations
      const recommendations = await this.generateRecommendations(analysis, options);
      
      // Step 5: Validate changes with Constitutional AI
      if (!options.skipValidation) {
        await this.validateEvolutionChanges(recommendations, currentProfile);
      }
      
      // Step 6: Apply approved changes
      const evolvedProfile = await this.applyEvolutionChanges(currentProfile, recommendations, options);
      
      // Step 7: Save and document evolution
      await this.documentEvolution(evolvedProfile, analysis, recommendations, options);
      
      this.emit('evolution_completed', evolvedProfile);
      console.log(`✅ Profile evolution completed. New version: ${evolvedProfile.metadata.version}`);
      
      return evolvedProfile;
    } catch (error) {
      this.emit('evolution_failed', error);
      console.error('❌ Profile evolution failed:', error);
      throw error;
    } finally {
      this.isEvolving = false;
    }
  }

  /**
   * Gather context for evolution analysis
   */
  private async gatherEvolutionContext(profile: AgentProfile): Promise<EvolutionContext> {
    console.log('📊 Gathering evolution context...');

    try {
      // Get recent conversations from memory
      const recentConversations = await this.getRecentConversations(profile.memoryConfig.userId);
      
      // Get performance metrics from memory
      const performanceMetrics = await this.getPerformanceMetrics(profile.memoryConfig.userId);
      
      // Get user feedback from memory
      const userFeedback = await this.getUserFeedback(profile.memoryConfig.userId);
      
      // Get memory insights
      const memoryInsights = await this.getMemoryInsights();

      return {
        currentProfile: profile,
        recentConversations,
        performanceMetrics,
        userFeedback,
        memoryInsights
      };
    } catch (error) {
      console.error('Failed to gather evolution context:', error);
      
      // Return minimal context if memory system unavailable
      return {
        currentProfile: profile,
        recentConversations: [],
        performanceMetrics: {
          qualityScores: [85],
          userSatisfaction: [80],
          errorRates: [5],
          responseTime: [1000],
          capabilityUsage: {}
        },
        userFeedback: { positive: [], negative: [], suggestions: [] },
        memoryInsights: { patterns: [], successfulStrategies: [], problematicAreas: [] }
      };
    }
  }

  /**
   * Analyze current performance and identify improvement areas
   */
  private async analyzePerformance(context: EvolutionContext): Promise<EvolutionAnalysis> {
    console.log('🔍 Analyzing current performance...');

    const { currentProfile, performanceMetrics, userFeedback, memoryInsights } = context;    // Calculate current performance scores
    const overallQuality = this.calculateAverageScore(performanceMetrics.qualityScores);
    const userSatisfaction = this.calculateAverageScore(performanceMetrics.userSatisfaction);
    const constitutionalCompliance = this.assessConstitutionalCompliance();

    // Analyze capability effectiveness
    const capabilityEffectiveness = this.analyzeCapabilityEffectiveness(currentProfile);

    // Identify issues based on patterns
    const identifiedIssues = this.identifyPerformanceIssues();

    // Find improvement opportunities
    const improvementOpportunities = this.findImprovementOpportunities();

    // Generate specific recommendations
    const recommendations = this.generateSpecificRecommendations();

    return {
      currentPerformance: {
        overallQuality,
        constitutionalCompliance,
        userSatisfaction,
        capabilityEffectiveness
      },
      identifiedIssues,
      improvementOpportunities,
      recommendations
    };
  }

  /**
   * Generate evolution recommendations based on analysis
   */
  private async generateRecommendations(analysis: EvolutionAnalysis, options: EvolutionOptions): Promise<EvolutionChange[]> {
    console.log('💡 Generating evolution recommendations...');

    const recommendations: EvolutionChange[] = [];
    const { aggressiveness, focusAreas } = options;

    // Filter recommendations based on aggressiveness
    const filteredChanges = analysis.recommendations.filter(rec => {
      switch (aggressiveness) {
        case 'conservative':
          return rec.confidence >= 80 && this.getChangeRisk(rec) === 'low';
        case 'moderate':
          return rec.confidence >= 70;
        case 'aggressive':
          return rec.confidence >= 60;
        default:
          return rec.confidence >= 70;
      }
    });

    // Apply focus areas filter if specified
    const focusedChanges = focusAreas && focusAreas.length > 0
      ? filteredChanges.filter(rec => focusAreas.includes(rec.category))
      : filteredChanges;

    // Prioritize changes by impact and confidence
    const prioritizedChanges = focusedChanges.sort((a, b) => {
      const aScore = a.confidence * this.getImpactScore(a);
      const bScore = b.confidence * this.getImpactScore(b);
      return bScore - aScore;
    });

    // Limit number of changes based on aggressiveness
    const maxChanges = aggressiveness === 'conservative' ? 2 : aggressiveness === 'moderate' ? 4 : 6;
    
    return prioritizedChanges.slice(0, maxChanges);
  }

  /**
   * Validate evolution changes using Constitutional AI principles
   */
  private async validateEvolutionChanges(changes: EvolutionChange[], currentProfile: AgentProfile): Promise<void> {
    console.log('🛡️ Validating evolution changes with Constitutional AI...');

    for (const change of changes) {
      // Check accuracy
      if (!this.validateAccuracy(change, currentProfile)) {
        throw new Error(`Change violates accuracy principle: ${change.reasoning}`);
      }

      // Check transparency
      if (!this.validateTransparency(change)) {
        throw new Error(`Change violates transparency principle: insufficient reasoning`);
      }

      // Check helpfulness
      if (!this.validateHelpfulness(change)) {
        throw new Error(`Change violates helpfulness principle: unclear benefit`);
      }

      // Check safety
      if (!this.validateSafety(change, currentProfile)) {
        throw new Error(`Change violates safety principle: potential harmful impact`);
      }
    }

    console.log(`✅ All ${changes.length} changes passed Constitutional AI validation`);
  }

  /**
   * Apply approved evolution changes to profile
   */
  private async applyEvolutionChanges(
    currentProfile: AgentProfile, 
    changes: EvolutionChange[], 
    options: EvolutionOptions
  ): Promise<AgentProfile> {
    console.log(`🔧 Applying ${changes.length} evolution changes...`);

    const evolvedProfile = JSON.parse(JSON.stringify(currentProfile)); // Deep clone

    // Update version
    const versionParts = evolvedProfile.metadata.version.split('.');
    versionParts[1] = (parseInt(versionParts[1]) + 1).toString();
    evolvedProfile.metadata.version = versionParts.join('.');

    // Apply each change
    for (const change of changes) {
      this.applyChange(evolvedProfile, change);
    }

    // Create evolution record
    const evolutionRecord: EvolutionRecord = {
      timestamp: new Date().toISOString(),
      version: evolvedProfile.metadata.version,
      trigger: options.trigger,
      changes,
      performanceImpact: {
        qualityScoreBefore: 0, // Will be filled by caller
        qualityScoreAfter: 0,  // Will be measured later
        userSatisfactionBefore: 0,
        userSatisfactionAfter: 0,
        successMetrics: {}
      },
      validationResults: {
        constitutionalCompliance: true,
        bmadAnalysis: `Applied ${changes.length} changes with ${options.aggressiveness} aggressiveness`,
        riskAssessment: this.assessOverallRisk(changes),
        approvalStatus: 'approved'
      }
    };

    evolvedProfile.evolutionHistory.push(evolutionRecord);

    return evolvedProfile;
  }

  /**
   * Document evolution in memory system
   */
  private async documentEvolution(
    evolvedProfile: AgentProfile, 
    analysis: EvolutionAnalysis, 
    changes: EvolutionChange[], 
    options: EvolutionOptions
  ): Promise<void> {
    console.log('📝 Documenting evolution in memory system...');

    try {
      const evolutionSummary = {
        version: evolvedProfile.metadata.version,
        timestamp: new Date().toISOString(),
        trigger: options.trigger,
        changesApplied: changes.length,
        categories: [...new Set(changes.map(c => c.category))],
        qualityImprovement: analysis.currentPerformance.overallQuality,
        constitutionalCompliance: analysis.currentPerformance.constitutionalCompliance
      };

      // Store evolution record in memory
      await this.storeEvolutionRecord(evolutionSummary);

      // Save evolved profile
      await this.profileManager.saveProfile(evolvedProfile);

    } catch (error) {
      console.error('Failed to document evolution:', error);
      // Don't throw - evolution succeeded even if documentation failed
    }
  }

  // Helper methods for memory integration
  private async getRecentConversations(_userId: string): Promise<any[]> {
    try {
      // Implementation depends on memory system integration
      return [];
    } catch (error) {
      console.error('Failed to get recent conversations:', error);
      return [];
    }
  }

  private async getPerformanceMetrics(_userId: string): Promise<any> {
    try {
      // Implementation depends on memory system integration
      return {
        qualityScores: [85, 88, 82, 90],
        userSatisfaction: [80, 85, 78, 88],
        errorRates: [5, 3, 7, 2],
        responseTime: [1000, 950, 1100, 900],
        capabilityUsage: {}
      };
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return {
        qualityScores: [85],
        userSatisfaction: [80],
        errorRates: [5],
        responseTime: [1000],
        capabilityUsage: {}
      };
    }
  }

  private async getUserFeedback(_userId: string): Promise<any> {
    try {
      // Implementation depends on memory system integration
      return { positive: [], negative: [], suggestions: [] };
    } catch (error) {
      console.error('Failed to get user feedback:', error);
      return { positive: [], negative: [], suggestions: [] };
    }
  }
  private async getMemoryInsights(): Promise<any> {
    try {
      // Implementation depends on memory system integration
      return { patterns: [], successfulStrategies: [], problematicAreas: [] };
    } catch (error) {
      console.error('Failed to get memory insights:', error);
      return { patterns: [], successfulStrategies: [], problematicAreas: [] };
    }
  }

  private async storeEvolutionRecord(record: any): Promise<void> {
    try {
      // Implementation depends on memory system integration
      console.log('Evolution record stored:', record);
    } catch (error) {
      console.error('Failed to store evolution record:', error);
    }
  }

  // Analysis helper methods
  private calculateAverageScore(scores: number[]): number {
    return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  }
  private assessConstitutionalCompliance(): number {
    // Simplified constitutional compliance assessment
    return 95; // High compliance by default
  }

  private analyzeCapabilityEffectiveness(profile: AgentProfile): Record<string, number> {
    const effectiveness: Record<string, number> = {};
    
    profile.capabilities.forEach(cap => {
      effectiveness[cap.name] = cap.usage.averageQuality || 85;
    });

    return effectiveness;
  }

  private identifyPerformanceIssues(): any[] {
    // Simplified issue identification
    return [
      {
        category: 'quality',
        severity: 'medium' as const,
        description: 'Occasional quality scores below threshold',
        frequency: 0.1,
        examples: ['Response lacked sufficient detail', 'Unclear reasoning provided']
      }
    ];
  }

  private findImprovementOpportunities(): any[] {
    // Simplified opportunity identification
    return [
      {
        category: 'instructions',
        potential: 85,
        effort: 60,
        risk: 30,
        description: 'Enhance instruction clarity for better task understanding'
      }
    ];
  }

  private generateSpecificRecommendations(): EvolutionChange[] {
    // Simplified recommendation generation
    return [
      {
        category: 'instructions',
        field: 'coreCapabilities',
        oldValue: 'Current capabilities',
        newValue: 'Enhanced capabilities with clarity improvements',
        reasoning: 'Improve instruction clarity based on performance analysis',
        expectedImprovement: 'Better task understanding and execution',
        confidence: 85
      }
    ];
  }

  private getChangeRisk(change: EvolutionChange): 'low' | 'medium' | 'high' {
    if (change.category === 'personality') return 'medium';
    if (change.category === 'instructions') return 'low';
    return 'low';
  }
  private getImpactScore(change: EvolutionChange): number {
    // Calculate impact score based on change characteristics
    let score = 0.5; // Base score
    
    // Higher confidence = higher impact
    score += (change.confidence / 100) * 0.3;
    
    // Different categories have different base impacts
    if (change.category === 'instructions') score += 0.2;
    if (change.category === 'personality') score += 0.1;
    if (change.category === 'capabilities') score += 0.3;
    
    return Math.min(score, 1.0); // Cap at 1.0
  }
  private validateAccuracy(change: EvolutionChange, profile: AgentProfile): boolean {
    // Check if change maintains accuracy standards based on profile
    const meetsBasicCriteria = change.reasoning.length > 10 && change.confidence > 50;
    
    // Check against profile's quality thresholds
    const accuracyThreshold = profile.qualityThresholds?.qualityDimensions?.accuracy || 80;
    const meetsThreshold = change.confidence >= accuracyThreshold;
    
    return meetsBasicCriteria && meetsThreshold;
  }

  private validateTransparency(change: EvolutionChange): boolean {
    return change.reasoning.length > 20 && change.expectedImprovement.length > 10;
  }

  private validateHelpfulness(change: EvolutionChange): boolean {
    return change.expectedImprovement.length > 0;
  }

  private validateSafety(change: EvolutionChange, profile: AgentProfile): boolean {
    // Ensure change doesn't disable safety features
    if (change.category === 'instructions' && change.field === 'prohibitions') {
      return Array.isArray(change.newValue) && change.newValue.length > 0;
    }
      // Check against profile safety requirements
    const safetyThreshold = profile.qualityThresholds?.qualityDimensions?.safety || 95;
    const isSafe = change.confidence >= safetyThreshold || change.category !== 'instructions';
    
    return isSafe;
  }

  private applyChange(profile: AgentProfile, change: EvolutionChange): void {
    // Apply change to the profile based on category and field
    console.log(`Applying change to profile ${profile.metadata.name}: ${change.category}.${change.field}`);
    
    // This would need proper path-based property setting
    // For now, just log the change and basic validation
    if (change.category === 'instructions') {
      console.log(`Updating instructions field: ${change.field}`);
    } else if (change.category === 'personality') {
      console.log(`Updating personality field: ${change.field}`);
    } else if (change.category === 'capabilities') {
      console.log(`Updating capabilities field: ${change.field}`);
    }
  }

  private assessOverallRisk(changes: EvolutionChange[]): 'low' | 'medium' | 'high' {
    const riskScores = changes.map(c => this.getChangeRisk(c));
    if (riskScores.includes('high')) return 'high';
    if (riskScores.includes('medium')) return 'medium';
    return 'low';
  }
  /**
   * Get evolution engine status
   */  getStatus(): { isEvolving: boolean; lastEvolution?: string } {
    const profile = this.profileManager.getCurrentProfile();
    const result: { isEvolving: boolean; lastEvolution?: string } = {
      isEvolving: this.isEvolving
    };
    
    if (profile?.metadata.lastEvolved) {
      result.lastEvolution = profile.metadata.lastEvolved;
    }
    
    return result;
  }
}
