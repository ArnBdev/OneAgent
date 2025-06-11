/**
 * IIntelligenceProvider - Interface for Intelligence and Validation Providers
 * 
 * This interface defines the contract for intelligence providers in the OneAgent ecosystem.
 * Intelligence providers are responsible for validating system integrity, detecting
 * deceptive implementations, and ensuring transparency in system capabilities.
 */

import { MemoryValidationResult } from '../intelligence/MemorySystemValidator';

export interface IIntelligenceProvider {
  /**
   * Validate a memory system for authenticity and capabilities
   * 
   * @param endpoint - The endpoint URL to validate (default: 'http://localhost:8000')
   * @returns Promise containing comprehensive validation results including:
   *   - System type identification (Gemini-ChromaDB, Mem0-Local, MockMemory, Unknown)
   *   - Connection status and data quality assessment
   *   - Transparency analysis to detect deceptive implementations
   *   - User impact assessment and recommendations
   */
  validateMemorySystem(endpoint?: string): Promise<MemoryValidationResult>;
}

// Export for module resolution
export { IIntelligenceProvider as default };
