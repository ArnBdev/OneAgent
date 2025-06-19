/**
 * Enhanced NLACS Core - Team Coordination & Direct Messaging
 * Builds on BackboneNLACSOrchestrator with advanced coordination capabilities
 * 
 * @version 3.0.0-ENHANCED-COORDINATION
 * @author OneAgent Professional Development Platform
 */

import { EventEmitter } from 'events';
import { BackboneNLACSOrchestrator } from './BackboneNLACSOrchestrator.js';
import { 
  ContextCategory, 
  ProjectScope, 
  PrivacyLevel,
  ProjectContext 
} from '../types/oneagent-backbone-types.js';
import { 
  unifiedTimeService, 
  unifiedMetadataService, 
  createUnifiedMetadata 
} from '../utils/UnifiedBackboneService.js';

// =============================================================================
// ENHANCED NLACS INTERFACES
// =============================================================================

export interface NLACSAgent {
  agentId: string;
  agentType: string;
  capabilities: string[];
  status: 'online' | 'busy' | 'offline' | 'error';
  lastSeen: Date;
  contextCategories: ContextCategory[];
  projectScopes: ProjectScope[];
  maxPrivacyLevel: PrivacyLevel;
  metadata: {
    version: string;
    endpoint?: string;
    responseTime: number;
    reliability: number;
  };
}

export interface DirectMessage {
  messageId: string;
  fromAgentId: string;
  toAgentId: string;
  content: string;
  messageType: 'request' | 'response' | 'broadcast' | 'notification';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  contextCategory: ContextCategory;
  projectContext?: ProjectContext;
  deliveryStatus: 'pending' | 'delivered' | 'acknowledged' | 'failed';
  timestamp: Date;
  expiresAt?: Date;
  metadataId: string;
}

export interface TeamCoordinationSession {
  sessionId: string;
  teamLead: string;
  participants: NLACSAgent[];
  objective: string;
  contextCategory: ContextCategory;
  projectContext?: ProjectContext;
  status: 'planning' | 'active' | 'coordinating' | 'completed' | 'failed';
  messages: DirectMessage[];
  decisions: string[];
  actionItems: {
    agentId: string;
    task: string;
    status: 'assigned' | 'in_progress' | 'completed' | 'blocked';
    dueDate?: Date;
  }[];
  createdAt: Date;
  completedAt?: Date;
  metadataId: string;
}

// =============================================================================
// ENHANCED NLACS ORCHESTRATOR
// =============================================================================

export class EnhancedNLACSCore extends EventEmitter {
  private backboneOrchestrator: BackboneNLACSOrchestrator;
  private registeredAgents: Map<string, NLACSAgent> = new Map();
  private directMessages: Map<string, DirectMessage> = new Map();
  private coordinationSessions: Map<string, TeamCoordinationSession> = new Map();
  private messageDeliveryQueue: DirectMessage[] = [];

  constructor() {
    super();
    this.backboneOrchestrator = new BackboneNLACSOrchestrator();
    this.setupMessageDelivery();
    console.log('[EnhancedNLACS] Core initialized with team coordination capabilities');
  }

  // =============================================================================
  // AGENT REGISTRATION & DISCOVERY
  // =============================================================================

  async registerAgent(agent: Omit<NLACSAgent, 'lastSeen'>): Promise<void> {
    const fullAgent: NLACSAgent = {
      ...agent,
      lastSeen: new Date()
    };

    // Create metadata for agent registration
    const agentMetadata = createUnifiedMetadata('nlacs_agent_registration', 'enhanced-nlacs', {
      system: {
        source: 'enhanced-nlacs',
        component: 'agent-registry',
        sessionId: `agent-${agent.agentId}`,
        userId: 'system'
      },
      content: {
        category: 'agent_registration',
        tags: ['nlacs', 'agent', agent.agentType, ...agent.capabilities],
        sensitivity: 'internal',
        relevanceScore: 90,
        contextDependency: 'global'
      },
      quality: {
        score: 88,
        constitutionalCompliant: true,
        validationLevel: 'enhanced',
        confidence: 85
      },
      relationships: {
        parent: 'nlacs-registry',
        children: [],
        related: [],
        dependencies: []
      }
    });

    this.registeredAgents.set(agent.agentId, fullAgent);
    
    this.emit('agentRegistered', {
      agentId: agent.agentId,
      agentType: agent.agentType,
      capabilities: agent.capabilities,
      metadataId: agentMetadata.id
    });

    console.log(`[EnhancedNLACS] Agent registered: ${agent.agentId} (${agent.agentType})`);
  }

