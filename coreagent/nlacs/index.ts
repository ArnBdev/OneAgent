/**
 * OneAgent NLACS (Natural Language Agent Coordination System) Module
 * 
 * Provides natural language coordination capabilities for multi-agent systems,
 * enabling emergent intelligence through conversation and synthesis.
 * 
 * @version 5.0.0
 * @author OneAgent Development Team
 */

// Export the main coordinator service
export { NLACSCoordinator } from './NLACSCoordinator';

// Export types from backbone types
export type {
  NLACSDiscussion,
  NLACSMessage,
  EmergentInsight,
  ConversationThread,
  ConversationContext,
  NLACSCapability
} from '../types/oneagent-backbone-types';

/**
 * NLACS Module Overview:
 * 
 * This module provides the Natural Language Agent Coordination System (NLACS)
 * for OneAgent v5.0.0. It enables:
 * 
 * 1. Multi-agent natural language discussions
 * 2. Emergent insight generation through conversation
 * 3. Knowledge synthesis across agent boundaries
 * 4. Constitutional AI validation of interactions
 * 5. Memory-integrated conversation patterns
 * 
 * Key Components:
 * - NLACSCoordinator: Central coordination service
 * - BaseAgent NLACS extensions: Agent-level capabilities
 * - Type definitions: Structured conversation data models
 * 
 * Usage:
 * ```typescript
 * import { NLACSCoordinator } from './nlacs';
 * 
 * const coordinator = new NLACSCoordinator();
 * const discussionId = await coordinator.initializeDiscussion(
 *   'AI Safety Best Practices',
 *   'question'
 * );
 * ```
 */
