/**
 * Unified Backbone Service for VS Code Extension
 * 
 * This is a lightweight version of the core UnifiedBackboneService specifically for the VS Code extension.
 * It provides the same interface and functionality while respecting the extension's module boundaries.
 * 
 * ARCHITECTURAL PRINCIPLE: Maintains compatibility with core OneAgent canonical systems
 */

export interface UnifiedTimestamp {
  unix: number;
  utc: string;
  iso: string;
  human: string;
}

/**
 * Create unified timestamp matching core OneAgent system
 */
export function createUnifiedTimestamp(): UnifiedTimestamp {
  const now = new Date();
  const unix = Math.floor(now.getTime() / 1000);
  
  return {
    unix,
    utc: now.toISOString(),
    iso: now.toISOString(),
    human: now.toLocaleString()
  };
}

/**
 * Generate unified ID matching core OneAgent system
 */
export function generateUnifiedId(type: string, context?: string): string {
  // Use the same pattern as the main system - delegate to core service
  const timestamp = createUnifiedTimestamp().unix;
  const randomSuffix = crypto.randomUUID().split('-')[0]; // Use crypto for better randomness
  const contextSuffix = context ? `_${context}` : '';
  
  return `${type}_${timestamp}_${randomSuffix}${contextSuffix}`;
}
