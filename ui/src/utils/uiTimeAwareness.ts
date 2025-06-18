/**
 * Enhanced Time Awareness for OneAgent UI
 * 
 * Provides time-aware functionality for UI components with intelligence
 * for professional and life coaching contexts.
 * 
 * Version: 1.0.0
 * Created: 2024-06-18
 */

// =====================================
// UI TIME INTERFACE
// =====================================

export interface UITimeContext {
  // Current time data
  current: {
    timestamp: Date;
    iso: string;
    unix: number;
    displayTime: string; // "3:45 PM"
    displayDate: string; // "June 18, 2025"
    relative: string; // "2 minutes ago"
  };
  
  // UI Context
  uiContext: {
    timeOfDay: 'early-morning' | 'morning' | 'afternoon' | 'evening' | 'late-night';
    energyLevel: 'low' | 'medium' | 'high' | 'peak';
    workingHours: boolean;
    optimalFocusTime: boolean;
    suggestedMode: 'focus' | 'collaborate' | 'learn' | 'reflect' | 'rest';
  };
  
  // Professional UI context
  professional: {
    businessDay: boolean;
    peakProductivity: boolean;
    meetingFriendly: boolean;
    deepWorkTime: boolean;
  };
  
  // Life coaching UI context
  lifeCoaching: {
    habitTime: boolean;
    reflectionTime: boolean;
    planningTime: boolean;
    motivationalContext: 'start-strong' | 'maintain-momentum' | 'final-push' | 'celebrate' | 'recharge';
  };
}

// =====================================
// UI TIME AWARENESS HOOK
// =====================================

export function getUITimeContext(): UITimeContext {  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();
  
  // Determine time of day
  let timeOfDay: UITimeContext['uiContext']['timeOfDay'];
  if (hour >= 5 && hour < 9) timeOfDay = 'early-morning';
  else if (hour >= 9 && hour < 12) timeOfDay = 'morning';
  else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
  else if (hour >= 17 && hour < 22) timeOfDay = 'evening';
  else timeOfDay = 'late-night';
  
  // Determine energy level (UI appropriate)
  let energyLevel: UITimeContext['uiContext']['energyLevel'];
  if ((hour >= 9 && hour <= 11) || (hour >= 15 && hour <= 17)) energyLevel = 'peak';
  else if ((hour >= 7 && hour <= 9) || (hour >= 14 && hour <= 16)) energyLevel = 'high';
  else if ((hour >= 11 && hour <= 14) || (hour >= 16 && hour <= 19)) energyLevel = 'medium';
  else energyLevel = 'low';
  
  // Working hours
  const workingHours = hour >= 9 && hour < 17 && dayOfWeek >= 1 && dayOfWeek <= 5;
  
  // Optimal focus time
  const optimalFocusTime = (hour >= 9 && hour <= 11) || (hour >= 15 && hour <= 17);
  
  // Suggested mode
  let suggestedMode: UITimeContext['uiContext']['suggestedMode'];
  if (hour >= 6 && hour <= 9) suggestedMode = 'focus';
  else if (hour >= 9 && hour <= 12) suggestedMode = 'collaborate';
  else if (hour >= 12 && hour <= 17) suggestedMode = 'learn';
  else if (hour >= 17 && hour <= 20) suggestedMode = 'reflect';
  else suggestedMode = 'rest';
  
  // Professional context
  const businessDay = dayOfWeek >= 1 && dayOfWeek <= 5;
  const peakProductivity = (hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16);
  const meetingFriendly = hour >= 10 && hour <= 16 && businessDay;
  const deepWorkTime = (hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16);
  
  // Life coaching context
  const habitTime = (hour >= 6 && hour <= 8) || (hour >= 18 && hour <= 21);
  const reflectionTime = hour >= 19 && hour <= 22;
  const planningTime = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
  
  let motivationalContext: UITimeContext['lifeCoaching']['motivationalContext'];
  if (hour <= 9 || dayOfWeek === 1) motivationalContext = 'start-strong';
  else if (hour >= 10 && hour <= 15) motivationalContext = 'maintain-momentum';
  else if (hour >= 16 && hour <= 18) motivationalContext = 'final-push';
  else if (hour >= 18 && hour <= 20) motivationalContext = 'celebrate';
  else motivationalContext = 'recharge';
  
  return {
    current: {
      timestamp: now,
      iso: now.toISOString(),
      unix: now.getTime(),
      displayTime: now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
      displayDate: now.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      relative: getRelativeTime(now)
    },
    
    uiContext: {
      timeOfDay,
      energyLevel,
      workingHours,
      optimalFocusTime,
      suggestedMode
    },
    
    professional: {
      businessDay,
      peakProductivity,
      meetingFriendly,
      deepWorkTime
    },
    
    lifeCoaching: {
      habitTime,
      reflectionTime,
      planningTime,
      motivationalContext
    }
  };
}

// =====================================
// UI MESSAGE TIMESTAMP UTILITIES
// =====================================

export function createUITimestamp(): Date {
  return new Date();
}

