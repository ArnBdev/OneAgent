/**
 * OneAgent Specialized Agents Export Module
 * 
 * This module exports all specialized agent implementations for OneAgent v5.0.0
 * 
 * Architecture:
 * - BaseAgent: Core agent functionality with NLACS integration
 * - PlannerAgent: Strategic planning and task orchestration
 * - Future agents: DevAgent, OfficeAgent, TriageAgent, etc.
 * 
 * Version: 5.0.0
 * Created: 2025-07-12
 */

// Export specialized agents
export { PlannerAgent } from './PlannerAgent';
export { ValidationAgent } from './ValidationAgent';

// Export agent types and interfaces
export type {
  PlanningTask,
  PlanningStrategy,
  AgentCapabilityProfile,
  PlanningContext,
  PlanningSession
} from './PlannerAgent';

// Export validation types
export type {
  ValidationResult,
  ValidationIssue,
  ConstitutionalResult,
  BMADAnalysisResult
} from './ValidationAgent';

// Export base agent functionality
export { BaseAgent } from '../base/BaseAgent';
export type { AgentConfig, AgentContext, AgentResponse } from '../base/ISpecializedAgent';

// Export NLACS integration
export { NLACSCoordinator } from '../../nlacs/NLACSCoordinator';
export { AdvancedNLACSEngine } from '../../nlacs/AdvancedNLACSEngine';

// Export Constitutional AI
export { ConstitutionalAI } from '../base/ConstitutionalAI';
export { BMADElicitationEngine } from '../base/BMADElicitationEngine';

console.log('🤖 OneAgent Specialized Agents module loaded successfully');
