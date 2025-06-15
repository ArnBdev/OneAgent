"use strict";
/**
 * AgentFactory - Factory for creating specialized agents
 *
 * This factory provides a centralized way to create and configure
 * different types of specialized agents in the OneAgent ecosystem.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentFactory = void 0;
const OfficeAgent_1 = require("../specialized/OfficeAgent");
const FitnessAgent_1 = require("../specialized/FitnessAgent");
const DevAgent_1 = require("../specialized/DevAgent");
const CoreAgent_1 = require("../specialized/CoreAgent");
const TemplateAgent_1 = require("../templates/TemplateAgent");
class AgentFactory {
    /**
     * Create a specialized agent based on type and configuration
     */
    static async createAgent(factoryConfig) {
        const agentConfig = {
            id: factoryConfig.id,
            name: factoryConfig.name,
            description: factoryConfig.description || `${factoryConfig.type} agent`,
            capabilities: factoryConfig.customCapabilities || AgentFactory.DEFAULT_CAPABILITIES[factoryConfig.type],
            memoryEnabled: factoryConfig.memoryEnabled ?? true,
            aiEnabled: factoryConfig.aiEnabled ?? true
        };
        let agent;
        switch (factoryConfig.type) {
            case 'core':
                // CoreAgent - System coordination and integration hub
                agent = new CoreAgent_1.CoreAgent({
                    ...agentConfig,
                    capabilities: [
                        ...agentConfig.capabilities,
                        'system_coordination',
                        'agent_integration',
                        'service_management',
                        'health_monitoring',
                        'resource_allocation',
                        'security_management',
                        'rise_plus_methodology'
                    ]
                });
                break;
            case 'enhanced-development':
                // Enhanced development agent with Advanced Prompt Engineering
                agent = new DevAgent_1.DevAgent({
                    ...agentConfig,
                    capabilities: [
                        ...agentConfig.capabilities,
                        'advanced_prompting',
                        'constitutional_ai',
                        'bmad_elicitation',
                        'quality_validation'
                    ]
                });
                break;
            case 'development':
                agent = new DevAgent_1.DevAgent(agentConfig);
                break;
            case 'office':
                agent = new OfficeAgent_1.OfficeAgent(agentConfig);
                break;
            case 'fitness':
                agent = new FitnessAgent_1.FitnessAgent(agentConfig);
                break;
            case 'template':
                agent = new TemplateAgent_1.TemplateAgent(agentConfig);
                break;
            default:
                throw new Error(`Unknown agent type: ${factoryConfig.type}`);
        }
        await agent.initialize();
        return agent;
    }
    /**
     * Get default capabilities for an agent type
     */
    static getDefaultCapabilities(type) {
        return [...AgentFactory.DEFAULT_CAPABILITIES[type]];
    }
    /**
     * Get available agent types
     */
    static getAvailableTypes() {
        return Object.keys(AgentFactory.DEFAULT_CAPABILITIES);
    }
    /**
     * Validate agent factory configuration
     */
    static validateConfig(config) {
        if (!config.id || !config.name || !config.type) {
            throw new Error('Agent factory config must include id, name, and type');
        }
        if (!AgentFactory.DEFAULT_CAPABILITIES[config.type]) {
            throw new Error(`Unsupported agent type: ${config.type}`);
        }
    }
    /**
     * Create multiple agents from configurations
     */
    static async createAgents(configs) {
        const agents = [];
        for (const config of configs) {
            try {
                const agent = await AgentFactory.createAgent(config);
                agents.push(agent);
            }
            catch (error) {
                console.error(`Failed to create agent ${config.id}:`, error);
                throw error;
            }
        }
        return agents;
    }
}
exports.AgentFactory = AgentFactory;
AgentFactory.DEFAULT_CAPABILITIES = {
    'core': ['system_coordination', 'agent_integration', 'service_management', 'health_monitoring', 'resource_allocation', 'security_management', 'rise_plus_methodology', 'constitutional_ai', 'quality_validation', 'advanced_prompting', 'bmad_analysis', 'chain_of_verification'],
    'enhanced-development': ['advanced_prompting', 'constitutional_ai', 'bmad_elicitation', 'chain_of_verification', 'quality_validation', 'self_correction', 'adaptive_prompting', 'code_analysis', 'test_generation', 'documentation_sync', 'refactoring'],
    'development': ['code_analysis', 'test_generation', 'documentation_sync', 'refactoring', 'performance_optimization', 'security_scanning', 'git_workflow', 'dependency_management'],
    office: ['document_processing', 'calendar_management', 'email_assistance', 'task_organization'],
    fitness: ['workout_planning', 'nutrition_tracking', 'progress_monitoring', 'goal_setting'],
    general: ['conversation', 'information_retrieval', 'task_assistance'],
    coach: ['goal_setting', 'progress_tracking', 'motivation', 'feedback'],
    advisor: ['analysis', 'recommendations', 'strategic_planning', 'consultation'],
    template: ['unified_memory', 'multi_agent_coordination', 'constitutional_ai', 'bmad_analysis', 'quality_scoring', 'time_awareness', 'comprehensive_error_handling', 'extensible_design', 'best_practices']
};
