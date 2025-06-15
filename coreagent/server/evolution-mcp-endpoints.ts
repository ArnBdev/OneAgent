/**
 * evolution-mcp-endpoints.ts - MCP Endpoints for ALITA Evolution System
 * 
 * Exposes ALITA self-evolution functionality through MCP endpoints
 * for user interaction and system monitoring.
 */

import { ALITASystem, EvolutionOptions, AgentProfile } from '../agents/evolution';

// Get ALITA singleton instance
const ALITA = ALITASystem.getInstance();

/**
 * MCP endpoint: oneagent_evolve_profile
 * Trigger agent profile evolution with configurable options
 */
export async function oneagent_evolve_profile(params: {
  trigger?: 'manual' | 'performance' | 'scheduled' | 'user_feedback';
  aggressiveness?: 'conservative' | 'moderate' | 'aggressive';
  focusAreas?: string[];
  qualityThreshold?: number;
  skipValidation?: boolean;
}) {
  try {
    console.log('🧬 MCP: Triggering profile evolution...');
    
    // Initialize ALITA if not already done
    await ALITA.initialize();
    
    // Prepare evolution options
    const options: EvolutionOptions = {
      trigger: params.trigger || 'manual',
      aggressiveness: params.aggressiveness || 'moderate',
      ...(params.focusAreas && { focusAreas: params.focusAreas }),
      ...(params.qualityThreshold && { qualityThreshold: params.qualityThreshold }),
      ...(params.skipValidation !== undefined && { skipValidation: params.skipValidation })
    };
    
    // Execute evolution
    const evolvedProfile = await ALITA.getEvolutionEngine().evolveProfile(options);
    
    return {
      success: true,
      message: 'Profile evolution completed successfully',
      result: {
        profileName: evolvedProfile.metadata.name,
        version: evolvedProfile.metadata.version,
        evolutionCount: evolvedProfile.metadata.evolutionCount,
        lastEvolved: evolvedProfile.metadata.lastEvolved,
        qualityImprovements: evolvedProfile.evolutionHistory.slice(-1)[0]?.performanceImpact || {},
        changesApplied: evolvedProfile.evolutionHistory.slice(-1)[0]?.changes.length || 0
      }
    };
      } catch (error) {
    console.error('❌ MCP: Profile evolution failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      message: `Profile evolution failed: ${errorMessage}`,
      error: errorMessage
    };
  }
}

/**
 * MCP endpoint: oneagent_profile_status
 * Get current profile status, health, and evolution readiness
 */
export async function oneagent_profile_status() {
  try {
    console.log('📊 MCP: Getting profile status...');
    
    // Get ALITA system status
    const systemStatus = await ALITA.getStatus();
    
    // Get current profile details
    const profileManager = ALITA.getProfileManager();
    const currentProfile = profileManager.getCurrentProfile();
    
    // Get evolution engine status
    const evolutionStatus = ALITA.getEvolutionEngine().getStatus();
    
    if (!currentProfile) {
      return {
        success: false,
        message: 'No profile loaded',
        result: { initialized: systemStatus.initialized }
      };
    }
    
    // Calculate profile health score
    const profileHealth = await calculateProfileHealth(currentProfile);
    
    return {
      success: true,
      message: 'Profile status retrieved successfully',
      result: {
        profile: {
          name: currentProfile.metadata.name,
          version: currentProfile.metadata.version,
          evolutionCount: currentProfile.metadata.evolutionCount,
          created: currentProfile.metadata.created,
          lastEvolved: currentProfile.metadata.lastEvolved
        },
        health: profileHealth,
        capabilities: {
          total: currentProfile.capabilities.length,
          enabled: currentProfile.capabilities.filter((cap: any) => cap.enabled).length,
          averageQuality: calculateAverageCapabilityQuality(currentProfile.capabilities)
        },
        qualityThresholds: currentProfile.qualityThresholds,
        evolution: {
          isEvolving: evolutionStatus.isEvolving,
          lastEvolution: evolutionStatus.lastEvolution,
          historyCount: currentProfile.evolutionHistory.length
        },
        system: systemStatus
      }
    };
      } catch (error) {
    console.error('❌ MCP: Failed to get profile status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      message: `Failed to get profile status: ${errorMessage}`,
      error: errorMessage
    };
  }
}

/**
 * MCP endpoint: oneagent_profile_history
 * View evolution history with detailed change tracking
 */
