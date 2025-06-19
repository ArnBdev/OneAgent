/**
 * NLACS Standalone System Integration
 * Provides NLACS capabilities for standalone OneAgent systems
 * 
 * @version 1.0.0-STANDALONE
 * @author OneAgent Professional Development Platform
 */

import { EventEmitter } from 'events';
import { EnhancedNLACSCore } from './EnhancedNLACSCore.js';
import { NLACSMCPTools } from './NLACSMCPTools.js';
import { ContextCategory, ProjectScope, PrivacyLevel } from '../types/oneagent-backbone-types.js';

export interface StandaloneNLACSConfig {
  systemId: string;
  systemType: 'development' | 'qa' | 'documentation' | 'analysis' | 'coordination' | 'monitoring';
  capabilities: string[];
  contextCategories: ContextCategory[];
  projectScopes: ProjectScope[];
  maxPrivacyLevel: PrivacyLevel;
  autoRegister: boolean;
  enableMCPTools: boolean;
  heartbeatInterval: number; // ms
}

export interface NLACSSystemEvent {
  eventType: 'message_received' | 'coordination_invitation' | 'system_status' | 'agent_discovery';
  timestamp: Date;
  data: any;
  contextCategory: ContextCategory;
  metadata?: Record<string, any>;
}

/**
 * Standalone NLACS System Integration
 * Provides complete NLACS functionality for independent OneAgent systems
 */
export class StandaloneNLACSSystem extends EventEmitter {
  private config: StandaloneNLACSConfig;
  private nlacs: EnhancedNLACSCore;
  private mcpTools?: NLACSMCPTools;
  private isActive: boolean = false;
  private heartbeatTimer?: NodeJS.Timeout | undefined;
  private messageHandlers: Map<string, (event: NLACSSystemEvent) => Promise<void>> = new Map();

  constructor(config: StandaloneNLACSConfig) {
    super();
    this.config = config;
    this.nlacs = new EnhancedNLACSCore();
    
    if (config.enableMCPTools) {
      this.mcpTools = new NLACSMCPTools(this.nlacs);
      this.mcpTools.setupEventForwarding();
    }

    this.setupEventHandlers();
    console.log(`[StandaloneNLACS] System initialized: ${config.systemId} (${config.systemType})`);
  }

  // =============================================================================
  // SYSTEM LIFECYCLE
  // =============================================================================

  async start(): Promise<void> {
    if (this.isActive) {
      console.log('[StandaloneNLACS] System already active');
      return;
    }

    try {
      // Auto-register if configured
      if (this.config.autoRegister) {
        await this.nlacs.registerAgent({
          agentId: this.config.systemId,
          agentType: this.config.systemType,
          capabilities: this.config.capabilities,
          status: 'online',
          contextCategories: this.config.contextCategories,
          projectScopes: this.config.projectScopes,
          maxPrivacyLevel: this.config.maxPrivacyLevel,
          metadata: {
            version: '1.0.0-standalone',
            responseTime: 100,
            reliability: 1.0
          }
        });
      }

      // Start heartbeat
      this.startHeartbeat();
      
      this.isActive = true;
      this.emit('systemStarted', { systemId: this.config.systemId });
      
      console.log(`[StandaloneNLACS] System started: ${this.config.systemId}`);
    } catch (error) {
      console.error('[StandaloneNLACS] Failed to start system:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isActive) {
      return;
    }

    try {
      // Stop heartbeat
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = undefined;
      }

      // Unregister if auto-registered
      if (this.config.autoRegister) {
        await this.nlacs.unregisterAgent(this.config.systemId);
      }

      this.isActive = false;
      this.emit('systemStopped', { systemId: this.config.systemId });
      
      console.log(`[StandaloneNLACS] System stopped: ${this.config.systemId}`);
    } catch (error) {
      console.error('[StandaloneNLACS] Error stopping system:', error);
      throw error;
    }
  }

  // =============================================================================
  // MESSAGE HANDLING
  // =============================================================================

  async sendMessage(
    toAgentId: string,
    content: string,
    messageType: 'request' | 'response' | 'broadcast' | 'notification' = 'request',
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal',
    contextCategory: ContextCategory,
    projectContext?: any
  ): Promise<string> {
    if (!this.isActive) {
      throw new Error('NLACS system not active');
    }

    return await this.nlacs.sendDirectMessage(
      this.config.systemId,
      toAgentId,
      content,
      messageType,
      priority,
      contextCategory,
      projectContext
    );
  }

  async acknowledgeMessage(messageId: string): Promise<void> {
    return await this.nlacs.acknowledgeMessage(messageId, this.config.systemId);
  }

  // Register message handler for specific message types
  registerMessageHandler(
    messageType: string,
    handler: (event: NLACSSystemEvent) => Promise<void>
  ): void {
    this.messageHandlers.set(messageType, handler);
    console.log(`[StandaloneNLACS] Message handler registered for: ${messageType}`);
  }

  // =============================================================================
  // COORDINATION FEATURES
  // =============================================================================

  async startCoordination(
    participants: string[],
    objective: string,
    contextCategory: ContextCategory,
    projectContext?: any
  ): Promise<string> {
    if (!this.isActive) {
      throw new Error('NLACS system not active');
    }

    return await this.nlacs.startCoordinationSession(
      this.config.systemId,
      participants,
      objective,
      contextCategory,
      projectContext
    );
  }

  async addCoordinationMessage(
    sessionId: string,
    content: string,
    messageType: 'update' | 'question' | 'decision' | 'action_item' = 'update'
  ): Promise<string> {
    return await this.nlacs.addCoordinationMessage(
      sessionId,
      this.config.systemId,
      content,
      messageType
    );
  }

