/**
 * OURA v3.0 MultiAgentMCPServer - CLEAN ARCHITECTURE 
 * 
 * Professional agent communication server with UnifiedAgentRegistry integration.
 * ALL legacy broadcast discovery systems have been ELIMINATED.
 * 
 * Features:
 * - Agent registration via UnifiedAgentRegistry ONLY
 * - Constitutional AI validation
 * - Quality threshold enforcement
 * - Memory-first architecture
 * - No broadcast spam or legacy discovery
 */

// Load environment variables first
import { config } from 'dotenv';
import * as path from 'path';
config({ path: path.join(__dirname, '..', '..', '..', '..', '.env') });

import { AgentCommunicationProtocol, A2AMessage, A2AResponse, AgentRegistration } from './AgentCommunicationProtocol';
import { AgentConfig, AgentContext } from '../base/BaseAgent';
import { UnifiedMemoryClient } from '../../memory/UnifiedMemoryClient';
import { oneAgentConfig } from '../../config/index';

export interface MultiAgentMCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MultiAgentCapability {
  toolName: string;
  description: string;
  parameters: Record<string, any>;
  qualityThreshold: number;
  constitutionalCompliant: boolean;
}

/**
 * OURA v3.0 MCP Server - Clean Architecture
 * Uses UnifiedAgentRegistry as single source of truth
 */
export class MultiAgentMCPServer {
  private communicationProtocol: AgentCommunicationProtocol;
  private mcpTools: Map<string, MultiAgentMCPTool> = new Map();
  private qualityThreshold = parseInt(process.env.OURA_V3_MINIMUM_QUALITY_SCORE || '85', 10);
  private memoryClient?: UnifiedMemoryClient;
  private communicationHistory: Map<string, any[]> = new Map();
  
  constructor(
    private coreAgentId: string = 'OneAgent-Core',
    private basePort: number = oneAgentConfig.mcpPort
  ) {
    this.communicationProtocol = AgentCommunicationProtocol.getInstance(coreAgentId, true);
    
    this.initializeMultiAgentTools();
    this.initializeMemoryClient();
    
    console.log('✅ OURA v3.0: Clean agent registry architecture initialized');
    console.log('📋 UnifiedAgentRegistry is the single source of truth');
    console.log('🔇 Legacy broadcast discovery ELIMINATED - no more spam!');
  }

  /**
   * Initialize unified memory client for persistent communication storage
   */
  private async initializeMemoryClient(): Promise<void> {
    try {
      this.memoryClient = new UnifiedMemoryClient({
        host: oneAgentConfig.host,
        port: oneAgentConfig.memoryPort,
        timeout: 30000
      });
      console.log('✅ MultiAgentMCPServer: Unified memory client initialized');
    } catch (error) {
      console.warn('⚠️ MultiAgentMCPServer: Could not initialize memory client, using in-memory fallback:', error);
    }
  }

