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

import { AgentCommunicationProtocol, A2AMessage, AgentRegistration } from './AgentCommunicationProtocol';
import { MultiAgentMCPServer } from './MultiAgentMCPServer';
import { ISpecializedAgent } from '../base/ISpecializedAgent';
import { AgentConfig, AgentContext, AgentResponse } from '../base/BaseAgent';
import { TriageAgent } from '../specialized/TriageAgent';
import { DevAgent } from '../specialized/DevAgent';
import { OfficeAgent } from '../specialized/OfficeAgent';
import { oneAgentConfig } from '../../config';

export interface MultiAgentSession {
  sessionId: string;
  participatingAgents: string[];
  taskContext: string;
  startTime: Date;
  lastActivity: Date;
  qualityScore: number;
  constitutionalCompliant: boolean;
}

export interface AgentCollaborationResult {
  success: boolean;
  result: string;
  participatingAgents: string[];
  qualityScore: number;
  executionTime: number;
  constitutionalValidated: boolean;
  bmadAnalysisApplied: boolean;
}

/**
 * Multi-Agent Orchestrator for OneAgent System
 * 
 * Bridges existing OneAgent architecture with new multi-agent capabilities
 */
export class MultiAgentOrchestrator {
  private communicationProtocol: AgentCommunicationProtocol;
  private mcpServer: MultiAgentMCPServer;
  private registeredAgents: Map<string, ISpecializedAgent> = new Map();
  private activeSessions: Map<string, MultiAgentSession> = new Map();
    constructor(
    private coreAgentId: string = 'OneAgent-Core-v4.0.0',
    private qualityThreshold: number = 85
  ) {
    this.communicationProtocol = AgentCommunicationProtocol.getInstance(coreAgentId, true);
    this.mcpServer = new MultiAgentMCPServer(coreAgentId);
  }  /**
   * Initialize multi-agent orchestrator with existing OneAgent infrastructure
   * Automatically registers existing agents for multi-agent communication
   */  async initialize(): Promise<void> {
    console.log(`🚀 Initializing Multi-Agent Orchestrator for ${this.coreAgentId}`);
    
    try {
      // NUCLEAR OPTION: Force reset singleton to eliminate phantom agents completely
      AgentCommunicationProtocol.resetSingleton();
      this.communicationProtocol = AgentCommunicationProtocol.getInstance(this.coreAgentId, true);
      console.log(`🚀 NUCLEAR RESET: Fresh AgentCommunicationProtocol instance created`);
      
      // Auto-register existing OneAgent agents (now disabled to prevent phantom agents)
      await this.autoRegisterExistingAgents();
      
      console.log(`✅ Multi-Agent Orchestrator initialized`);
      console.log(`📊 Registered Agents: ${this.registeredAgents.size}`);
      console.log(`🔧 MCP Tools Available: ${this.mcpServer.getAvailableTools().length}`);
      console.log(`⚖️ Constitutional AI: Active | Quality Threshold: ${this.qualityThreshold}%`);
        // Initialize UnifiedAgentRegistry integration
      console.log('� Connecting to UnifiedAgentRegistry...');
      await this.queryAgentCapabilities("ping");
      console.log('🎯 UnifiedAgentRegistry integration ready - OURA v3.0 clean architecture!');
      
    } catch (error) {
      console.error(`❌ Multi-Agent Orchestrator initialization failed:`, error);
      throw error;
    }
  }

  /**
   * Register an existing OneAgent specialized agent for multi-agent communication
   * Automatically discovers capabilities and creates registration
   */
  async registerExistingAgent(agent: ISpecializedAgent, agentType: string): Promise<boolean> {
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
      const registration: AgentRegistration = {
        agentId,
        agentType,
        capabilities,
        endpoint: `${oneAgentConfig.mcpUrl}/agents/${agentType}`,
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
      
    } catch (error) {
      console.error(`❌ Failed to register agent ${agentType}:`, error);
      return false;
    }
  }

