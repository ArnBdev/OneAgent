/**
 * OneAgent Level 2 Orchestrator
 * Main entry point for the orchestration layer that coordinates all agent interactions
 * 
 * This file serves as the central hub for:
 * - Agent Registry Management
 * - Request Routing and Processing
 * - Memory Context Bridging
 * - Chat Interface Coordination
 */

// Core Orchestrator Components
export { AgentRegistry } from './agentRegistry';
export { RequestRouter } from './requestRouter';
export { MemoryContextBridge } from './memoryContextBridge';

// Orchestrator Interfaces
export type { IAgentRegistry } from './interfaces/IAgentRegistry';
export type { IRequestRouter } from './interfaces/IRequestRouter';
export type { IMemoryContextBridge } from './interfaces/IMemoryContextBridge';
export type { IChatInterface } from './interfaces/IChatInterface';

// Type exports for external usage
export type {
    AgentRegistrationRequest,
    AgentStatus,
    RegistryStatistics,
    AgentHealthCheck
} from './interfaces/IAgentRegistry';

export type {
    RoutingRequest,
    RoutingResult,
    IntentAnalysis,
    ConfidenceScore,
    RoutingContext
} from './interfaces/IRequestRouter';

export type {
    ConversationContext,
    ContextualMemory,
    MemoryBridgeRequest,
    MemoryBridgeResponse,
    ConversationState
} from './interfaces/IMemoryContextBridge';

export type {
    ChatMessage,
    ChatResponse,
    ChatSession,
    MessageType,
    ChatStatus
} from './interfaces/IChatInterface';

/**
 * Initialize the complete orchestrator system
 * This function sets up all core components and their dependencies
 */
export async function initializeOrchestrator() {
    console.log('🚀 Initializing OneAgent Level 2 Orchestrator...');
    
    try {
        // Initialize core components
        const agentRegistry = new AgentRegistry();
        const memoryBridge = new MemoryContextBridge();
        const requestRouter = new RequestRouter(agentRegistry, memoryBridge);
        
        // Verify all components are ready
        await agentRegistry.initialize();
        await memoryBridge.initialize();
        await requestRouter.initialize();
        
        console.log('✅ Orchestrator initialized successfully');
        
        return {
            agentRegistry,
            memoryBridge,
            requestRouter
        };
        
    } catch (error) {
        console.error('❌ Failed to initialize orchestrator:', error);
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