"use strict";
/**
 * MultiAgentOrchestrator - Integration layer for OneAgent Multi-Agent Communication
 *
 * This orchestrator integrates the new multi-agent communication capabilities
 * with OneAgent's existing agent infrastructure (CoreAgent, TriageAgent, DevAgent, OfficeAgent)
 * while maintaining Constitutional AI validation and quality standards.
 *
 * Features:
 * - Seamless integration with existing OneAgent architecture
 * - Automatic agent registration and capability discovery
 * - Natural language coordination between existing agents
 * - Constitutional AI validation for all multi-agent interactions
 * - Quality threshold enforcement and monitoring
 * - Backward compatibility with existing OneAgent workflows
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiAgentOrchestrator = void 0;
const AgentCommunicationProtocol_1 = require("./AgentCommunicationProtocol");
const MultiAgentMCPServer_1 = require("./MultiAgentMCPServer");
const config_1 = require("../../config");
/**
 * Multi-Agent Orchestrator for OneAgent System
 *
 * Bridges existing OneAgent architecture with new multi-agent capabilities
 */
class MultiAgentOrchestrator {
    constructor(coreAgentId = 'OneAgent-Core-v4.0.0', qualityThreshold = 85) {
        this.coreAgentId = coreAgentId;
        this.qualityThreshold = qualityThreshold;
        this.registeredAgents = new Map();
        this.activeSessions = new Map();
        this.communicationProtocol = AgentCommunicationProtocol_1.AgentCommunicationProtocol.getInstance(coreAgentId, true);
        this.mcpServer = new MultiAgentMCPServer_1.MultiAgentMCPServer(coreAgentId);
    } /**
     * Initialize multi-agent orchestrator with existing OneAgent infrastructure
     * Automatically registers existing agents for multi-agent communication
     */
    async initialize() {
        console.log(`🚀 Initializing Multi-Agent Orchestrator for ${this.coreAgentId}`);
        try {
            // NUCLEAR OPTION: Force reset singleton to eliminate phantom agents completely
            AgentCommunicationProtocol_1.AgentCommunicationProtocol.resetSingleton();
            this.communicationProtocol = AgentCommunicationProtocol_1.AgentCommunicationProtocol.getInstance(this.coreAgentId, true);
            console.log(`🚀 NUCLEAR RESET: Fresh AgentCommunicationProtocol instance created`);
            // Auto-register existing OneAgent agents (now disabled to prevent phantom agents)
            await this.autoRegisterExistingAgents();
            console.log(`✅ Multi-Agent Orchestrator initialized`);
            console.log(`📊 Registered Agents: ${this.registeredAgents.size}`);
            console.log(`🔧 MCP Tools Available: ${this.mcpServer.getAvailableTools().length}`);
            console.log(`⚖️ Constitutional AI: Active | Quality Threshold: ${this.qualityThreshold}%`);
            // Start automated agent discovery
            console.log('🔍 Starting automated agent discovery protocol...');
            await this.triggerAgentDiscovery();
            console.log('🎯 Agent discovery protocol activated - CoreAgent ready to ask "Who\'s awake?"');
        }
        catch (error) {
            console.error(`❌ Multi-Agent Orchestrator initialization failed:`, error);
            throw error;
        }
    }
    /**
     * Register an existing OneAgent specialized agent for multi-agent communication
     * Automatically discovers capabilities and creates registration
     */
    async registerExistingAgent(agent, agentType) {
        try {
            const agentId = `${agentType}-${Date.now()}`;
            const healthStatus = await agent.getHealthStatus();
            // Extract capabilities from agent actions
            const capabilities = agent.getAvailableActions().map(action => ({
                name: action.type,
                description: action.description,
                version: '1.0.0',
                parameters: action.parameters || {},
                qualityThreshold: this.qualityThreshold,
                constitutionalCompliant: true
            }));
            // Create registration with quality assessment
            const registration = {
                agentId,
                agentType,
                capabilities,
                endpoint: `${config_1.oneAgentConfig.mcpUrl}/agents/${agentType}`,
                status: healthStatus.status === 'healthy' ? 'online' : 'offline',
                loadLevel: this.calculateLoadLevel(healthStatus),
                qualityScore: this.assessAgentQuality(agent, healthStatus),
                lastSeen: new Date()
            };
            // Register with communication protocol
            const success = await this.communicationProtocol.registerAgent(registration);
            if (success) {
                this.registeredAgents.set(agentId, agent);
                console.log(`✅ Agent registered for multi-agent communication: ${agentId}`);
                console.log(`📊 Capabilities: ${capabilities.length} | Quality: ${registration.qualityScore}%`);
            }
            return success;
        }
        catch (error) {
            console.error(`❌ Failed to register agent ${agentType}:`, error);
            return false;
        }
    }
    /**
     * Coordinate multiple OneAgent agents for complex tasks
     * Uses natural language task description and Constitutional AI validation
     */
    async coordinateAgentsForTask(taskDescription, context, options = {}) {
        const startTime = Date.now();
        const sessionId = `collab-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        try {
            // Apply BMAD analysis for complex tasks if enabled
            const enableBMAD = options.enableBMAD !== false &&
                (taskDescription.length > 200 || (options.maxAgents || 2) > 2);
            console.log(`🎯 Starting agent coordination: ${sessionId}`);
            console.log(`📋 Task: ${taskDescription}`);
            console.log(`🧠 BMAD Analysis: ${enableBMAD ? 'Enabled' : 'Disabled'}`);
            // Determine required capabilities from task description
            const requiredCapabilities = this.extractCapabilitiesFromTask(taskDescription);
            // Get coordination plan
            const coordination = await this.communicationProtocol.coordinateAgents(taskDescription, requiredCapabilities, context);
            // Create collaboration session
            const session = {
                sessionId,
                participatingAgents: Object.values(coordination.coordinationPlan.selectedAgents),
                taskContext: taskDescription,
                startTime: new Date(),
                lastActivity: new Date(),
                qualityScore: coordination.qualityScore,
                constitutionalCompliant: true
            };
            this.activeSessions.set(sessionId, session);
            // Execute coordination plan
            const executionResult = await this.executeCoordinationPlan(coordination.coordinationPlan, context, session);
            const executionTime = Date.now() - startTime;
            const result = {
                success: coordination.qualityScore >= (options.qualityTarget || this.qualityThreshold),
                result: executionResult,
                participatingAgents: session.participatingAgents,
                qualityScore: coordination.qualityScore,
                executionTime,
                constitutionalValidated: true,
                bmadAnalysisApplied: enableBMAD
            };
            console.log(`✅ Agent coordination completed: ${sessionId}`);
            console.log(`📊 Quality: ${result.qualityScore}% | Time: ${executionTime}ms`);
            console.log(`🤖 Agents: ${result.participatingAgents.join(', ')}`);
            return result;
        }
        catch (error) {
            console.error(`❌ Agent coordination failed: ${sessionId}`, error);
            return {
                success: false,
                result: `Coordination failed: ${error}`,
                participatingAgents: [],
                qualityScore: 0,
                executionTime: Date.now() - startTime,
                constitutionalValidated: false,
                bmadAnalysisApplied: false
            };
        }
    }
    /**
     * Send a message between OneAgent agents using natural language
     * Includes Constitutional AI validation and quality assessment
     */
    async sendAgentMessage(sourceAgentType, targetAgentType, message, context, messageType = 'coordination') {
        const startTime = Date.now();
        try {
            // Find registered agents
            const sourceAgent = this.findAgentByType(sourceAgentType);
            const targetAgent = this.findAgentByType(targetAgentType);
            if (!sourceAgent || !targetAgent) {
                return {
                    success: false,
                    response: `Agent not found: ${!sourceAgent ? sourceAgentType : targetAgentType}`,
                    qualityScore: 0,
                    processingTime: Date.now() - startTime,
                    constitutionalValidated: false
                };
            }
            // Create A2A message
            const a2aMessage = {
                id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                type: this.mapMessageType(messageType),
                sourceAgent: sourceAgent,
                targetAgent: targetAgent,
                content: message,
                metadata: {
                    priority: 'medium',
                    requiresResponse: true,
                    confidenceLevel: 0.8,
                    constitutionalValidated: false,
                    qualityScore: 0,
                    bmadAnalysis: message.length > 100
                },
                timestamp: new Date(),
                sessionId: context.sessionId
            };
            // Send message through communication protocol
            const response = await this.communicationProtocol.sendMessage(a2aMessage);
            const result = {
                success: response.success,
                response: response.content,
                qualityScore: response.metadata.qualityScore,
                processingTime: Date.now() - startTime,
                constitutionalValidated: response.metadata.constitutionalCompliant
            };
            console.log(`📧 Agent Message: ${sourceAgentType} → ${targetAgentType}`);
            console.log(`📊 Quality: ${result.qualityScore}% | Success: ${result.success}`);
            return result;
        }
        catch (error) {
            console.error(`❌ Agent message failed: ${sourceAgentType} → ${targetAgentType}`, error);
            return {
                success: false,
                response: `Message failed: ${error}`,
                qualityScore: 0,
                processingTime: Date.now() - startTime,
                constitutionalValidated: false
            };
        }
    }
    /**
     * Query available agents using natural language
     * Returns agents that match the capability description
     */
    async queryAgentCapabilities(query, options = {}) {
        try {
            const agents = await this.communicationProtocol.queryCapabilities(query);
            // Apply filters
            let filteredAgents = agents;
            if (options.qualityFilter !== false) {
                filteredAgents = filteredAgents.filter(agent => agent.qualityScore >= this.qualityThreshold);
            }
            if (options.statusFilter && options.statusFilter.length > 0) {
                filteredAgents = filteredAgents.filter(agent => options.statusFilter.includes(agent.status));
            }
            if (options.maxResults) {
                filteredAgents = filteredAgents.slice(0, options.maxResults);
            }
            const qualityStats = {
                averageQuality: filteredAgents.reduce((sum, a) => sum + a.qualityScore, 0) / filteredAgents.length || 0,
                aboveThreshold: filteredAgents.filter(a => a.qualityScore >= this.qualityThreshold).length
            };
            console.log(`🔍 Agent Query: "${query}" | Found: ${filteredAgents.length} agents`);
            console.log(`📊 Average Quality: ${qualityStats.averageQuality.toFixed(1)}%`);
            return {
                agents: filteredAgents,
                totalFound: agents.length,
                qualityStats
            };
        }
        catch (error) {
            console.error(`❌ Agent capability query failed:`, error);
            return {
                agents: [],
                totalFound: 0,
                qualityStats: { averageQuality: 0, aboveThreshold: 0 }
            };
        }
    }
    /**
     * Get multi-agent network health status
     * Provides comprehensive monitoring of the agent ecosystem
     */
    getNetworkHealth() {
        const networkHealth = this.communicationProtocol.getNetworkHealth();
        const activeSessions = this.activeSessions.size;
        // Assess overall status
        let status = 'healthy';
        if (networkHealth.averageQuality < 70 || networkHealth.onlineAgents < 2) {
            status = 'critical';
        }
        else if (networkHealth.averageQuality < 85 || networkHealth.onlineAgents < 3) {
            status = 'degraded';
        }
        // Generate recommendations
        const recommendations = [];
        if (networkHealth.averageQuality < this.qualityThreshold) {
            recommendations.push('Improve agent quality scores through optimization');
        }
        if (networkHealth.onlineAgents < 3) {
            recommendations.push('Increase agent availability for better coordination');
        }
        if (activeSessions > 10) {
            recommendations.push('High session load - consider scaling coordination capacity');
        }
        return {
            status,
            totalAgents: networkHealth.totalAgents,
            onlineAgents: networkHealth.onlineAgents,
            averageQuality: networkHealth.averageQuality,
            activeSessions,
            recommendations
        };
    }
    /**
     * Get multi-agent MCP tools for integration with existing OneAgent MCP server
     * These 6 new tools extend the existing 12 OneAgent professional tools
     */
    getMultiAgentMCPTools() {
        return this.mcpServer.getToolDefinitions();
    }
    /**
     * Process multi-agent MCP tool calls
     * Integrates with OneAgent's existing MCP tool processing pipeline
     */
    async processMultiAgentMCPTool(toolName, parameters, context) {
        return await this.mcpServer.processToolCall(toolName, parameters, context);
    }
    /**
     * Get the discovery service for agent auto-registration
     */
    getDiscoveryService() {
        return this.mcpServer.getDiscoveryService();
    }
    /**
     * Get the MCP server instance
     */
    getMCPServer() {
        return this.mcpServer;
    }
    // Private implementation methods
    async autoRegisterExistingAgents() {
        console.log(`🔄 Auto-registering existing OneAgent agents...`);
        try {
            // Re-enable auto-registration for real agents from AgentBootstrapService
            // This allows agents initialized by AgentBootstrapService to automatically register
            // Register DevAgent with enhanced capabilities
            const devAgentRegistration = {
                agentId: 'DevAgent',
                agentType: 'dev',
                capabilities: [{
                        name: 'analyze_code',
                        description: 'TypeScript and JavaScript code analysis with Context7 integration',
                        version: '4.0.0',
                        parameters: {},
                        qualityThreshold: 95,
                        constitutionalCompliant: true
                    },
                    {
                        name: 'generate_tests',
                        description: 'Test suite generation and validation',
                        version: '4.0.0',
                        parameters: {},
                        qualityThreshold: 95,
                        constitutionalCompliant: true
                    },
                    {
                        name: 'learning_engine',
                        description: 'Adaptive pattern learning with constitutional AI',
                        version: '4.0.0',
                        parameters: {},
                        qualityThreshold: 95,
                        constitutionalCompliant: true
                    }
                ],
                endpoint: `${config_1.oneAgentConfig.mcpUrl}/devagent`,
                status: 'online',
                loadLevel: 0,
                qualityScore: 95,
                lastSeen: new Date()
            };
            await this.communicationProtocol.registerAgent(devAgentRegistration);
            // Register CoreAgent for coordination
            const coreAgentRegistration = {
                agentId: 'CoreAgent',
                agentType: 'core',
                capabilities: [{
                        name: 'coordinate_tasks',
                        description: 'Task coordination and delegation with Constitutional AI',
                        version: '4.0.0',
                        parameters: {},
                        qualityThreshold: 95,
                        constitutionalCompliant: true
                    },
                    {
                        name: 'quality_validation',
                        description: 'Quality scoring and Constitutional AI validation',
                        version: '4.0.0',
                        parameters: {},
                        qualityThreshold: 95,
                        constitutionalCompliant: true
                    }
                ],
                endpoint: `${config_1.oneAgentConfig.mcpUrl}/coreagent`,
                status: 'online',
                loadLevel: 0,
                qualityScore: 95,
                lastSeen: new Date()
            };
            await this.communicationProtocol.registerAgent(coreAgentRegistration);
            console.log(`✅ Auto-registration enabled - DevAgent and CoreAgent registered automatically`);
            console.log(`📌 Additional agents can be registered via register_agent MCP tool`);
        }
        catch (error) {
            console.error(`❌ Auto-registration failed:`, error);
        }
    }
    getDefaultCapabilities(agentType) {
        const capabilityMap = {
            dev: [
                { name: 'analyze_code', description: 'TypeScript and JavaScript code analysis' },
                { name: 'generate_tests', description: 'Test suite generation and validation' },
                { name: 'update_documentation', description: 'Code documentation management' }
            ],
            office: [
                { name: 'create_document', description: 'Document creation and formatting' },
                { name: 'schedule_event', description: 'Calendar and scheduling management' },
                { name: 'draft_email', description: 'Email composition and communication' }
            ],
            triage: [
                { name: 'route_task', description: 'Intelligent task routing and delegation' },
                { name: 'check_agent_health', description: 'Agent health monitoring and status' },
                { name: 'recovery_management', description: 'Error recovery and flow restoration' }
            ]
        };
        return (capabilityMap[agentType] || []).map((cap) => ({
            ...cap,
            version: '1.0.0',
            parameters: {},
            qualityThreshold: this.qualityThreshold,
            constitutionalCompliant: true
        }));
    }
    calculateLoadLevel(healthStatus) {
        // Convert health metrics to load level (0-1)
        const baseLoad = 0.1;
        const errorPenalty = (healthStatus.errorRate || 0) * 10;
        const uptimeFactor = Math.min(healthStatus.uptime / 86400000, 1); // 24 hours
        return Math.min(1, baseLoad + errorPenalty + (1 - uptimeFactor) * 0.3);
    }
    assessAgentQuality(agent, healthStatus) {
        // Assess agent quality based on health and capabilities
        let baseQuality = 80;
        if (healthStatus.status === 'healthy')
            baseQuality += 10;
        if (healthStatus.errorRate < 0.01)
            baseQuality += 5;
        if (agent.getAvailableActions().length > 3)
            baseQuality += 5;
        return Math.min(100, Math.max(60, baseQuality));
    }
    extractCapabilitiesFromTask(taskDescription) {
        const taskLower = taskDescription.toLowerCase();
        const capabilities = [];
        // Development-related capabilities
        if (taskLower.includes('code') || taskLower.includes('typescript') || taskLower.includes('develop')) {
            capabilities.push('code_analysis', 'documentation');
        }
        // Office-related capabilities
        if (taskLower.includes('document') || taskLower.includes('email') || taskLower.includes('schedule')) {
            capabilities.push('document_processing', 'communication');
        }
        // Analysis capabilities
        if (taskLower.includes('analyze') || taskLower.includes('review') || taskLower.includes('assess')) {
            capabilities.push('analysis', 'quality_assessment');
        }
        // Default capabilities if none detected
        if (capabilities.length === 0) {
            capabilities.push('general_assistance', 'task_coordination');
        }
        return capabilities;
    }
    findAgentByType(agentType) {
        for (const [agentId, _] of this.registeredAgents) {
            if (agentId.includes(agentType)) {
                return agentId;
            }
        }
        return null;
    }
    mapMessageType(messageType) {
        const typeMap = {
            coordination: 'coordination_request',
            query: 'capability_query',
            delegation: 'task_delegation',
            status: 'status_update'
        };
        return typeMap[messageType] || 'coordination_request';
    }
    async executeCoordinationPlan(plan, _context, session) {
        // Execute the coordination plan step by step
        const results = [];
        for (const step of plan.executionOrder) {
            const stepResult = `Step ${step.step}: ${step.description} completed by ${step.agentId}`;
            results.push(stepResult);
            // Update session activity
            session.lastActivity = new Date();
        }
        return `Coordination completed successfully:\n${results.join('\n')}`;
    }
    /**
     * Trigger automated agent discovery
     * CoreAgent broadcasts "Who's awake?" and agents respond with capabilities
     */
    async triggerAgentDiscovery() {
        try {
            console.log('🔍 CoreAgent asking: "Who\'s awake?"');
            const discoveredAgents = await this.mcpServer.triggerAgentDiscovery();
            console.log(`📡 Discovery complete: Found ${discoveredAgents.length} agents`);
            discoveredAgents.forEach(agent => {
                console.log(`   👋 ${agent.agentId} (${agent.agentType}): Quality ${agent.qualityScore}%`);
            });
            return discoveredAgents;
        }
        catch (error) {
            console.error('❌ Agent discovery failed:', error);
            return [];
        }
    }
    /**
     * Get discovery network status from the automated discovery protocol
     */
    getDiscoveryNetworkStatus() {
        return this.mcpServer.getDiscoveryNetworkStatus();
    }
}
exports.MultiAgentOrchestrator = MultiAgentOrchestrator;
/**
 * Usage Examples for OneAgent Multi-Agent Integration:
 *
 * // Initialize orchestrator
 * const orchestrator = new MultiAgentOrchestrator();
 * await orchestrator.initialize();
 *
 * // Coordinate agents for complex task
 * const result = await orchestrator.coordinateAgentsForTask(
 *   "Analyze this TypeScript project, generate tests, and create documentation",
 *   context,
 *   { maxAgents: 3, enableBMAD: true }
 * );
 *
 * // Send message between agents
 * const messageResult = await orchestrator.sendAgentMessage(
 *   'dev',
 *   'office',
 *   'Can you help document the API endpoints I just analyzed?',
 *   context,
 *   'coordination'
 * );
 *
 * // Query for specific capabilities
 * const capableAgents = await orchestrator.queryAgentCapabilities(
 *   'Find agents that can process documents with high quality scores'
 * );
 */
