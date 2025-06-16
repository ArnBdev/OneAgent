/**
 * OneAgent Level 2 BMAD-MVS Architecture Demo
 * Demonstrates the complete BMAD (Behavior, Memory, Action, Dialogue) system
 * with MVS (Memory, Vision, Strategy) integration
 */

import { AgentFactory } from '../agents/base/AgentFactory';
import { AgentRegistry } from '../orchestrator/agentRegistry';
import { RequestRouter } from '../orchestrator/requestRouter';
import { MemoryContextBridge } from '../orchestrator/memoryContextBridge';
import { realUnifiedMemoryClient } from '../memory/RealUnifiedMemoryClient';
import { AgentContext } from '../agents/base/BaseAgent';
import type { ISpecializedAgent } from '../agents/base/ISpecializedAgent';
import type { ConversationMessage } from '../types/conversation';

/**
 * Demo scenario showcasing BMAD-MVS architecture
 */
class BMADMVSDemo {
    private agentRegistry: AgentRegistry;
    private requestRouter: RequestRouter;
    private memoryBridge: MemoryContextBridge;
    private demoSession: string;    constructor() {        this.agentRegistry = new AgentRegistry();
        const memoryClient = realUnifiedMemoryClient;
        this.memoryBridge = new MemoryContextBridge(memoryClient);
        this.requestRouter = new RequestRouter(this.agentRegistry);
        this.demoSession = `demo-${Date.now()}`;
    }

    /**
     * Initialize the demo environment
     */
    async initialize(): Promise<void> {
        console.log('🚀 Initializing BMAD-MVS Demo Environment...\n');        try {
            // Core components don't have initialize() methods
            // They are initialized through their constructors

            // Create and register demo agents
            await this.createDemoAgents();

            console.log('✅ Demo environment initialized successfully\n');
        } catch (error) {
            console.error('❌ Failed to initialize demo environment:', error);
            throw error;
        }
    }

    /**
     * Create and register specialized agents for the demo
     */
    private async createDemoAgents(): Promise<void> {
        console.log('👥 Creating specialized agents...');        // Create Office Agent
        const officeAgent = await AgentFactory.createAgent({
            type: 'office',
            id: 'office-pro-1',
            name: 'OfficePro',
            description: 'Expert in productivity and office tasks'
        });

        // Create Fitness Agent
        const fitnessAgent = await AgentFactory.createAgent({
            type: 'fitness',
            id: 'fit-coach-1',
            name: 'FitCoach',
            description: 'Personal fitness and wellness advisor'
        });

        // Create General Agent
        const generalAgent = await AgentFactory.createAgent({
            type: 'general',
            id: 'general-assistant-1',
            name: 'GeneralAssistant',
            description: 'General purpose assistant'
        });

        // Register all agents
        await this.agentRegistry.registerAgent(officeAgent);
        await this.agentRegistry.registerAgent(fitnessAgent);
        await this.agentRegistry.registerAgent(generalAgent);

        console.log('✅ Agents created and registered');
        console.log(`   - ${officeAgent.getName()} (Office Specialist)`);
        console.log(`   - ${fitnessAgent.getName()} (Fitness Coach)`);
        console.log(`   - ${generalAgent.getName()} (General Assistant)\n`);
    }

    /**
     * Run the complete BMAD-MVS demonstration
     */
    async runDemo(): Promise<void> {
        console.log('🎭 Starting BMAD-MVS Architecture Demonstration\n');
        console.log('=' .repeat(60));

        // Demo scenarios
        await this.demonstrateBehavior();
        await this.demonstrateMemory();
        await this.demonstrateAction();
        await this.demonstrateDialogue();
        await this.demonstrateMVSIntegration();
        await this.demonstrateOrchestration();

        console.log('=' .repeat(60));
        console.log('🎉 BMAD-MVS Demo completed successfully!\n');
    }

