/**
 * OneAgent Enhanced Time Awareness System
 * Comprehensive Time Intelligence for Professional & Life Coaching
 * 
 * This enhances our minimal timeContext.ts with intelligent temporal features
 * needed for both professional development and personal life coaching.
 * 
 * Version: 2.0.0
 * Created: 2024-06-18
 */

import { OneAgentUnifiedBackbone, createUnifiedTimestamp } from './UnifiedBackboneService.js';
import { UnifiedTimeContext } from '../types/oneagent-backbone-types.js';

// =====================================
// ENHANCED TIME AWARENESS INTERFACES
// =====================================

export interface EnhancedTimeContext extends UnifiedTimeContext {
  // Real-time awareness
  realTime: {
    unix: number;
    utc: string;
    local: string;
    timezone: string;
    offset: number; // UTC offset in minutes
  };
  
  // Life coaching temporal context
  lifeContext: {
    dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    timeOfDay: 'early-morning' | 'morning' | 'afternoon' | 'evening' | 'late-night';
    workingHours: boolean;
    weekendMode: boolean;
    seasonalContext: 'spring' | 'summer' | 'fall' | 'winter';
  };
  
  // Professional context
  professionalContext: {
    businessDay: boolean;
    peakHours: boolean; // 9-11 AM, 2-4 PM typically
    quarterInfo: {
      quarter: 1 | 2 | 3 | 4;
      quarterStart: Date;
      quarterEnd: Date;
      daysIntoQuarter: number;
      daysRemainingInQuarter: number;
    };
    fiscalYear: {
      year: number;
      start: Date;
      end: Date;
    };
  };
  
  // Temporal intelligence
  intelligence: {
    optimalFocusTime: boolean; // Based on circadian rhythms
    energyLevel: 'low' | 'medium' | 'high' | 'peak';
    suggestionContext: 'planning' | 'execution' | 'review' | 'rest';
    motivationalTiming: 'start-strong' | 'mid-momentum' | 'end-sprint' | 'reflection';
  };
}

// =====================================
// TEMPORAL METADATA INTEGRATION
// =====================================

export interface TemporalMetadata {
  // Real-time tracking
  realTime: {
    createdAtUnix: number;
    updatedAtUnix: number;
    lastAccessedUnix?: number;
    timezoneCaptured: string;
    utcOffset: number;
  };
  
  // Temporal context at creation
  contextSnapshot: {
    timeOfDay: string;
    dayOfWeek: string;
    businessContext: boolean;
    seasonalContext: string;
    userEnergyContext?: 'low' | 'medium' | 'high' | 'peak';
  };
  
  // Temporal relevance
  relevance: {
    isTimeDependent: boolean;
    relevanceDecay: 'none' | 'slow' | 'medium' | 'fast'; // How quickly this becomes outdated
    temporalTags: string[]; // e.g., 'morning-routine', 'quarterly-review', 'weekend-planning'
    futureRelevance?: {
      relevantAt: Date[];
      reminderTiming: 'before' | 'during' | 'after';
      contextNeeded: string[];
    };
  };
  
  // Life coaching temporal patterns
  lifeCoaching: {
    habitTimestamp: boolean; // Is this related to habit tracking?
    goalTimeline: {
      isGoalRelated: boolean;
      timeframe: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'lifetime';
      milestoneTiming?: Date[];
    };
    emotionalTiming: {
      emotionalState?: 'positive' | 'neutral' | 'challenging' | 'breakthrough';
      energyAlignment: boolean; // Was this created during optimal energy time?
      reflectionTiming: boolean; // Is this a reflection/review activity?
    };
  };
  
  // Professional timing intelligence
  professional: {
    projectPhase: 'planning' | 'execution' | 'review' | 'maintenance';
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    deadlineAwareness: {
      hasDeadline: boolean;
      deadline?: Date;
      bufferTime?: number; // Days before deadline
      criticalPath: boolean;
    };
    collaborationTiming: {
      requiresRealTime: boolean; // Needs immediate sync
      asyncFriendly: boolean; // Can handle delays
      timezoneSensitive: boolean; // Coordination across timezones needed
    };
  };
}