  /**
   * Initialize OURA v3.0 MCP tools - NO legacy discovery tools
   */
  private initializeMultiAgentTools(): void {
    // Agent Registration Tool (UnifiedAgentRegistry integration)
    this.mcpTools.set('register_agent', {
      name: 'register_agent',
      description: 'Register an agent in the UnifiedAgentRegistry with Constitutional AI validation',
      inputSchema: {
        type: 'object',
        properties: {
          agentId: { type: 'string', description: 'Unique agent identifier' },
          agentType: { type: 'string', description: 'Agent type (dev, office, fitness, etc.)' },
          capabilities: { type: 'array', description: 'Agent capabilities with quality thresholds' },
          endpoint: { type: 'string', description: 'Agent communication endpoint' },
          qualityScore: { type: 'number', description: 'Agent quality score (0-100)', minimum: 0, maximum: 100 }
        },
        required: ['agentId', 'agentType', 'capabilities', 'endpoint', 'qualityScore']
      }
    });

    // Agent Messaging Tool
    this.mcpTools.set('send_agent_message', {
      name: 'send_agent_message',
      description: 'Send a message between agents with Constitutional AI validation',
      inputSchema: {
        type: 'object',
        properties: {
          targetAgent: { type: 'string', description: 'Target agent ID' },
          messageType: { 
            type: 'string', 
            enum: ['coordination_request', 'capability_query', 'task_delegation', 'status_update'],
            description: 'Type of message being sent'
          },
          content: { type: 'string', description: 'Natural language message content' },
          priority: { 
            type: 'string', 
            enum: ['low', 'medium', 'high', 'urgent'], 
            description: 'Message priority level' 
          },
          requiresResponse: { type: 'boolean', description: 'Whether response is required' },
          confidenceLevel: { type: 'number', description: 'Confidence in message content (0-1)', minimum: 0, maximum: 1 }
        },
        required: ['targetAgent', 'messageType', 'content']
      }
    });    // Query Agent Capabilities Tool (UnifiedAgentRegistry query)
    this.mcpTools.set('query_agent_capabilities', {
      name: 'query_agent_capabilities',
      description: 'Query available agents using natural language capability descriptions from UnifiedAgentRegistry',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Natural language query for agent capabilities' },
          qualityFilter: { type: 'boolean', description: 'Apply quality filter (85%+ threshold)' },
          statusFilter: { 
            type: 'array', 
            items: { type: 'string' },
            description: 'Filter by agent status (online, busy, offline)' 
          }
        },
        required: ['query']
      }
    });

    // Communication History Tool with Enhanced Metadata
    this.mcpTools.set('get_communication_history', {
      name: 'get_communication_history',
      description: 'Retrieve inter-agent communication history with privacy isolation and enhanced metadata filtering',
      inputSchema: {
        type: 'object',
        properties: {
          agentFilter: { type: 'string', description: 'Filter by specific agent ID (optional)' },
          projectContext: { type: 'string', description: 'Filter by project context (optional)' },
          topicContext: { type: 'string', description: 'Filter by topic context (optional)' },
          timeRangeMinutes: { type: 'number', description: 'Time range in minutes (default: 60)', minimum: 1, maximum: 10080 },
          limit: { type: 'number', description: 'Maximum number of messages to return (default: 20)', minimum: 1, maximum: 100 },
          includeMetadata: { type: 'boolean', description: 'Include detailed metadata in results (default: true)' }
        }
      }
    });

    console.log(`✅ OURA v3.0 MCP Tools initialized: ${this.mcpTools.size} tools available`);
    console.log('🔇 Legacy discovery tools ELIMINATED - clean architecture!');
  }

  /**
   * Get available MCP tools
   */
  getAvailableTools(): MultiAgentMCPTool[] {
    return Array.from(this.mcpTools.values());
  }
  /**
   * Handle MCP tool calls - CLEAN implementation
   */
  async handleToolCall(toolName: string, parameters: any, context: AgentContext): Promise<any> {
    switch (toolName) {
      case 'register_agent':
        return await this.handleAgentRegistration(parameters, context);
      case 'send_agent_message':
        return await this.handleAgentMessage(parameters, context);
      case 'query_agent_capabilities':
        return await this.handleCapabilityQuery(parameters, context);
      case 'get_communication_history':
        return await this.handleCommunicationHistory(parameters, context);
      default:
        return {
          success: false,
          error: `Unknown tool: ${toolName}`,
          availableTools: Array.from(this.mcpTools.keys())
        };
    }
  }

  /**
   * Handle agent registration via UnifiedAgentRegistry
   */
  private async handleAgentRegistration(parameters: any, _context: AgentContext): Promise<any> {
    const { agentId, agentType, capabilities, endpoint, qualityScore } = parameters;

    // Quality threshold validation
    if (qualityScore < this.qualityThreshold) {
      return {
        success: false,
        error: `Agent quality score ${qualityScore}% below OURA v3.0 threshold (${this.qualityThreshold}%)`,
        recommendation: 'Improve agent quality before registration'
      };
    }

    // Register with communication protocol (which integrates with UnifiedAgentRegistry)
    const registration: AgentRegistration = {
      agentId,
      agentType,
      capabilities: capabilities.map((cap: any) => ({
        name: cap.name,
        description: cap.description,
        version: cap.version || '1.0.0',
        parameters: cap.parameters || {},
        qualityThreshold: cap.qualityThreshold || this.qualityThreshold,
        constitutionalCompliant: cap.constitutionalCompliant !== false
      })),
      endpoint,
      status: 'online',
      loadLevel: 0,
      qualityScore,
      lastSeen: new Date()
    };

    const success = await this.communicationProtocol.registerAgent(registration);

    return {
      success,
      agentId,
      message: success
        ? `Agent ${agentId} registered successfully in UnifiedAgentRegistry`
        : `Agent registration failed for ${agentId}`,
      registrationDetails: success ? registration : null
    };
  }
  /**
   * Handle agent messaging with enhanced metadata and memory storage
   */
  private async handleAgentMessage(parameters: any, context: AgentContext): Promise<any> {
    const { targetAgent, messageType, content, priority = 'medium', requiresResponse = true, confidenceLevel = 0.8 } = parameters;

    // Extract enhanced metadata from context if available
    const interAgentMetadata = (context.metadata as any)?.customData?.interAgentMetadata;
    
    const message: A2AMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: messageType,
      sourceAgent: context.user?.id || this.coreAgentId,
      targetAgent,
      content,
      metadata: {
        priority,
        requiresResponse,
        confidenceLevel,
        constitutionalValidated: false,
        bmadAnalysis: content.length > 200 || messageType === 'coordination_request',
        // Enhanced metadata for privacy isolation and context
        ...(interAgentMetadata && {
          projectContext: interAgentMetadata.projectContext,
          topicContext: interAgentMetadata.topicContext,
          workflowId: interAgentMetadata.workflowId,
          privacyLevel: interAgentMetadata.privacyLevel,
          userDataScope: interAgentMetadata.userDataScope,
          correlationId: interAgentMetadata.correlationId,
          requestId: interAgentMetadata.requestId
        })
      },
      timestamp: new Date(),
      sessionId: context.sessionId
    };    // Store message in memory with enhanced context
    if (this.memoryClient) {
      try {
        await this.memoryClient.createMemory(
          `Inter-agent message: ${message.sourceAgent} → ${message.targetAgent}: ${content}`,
          interAgentMetadata?.userId || context.user?.id || 'unknown',
          'long_term',
          {
            timestamp: message.timestamp,
            tags: [
              'inter_agent_communication',
              messageType,
              `source_${message.sourceAgent}`,
              `target_${targetAgent}`,
              ...(interAgentMetadata?.projectContext ? [`project_${interAgentMetadata.projectContext}`] : []),
              ...(interAgentMetadata?.topicContext ? [`topic_${interAgentMetadata.topicContext}`] : [])
            ],
            category: 'agent_communication',
            importance: priority === 'urgent' ? 0.9 : priority === 'high' ? 0.8 : 0.6,
            sessionId: context.sessionId,
            agentId: 'MultiAgentMCPServer',
            interAgentContext: {
              communicationType: 'direct_message',
              sourceAgentId: message.sourceAgent,
              targetAgentId: targetAgent,
              messageType,
              projectContext: interAgentMetadata?.projectContext,
              topicContext: interAgentMetadata?.topicContext,
              privacyLevel: interAgentMetadata?.privacyLevel || 'internal',
              userDataScope: interAgentMetadata?.userDataScope || 'session',
              qualityThreshold: interAgentMetadata?.qualityThreshold || 90,
              priorityLevel: priority,
              correlationId: interAgentMetadata?.correlationId,
              requestId: interAgentMetadata?.requestId
            }
          }
        );
        
        console.log(`✅ Inter-agent message stored in memory with enhanced context`);
      } catch (error) {
        console.warn(`⚠️ Failed to store inter-agent message in memory:`, error);
      }
    }

    // Store in local communication history for retrieval
    const conversationKey = `${message.sourceAgent}_${targetAgent}`;
    if (!this.communicationHistory.has(conversationKey)) {
      this.communicationHistory.set(conversationKey, []);
    }
    this.communicationHistory.get(conversationKey)!.push({
      ...message,
      enhancedMetadata: interAgentMetadata
    });

    // Send message through communication protocol
    const response = await this.communicationProtocol.sendMessage(message);

    return {
      success: response.success,
      messageId: message.id,
      response: response,
      enhancedContext: {
        storedInMemory: !!this.memoryClient,
        privacyIsolated: !!interAgentMetadata?.userId,
        projectContext: interAgentMetadata?.projectContext,
        topicContext: interAgentMetadata?.topicContext,
        correlationId: interAgentMetadata?.correlationId
      },
      timestamp: new Date()
    };
  }

  /**
   * Handle capability queries from UnifiedAgentRegistry
   */
  private async handleCapabilityQuery(parameters: any, _context: AgentContext): Promise<any> {
    const { query, qualityFilter = true, statusFilter = ['online'] } = parameters;
    
    const agents = await this.communicationProtocol.queryCapabilities(query);
    
    // Apply filters
    const filteredAgents = agents.filter(agent => {
      const qualityCheck = !qualityFilter || agent.qualityScore >= this.qualityThreshold;
      const statusCheck = statusFilter.length === 0 || statusFilter.includes(agent.status);
      return qualityCheck && statusCheck;
    });

    return {
      success: true,
      query,
      totalFound: agents.length,
      filteredResults: filteredAgents.length,
      agents: filteredAgents.slice(0, 10), // Limit to top 10 results
      summary: `Found ${filteredAgents.length} agents in UnifiedAgentRegistry matching "${query}"`,
      qualityStats: {
        averageQuality: filteredAgents.length > 0 
          ? Math.round(filteredAgents.reduce((sum, agent) => sum + agent.qualityScore, 0) / filteredAgents.length)
          : 0,
        minQuality: Math.min(...filteredAgents.map(agent => agent.qualityScore)),
        maxQuality: Math.max(...filteredAgents.map(agent => agent.qualityScore))
      }
    };
  }

  /**
   * Handle communication history retrieval with enhanced metadata filtering
   */
  async handleCommunicationHistory(parameters: any, context: AgentContext): Promise<any> {
    const { 
      agentFilter = null, 
      projectContext = null, 
      topicContext = null,
      timeRangeMinutes = 60,
      limit = 20,
      includeMetadata = true 
    } = parameters;

    // Extract enhanced metadata from context if available
    const interAgentMetadata = (context.metadata as any)?.customData?.interAgentMetadata;
    const userId = interAgentMetadata?.userId || context.user?.id || 'unknown';
    
    try {      // Get messages from memory with privacy isolation
      let memoryResults: any[] = [];
      if (this.memoryClient) {
        try {
          // Build search query for inter-agent communication
          const searchQuery = [
            'inter_agent_communication',
            agentFilter ? `agent ${agentFilter}` : '',
            projectContext ? `project ${projectContext}` : '',
            topicContext ? `topic ${topicContext}` : ''
          ].filter(Boolean).join(' ');
          
          const memorySearchResult = await this.memoryClient.getMemoryContext(
            searchQuery,
            userId,
            limit,
            ['long_term', 'session']
          );
          
          memoryResults = memorySearchResult.entries || [];
        } catch (error) {
          console.warn(`⚠️ Failed to retrieve memory context for communication history:`, error);
        }
      }
      
      // Get messages from local communication history
      let localResults: any[] = [];
      for (const [conversationKey, messages] of this.communicationHistory.entries()) {
        if (agentFilter && !conversationKey.includes(agentFilter)) continue;
        
        const filteredMessages = messages.filter((msg: any) => {
          const timeDiff = (Date.now() - new Date(msg.timestamp).getTime()) / (1000 * 60);
          if (timeDiff > timeRangeMinutes) return false;
          
          if (projectContext && msg.enhancedMetadata?.projectContext !== projectContext) return false;
          if (topicContext && msg.enhancedMetadata?.topicContext !== topicContext) return false;
          
          // Privacy isolation check
          if (msg.enhancedMetadata?.userId && msg.enhancedMetadata.userId !== userId) return false;
          
          return true;
        });
        
        localResults.push(...filteredMessages);
      }
      
      // Combine and sort results
      const combinedResults = [
        ...memoryResults.map((memory: any) => ({
          id: memory.id,
          type: 'memory',
          content: memory.content,
          timestamp: memory.timestamp,
          metadata: memory.metadata,
          enhancedContext: memory.metadata?.interAgentContext
        })),
        ...localResults.map((msg: any) => ({
          id: msg.id,
          type: 'local',
          content: msg.content,
          sourceAgent: msg.sourceAgent,
          targetAgent: msg.targetAgent,
          timestamp: msg.timestamp,
          metadata: includeMetadata ? msg.metadata : undefined,
          enhancedContext: msg.enhancedMetadata
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
       .slice(0, limit);

      return {
        success: true,
        totalResults: combinedResults.length,
        conversations: combinedResults,
        filters: {
          agentFilter,
          projectContext,
          topicContext,
          timeRangeMinutes,
          userId: userId
        },
        privacyIsolation: {
          enabled: true,
          userScope: userId,
          dataLeakagePrevention: 'active'
        },
        enhancedContext: {
          memoryIntegration: !!this.memoryClient,
          metadataFiltering: true,
          temporalFiltering: true,
          privacyEnforced: true
        }
      };
      
    } catch (error) {
      console.error(`❌ Error retrieving communication history:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        conversations: [],
        filters: { agentFilter, projectContext, topicContext, timeRangeMinutes, userId }
      };
    }
  }

  /**
   * Get communication protocol (for external access)
   */
  getCommunicationProtocol(): AgentCommunicationProtocol {
    return this.communicationProtocol;
  }
}