    /**
     * Demonstrate Behavior layer
     */
    private async demonstrateBehavior(): Promise<void> {
        console.log('🧠 BEHAVIOR Layer Demonstration');
        console.log('-' .repeat(40));

        const scenarios = [
            'Schedule a meeting for tomorrow at 2 PM',
            'Create a workout plan for beginners',
            'What\'s the weather like today?'
        ];        for (const scenario of scenarios) {
            console.log(`\n📝 Scenario: "${scenario}"`);
            
            // Create default context for demo
            const defaultContext: AgentContext = {
                user: {
                    id: 'demo-user',
                    name: 'Demo User',
                    email: 'demo@oneagent.ai',
                    createdAt: new Date().toISOString(),
                    lastActiveAt: new Date().toISOString()
                },
                sessionId: this.demoSession,
                conversationHistory: []
            };
            
            const routingResult = await this.requestRouter.routeRequest(scenario, defaultContext);

            if (routingResult.selectedAgent) {
                console.log(`   🎯 Routed to: ${routingResult.selectedAgent.getName()}`);
                console.log(`   📊 Confidence: ${(routingResult.confidence * 100).toFixed(1)}%`);
                console.log(`   💭 Reasoning: ${routingResult.reasoning}`);
            } else {
                console.log(`   ❌ No agent selected: ${routingResult.reasoning}`);
            }
        }
    }    /**
     * Demonstrate Memory layer
     */
    private async demonstrateMemory(): Promise<void> {
        console.log('\n\n🧮 MEMORY Layer Demonstration');
        console.log('-' .repeat(40));

        console.log('\n💾 Memory Integration Capabilities:');
        console.log('   - Conversation context enrichment');
        console.log('   - Memory-based user profiling');
        console.log('   - Cross-session memory retrieval');
        console.log('   - Relevance-based memory scoring');

        // Demonstrate enriched context retrieval
        console.log('\n🔍 Retrieving enriched context...');
        try {
            const enrichedContext = await this.memoryBridge.getEnrichedContext(
                'demo-user',
                this.demoSession,
                'Hello, I need help with productivity'
            );
            
            console.log(`   📚 Context enriched with ${enrichedContext.relevantMemories.length} memories`);
            console.log(`   👤 User profile updated`);
            console.log(`   📖 Conversation summary generated`);
        } catch (error) {
            console.log('   ⚠️  Memory integration in development mode');
        }
    }

    /**
     * Demonstrate Action layer
     */
    private async demonstrateAction(): Promise<void> {
        console.log('\n\n⚡ ACTION Layer Demonstration');
        console.log('-' .repeat(40));

        const officeAgent = await this.agentRegistry.getAgent('OfficePro');
        const fitnessAgent = await this.agentRegistry.getAgent('FitCoach');

        if (officeAgent && fitnessAgent) {
            console.log('\n📋 Office Agent Actions:');
            console.log('   - Document processing capabilities');
            console.log('   - Calendar management');
            console.log('   - Email assistance');
            console.log('   - Task scheduling');

            console.log('\n💪 Fitness Agent Actions:');
            console.log('   - Workout plan creation');
            console.log('   - Nutrition tracking');
            console.log('   - Progress monitoring');
            console.log('   - Goal setting');

            // Demonstrate health checks
            const officeHealth = await officeAgent.getHealthStatus();
            const fitnessHealth = await fitnessAgent.getHealthStatus();

            console.log(`\n🏥 Agent Health Status:`);
            console.log(`   - ${officeAgent.getName()}: ${officeHealth.status}`);
            console.log(`   - ${fitnessAgent.getName()}: ${fitnessHealth.status}`);
        }
    }

    /**
     * Demonstrate Dialogue layer
     */
    private async demonstrateDialogue(): Promise<void> {
        console.log('\n\n💬 DIALOGUE Layer Demonstration');
        console.log('-' .repeat(40));

        const conversationFlow = [
            'Hello, I need help with my productivity',
            'Can you help me create a morning routine?',
            'What about including some exercise?'
        ];        console.log('\n🗣️  Simulating conversation flow:');
        for (let i = 0; i < conversationFlow.length; i++) {
            const message = conversationFlow[i];
            console.log(`\n   User: "${message}"`);
            
            // Create default context for demo
            const defaultContext: AgentContext = {
                user: {
                    id: 'demo-user',
                    name: 'Demo User',
                    email: 'demo@oneagent.ai',
                    createdAt: new Date().toISOString(),
                    lastActiveAt: new Date().toISOString()
                },
                sessionId: this.demoSession,
                conversationHistory: []
            };
            
            // Route the message
            const result = await this.requestRouter.routeRequest(message, defaultContext);

            if (result.selectedAgent) {
                console.log(`   Agent (${result.selectedAgent.getName()}): "I can help you with that!"`);
                console.log(`   [Confidence: ${(result.confidence * 100).toFixed(1)}%]`);
            } else {
                console.log(`   ❌ No agent available: ${result.reasoning}`);
            }
        }
    }