// =====================================
// ENHANCED TIME AWARENESS SYSTEM
// =====================================

export class OneAgentTimeAwareness {
  private static instance: OneAgentTimeAwareness;
  
  // Singleton pattern for consistent time awareness
  public static getInstance(): OneAgentTimeAwareness {
    if (!OneAgentTimeAwareness.instance) {
      OneAgentTimeAwareness.instance = new OneAgentTimeAwareness();
    }
    return OneAgentTimeAwareness.instance;
  }
  
  /**
   * Get comprehensive time context with intelligence
   */
  public getEnhancedTimeContext(): EnhancedTimeContext {
    const basicTime = OneAgentUnifiedBackbone.getInstance().getServices().timeService.getContext();
    const now = new Date();
    
    return {
      ...basicTime,
      
      // Real-time awareness
      realTime: {
        unix: now.getTime(),
        utc: now.toISOString(),
        local: now.toLocaleString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        offset: now.getTimezoneOffset()
      },
      
      // Life coaching context
      lifeContext: this.getLifeContext(now),
      
      // Professional context
      professionalContext: this.getProfessionalContext(now),
      
      // Temporal intelligence
      intelligence: this.getTemporalIntelligence(now)
    };
  }
  
  /**
   * Create temporal metadata for any content
   */
  public createTemporalMetadata(options: {
    isTimeDependent?: boolean;
    relevanceDecay?: 'none' | 'slow' | 'medium' | 'fast';
    isGoalRelated?: boolean;
    hasDeadline?: boolean;
    deadline?: Date;
    requiresRealTime?: boolean;
  } = {}): TemporalMetadata {
    const timeContext = this.getEnhancedTimeContext();
    const now = new Date();
    
    return {
      realTime: {
        createdAtUnix: now.getTime(),
        updatedAtUnix: now.getTime(),
        timezoneCaptured: timeContext.realTime.timezone,
        utcOffset: timeContext.realTime.offset
      },
      
      contextSnapshot: {
        timeOfDay: timeContext.lifeContext.timeOfDay,
        dayOfWeek: timeContext.lifeContext.dayOfWeek,
        businessContext: timeContext.professionalContext.businessDay,
        seasonalContext: timeContext.lifeContext.seasonalContext,
        userEnergyContext: timeContext.intelligence.energyLevel
      },
      
      relevance: {
        isTimeDependent: options.isTimeDependent || false,
        relevanceDecay: options.relevanceDecay || 'medium',
        temporalTags: this.generateTemporalTags(timeContext),
        ...(options.deadline && {
          futureRelevance: {
            relevantAt: [options.deadline],
            reminderTiming: 'before',
            contextNeeded: ['deadline-approach', 'urgency-context']
          }
        })
      },
      
      lifeCoaching: {
        habitTimestamp: this.isHabitTime(timeContext),
        goalTimeline: {
          isGoalRelated: options.isGoalRelated || false,
          timeframe: this.inferTimeframe(timeContext, options),
          ...(options.deadline && { milestoneTiming: [options.deadline] })
        },
        emotionalTiming: {
          energyAlignment: timeContext.intelligence.optimalFocusTime,
          reflectionTiming: timeContext.intelligence.suggestionContext === 'review'
        }
      },
      
      professional: {
        projectPhase: this.inferProjectPhase(timeContext),
        urgencyLevel: options.hasDeadline ? 'medium' : 'low',        deadlineAwareness: {
          hasDeadline: options.hasDeadline || false,
          ...(options.deadline && { deadline: options.deadline }),
          criticalPath: false
        },
        collaborationTiming: {
          requiresRealTime: options.requiresRealTime || false,
          asyncFriendly: !options.requiresRealTime,
          timezoneSensitive: false
        }
      }
    };
  }
  