  async unregisterAgent(agentId: string): Promise<void> {
    const agent = this.registeredAgents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    this.registeredAgents.delete(agentId);
    
    this.emit('agentUnregistered', { agentId });
    console.log(`[EnhancedNLACS] Agent unregistered: ${agentId}`);
  }

  getRegisteredAgents(): NLACSAgent[] {
    return Array.from(this.registeredAgents.values());
  }

  getAgentsByCapability(capability: string): NLACSAgent[] {
    return this.getRegisteredAgents().filter(agent => 
      agent.capabilities.includes(capability) && agent.status === 'online'
    );
  }

  getAgentsByContext(contextCategory: ContextCategory): NLACSAgent[] {
    return this.getRegisteredAgents().filter(agent => 
      agent.contextCategories.includes(contextCategory) && agent.status === 'online'
    );
  }

  // =============================================================================
  // DIRECT AGENT MESSAGING
  // =============================================================================

  async sendDirectMessage(
    fromAgentId: string,
    toAgentId: string,
    content: string,
    messageType: DirectMessage['messageType'] = 'request',
    priority: DirectMessage['priority'] = 'normal',
    contextCategory: ContextCategory,
    projectContext?: ProjectContext
  ): Promise<string> {
    // Validate agents exist and are authorized
    const fromAgent = this.registeredAgents.get(fromAgentId);
    const toAgent = this.registeredAgents.get(toAgentId);

    if (!fromAgent) {
      throw new Error(`Sender agent ${fromAgentId} not registered`);
    }
    if (!toAgent) {
      throw new Error(`Recipient agent ${toAgentId} not registered`);
    }

    // Validate context authorization
    if (!toAgent.contextCategories.includes(contextCategory)) {
      throw new Error(`Agent ${toAgentId} not authorized for context ${contextCategory}`);
    }

    const messageId = `dm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create message metadata
    const messageMetadata = createUnifiedMetadata('nlacs_direct_message', 'enhanced-nlacs', {
      system: {
        source: 'enhanced-nlacs',
        component: 'direct-messaging',
        sessionId: messageId,
        userId: 'system',
        agent: { id: fromAgentId, type: fromAgent.agentType }
      },
      content: {
        category: 'direct_message',
        tags: ['nlacs', 'direct-message', messageType, priority, contextCategory],
        sensitivity: this.determineSensitivityFromContext(contextCategory),
        relevanceScore: this.calculateMessageRelevance(priority, messageType),
        contextDependency: 'session'
      },
      quality: {
        score: 85,
        constitutionalCompliant: true,
        validationLevel: 'enhanced',
        confidence: 80
      },
      relationships: {
        parent: 'nlacs-messaging',
        children: [],
        related: [],
        dependencies: []
      }
    });

    const message: DirectMessage = {
      messageId,
      fromAgentId,
      toAgentId,
      content,
      messageType,
      priority,
      contextCategory,
      projectContext,
      deliveryStatus: 'pending',
      timestamp: new Date(),
      expiresAt: priority === 'urgent' ? new Date(Date.now() + 5 * 60 * 1000) : undefined, // 5 min for urgent
      metadataId: messageMetadata.id
    };

    this.directMessages.set(messageId, message);
    this.messageDeliveryQueue.push(message);

    this.emit('directMessageSent', {
      messageId,
      fromAgentId,
      toAgentId,
      messageType,
      priority,
      contextCategory
    });

    console.log(`[EnhancedNLACS] Direct message sent: ${fromAgentId} → ${toAgentId} (${priority})`);
    return messageId;
  }

  async acknowledgeMessage(messageId: string, respondingAgentId: string): Promise<void> {
    const message = this.directMessages.get(messageId);
    if (!message) {
      throw new Error(`Message ${messageId} not found`);
    }

    if (message.toAgentId !== respondingAgentId) {
      throw new Error(`Agent ${respondingAgentId} not authorized to acknowledge message ${messageId}`);
    }

    message.deliveryStatus = 'acknowledged';
    
    this.emit('messageAcknowledged', {
      messageId,
      toAgentId: message.toAgentId,
      fromAgentId: message.fromAgentId
    });

    console.log(`[EnhancedNLACS] Message acknowledged: ${messageId} by ${respondingAgentId}`);
  }

  // =============================================================================
  // TEAM COORDINATION
  // =============================================================================

  async startCoordinationSession(
    teamLead: string,
    participants: string[],
    objective: string,
    contextCategory: ContextCategory,
    projectContext?: ProjectContext
  ): Promise<string> {
    // Validate team lead and participants
    const leadAgent = this.registeredAgents.get(teamLead);
    if (!leadAgent) {
      throw new Error(`Team lead ${teamLead} not registered`);
    }

    const participantAgents = participants.map(agentId => {
      const agent = this.registeredAgents.get(agentId);
      if (!agent) {
        throw new Error(`Participant ${agentId} not registered`);
      }
      return agent;
    });

    // Validate all participants can access the context
    const unauthorizedAgents = participantAgents.filter(agent => 
      !agent.contextCategories.includes(contextCategory)
    );
    if (unauthorizedAgents.length > 0) {
      throw new Error(`Agents not authorized for context ${contextCategory}: ${unauthorizedAgents.map(a => a.agentId).join(', ')}`);
    }

    const sessionId = `coord-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create session metadata
    const sessionMetadata = createUnifiedMetadata('nlacs_coordination_session', 'enhanced-nlacs', {
      system: {
        source: 'enhanced-nlacs',
        component: 'team-coordination',
        sessionId,
        userId: 'system',
        agent: { id: teamLead, type: leadAgent.agentType }
      },
      content: {
        category: 'team_coordination',
        tags: ['nlacs', 'coordination', 'team', contextCategory, ...participants],
        sensitivity: this.determineSensitivityFromContext(contextCategory),
        relevanceScore: 90,
        contextDependency: 'session'
      },
      quality: {
        score: 88,
        constitutionalCompliant: true,
        validationLevel: 'enhanced',
        confidence: 85
      },
      relationships: {
        parent: 'nlacs-coordination',
        children: [],
        related: [],
        dependencies: []
      }
    });

    const session: TeamCoordinationSession = {
      sessionId,
      teamLead,
      participants: [leadAgent, ...participantAgents],
      objective,
      contextCategory,
      projectContext,
      status: 'planning',
      messages: [],
      decisions: [],
      actionItems: [],
      createdAt: new Date(),
      metadataId: sessionMetadata.id
    };

    this.coordinationSessions.set(sessionId, session);

    // Notify all participants
    for (const participant of participantAgents) {
      await this.sendDirectMessage(
        'system',
        participant.agentId,
        `You've been invited to coordination session: ${objective}`,
        'notification',
        'normal',
        contextCategory,
        projectContext
      );
    }

    this.emit('coordinationSessionStarted', {
      sessionId,
      teamLead,
      participants: participants,
      objective,
      contextCategory
    });

    console.log(`[EnhancedNLACS] Coordination session started: ${sessionId}`);
    return sessionId;
  }

