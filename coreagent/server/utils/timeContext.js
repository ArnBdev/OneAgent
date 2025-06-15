"use strict";
/**
 * TimeContext - Minimal Time Awareness Utility for OneAgent
 *
 * Provides current date/time context to prevent temporal errors in responses.
 * Integrates with Constitutional AI for accuracy validation.
 *
 * Ultra-lightweight: ~20 lines, zero overhead, no dependencies.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentTimeContext = getCurrentTimeContext;
exports.getTimeContextString = getTimeContextString;
/**
 * Get current time context for accurate temporal responses
 * Zero overhead - only called when needed
 */
function getCurrentTimeContext() {
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
function getTimeContextString() {
    const time = getCurrentTimeContext();
    return `Current date: ${time.current.date}`;
}
