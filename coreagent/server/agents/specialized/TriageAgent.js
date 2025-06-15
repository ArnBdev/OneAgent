"use strict";
/**
 * RealTriageAgent - REAL Task Routing & System Health AI Agent
 *
 * A fully functional BaseAgent implementation with:
 * - Real memory integration for tracking routing decisions
 * - Gemini AI for intelligent task routing and system analysis
 * - Constitutional AI validation
 * - Specialized triage and orchestration expertise
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TriageAgent = void 0;
const BaseAgent_1 = require("../base/BaseAgent");
class TriageAgent extends BaseAgent_1.BaseAgent {
    constructor() {
        const config = {
            id: 'TriageAgent',
            name: 'TriageAgent',
            description: 'AI agent specializing in intelligent task routing, agent health monitoring, and system orchestration',
            capabilities: [
                'task_routing',
                'agent_health_monitoring',
                'priority_assessment',
                'capability_matching',
                'load_balancing',
                'system_optimization',
                'escalation_management',
                'resource_allocation'
            ],
            memoryEnabled: true,
            aiEnabled: true
        };
        const promptConfig = TriageAgent.createTriagePromptConfig();
        super(config, promptConfig);
    }
    /**
     * Process triage and routing related messages
     */
    async processMessage(context, message) {
        try {
            this.validateContext(context);
            // Search for relevant routing patterns in memory
            const relevantMemories = await this.searchMemories(context.user.id, message, 5);
            // Analyze the task/query for routing decisions
            const triageAnalysis = await this.analyzeTaskForTriage(message, relevantMemories, context);
            // Generate AI response with triage expertise
            const response = await this.generateTriageResponse(message, triageAnalysis, relevantMemories, context);
            // Store this routing decision in memory for future reference
            await this.addMemory(context.user.id, `Triage Analysis: ${message}\nRouting Decision: ${JSON.stringify(triageAnalysis)}\nResponse: ${response}`, {
                type: 'triage_decision',
                priority: triageAnalysis.priority,
                recommendedAgent: triageAnalysis.recommendedAgent,
                category: triageAnalysis.category,
                timestamp: new Date().toISOString(),
                sessionId: context.sessionId
            });
            return this.createResponse(response, [], relevantMemories);
        }
        catch (error) {
            console.error('RealTriageAgent: Error processing message:', error);
            return this.createResponse('I apologize, but I encountered an error while analyzing your request for routing. Please try again.', [], []);
        }
    }
    /**
     * Analyze a task to determine optimal routing
     */
    async analyzeTaskForTriage(message, memories, _context) {
        const prompt = `
Analyze this user request for optimal task routing:

Request: "${message}"

Previous routing patterns: ${this.buildRoutingContext(memories)}

Determine:
1. Task category (dev, office, fitness, core, general)
2. Priority level (low, medium, high, urgent)
3. Complexity (simple, medium, complex)
4. Recommended agent(s)
5. Confidence in routing decision (1-10)
6. Alternative agents if primary is unavailable

Respond in JSON format:
{
  "category": "string",
  "priority": "string",
  "complexity": "string", 
  "recommendedAgent": "string",
  "alternativeAgents": ["string"],
  "confidence": number,
  "reasoning": "string"
}
`;
        const aiResponse = await this.generateResponse(prompt, memories);
        try {
            // Extract JSON from response
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        }
        catch (error) {
            console.warn('Failed to parse triage analysis JSON:', error);
        }
        // Fallback analysis
        return this.performFallbackTriage(message);
    }
    /**
     * Generate specialized triage response with AI
     */
    async generateTriageResponse(message, triageAnalysis, memories, _context) {
        const routingContext = this.buildRoutingContext(memories);
        const prompt = `
You are a professional task routing and system orchestration specialist with expertise in:
- Intelligent task analysis and categorization
- Agent capability assessment and matching
- Priority-based routing decisions
- System health monitoring and optimization
- Load balancing and resource allocation
- Escalation path management

Routing Analysis: ${JSON.stringify(triageAnalysis, null, 2)}
Previous routing patterns: ${routingContext}

User query: ${message}

Provide expert routing guidance that includes:
1. Clear explanation of routing decision
2. Recommended agent and reasoning
3. Alternative options if primary agent unavailable
4. Expected timeline and approach
5. Any special considerations or requirements

Be concise but comprehensive in your routing analysis.
`;
        return await this.generateResponse(prompt, memories);
    }
    /**
     * Build routing context from historical decisions
     */
    buildRoutingContext(memories) {
        if (!memories || memories.length === 0) {
            return "No previous routing history available.";
        }
        const routingMemories = memories
            .filter(memory => memory.metadata?.type === 'triage_decision' ||
            memory.content?.toLowerCase().includes('routing') ||
            memory.content?.toLowerCase().includes('agent'))
            .slice(0, 3);
        if (routingMemories.length === 0) {
            return "No relevant routing history found.";
        }
        return routingMemories
            .map(memory => {
            const metadata = memory.metadata || {};
            return `Previous: ${metadata.category || 'unknown'} -> ${metadata.recommendedAgent || 'unknown'} (Priority: ${metadata.priority || 'unknown'})`;
        })
            .join('\n');
    }
    /**
     * Perform fallback triage analysis when AI parsing fails
     */
    performFallbackTriage(message) {
        const messageLower = message.toLowerCase();
        // Simple keyword-based analysis
        let category = 'general';
        let recommendedAgent = 'CoreAgent';
        let priority = 'medium';
        if (messageLower.includes('code') || messageLower.includes('dev') || messageLower.includes('program')) {
            category = 'dev';
            recommendedAgent = 'DevAgent';
        }
        else if (messageLower.includes('document') || messageLower.includes('office') || messageLower.includes('productivity')) {
            category = 'office';
            recommendedAgent = 'OfficeAgent';
        }
        else if (messageLower.includes('fitness') || messageLower.includes('workout') || messageLower.includes('health')) {
            category = 'fitness';
            recommendedAgent = 'FitnessAgent';
        }
        if (messageLower.includes('urgent') || messageLower.includes('critical')) {
            priority = 'urgent';
        }
        else if (messageLower.includes('important') || messageLower.includes('priority')) {
            priority = 'high';
        }
        return {
            category,
            priority,
            complexity: 'medium',
            recommendedAgent,
            alternativeAgents: ['CoreAgent'],
            confidence: 6,
            reasoning: 'Fallback keyword-based analysis used due to AI parsing failure'
        };
    }
    /**
     * Create enhanced prompt configuration for triage expertise
     */
    static createTriagePromptConfig() {
        return { agentPersona: TriageAgent.createTriagePersona(),
            constitutionalPrinciples: TriageAgent.createTriageConstitutionalPrinciples(),
            enabledFrameworks: ['RTF', 'TAG', 'RGC'], // Reasoning, Task, Goals + Resources, Goals, Constraints
            enableCoVe: true, // Enable verification for routing decisions
            enableRAG: true, // Use relevant memory context
            qualityThreshold: 85 // High standard for routing accuracy
        };
    }
    /**
     * Create triage-specialized agent persona
     */
    static createTriagePersona() {
        return {
            role: 'Professional Task Routing & System Orchestration Specialist AI',
            style: 'Analytical, decisive, systematic, and optimization-focused',
            coreStrength: 'Intelligent task analysis and optimal agent routing',
            principles: [
                'Optimal routing based on agent capabilities and availability',
                'Priority-aware task scheduling and resource allocation',
                'System health monitoring and proactive optimization',
                'Clear routing rationale with fallback options',
                'Continuous learning from routing patterns and outcomes',
                'Efficient load balancing across agent network'
            ],
            frameworks: ['RTF', 'TAG', 'RGC']
        };
    }
    /**
     * Create triage-specific constitutional principles
     */
    static createTriageConstitutionalPrinciples() {
        return [
            {
                id: 'optimal_routing',
                name: 'Optimal Agent Routing',
                description: 'Route tasks to the most appropriate agent based on capabilities and availability',
                validationRule: 'Response includes clear routing rationale and agent capability matching',
                severityLevel: 'high'
            },
            {
                id: 'priority_awareness',
                name: 'Priority-Based Scheduling',
                description: 'Respect task priorities and urgency levels in routing decisions',
                validationRule: 'Response considers and respects stated or implied priority levels',
                severityLevel: 'high'
            },
            {
                id: 'fallback_options',
                name: 'Fallback Route Planning',
                description: 'Always provide alternative routing options for resilience',
                validationRule: 'Response includes backup agents or escalation paths',
                severityLevel: 'medium'
            },
            {
                id: 'transparent_reasoning',
                name: 'Transparent Routing Logic',
                description: 'Clearly explain routing decisions and reasoning',
                validationRule: 'Response includes clear explanation of why specific agent was chosen',
                severityLevel: 'high'
            },
            {
                id: 'system_optimization',
                name: 'System-Wide Optimization',
                description: 'Consider overall system health and load balancing',
                validationRule: 'Response considers system-wide impact and optimization',
                severityLevel: 'medium'
            }
        ];
    }
}
exports.TriageAgent = TriageAgent;
