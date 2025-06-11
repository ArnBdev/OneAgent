/**
 * TimeContext - Minimal Time Awareness Utility for OneAgent
 * 
 * Provides current date/time context to prevent temporal errors in responses.
 * Integrates with Constitutional AI for accuracy validation.
 * 
 * Ultra-lightweight: ~20 lines, zero overhead, no dependencies.
 */

export interface TimeContext {
  current: {
    date: string;        // "June 11, 2025"
    isoDate: string;     // "2025-06-11T15:30:45.123Z"
    timestamp: number;   // 1749648645123
  };
  format: {
    readable: string;    // "Tuesday, June 11, 2025 at 3:30 PM"
    short: string;       // "Jun 11, 2025"
  };
}

/**
 * Get current time context for accurate temporal responses
 * Zero overhead - only called when needed
 */
export function getCurrentTimeContext(): TimeContext {
  const now = new Date();
  
  return {
    current: {
      date: now.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      isoDate: now.toISOString(),
      timestamp: now.getTime()
    },
    format: {
      readable: now.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      short: now.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    }
  };
}

/**
 * Get context string for Constitutional AI validation
 * Provides time awareness for accuracy principle
 */
export function getTimeContextString(): string {
  const time = getCurrentTimeContext();
  return `Current date: ${time.current.date}`;
}
