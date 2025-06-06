/**
 * OneAgent Level 2 BMAD-MVS Architecture Demo
 * Demonstrates the complete BMAD (Behavior, Memory, Action, Dialogue) system
 * with MVS (Memory, Vision, Strategy) integration
 */

import { AgentFactory } from '../agents/base/AgentFactory';
import { AgentRegistry } from '../orchestrator/agentRegistry';
import { RequestRouter } from '../orchestrator/requestRouter';
import { MemoryContextBridge } from '../orchestrator/memoryContextBridge';
import type { ISpecializedAgent } from '../agents/base/ISpecializedAgent';
import type { ConversationMessage } from '../types/conversation';

/**
 * Demo scenario showcasing BMAD-MVS architecture
 */
class BMADMVSDemo {
    private agentRegistry: AgentRegistry;
    private requestRouter: RequestRouter;
    private memoryBridge: MemoryContextBridge;
    private demoSession: string;

    constructor() {
        this.agentRegistry = new AgentRegistry();
        this.memoryBridge = new MemoryContextBridge();
        this.requestRouter = new RequestRouter(this.agentRegistry, this.memoryBridge);
        this.demoSession = `demo-${Date.now()}`;
    }

    /**
     * Initialize the demo environment
     */
    async initialize(): Promise<void> {
        console.log('🚀 Initializing BMAD-MVS Demo Environment...\n');

        try {
            // Initialize core components
            await this.agentRegistry.initialize();
            await this.memoryBridge.initialize();
            await this.requestRouter.initialize();

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
        console.log('👥 Creating specialized agents...');

        // Create Office Agent
        const officeAgent = await AgentFactory.createAgent('office', {
            name: 'OfficePro',
            description: 'Expert in productivity and office tasks'
        });

        // Create Fitness Agent
        const fitnessAgent = await AgentFactory.createAgent('fitness', {
            name: 'FitCoach',
            description: 'Personal fitness and wellness advisor'
        });

        // Create General Agent
        const generalAgent = await AgentFactory.createAgent('general', {
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
        ];

        for (const scenario of scenarios) {
            console.log(`\n📝 Scenario: "${scenario}"`);
            
            const routingResult = await this.requestRouter.routeRequest({
                content: scenario,
                sessionId: this.demoSession,
                userId: 'demo-user',
                timestamp: new Date(),
                context: {
                    urgency: 'medium',
                    tags: ['demo'],
                    goals: ['demonstrate-routing'],
                    constraints: [],
                    preferences: {
                        communicationStyle: 'professional',
                        responseLength: 'moderate',
                        expertise: 'intermediate',
                        notifications: true,
                        memoryRetention: 'session'
                    }
                }
            });

            console.log(`   🎯 Routed to: ${routingResult.selectedAgent.getName()}`);
            console.log(`   📊 Confidence: ${(routingResult.confidence * 100).toFixed(1)}%`);
            console.log(`   🔍 Intent: ${routingResult.analysis.primaryIntent}`);
        }
    }

    /**
     * Demonstrate Memory layer
     */
    private async demonstrateMemory(): Promise<void> {
        console.log('\n\n🧮 MEMORY Layer Demonstration');
        console.log('-' .repeat(40));

        // Store some demo memories
        const memoryItems = [
            { key: 'user_name', value: 'Demo User', category: 'personal' },
            { key: 'preferred_meeting_time', value: '2 PM', category: 'preferences' },
            { key: 'fitness_goal', value: 'lose 10 pounds', category: 'goals' }
        ];

        console.log('\n💾 Storing memories...');
        for (const item of memoryItems) {
            await this.memoryBridge.storeMemory(this.demoSession, item.key, item.value, {
                category: item.category,
                importance: 0.8,
                timestamp: new Date()
            });
            console.log(`   ✅ Stored: ${item.key} = ${item.value}`);
        }

        // Retrieve contextual memories
        console.log('\n🔍 Retrieving contextual memories...');
        const context = await this.memoryBridge.getConversationContext(this.demoSession);
        console.log(`   📚 Context items: ${context.memories.length}`);
        console.log(`   🏷️  Tags: ${context.tags.join(', ')}`);
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
        ];

        console.log('\n🗣️  Simulating conversation flow:');
        for (let i = 0; i < conversationFlow.length; i++) {
            const message = conversationFlow[i];
            console.log(`\n   User: "${message}"`);
            
            // Route the message
            const result = await this.requestRouter.routeRequest({
                content: message,
                sessionId: this.demoSession,
                userId: 'demo-user',
                timestamp: new Date(),
                context: {
                    urgency: 'medium',
                    tags: ['conversation', 'demo'],
                    goals: ['help-user'],
                    constraints: [],
                    preferences: {
                        communicationStyle: 'friendly',
                        responseLength: 'moderate',
                        expertise: 'intermediate',
                        notifications: true,
                        memoryRetention: 'session'
                    }
                }
            });

            console.log(`   Agent (${result.selectedAgent.getName()}): "I can help you with that!"`);
            console.log(`   [Confidence: ${(result.confidence * 100).toFixed(1)}%]`);
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
        console.log('   - Adaptive responses');

        // Demonstrate strategic decision making
        console.log('\n🤔 Strategic Decision Example:');
        const complexQuery = 'I want to improve my work-life balance while staying fit';
        
        const result = await this.requestRouter.routeRequest({
            content: complexQuery,
            sessionId: this.demoSession,
            userId: 'demo-user',
            timestamp: new Date(),
            context: {
                urgency: 'high',
                tags: ['complex', 'multi-domain'],
                goals: ['work-life-balance', 'fitness'],
                constraints: ['limited-time'],
                preferences: {
                    communicationStyle: 'professional',
                    responseLength: 'detailed',
                    expertise: 'intermediate',
                    notifications: true,
                    memoryRetention: 'permanent'
                }
            }
        });

        console.log(`   🎯 Primary Agent: ${result.selectedAgent.getName()}`);
        console.log(`   🤝 Collaboration Potential: ${result.analysis.collaborationPotential ? 'Yes' : 'No'}`);
        console.log(`   📈 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    }

    /**
     * Demonstrate orchestration capabilities
     */
    private async demonstrateOrchestration(): Promise<void> {
        console.log('\n\n🎼 ORCHESTRATION Demonstration');
        console.log('-' .repeat(40));

        // Get registry statistics
        const stats = await this.agentRegistry.getStatistics();
        console.log('\n📊 Registry Statistics:');
        console.log(`   - Total Agents: ${stats.totalAgents}`);
        console.log(`   - Active Agents: ${stats.activeAgents}`);
        console.log(`   - Specialized Agents: ${stats.specializedAgents}`);
        console.log(`   - Average Health: ${(stats.averageHealth * 100).toFixed(1)}%`);

        // Demonstrate load balancing
        console.log('\n⚖️  Load Balancing Demo:');
        for (let i = 0; i < 3; i++) {
            const result = await this.requestRouter.routeRequest({
                content: `Task ${i + 1}: Process this request`,
                sessionId: `${this.demoSession}-${i}`,
                userId: 'demo-user',
                timestamp: new Date(),
                context: {
                    urgency: 'medium',
                    tags: ['load-test'],
                    goals: ['demonstrate-balancing'],
                    constraints: [],
                    preferences: {
                        communicationStyle: 'professional',
                        responseLength: 'brief',
                        expertise: 'intermediate',
                        notifications: false,
                        memoryRetention: 'session'
                    }
                }
            });
            console.log(`   Task ${i + 1} → ${result.selectedAgent.getName()}`);
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