  /**
   * Get life coaching appropriate time context
   */
  private getLifeContext(now: Date): EnhancedTimeContext['lifeContext'] {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = dayNames[now.getDay()] as any;
    const hour = now.getHours();
    const month = now.getMonth();
    
    // Determine time of day for life coaching context
    let timeOfDay: EnhancedTimeContext['lifeContext']['timeOfDay'];
    if (hour >= 5 && hour < 9) timeOfDay = 'early-morning';
    else if (hour >= 9 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 22) timeOfDay = 'evening';
    else timeOfDay = 'late-night';
    
    // Seasonal context
    let seasonalContext: EnhancedTimeContext['lifeContext']['seasonalContext'];
    if (month >= 2 && month <= 4) seasonalContext = 'spring';
    else if (month >= 5 && month <= 7) seasonalContext = 'summer';
    else if (month >= 8 && month <= 10) seasonalContext = 'fall';
    else seasonalContext = 'winter';
    
    return {
      dayOfWeek,
      timeOfDay,
      workingHours: hour >= 9 && hour < 17 && dayOfWeek !== 'saturday' && dayOfWeek !== 'sunday',
      weekendMode: dayOfWeek === 'saturday' || dayOfWeek === 'sunday',
      seasonalContext
    };
  }
  
  /**
   * Get professional context
   */
  private getProfessionalContext(now: Date): EnhancedTimeContext['professionalContext'] {
    const dayOfWeek = now.getDay();
    const hour = now.getHours();
    const month = now.getMonth();
    const quarter = Math.floor(month / 3) + 1;
    
    // Calculate quarter boundaries
    const quarterStart = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
    const quarterEnd = new Date(now.getFullYear(), quarter * 3, 0);
    const daysIntoQuarter = Math.floor((now.getTime() - quarterStart.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemainingInQuarter = Math.floor((quarterEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      businessDay: dayOfWeek >= 1 && dayOfWeek <= 5,
      peakHours: (hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16),
      quarterInfo: {
        quarter: quarter as 1 | 2 | 3 | 4,
        quarterStart,
        quarterEnd,
        daysIntoQuarter,
        daysRemainingInQuarter
      },
      fiscalYear: {
        year: now.getFullYear(),
        start: new Date(now.getFullYear(), 0, 1),
        end: new Date(now.getFullYear(), 11, 31)
      }
    };
  }
  
  /**
   * Get temporal intelligence insights
   */
  private getTemporalIntelligence(now: Date): EnhancedTimeContext['intelligence'] {
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    
    // Optimal focus time (based on general circadian rhythms)
    const optimalFocusTime = (hour >= 9 && hour <= 11) || (hour >= 15 && hour <= 17);
    
    // Energy level estimation
    let energyLevel: EnhancedTimeContext['intelligence']['energyLevel'];
    if (hour >= 9 && hour <= 11) energyLevel = 'peak';
    else if ((hour >= 7 && hour <= 9) || (hour >= 14 && hour <= 16)) energyLevel = 'high';
    else if ((hour >= 11 && hour <= 14) || (hour >= 16 && hour <= 19)) energyLevel = 'medium';
    else energyLevel = 'low';
    
    // Suggestion context
    let suggestionContext: EnhancedTimeContext['intelligence']['suggestionContext'];
    if (hour >= 6 && hour <= 9) suggestionContext = 'planning';
    else if (hour >= 9 && hour <= 17) suggestionContext = 'execution';
    else if (hour >= 17 && hour <= 20) suggestionContext = 'review';
    else suggestionContext = 'rest';
    
    // Motivational timing
    let motivationalTiming: EnhancedTimeContext['intelligence']['motivationalTiming'];
    if (dayOfWeek === 1 || hour <= 9) motivationalTiming = 'start-strong';
    else if (dayOfWeek >= 2 && dayOfWeek <= 4) motivationalTiming = 'mid-momentum';
    else if (dayOfWeek === 5 || hour >= 16) motivationalTiming = 'end-sprint';
    else motivationalTiming = 'reflection';
    
    return {
      optimalFocusTime,
      energyLevel,
      suggestionContext,
      motivationalTiming
    };
  }
  
  /**
   * Generate temporal tags for enhanced searchability
   */
  private generateTemporalTags(timeContext: EnhancedTimeContext): string[] {
    const tags: string[] = [];
    
    // Basic temporal tags
    tags.push(`time-${timeContext.lifeContext.timeOfDay}`);
    tags.push(`day-${timeContext.lifeContext.dayOfWeek}`);
    tags.push(`season-${timeContext.lifeContext.seasonalContext}`);
    tags.push(`energy-${timeContext.intelligence.energyLevel}`);
    
    // Context-specific tags
    if (timeContext.lifeContext.weekendMode) tags.push('weekend');
    if (timeContext.professionalContext.businessDay) tags.push('business-day');
    if (timeContext.intelligence.optimalFocusTime) tags.push('focus-time');
    if (timeContext.professionalContext.peakHours) tags.push('peak-hours');
    
    // Quarter and seasonal tags
    tags.push(`q${timeContext.professionalContext.quarterInfo.quarter}`);
    if (timeContext.professionalContext.quarterInfo.daysRemainingInQuarter <= 30) {
      tags.push('quarter-end');
    }
    
    return tags;
  }
  
  private isHabitTime(timeContext: EnhancedTimeContext): boolean {
    // Morning and evening are typical habit times
    return timeContext.lifeContext.timeOfDay === 'early-morning' || 
           timeContext.lifeContext.timeOfDay === 'evening';
  }
  
  private inferTimeframe(_timeContext: EnhancedTimeContext, options: any): TemporalMetadata['lifeCoaching']['goalTimeline']['timeframe'] {
    if (options.deadline) {
      const daysToDeadline = Math.floor((options.deadline.getTime() - createUnifiedTimestamp().unix) / (1000 * 60 * 60 * 24));
      if (daysToDeadline <= 1) return 'daily';
      if (daysToDeadline <= 7) return 'weekly';
      if (daysToDeadline <= 30) return 'monthly';
      if (daysToDeadline <= 90) return 'quarterly';
      return 'yearly';
    }
    return 'weekly'; // Default
  }
  
  private inferProjectPhase(timeContext: EnhancedTimeContext): TemporalMetadata['professional']['projectPhase'] {
    // Use suggestion context as a proxy for project phase
    switch (timeContext.intelligence.suggestionContext) {
      case 'planning': return 'planning';
      case 'execution': return 'execution';
      case 'review': return 'review';
      default: return 'maintenance';
    }
  }
  
  /**
   * System-wide time synchronization point
   */
  public async syncSystemTime(): Promise<{
    systemTime: EnhancedTimeContext;
    syncTimestamp: number;
    timezone: string;
  }> {
    const timeContext = this.getEnhancedTimeContext();
    
    return {
      systemTime: timeContext,
      syncTimestamp: createUnifiedTimestamp().unix,
      timezone: timeContext.realTime.timezone
    };
  }
  
  /**
   * Constitutional AI time context for accuracy
   */
  public getConstitutionalTimeContext(): string {
    const timeContext = this.getEnhancedTimeContext();
    return `Current time: ${timeContext.realTime.local} (${timeContext.realTime.timezone}). ` +
           `Context: ${timeContext.intelligence.suggestionContext} time, ` +
           `${timeContext.intelligence.energyLevel} energy period.`;
  }
}

// =====================================
// GLOBAL TIME AWARENESS INTEGRATION
// =====================================

// Singleton instance for system-wide use
export const timeAwareness = OneAgentTimeAwareness.getInstance();

// Enhanced exports for backward compatibility
export const getEnhancedTimeContext = () => timeAwareness.getEnhancedTimeContext();
export const createTemporalMetadata = (options = {}) => timeAwareness.createTemporalMetadata(options);
export const getConstitutionalTimeContext = () => timeAwareness.getConstitutionalTimeContext();

/**
 * This enhanced time awareness system provides:
 * 
 * 1. **Real-time Intelligence**: Comprehensive temporal context
 * 2. **Life Coaching Integration**: Time-aware guidance and habit tracking
 * 3. **Professional Context**: Business cycles, deadlines, optimal timing
 * 4. **Temporal Metadata**: Rich time-based metadata for all content
 * 5. **Constitutional AI Integration**: Time-aware accuracy validation
 * 6. **System-wide Consistency**: Single source of truth for time
 * 7. **Cross-timezone Support**: Professional collaboration awareness
 * 8. **Circadian Intelligence**: Energy and focus optimization
 * 
 * For OneAgent's dual professional and life coaching purposes, this provides
 * the temporal intelligence needed for truly time-aware assistance.
 */
