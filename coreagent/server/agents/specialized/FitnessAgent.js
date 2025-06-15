"use strict";
/**
 * RealFitnessAgent - REAL Fitness & Wellness AI Agent
 *
 * A fully functional BaseAgent implementation with:
 * - Real memory integration for tracking progress
 * - Gemini AI for intelligent fitness guidance
 * - Constitutional AI validation
 * - Specialized fitness and wellness expertise
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FitnessAgent = void 0;
const BaseAgent_1 = require("../base/BaseAgent");
class FitnessAgent extends BaseAgent_1.BaseAgent {
    constructor() {
        const config = {
            id: 'FitnessAgent',
            name: 'FitnessAgent',
            description: 'AI agent specializing in fitness tracking, workout planning, nutrition guidance, and wellness coaching',
            capabilities: [
                'workout_planning',
                'nutrition_guidance',
                'fitness_tracking',
                'wellness_coaching',
                'goal_setting',
                'progress_monitoring',
                'recovery_advice',
                'motivation_support'
            ],
            memoryEnabled: true,
            aiEnabled: true
        };
        const promptConfig = FitnessAgent.createFitnessPromptConfig();
        super(config, promptConfig);
    }
    /**
     * Process fitness and wellness related messages
     */
    async processMessage(context, message) {
        try {
            this.validateContext(context);
            // Search for relevant fitness context in memory
            const relevantMemories = await this.searchMemories(context.user.id, message, 5);
            // Generate AI response with fitness expertise
            const response = await this.generateFitnessResponse(message, relevantMemories, context);
            // Store this interaction in memory for future reference
            await this.addMemory(context.user.id, `Fitness Query: ${message}\nResponse: ${response}`, {
                type: 'fitness_consultation',
                category: this.categorizeQuery(message),
                timestamp: new Date().toISOString(),
                sessionId: context.sessionId
            });
            return this.createResponse(response, [], relevantMemories);
        }
        catch (error) {
            console.error('RealFitnessAgent: Error processing message:', error);
            return this.createResponse('I apologize, but I encountered an error while processing your fitness query. Please try again.', [], []);
        }
    }
    /**
     * Generate specialized fitness response with AI
     */
    async generateFitnessResponse(message, memories, context) {
        const fitnessContext = this.buildFitnessContext(memories, context);
        const prompt = `
You are a professional fitness and wellness specialist AI with expertise in:
- Personalized workout planning and exercise science
- Nutrition guidance and meal planning
- Fitness goal setting and progress tracking
- Wellness coaching and lifestyle optimization
- Recovery strategies and injury prevention
- Motivation and behavioral support

Previous context: ${fitnessContext}

User query: ${message}

Provide expert fitness guidance that is:
1. Safe and appropriate for the user's level
2. Evidence-based and scientifically sound
3. Personalized to their goals and preferences
4. Actionable with clear next steps
5. Motivating and supportive

Always recommend consulting healthcare professionals for medical concerns.
`;
        return await this.generateResponse(prompt, memories);
    }
    /**
     * Build fitness-specific context from memories
     */
    buildFitnessContext(memories, _context) {
        if (!memories || memories.length === 0) {
            return "No previous fitness history available.";
        }
        const fitnessMemories = memories
            .filter(memory => memory.metadata?.type === 'fitness_consultation' ||
            memory.content?.toLowerCase().includes('workout') ||
            memory.content?.toLowerCase().includes('exercise') ||
            memory.content?.toLowerCase().includes('nutrition'))
            .slice(0, 3);
        if (fitnessMemories.length === 0) {
            return "No relevant fitness history found.";
        }
        return fitnessMemories
            .map(memory => `Previous: ${memory.content?.substring(0, 200)}...`)
            .join('\n');
    }
    /**
     * Categorize the fitness query for better memory organization
     */
    categorizeQuery(message) {
        const messageLower = message.toLowerCase();
        if (messageLower.includes('workout') || messageLower.includes('exercise') || messageLower.includes('training')) {
            return 'workout_planning';
        }
        if (messageLower.includes('nutrition') || messageLower.includes('diet') || messageLower.includes('meal')) {
            return 'nutrition_guidance';
        }
        if (messageLower.includes('goal') || messageLower.includes('target')) {
            return 'goal_setting';
        }
        if (messageLower.includes('progress') || messageLower.includes('track')) {
            return 'progress_tracking';
        }
        if (messageLower.includes('recovery') || messageLower.includes('rest') || messageLower.includes('sleep')) {
            return 'recovery_advice';
        }
        if (messageLower.includes('motivation') || messageLower.includes('support')) {
            return 'motivation_support';
        }
        return 'general_wellness';
    }
    /**
     * Create enhanced prompt configuration for fitness expertise
     */
    static createFitnessPromptConfig() {
        return { agentPersona: FitnessAgent.createFitnessPersona(),
            constitutionalPrinciples: FitnessAgent.createFitnessConstitutionalPrinciples(),
            enabledFrameworks: ['RTF', 'TAG', 'CARE'], // Reasoning, Task, Goals + Care framework
            enableCoVe: true, // Enable verification for safety-critical fitness advice
            enableRAG: true, // Use relevant memory context
            qualityThreshold: 88 // High standard for fitness/health advice
        };
    }
    /**
     * Create fitness-specialized agent persona
     */
    static createFitnessPersona() {
        return {
            role: 'Professional Fitness & Wellness Specialist AI',
            style: 'Encouraging, knowledgeable, safety-focused, and motivational',
            coreStrength: 'Personalized fitness guidance and wellness coaching',
            principles: [
                'Safety first - always recommend appropriate progression',
                'Evidence-based fitness and nutrition recommendations',
                'Personalized guidance based on individual goals and abilities',
                'Motivational support while being realistic about expectations',
                'Holistic wellness approach including physical and mental health',
                'Always recommend professional consultation for medical concerns'
            ],
            frameworks: ['RTF', 'TAG', 'CARE']
        };
    }
    /**
     * Create fitness-specific constitutional principles
     */
    static createFitnessConstitutionalPrinciples() {
        return [
            {
                id: 'safety_first',
                name: 'Safety-First Fitness Guidance',
                description: 'Always prioritize user safety and recommend appropriate progression',
                validationRule: 'Response includes safety considerations and appropriate difficulty level',
                severityLevel: 'critical'
            },
            {
                id: 'evidence_based',
                name: 'Evidence-Based Recommendations',
                description: 'Provide recommendations based on established fitness science',
                validationRule: 'Response avoids unproven fads and includes scientific rationale',
                severityLevel: 'high'
            },
            {
                id: 'medical_disclaimer',
                name: 'Medical Professional Referral',
                description: 'Always recommend consulting healthcare professionals for medical concerns',
                validationRule: 'Response includes appropriate medical disclaimers when relevant',
                severityLevel: 'critical'
            },
            {
                id: 'personalization',
                name: 'Personalized Guidance',
                description: 'Tailor recommendations to individual capabilities and goals',
                validationRule: 'Response considers user context and individual differences',
                severityLevel: 'high'
            },
            {
                id: 'realistic_expectations',
                name: 'Realistic Expectations',
                description: 'Provide realistic timelines and expectations for fitness goals',
                validationRule: 'Response avoids unrealistic promises or extreme claims',
                severityLevel: 'high'
            }
        ];
    } /**
     * Get fitness agent context with specialized fitness data
     */
    getCurrentContext() {
        const baseContext = super.getCurrentContext();
        // Note: Fitness-specific context handled in memory metadata
        // EnrichedContext properties are read-only from the interface
        return baseContext;
    }
}
exports.FitnessAgent = FitnessAgent;