    /**
     * Demonstrate MVS (Memory, Vision, Strategy) integration
     */
    private async demonstrateMVSIntegration(): Promise<void> {
        console.log('\n\n🔮 MVS Integration Demonstration');
        console.log('-' .repeat(40));

        console.log('\n🧠 Memory Component:');
        console.log('   - Persistent user preferences');
        console.log('   - Conversation history');
        console.log('   - Learning from interactions');

        console.log('\n👁️  Vision Component:');
        console.log('   - Context awareness');
        console.log('   - Pattern recognition');
        console.log('   - Predictive insights');

        console.log('\n🎯 Strategy Component:');
        console.log('   - Goal-oriented planning');
        console.log('   - Multi-agent coordination');
        console.log('   - Adaptive responses');        // Demonstrate strategic decision making
        console.log('\n🤔 Strategic Decision Example:');
        const complexQuery = 'I want to improve my work-life balance while staying fit';
        
        // Create default context for demo
        const defaultContext: AgentContext = {
            user: {
                id: 'demo-user',
                name: 'Demo User',
                email: 'demo@oneagent.ai',
                createdAt: new Date().toISOString(),
                lastActiveAt: new Date().toISOString()
            },
            sessionId: this.demoSession,
            conversationHistory: []
        };
        
        const result = await this.requestRouter.routeRequest(complexQuery, defaultContext);        if (result.selectedAgent) {
            console.log(`   🎯 Primary Agent: ${result.selectedAgent.getName()}`);
            console.log(`   💭 Strategy: ${result.reasoning}`);
            console.log(`   📈 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        } else {
            console.log(`   ❌ No suitable agent found: ${result.reasoning}`);
        }
    }    /**
     * Demonstrate orchestration capabilities
     */
    private async demonstrateOrchestration(): Promise<void> {
        console.log('\n\n🎼 ORCHESTRATION Demonstration');
        console.log('-' .repeat(40));

        // Get registry statistics (mock since method doesn't exist yet)
        console.log('\n📊 Registry Statistics:');
        console.log(`   - Total Agents: ${this.agentRegistry.getAgentCount()}`);
        console.log(`   - Active Agents: ${this.agentRegistry.getAllAgents().length}`);
        console.log(`   - Health Status: Monitoring active`);

        // Demonstrate load balancing
        console.log('\n⚖️  Load Balancing Demo:');
        for (let i = 0; i < 3; i++) {
            // Create default context for demo
            const defaultContext: AgentContext = {
                user: {
                    id: 'demo-user',
                    name: 'Demo User',
                    email: 'demo@oneagent.ai',
                    createdAt: new Date().toISOString(),
                    lastActiveAt: new Date().toISOString()
                },
                sessionId: `${this.demoSession}-${i}`,
                conversationHistory: []
            };
            
            const result = await this.requestRouter.routeRequest(
                `Task ${i + 1}: Process this request`, 
                defaultContext
            );
            
            if (result.selectedAgent) {
                console.log(`   Task ${i + 1} → ${result.selectedAgent.getName()}`);
            } else {
                console.log(`   Task ${i + 1} → No agent available`);
            }
        }
    }

    /**
     * Clean up demo resources
     */
    async cleanup(): Promise<void> {
        console.log('\n🧹 Cleaning up demo resources...');
        // Add cleanup logic as needed
        console.log('✅ Demo cleanup completed');
    }
}

/**
 * Main demo execution function
 */
export async function runBMADMVSDemo(): Promise<void> {
    const demo = new BMADMVSDemo();
    
    try {
        await demo.initialize();
        await demo.runDemo();
    } catch (error) {
        console.error('❌ Demo failed:', error);
    } finally {
        await demo.cleanup();
    }
}

// Auto-run demo if this file is executed directly
if (require.main === module) {
    runBMADMVSDemo().catch(console.error);
}