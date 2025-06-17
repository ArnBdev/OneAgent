/**
 * OneAgent Level 2 Orchestrator
 * Main entry point for the orchestration layer that coordinates all agent interactions
 * 
 * This file serves as the central hub for:
 * - Unified Agent Registry Management (OURA v3.0)
 * - Request Routing and Processing
 * - Memory Context Bridging
 * - Chat Interface Coordination
 */

import { realUnifiedMemoryClient } from '../memory/RealUnifiedMemoryClient';

// Core Orchestrator Components - Modern Unified Architecture
export { UnifiedAgentRegistry } from './UnifiedAgentRegistry';
export { RequestRouter } from './requestRouter';
export { MemoryContextBridge } from './memoryContextBridge';

// Orchestrator Interfaces - Unified Only
export type { IUnifiedAgentRegistry } from './interfaces/IUnifiedAgentRegistry';
export type { IRequestRouter } from './interfaces/IRequestRouter';
export type { IMemoryContextBridge } from './interfaces/IMemoryContextBridge';
export type { IChatInterface } from './interfaces/IChatInterface';

// Type exports for external usage - Unified Architecture
export type {
    RegistrationResult,
    DeregistrationResult,
    AgentEnhancementResult,
    EnhancedAgentConfig,
    TemporaryAgentConfig
} from './interfaces/IUnifiedAgentRegistry';

export type {
    RoutingRule,
    RouteResult
} from './interfaces/IRequestRouter';

// Import the unified implementations
import { UnifiedAgentRegistry } from './UnifiedAgentRegistry';
import { RequestRouter } from './requestRouter';
import { MemoryContextBridge } from './memoryContextBridge';

/**
 * Initialize the complete orchestrator system
 * This function sets up all core components and their dependencies
 */
export async function initializeOrchestrator() {
    console.log('🚀 Initializing OneAgent Level 2 Orchestrator (OURA v3.0)...');
    
    try {        
        // Initialize core components with unified architecture
        const agentRegistry = new UnifiedAgentRegistry();
        await agentRegistry.initialize();
        
        const memoryClient = realUnifiedMemoryClient;
        const memoryBridge = new MemoryContextBridge(memoryClient);
        const requestRouter = new RequestRouter(agentRegistry);
        
        console.log('✅ OURA v3.0 Orchestrator initialized successfully');
        
        return {
            agentRegistry,
            memoryBridge,
            requestRouter
        };
        
    } catch (error) {
        console.error('❌ Failed to initialize OURA v3.0 orchestrator:', error);
        throw error;
    }
}

/**
 * Graceful shutdown of orchestrator components
 */
export async function shutdownOrchestrator() {
    console.log('🛑 Shutting down OneAgent orchestrator...');
    // Add cleanup logic as needed
    console.log('✅ Orchestrator shutdown complete');
}