export function formatUITimestamp(timestamp: Date | string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

export function getRelativeTime(timestamp: Date | string): string {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  
  return past.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: past.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

// =====================================
// TIME-AWARE UI ENHANCEMENTS
// =====================================

export interface TimeAwareUIProps {
  showEnergyIndicator?: boolean;
  showOptimalTiming?: boolean;
  showContextualSuggestions?: boolean;
  adaptToUserEnergy?: boolean;
}

export function getTimeAwareUIEnhancements(props: TimeAwareUIProps = {}): {
  energyIndicator?: { level: string; color: string; icon: string };
  timingContext?: { message: string; type: 'info' | 'success' | 'warning' };
  contextualSuggestions?: string[];
  uiAdaptations?: { theme: 'bright' | 'moderate' | 'dim'; pace: 'fast' | 'normal' | 'relaxed' };
} {
  const timeContext = getUITimeContext();
  const enhancements: any = {};
  
  if (props.showEnergyIndicator) {
    const energyColors = {
      'peak': { color: '#10B981', icon: '⚡' },
      'high': { color: '#059669', icon: '🔋' },
      'medium': { color: '#F59E0B', icon: '⭐' },
      'low': { color: '#6B7280', icon: '🌙' }
    };
    
    enhancements.energyIndicator = {
      level: timeContext.uiContext.energyLevel,
      ...energyColors[timeContext.uiContext.energyLevel]
    };
  }
  
  if (props.showOptimalTiming) {
    if (timeContext.uiContext.optimalFocusTime) {
      enhancements.timingContext = {
        message: 'Perfect time for focused work! 🎯',
        type: 'success'
      };
    } else if (timeContext.professional.meetingFriendly) {
      enhancements.timingContext = {
        message: 'Great time for collaboration 🤝',
        type: 'info'
      };
    } else if (timeContext.lifeCoaching.reflectionTime) {
      enhancements.timingContext = {
        message: 'Ideal time for reflection and planning 🤔',
        type: 'info'
      };
    }
  }
  
  if (props.showContextualSuggestions) {
    const suggestions: string[] = [];
    
    if (timeContext.professional.deepWorkTime) {
      suggestions.push('Consider tackling complex problems now');
    }
    if (timeContext.lifeCoaching.habitTime) {
      suggestions.push('Great time to reinforce daily habits');
    }
    if (timeContext.lifeCoaching.planningTime) {
      suggestions.push('Perfect for planning your day/week');
    }
    if (timeContext.uiContext.energyLevel === 'low') {
      suggestions.push('Consider lighter tasks or taking a break');
    }
    
    enhancements.contextualSuggestions = suggestions;
  }
  
  if (props.adaptToUserEnergy) {
    const adaptations = {
      'peak': { theme: 'bright' as const, pace: 'fast' as const },
      'high': { theme: 'bright' as const, pace: 'normal' as const },
      'medium': { theme: 'moderate' as const, pace: 'normal' as const },
      'low': { theme: 'dim' as const, pace: 'relaxed' as const }
    };
    
    enhancements.uiAdaptations = adaptations[timeContext.uiContext.energyLevel];
  }
  
  return enhancements;
}

// =====================================
// ENHANCED MESSAGE INTERFACE
// =====================================

export interface EnhancedUIMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  
  // Enhanced timing data
  timing: {
    created: string; // ISO string
    unix: number;
    displayTime: string;
    relative: string;
    
    // Context at creation
    timeOfDay: string;
    energyLevel: string;
    contextualMode: string;
  };
  
  // Optional enhancements
  qualityScore?: number;
  agentType?: string;
  status?: 'processing' | 'complete' | 'error';
  constitutionalValidation?: {
    accuracy: number;
    transparency: number;
    helpfulness: number;
    safety: number;
  };
}

export function createEnhancedUIMessage(
  content: string, 
  role: 'user' | 'assistant',
  additional: Partial<EnhancedUIMessage> = {}
): EnhancedUIMessage {
  const timeContext = getUITimeContext();
  
  return {
    id: `msg_${timeContext.current.unix}_${Math.random().toString(36).substr(2, 9)}`,
    content,
    role,
    timestamp: timeContext.current.timestamp,
    
    timing: {
      created: timeContext.current.iso,
      unix: timeContext.current.unix,
      displayTime: timeContext.current.displayTime,
      relative: 'just now',
      timeOfDay: timeContext.uiContext.timeOfDay,
      energyLevel: timeContext.uiContext.energyLevel,
      contextualMode: timeContext.uiContext.suggestedMode
    },
    
    ...additional
  };
}

/**
 * This UI time awareness system provides:
 * 
 * 1. **Time-Intelligent UI**: Adapts interface based on user energy and context
 * 2. **Professional Awareness**: Shows optimal timing for work activities
 * 3. **Life Coaching Integration**: Suggests habits, reflection, and planning times
 * 4. **Enhanced Messages**: Rich temporal context for all communications
 * 5. **Contextual Suggestions**: Time-appropriate recommendations
 * 6. **Energy Adaptation**: UI adapts to user's natural energy rhythms
 * 
 * Seamlessly integrates with OneAgent's enhanced time awareness backend
 * while providing immediate UI benefits for both professional and personal use.
 */