  async addCoordinationMessage(
    sessionId: string,
    agentId: string,
    content: string,
    messageType: 'update' | 'question' | 'decision' | 'action_item' = 'update'
  ): Promise<string> {
    const session = this.coordinationSessions.get(sessionId);
    if (!session) {
      throw new Error(`Coordination session ${sessionId} not found`);
    }

    const agent = session.participants.find(p => p.agentId === agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not part of coordination session ${sessionId}`);
    }

    // Send message to all participants
    const messagePromises = session.participants
      .filter(p => p.agentId !== agentId)
      .map(participant =>
        this.sendDirectMessage(
          agentId,
          participant.agentId,
          `[Coordination] ${content}`,
          'broadcast',
          'normal',
          session.contextCategory,
          session.projectContext
        )
      );

    await Promise.all(messagePromises);

    // Track decisions and action items
    if (messageType === 'decision') {
      session.decisions.push(`${agent.agentType}: ${content}`);
    } else if (messageType === 'action_item') {
      session.actionItems.push({
        agentId,
        task: content,
        status: 'assigned',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours default
      });
    }

    this.emit('coordinationMessage', {
      sessionId,
      agentId,
      messageType,
      content
    });

    console.log(`[EnhancedNLACS] Coordination message: ${sessionId} from ${agentId}`);
    return sessionId;
  }

  // =============================================================================
  // PRIVATE UTILITY METHODS
  // =============================================================================

  private setupMessageDelivery(): void {
    // Process message delivery queue every 100ms
    setInterval(() => {
      this.processMessageDeliveryQueue();
    }, 100);
  }

  private processMessageDeliveryQueue(): void {
    while (this.messageDeliveryQueue.length > 0) {
      const message = this.messageDeliveryQueue.shift()!;
      
      // Check if message has expired
      if (message.expiresAt && new Date() > message.expiresAt) {
        message.deliveryStatus = 'failed';
        this.emit('messageExpired', { messageId: message.messageId });
        continue;
      }

      // Attempt delivery
      const recipient = this.registeredAgents.get(message.toAgentId);
      if (recipient && recipient.status === 'online') {
        message.deliveryStatus = 'delivered';
        this.emit('messageDelivered', {
          messageId: message.messageId,
          toAgentId: message.toAgentId,
          fromAgentId: message.fromAgentId
        });
      } else {
        // Re-queue for later delivery
        this.messageDeliveryQueue.push(message);
      }
    }
  }

  private determineSensitivityFromContext(contextCategory: ContextCategory): 'public' | 'internal' | 'confidential' | 'restricted' {
    const sensitivityMap: Record<ContextCategory, 'public' | 'internal' | 'confidential' | 'restricted'> = {
      'WORKPLACE': 'internal',
      'PRIVATE': 'confidential',
      'PROJECT': 'internal',
      'TECHNICAL': 'internal',
      'FINANCIAL': 'confidential',
      'HEALTH': 'confidential',
      'EDUCATIONAL': 'public',
      'CREATIVE': 'internal',
      'ADMINISTRATIVE': 'internal',
      'GENERAL': 'public'
    };
    return sensitivityMap[contextCategory];
  }

  private calculateMessageRelevance(priority: DirectMessage['priority'], messageType: DirectMessage['messageType']): number {
    const priorityScores = { low: 60, normal: 75, high: 85, urgent: 95 };
    const typeScores = { request: 80, response: 85, broadcast: 70, notification: 65 };
    return Math.round((priorityScores[priority] + typeScores[messageType]) / 2);
  }

  // =============================================================================
  // PUBLIC STATUS METHODS
  // =============================================================================

  getSystemStatus() {
    return {
      registeredAgents: this.registeredAgents.size,
      activeCoordinationSessions: Array.from(this.coordinationSessions.values()).filter(s => s.status === 'active').length,
      pendingMessages: this.messageDeliveryQueue.length,
      totalMessages: this.directMessages.size
    };
  }
}
