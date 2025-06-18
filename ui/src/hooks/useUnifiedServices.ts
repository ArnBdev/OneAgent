/**
 * OneAgent UI Unified Services Adapter
 * Bridge between unified backend services and React UI components
 * 
 * Provides React-friendly interfaces for unified time and metadata services
 * while maintaining full backend compatibility and Constitutional AI compliance.
 * 
 * Version: 1.0.0
 * Created: 2024-06-18
 * Priority: CRITICAL UI INTEGRATION
 */

import { useState, useEffect, useCallback } from 'react';
import type { 
  UnifiedTimestamp, 
  UnifiedTimeContext, 
  UnifiedMetadata
} from '../../../coreagent/types/unified';

// =====================================
// UI-FRIENDLY UNIFIED SERVICES
// =====================================

/**
 * UI-adapted unified timestamp for React components
 */
export interface UIUnifiedTimestamp extends UnifiedTimestamp {
  // Additional UI-specific properties
  displayTime: string; // Human-readable format for UI
  relativeTime: string; // "2 minutes ago" format
}

/**
 * UI message interface with unified metadata
 */
export interface UIMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: UIUnifiedTimestamp;
  metadata: UnifiedMetadata;
  // UI-specific properties
  isLoading?: boolean;
  error?: string;
  energyContext?: string;
  suggestionContext?: string;
}

/**
 * UI session context with unified services
 */
export interface UISessionContext {
  sessionId: string;
  userId?: string;
  currentEnergy: string;
  optimalTiming: boolean;
  timeContext: UnifiedTimeContext;
}

// =====================================
// REACT HOOKS FOR UNIFIED SERVICES
// =====================================

/**
 * Hook for unified time awareness in React components
 */