export async function oneagent_profile_history(params: {
  limit?: number;
  detailed?: boolean;
  filterByTrigger?: string;
}) {
  try {
    console.log('📜 MCP: Getting profile evolution history...');
    
    const profileManager = ALITA.getProfileManager();
    const currentProfile = profileManager.getCurrentProfile();
    
    if (!currentProfile) {
      return {
        success: false,
        message: 'No profile loaded'
      };
    }
    
    let history = currentProfile.evolutionHistory;
    
    // Apply filters
    if (params.filterByTrigger) {
      history = history.filter((record: any) => record.trigger === params.filterByTrigger);
    }
    
    // Apply limit
    if (params.limit && params.limit > 0) {
      history = history.slice(-params.limit);
    }
    
    // Format history based on detail level
    const formattedHistory = history.map((record: any) => {
      const base = {
        version: record.version,
        timestamp: record.timestamp,
        trigger: record.trigger,
        changesCount: record.changes.length,
        validationStatus: record.validationResults.approvalStatus,
        riskAssessment: record.validationResults.riskAssessment,
        qualityImpact: {
          before: record.performanceImpact.qualityScoreBefore,
          after: record.performanceImpact.qualityScoreAfter,
          improvement: record.performanceImpact.qualityScoreAfter - record.performanceImpact.qualityScoreBefore
        }
      };
      
      if (params.detailed) {
        return {
          ...base,
          changes: record.changes,
          bmadAnalysis: record.validationResults.bmadAnalysis,
          constitutionalCompliance: record.validationResults.constitutionalCompliance,
          performanceMetrics: record.performanceImpact.successMetrics
        };
      }
      
      return base;
    });
    
    return {
      success: true,
      message: 'Evolution history retrieved successfully',
      result: {
        totalEvolutions: currentProfile.evolutionHistory.length,
        filteredResults: formattedHistory.length,
        history: formattedHistory,
        summary: {
          totalQualityImprovement: calculateTotalQualityImprovement(currentProfile.evolutionHistory),
          mostCommonTrigger: getMostCommonTrigger(currentProfile.evolutionHistory),
          averageChangesPerEvolution: calculateAverageChangesPerEvolution(currentProfile.evolutionHistory)
        }
      }
    };
      } catch (error) {
    console.error('❌ MCP: Failed to get profile history:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      message: `Failed to get profile history: ${errorMessage}`,
      error: errorMessage
    };
  }
}

/**
 * MCP endpoint: oneagent_profile_rollback
 * Rollback to a previous profile version
 */
export async function oneagent_profile_rollback(params: {
  targetVersion?: string;
  confirm?: boolean;
}) {
  try {
    console.log('⏮️ MCP: Rolling back profile...');
    
    if (!params.confirm) {
      return {
        success: false,
        message: 'Rollback requires explicit confirmation. Set confirm: true to proceed.',
        requiresConfirmation: true
      };
    }
    
    const profileManager = ALITA.getProfileManager();
    
    // Get available versions for rollback
    const history = await profileManager.getProfileHistory('oneagent-profile');
    
    if (history.length === 0) {
      return {
        success: false,
        message: 'No previous versions available for rollback'
      };
    }
    
    // Perform rollback
    const restoredProfile = await profileManager.rollbackProfile('oneagent-profile', params.targetVersion);
    
    return {
      success: true,
      message: 'Profile rollback completed successfully',
      result: {
        restoredVersion: restoredProfile.metadata.version,
        previousEvolutionCount: restoredProfile.metadata.evolutionCount,
        rollbackTimestamp: restoredProfile.metadata.lastEvolved,
        availableVersions: history.map((h: any) => ({
          version: h.version,
          timestamp: h.timestamp
        }))
      }
    };
      } catch (error) {
    console.error('❌ MCP: Profile rollback failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      message: `Profile rollback failed: ${errorMessage}`,
      error: errorMessage
    };
  }
}

/**
 * MCP endpoint: oneagent_evolution_analytics
 * Get comprehensive evolution analytics and performance metrics
 */
export async function oneagent_evolution_analytics(params: {
  timeframe?: 'last_week' | 'last_month' | 'all_time';
  includeCapabilityAnalysis?: boolean;
  includeQualityTrends?: boolean;
}) {
  try {
    console.log('📈 MCP: Generating evolution analytics...');
    
    const profileManager = ALITA.getProfileManager();
    const currentProfile = profileManager.getCurrentProfile();
    
    if (!currentProfile) {
      return {
        success: false,
        message: 'No profile loaded for analytics'
      };
    }
    
    const analytics: any = {
      overview: {
        totalEvolutions: currentProfile.evolutionHistory.length,
        currentVersion: currentProfile.metadata.version,
        totalQualityImprovement: calculateTotalQualityImprovement(currentProfile.evolutionHistory),
        averageEvolutionInterval: calculateAverageEvolutionInterval(currentProfile.evolutionHistory)
      },
      
      evolutionPatterns: {
        triggerDistribution: getEvolutionTriggerDistribution(currentProfile.evolutionHistory),
        riskAssessmentDistribution: getRiskAssessmentDistribution(currentProfile.evolutionHistory),
        successRate: calculateEvolutionSuccessRate(currentProfile.evolutionHistory)
      },
      
      qualityMetrics: {
        currentQualityScore: currentProfile.qualityThresholds.minimumScore,
        qualityTrend: calculateQualityTrend(currentProfile.evolutionHistory),
        constitutionalComplianceRate: calculateConstitutionalComplianceRate(currentProfile.evolutionHistory)
      }
    };
    
    // Add capability analysis if requested
    if (params.includeCapabilityAnalysis) {
      analytics.capabilities = analyzeCapabilityEvolution(currentProfile);
    }
    
    // Add quality trends if requested
    if (params.includeQualityTrends) {
      analytics.qualityTrends = calculateDetailedQualityTrends(currentProfile.evolutionHistory);
    }
    
    return {
      success: true,
      message: 'Evolution analytics generated successfully',
      result: analytics
    };
      } catch (error) {
    console.error('❌ MCP: Failed to generate analytics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      message: `Failed to generate analytics: ${errorMessage}`,
      error: errorMessage
    };
  }
}