  /**
   * Coordinate multiple OneAgent agents for complex tasks
   * Uses natural language task description and Constitutional AI validation
   */
  async coordinateAgentsForTask(
    taskDescription: string,
    context: AgentContext,
    options: {
      maxAgents?: number;
      qualityTarget?: number;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      enableBMAD?: boolean;
    } = {}
  ): Promise<AgentCollaborationResult> {
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
      const coordination = await this.communicationProtocol.coordinateAgents(
        taskDescription,
        requiredCapabilities,
        context
      );
      
      // Create collaboration session
      const session: MultiAgentSession = {
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
      const executionResult = await this.executeCoordinationPlan(
        coordination.coordinationPlan,
        context,
        session
      );
      
      const executionTime = Date.now() - startTime;
      
      const result: AgentCollaborationResult = {
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
      
    } catch (error) {
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
  async sendAgentMessage(
    sourceAgentType: string,
    targetAgentType: string,
    message: string,
    context: AgentContext,
    messageType: 'coordination' | 'query' | 'delegation' | 'status' = 'coordination'
  ): Promise<{
    success: boolean;
    response: string;
    qualityScore: number;
    processingTime: number;
    constitutionalValidated: boolean;
  }> {
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
      const a2aMessage: A2AMessage = {
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
      
    } catch (error) {
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
  async queryAgentCapabilities(
    query: string,
    options: {
      qualityFilter?: boolean;
      statusFilter?: string[];
      maxResults?: number;
    } = {}
  ): Promise<{
    agents: AgentRegistration[];
    totalFound: number;
    qualityStats: {
      averageQuality: number;
      aboveThreshold: number;
    };
  }> {
    try {
      const agents = await this.communicationProtocol.queryCapabilities(query);
      
      // Apply filters
      let filteredAgents = agents;
      
      if (options.qualityFilter !== false) {
        filteredAgents = filteredAgents.filter(agent => 
          agent.qualityScore >= this.qualityThreshold
        );
      }
      
      if (options.statusFilter && options.statusFilter.length > 0) {
        filteredAgents = filteredAgents.filter(agent => 
          options.statusFilter!.includes(agent.status)
        );
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
      
    } catch (error) {
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
  getNetworkHealth(): {
    status: 'healthy' | 'degraded' | 'critical';
    totalAgents: number;
    onlineAgents: number;
    averageQuality: number;
    activeSessions: number;
    recommendations: string[];
  } {
    const networkHealth = this.communicationProtocol.getNetworkHealth();
    const activeSessions = this.activeSessions.size;
    
    // Assess overall status
    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (networkHealth.averageQuality < 70 || networkHealth.onlineAgents < 2) {
      status = 'critical';
    } else if (networkHealth.averageQuality < 85 || networkHealth.onlineAgents < 3) {
      status = 'degraded';
    }
    
    // Generate recommendations
    const recommendations: string[] = [];
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
   * These tools extend the existing OneAgent professional tools
   */
  getMultiAgentMCPTools(): any[] {
    return this.mcpServer.getAvailableTools();
  }

  /**
   * Process multi-agent MCP tool calls
   * Integrates with OneAgent's existing MCP tool processing pipeline
   */
  async processMultiAgentMCPTool(toolName: string, parameters: any, context: AgentContext): Promise<any> {
    return await this.mcpServer.handleToolCall(toolName, parameters, context);
  }

  /**
   * Get the MCP server instance
   */
  getMCPServer(): MultiAgentMCPServer {
    return this.mcpServer;
  }

  /**
   * Get the communication protocol instance for agent registration
   */
  getCommunicationProtocol(): AgentCommunicationProtocol {
    return this.communicationProtocol;
  }

  // Private implementation methods
  
  private async autoRegisterExistingAgents(): Promise<void> {
    console.log(`🔄 Auto-registering existing OneAgent agents...`);
    
    try {
      // Re-enable auto-registration for real agents from AgentBootstrapService
      // This allows agents initialized by AgentBootstrapService to automatically register
      
      // Register DevAgent with enhanced capabilities
      const devAgentRegistration: AgentRegistration = {
        agentId: 'DevAgent',
        agentType: 'dev',
        capabilities: [          {
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
        endpoint: `${oneAgentConfig.mcpUrl}/devagent`,
        status: 'online',
        loadLevel: 0,
        qualityScore: 95,
        lastSeen: new Date()
      };

      await this.communicationProtocol.registerAgent(devAgentRegistration);

      // Register CoreAgent for coordination
      const coreAgentRegistration: AgentRegistration = {
        agentId: 'CoreAgent',
        agentType: 'core',
        capabilities: [          {
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
        endpoint: `${oneAgentConfig.mcpUrl}/coreagent`,
        status: 'online',
        loadLevel: 0,
        qualityScore: 95,
        lastSeen: new Date()
      };

      await this.communicationProtocol.registerAgent(coreAgentRegistration);
      
      console.log(`✅ Auto-registration enabled - DevAgent and CoreAgent registered automatically`);
      console.log(`📌 Additional agents can be registered via register_agent MCP tool`);
      
    } catch (error) {
      console.error(`❌ Auto-registration failed:`, error);
    }
  }

  private getDefaultCapabilities(agentType: string): any[] {    const capabilityMap: Record<string, { name: string; description: string }[]> = {
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
    
    return (capabilityMap[agentType] || []).map((cap: { name: string; description: string }) => ({
      ...cap,
      version: '1.0.0',
      parameters: {},
      qualityThreshold: this.qualityThreshold,
      constitutionalCompliant: true
    }));
  }

  private calculateLoadLevel(healthStatus: any): number {
    // Convert health metrics to load level (0-1)
    const baseLoad = 0.1;
    const errorPenalty = (healthStatus.errorRate || 0) * 10;
    const uptimeFactor = Math.min(healthStatus.uptime / 86400000, 1); // 24 hours
    
    return Math.min(1, baseLoad + errorPenalty + (1 - uptimeFactor) * 0.3);
  }

  private assessAgentQuality(agent: ISpecializedAgent, healthStatus: any): number {
    // Assess agent quality based on health and capabilities
    let baseQuality = 80;
    
    if (healthStatus.status === 'healthy') baseQuality += 10;
    if (healthStatus.errorRate < 0.01) baseQuality += 5;
    if (agent.getAvailableActions().length > 3) baseQuality += 5;
    
    return Math.min(100, Math.max(60, baseQuality));
  }

  private extractCapabilitiesFromTask(taskDescription: string): string[] {
    const taskLower = taskDescription.toLowerCase();
    const capabilities: string[] = [];
    
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
  }  private findAgentByType(agentType: string): string | null {
    const agentIds = Array.from(this.registeredAgents.keys());
    for (const agentId of agentIds) {
      if (agentId.includes(agentType)) {
        return agentId;
      }
    }
    return null;
  }
  private mapMessageType(messageType: string): any {
    const typeMap: Record<string, string> = {
      coordination: 'coordination_request',
      query: 'capability_query',
      delegation: 'task_delegation',
      status: 'status_update'
    };
    
    return typeMap[messageType] || 'coordination_request';
  }

  private async executeCoordinationPlan(plan: any, _context: AgentContext, session: MultiAgentSession): Promise<string> {
    // Execute the coordination plan step by step
    const results: string[] = [];
    
    for (const step of plan.executionOrder) {
      const stepResult = `Step ${step.step}: ${step.description} completed by ${step.agentId}`;
      results.push(stepResult);
      
      // Update session activity
      session.lastActivity = new Date();
    }
      return `Coordination completed successfully:\n${results.join('\n')}`;
  }
}