export function useUnifiedTime() {
  const [timeContext, setTimeContext] = useState<UnifiedTimeContext | null>(null);
  
  useEffect(() => {
    // Dynamically import unified services to avoid build issues
    const updateTimeContext = async () => {
      try {
        const { unifiedTimeService } = await import('../../../coreagent/utils/UnifiedBackboneService');
        const context = unifiedTimeService.getContext();
        setTimeContext(context);
      } catch (error) {
        console.error('Failed to load unified time service:', error);
      }
    };
    
    updateTimeContext();
    const interval = setInterval(updateTimeContext, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);
  
  const createUITimestamp = useCallback(async (): Promise<UIUnifiedTimestamp> => {
    try {
      const { unifiedTimeService } = await import('../../../coreagent/utils/UnifiedBackboneService');
      const baseTimestamp = unifiedTimeService.now();
      
      return {
        ...baseTimestamp,
        displayTime: new Date(baseTimestamp.unix).toLocaleString(),
        relativeTime: getRelativeTime(baseTimestamp.unix)
      };
    } catch (error) {
      console.error('Failed to create UI timestamp:', error);
      // Fallback to basic timestamp
      const now = new Date();
      return {
        unix: now.getTime(),
        utc: now.toISOString(),
        local: now.toLocaleString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        context: 'fallback',
        displayTime: now.toLocaleString(),
        relativeTime: 'just now'
      };
    }
  }, []);
  
  const isOptimalTime = useCallback((type: 'focus' | 'creative' | 'social' | 'rest') => {
    if (!timeContext) return false;
    
    const hour = new Date().getHours();
    switch (type) {
      case 'focus': return timeContext.intelligence.optimalFocusTime;
      case 'creative': return hour >= 10 && hour <= 12 || hour >= 15 && hour <= 17;
      case 'social': return timeContext.context.workingHours;
      case 'rest': return timeContext.intelligence.suggestionContext === 'rest';
      default: return false;
    }
  }, [timeContext]);
  
  return {
    timeContext,
    createUITimestamp,
    isOptimalTime,
    energyLevel: timeContext?.intelligence.energyLevel,
    suggestionContext: timeContext?.intelligence.suggestionContext
  };
}

/**
 * Hook for unified metadata in React components
 */
export function useUnifiedMetadata() {
  const createUIMessage = useCallback(async (
    content: string, 
    role: 'user' | 'assistant' | 'system',
    options: {
      sessionId: string;
      userId?: string;
      isLoading?: boolean;
      error?: string;
    } = { sessionId: 'default' }
  ): Promise<UIMessage> => {
    try {
      const { unifiedMetadataService, unifiedTimeService } = await import('../../../coreagent/utils/UnifiedBackboneService');
      
      const timestamp = unifiedTimeService.now();
      const timeContext = unifiedTimeService.getContext();
      
      const metadata = unifiedMetadataService.create('ui_message', 'chat_interface', {
        system: {
          source: 'chat_interface',
          component: 'UIMessage',
          sessionId: options.sessionId,
          ...(options.userId && { userId: options.userId })
        },
        content: {
          category: 'conversation',
          tags: ['chat', 'ui', role],
          sensitivity: 'internal',
          relevanceScore: 0.9,
          contextDependency: 'session'
        },
        quality: {
          score: options.error ? 60 : 90,
          constitutionalCompliant: true,
          validationLevel: 'enhanced',
          confidence: options.error ? 0.6 : 0.9
        }
      });
      
      const uiTimestamp: UIUnifiedTimestamp = {
        ...timestamp,
        displayTime: new Date(timestamp.unix).toLocaleString(),
        relativeTime: getRelativeTime(timestamp.unix)
      };
      
      return {
        id: metadata.id,
        content,
        role,
        timestamp: uiTimestamp,
        metadata,
        isLoading: options.isLoading,
        error: options.error,
        energyContext: timeContext.intelligence.energyLevel,
        suggestionContext: timeContext.intelligence.suggestionContext
      };
    } catch (error) {
      console.error('Failed to create UI message with unified metadata:', error);
      // Fallback message
      const now = new Date();
      return {
        id: `fallback_${now.getTime()}_${Math.random().toString(36).substr(2, 9)}`,
        content,
        role,
        timestamp: {
          unix: now.getTime(),
          utc: now.toISOString(),
          local: now.toLocaleString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          context: 'fallback',
          displayTime: now.toLocaleString(),
          relativeTime: 'just now'
        },
        metadata: {} as UnifiedMetadata, // Empty fallback
        isLoading: options.isLoading,
        error: options.error
      };
    }
  }, []);
  
  return {
    createUIMessage
  };
}

/**
 * Hook for unified session context
 */
export function useUnifiedSession(initialSessionId?: string) {
  const [sessionContext, setSessionContext] = useState<UISessionContext | null>(null);
  const { timeContext } = useUnifiedTime();
  
  useEffect(() => {
    if (timeContext) {
      setSessionContext({
        sessionId: initialSessionId || `ui_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        currentEnergy: timeContext.intelligence.energyLevel,
        optimalTiming: timeContext.intelligence.optimalFocusTime,
        timeContext
      });
    }
  }, [timeContext, initialSessionId]);
  
  return sessionContext;
}

// =====================================
// UTILITY FUNCTIONS
// =====================================

/**
 * Calculate relative time string for UI display
 */
function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

/**
 * Energy-aware UI theme suggestions
 */
export function getEnergyTheme(energyLevel: string): {
  primaryColor: string;
  secondaryColor: string;
  suggestion: string;
} {
  switch (energyLevel) {
    case 'peak':
      return {
        primaryColor: '#10B981', // Green
        secondaryColor: '#D1FAE5',
        suggestion: 'Perfect time for complex tasks!'
      };
    case 'high':
      return {
        primaryColor: '#3B82F6', // Blue
        secondaryColor: '#DBEAFE',
        suggestion: 'Great time for focused work'
      };
    case 'medium':
      return {
        primaryColor: '#F59E0B', // Yellow
        secondaryColor: '#FEF3C7',
        suggestion: 'Good for routine tasks'
      };
    case 'low':
      return {
        primaryColor: '#8B5CF6', // Purple
        secondaryColor: '#EDE9FE',
        suggestion: 'Consider taking a break'
      };
    default:
      return {
        primaryColor: '#6B7280', // Gray
        secondaryColor: '#F3F4F6',
        suggestion: 'Standard mode'
      };
  }
}

/**
 * Constitutional AI compliance indicator for UI
 */
export function getComplianceIndicator(metadata: UnifiedMetadata): {
  status: 'compliant' | 'warning' | 'violation';
  color: string;
  icon: string;
} {
  if (metadata.quality?.constitutionalCompliant === false) {
    return {
      status: 'violation',
      color: '#EF4444', // Red
      icon: '⚠️'
    };
  }
  
  if (metadata.quality?.score < 80) {
    return {
      status: 'warning',
      color: '#F59E0B', // Yellow
      icon: '⚡'
    };
  }
  
  return {
    status: 'compliant',
    color: '#10B981', // Green
    icon: '✅'
  };
}

export default {
  useUnifiedTime,
  useUnifiedMetadata,
  useUnifiedSession,
  getEnergyTheme,
  getComplianceIndicator
};