// Helper functions for analytics and calculations

async function calculateProfileHealth(profile: any): Promise<number> {
  // Simplified health calculation
  let health = 100;
  
  // Check capability health
  const enabledCapabilities = profile.capabilities.filter((cap: any) => cap.enabled);
  if (enabledCapabilities.length === 0) health -= 30;
  
  // Check quality thresholds
  if (profile.qualityThresholds.minimumScore < 80) health -= 20;
  
  // Check recent evolution success
  const recentEvolutions = profile.evolutionHistory.slice(-3);
  const failedEvolutions = recentEvolutions.filter((ev: any) => ev.validationResults.approvalStatus !== 'approved');
  health -= failedEvolutions.length * 15;
  
  return Math.max(0, health);
}

function calculateAverageCapabilityQuality(capabilities: any[]): number {
  if (capabilities.length === 0) return 0;
  const total = capabilities.reduce((sum, cap) => sum + (cap.usage?.averageQuality || 0), 0);
  return total / capabilities.length;
}

function calculateTotalQualityImprovement(history: any[]): number {
  if (history.length === 0) return 0;
  return history.reduce((total, record) => {
    const improvement = record.performanceImpact.qualityScoreAfter - record.performanceImpact.qualityScoreBefore;
    return total + improvement;
  }, 0);
}

function getMostCommonTrigger(history: any[]): string {
  if (history.length === 0) return 'none';
  const triggerCounts: Record<string, number> = {};
  history.forEach(record => {
    triggerCounts[record.trigger] = (triggerCounts[record.trigger] || 0) + 1;
  });
  return Object.entries(triggerCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'none';
}

function calculateAverageChangesPerEvolution(history: any[]): number {
  if (history.length === 0) return 0;
  const totalChanges = history.reduce((sum, record) => sum + record.changes.length, 0);
  return totalChanges / history.length;
}

function calculateAverageEvolutionInterval(history: any[]): number {
  if (history.length < 2) return 0;
  // Simplified interval calculation (in days)
  return 7; // Placeholder - would calculate actual intervals
}

function getEvolutionTriggerDistribution(history: any[]): Record<string, number> {
  const distribution: Record<string, number> = {};
  history.forEach(record => {
    distribution[record.trigger] = (distribution[record.trigger] || 0) + 1;
  });
  return distribution;
}

function getRiskAssessmentDistribution(history: any[]): Record<string, number> {
  const distribution: Record<string, number> = {};
  history.forEach(record => {
    const risk = record.validationResults.riskAssessment;
    distribution[risk] = (distribution[risk] || 0) + 1;
  });
  return distribution;
}

function calculateEvolutionSuccessRate(history: any[]): number {
  if (history.length === 0) return 100;
  const successful = history.filter(record => record.validationResults.approvalStatus === 'approved').length;
  return (successful / history.length) * 100;
}

function calculateQualityTrend(history: any[]): 'improving' | 'stable' | 'declining' {
  if (history.length < 2) return 'stable';
  const recent = history.slice(-3);
  const improvements = recent.filter(r => r.performanceImpact.qualityScoreAfter > r.performanceImpact.qualityScoreBefore);
  if (improvements.length > recent.length * 0.6) return 'improving';
  if (improvements.length < recent.length * 0.3) return 'declining';
  return 'stable';
}

function calculateConstitutionalComplianceRate(history: any[]): number {
  if (history.length === 0) return 100;
  const compliant = history.filter(record => record.validationResults.constitutionalCompliance).length;
  return (compliant / history.length) * 100;
}

function analyzeCapabilityEvolution(profile: any): any {
  return {
    totalCapabilities: profile.capabilities.length,
    enabledCapabilities: profile.capabilities.filter((cap: any) => cap.enabled).length,
    averageUsage: calculateAverageCapabilityQuality(profile.capabilities),
    topPerformingCapabilities: profile.capabilities
      .sort((a: any, b: any) => (b.usage?.averageQuality || 0) - (a.usage?.averageQuality || 0))
      .slice(0, 5)
      .map((cap: any) => ({ name: cap.name, quality: cap.usage?.averageQuality || 0 }))
  };
}

function calculateDetailedQualityTrends(history: any[]): any {
  return {
    qualityProgression: history.map(record => ({
      version: record.version,
      before: record.performanceImpact.qualityScoreBefore,
      after: record.performanceImpact.qualityScoreAfter,
      improvement: record.performanceImpact.qualityScoreAfter - record.performanceImpact.qualityScoreBefore
    })),
    averageImprovement: calculateTotalQualityImprovement(history) / Math.max(history.length, 1)
  };
}