  // =============================================================================
  // DISCOVERY & STATUS
  // =============================================================================

  async discoverAgents(
    capability?: string,
    contextCategory?: ContextCategory
  ): Promise<any[]> {
    let agents = this.nlacs.getRegisteredAgents();
    
    if (capability) {
      agents = this.nlacs.getAgentsByCapability(capability);
    }
    if (contextCategory) {
      agents = this.nlacs.getAgentsByContext(contextCategory);
    }

    return agents.filter(agent => agent.agentId !== this.config.systemId); // Exclude self
  }

  getSystemStatus() {
    return {
      ...this.nlacs.getSystemStatus(),
      systemId: this.config.systemId,
      systemType: this.config.systemType,
      isActive: this.isActive,
      capabilities: this.config.capabilities,
      contextCategories: this.config.contextCategories,
      mcpToolsEnabled: !!this.mcpTools
    };
  }

  // =============================================================================
  // MCP INTEGRATION
  // =============================================================================

  getMCPTools(): any[] {
    return this.mcpTools?.getTools() || [];
  }

  async handleMCPToolCall(name: string, args: any): Promise<any> {
    if (!this.mcpTools) {
      throw new Error('MCP tools not enabled for this system');
    }
    return await this.mcpTools.handleToolCall(name, args);
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private setupEventHandlers(): void {
    // Handle incoming messages
    this.nlacs.on('messageDelivered', async (data) => {
      if (data.toAgentId === this.config.systemId) {
        const event: NLACSSystemEvent = {
          eventType: 'message_received',
          timestamp: new Date(),
          data,
          contextCategory: 'GENERAL', // Would need to get from message metadata
          metadata: { messageId: data.messageId, fromAgentId: data.fromAgentId }
        };

        // Try to find and call appropriate handler
        const handler = this.messageHandlers.get('message_received');
        if (handler) {
          try {
            await handler(event);
          } catch (error) {
            console.error('[StandaloneNLACS] Message handler error:', error);
          }
        }

        this.emit('messageReceived', data);
      }
    });

    // Handle coordination invitations
    this.nlacs.on('coordinationSessionStarted', async (data) => {
      if (data.participants.includes(this.config.systemId)) {
        const event: NLACSSystemEvent = {
          eventType: 'coordination_invitation',
          timestamp: new Date(),
          data,
          contextCategory: data.contextCategory,
          metadata: { sessionId: data.sessionId, teamLead: data.teamLead }
        };

        const handler = this.messageHandlers.get('coordination_invitation');
        if (handler) {
          try {
            await handler(event);
          } catch (error) {
            console.error('[StandaloneNLACS] Coordination handler error:', error);
          }
        }

        this.emit('coordinationInvitation', data);
      }
    });

    // Handle agent registrations for discovery
    this.nlacs.on('agentRegistered', (data) => {
      const event: NLACSSystemEvent = {
        eventType: 'agent_discovery',
        timestamp: new Date(),
        data,
        contextCategory: 'GENERAL',
        metadata: { agentId: data.agentId, agentType: data.agentType }
      };

      const handler = this.messageHandlers.get('agent_discovery');
      if (handler) {
        handler(event).catch(error => {
          console.error('[StandaloneNLACS] Agent discovery handler error:', error);
        });
      }

      this.emit('agentDiscovered', data);
    });
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      const status = this.getSystemStatus();
      
      const event: NLACSSystemEvent = {
        eventType: 'system_status',
        timestamp: new Date(),
        data: status,
        contextCategory: 'GENERAL',
        metadata: { heartbeat: true }
      };

      const handler = this.messageHandlers.get('system_status');
      if (handler) {
        handler(event).catch(error => {
          console.error('[StandaloneNLACS] Status handler error:', error);
        });
      }

      this.emit('heartbeat', status);
    }, this.config.heartbeatInterval);
  }

  // =============================================================================
  // FACTORY METHODS
  // =============================================================================

  static createDevelopmentSystem(systemId: string): StandaloneNLACSSystem {
    return new StandaloneNLACSSystem({
      systemId,
      systemType: 'development',
      capabilities: ['coding', 'testing', 'debugging', 'documentation'],
      contextCategories: ['WORKPLACE', 'PROJECT', 'TECHNICAL'],
      projectScopes: ['TEAM', 'DEPARTMENT', 'PROTOTYPE', 'PRODUCTION'],
      maxPrivacyLevel: 'internal',
      autoRegister: true,
      enableMCPTools: true,
      heartbeatInterval: 5000
    });
  }

  static createQASystem(systemId: string): StandaloneNLACSSystem {
    return new StandaloneNLACSSystem({
      systemId,
      systemType: 'qa',
      capabilities: ['testing', 'validation', 'quality-assurance', 'reporting'],
      contextCategories: ['WORKPLACE', 'PROJECT', 'TECHNICAL'],
      projectScopes: ['TEAM', 'DEPARTMENT', 'PRODUCTION'],
      maxPrivacyLevel: 'internal',
      autoRegister: true,
      enableMCPTools: true,
      heartbeatInterval: 10000
    });
  }

  static createDocumentationSystem(systemId: string): StandaloneNLACSSystem {
    return new StandaloneNLACSSystem({
      systemId,
      systemType: 'documentation',
      capabilities: ['documentation', 'analysis', 'writing', 'research'],
      contextCategories: ['WORKPLACE', 'PROJECT', 'EDUCATIONAL', 'GENERAL'],
      projectScopes: ['TEAM', 'DEPARTMENT', 'ORGANIZATION', 'PUBLIC'],
      maxPrivacyLevel: 'public',
      autoRegister: true,
      enableMCPTools: true,
      heartbeatInterval: 15000
    });
  }
}
