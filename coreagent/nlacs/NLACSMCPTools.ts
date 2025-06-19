/**
 * NLACS MCP Tools - External Tool Surface for GitHub Copilot Integration
 * Exposes NLACS capabilities as MCP tools for external access
 * 
 * @version 1.0.0-MCP-INTEGRATION
 * @author OneAgent Professional Development Platform
 */

import { EnhancedNLACSCore } from './EnhancedNLACSCore.js';
import { ContextCategory, ProjectScope, PrivacyLevel } from '../types/oneagent-backbone-types.js';

// MCP Tool Interface (simplified)
interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export class NLACSMCPTools {
  private nlacs: EnhancedNLACSCore;

  constructor(nlacsCore: EnhancedNLACSCore) {
    this.nlacs = nlacsCore;
    console.log('[NLACSMCPTools] MCP tool surface initialized');
  }

  // =============================================================================
  // MCP TOOL DEFINITIONS
  // =============================================================================

  getTools(): MCPTool[] {
    return [
      {
        name: 'nlacs_register_agent',
        description: 'Register an agent with NLACS for team coordination and messaging',
        inputSchema: {
          type: 'object',
          properties: {
            agentId: {
              type: 'string',
              description: 'Unique identifier for the agent'
            },
            agentType: {
              type: 'string',
              description: 'Type of agent (e.g., "development", "qa", "documentation")'
            },
            capabilities: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of agent capabilities (e.g., ["coding", "testing", "analysis"])'
            },
            contextCategories: {
              type: 'array',
              items: { 
                type: 'string',
                enum: ['WORKPLACE', 'PRIVATE', 'PROJECT', 'TECHNICAL', 'FINANCIAL', 'HEALTH', 'EDUCATIONAL', 'CREATIVE', 'ADMINISTRATIVE', 'GENERAL']
              },
              description: 'Context categories this agent can access'
            },
            projectScopes: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['PERSONAL', 'TEAM', 'DEPARTMENT', 'ORGANIZATION', 'PUBLIC', 'CLIENT', 'RESEARCH', 'PROTOTYPE', 'PRODUCTION', 'ARCHIVED']
              },
              description: 'Project scopes this agent can work with'
            },
            maxPrivacyLevel: {
              type: 'string',
              enum: ['public', 'internal', 'confidential', 'restricted'],
              description: 'Maximum privacy level this agent can handle'
            }
          },
          required: ['agentId', 'agentType', 'capabilities', 'contextCategories', 'projectScopes', 'maxPrivacyLevel']
        }
      },

      {
        name: 'nlacs_send_direct_message',
        description: 'Send a direct message to a specific agent through NLACS',
        inputSchema: {
          type: 'object',
          properties: {
            fromAgentId: {
              type: 'string',
              description: 'ID of the sending agent'
            },
            toAgentId: {
              type: 'string',
              description: 'ID of the recipient agent'
            },
            content: {
              type: 'string',
              description: 'Message content to send'
            },
            messageType: {
              type: 'string',
              enum: ['request', 'response', 'broadcast', 'notification'],
              description: 'Type of message being sent',
              default: 'request'
            },
            priority: {
              type: 'string',
              enum: ['low', 'normal', 'high', 'urgent'],
              description: 'Message priority level',
              default: 'normal'
            },
            contextCategory: {
              type: 'string',
              enum: ['WORKPLACE', 'PRIVATE', 'PROJECT', 'TECHNICAL', 'FINANCIAL', 'HEALTH', 'EDUCATIONAL', 'CREATIVE', 'ADMINISTRATIVE', 'GENERAL'],
              description: 'Context category for the message'
            },
            projectContext: {
              type: 'object',
              properties: {
                projectId: { type: 'string' },
                projectName: { type: 'string' },
                projectScope: {
                  type: 'string',
                  enum: ['PERSONAL', 'TEAM', 'DEPARTMENT', 'ORGANIZATION', 'PUBLIC', 'CLIENT', 'RESEARCH', 'PROTOTYPE', 'PRODUCTION', 'ARCHIVED']
                }
              },
              description: 'Optional project context for the message'
            }
          },
          required: ['fromAgentId', 'toAgentId', 'content', 'contextCategory']
        }
      },

      {
        name: 'nlacs_start_coordination_session',
        description: 'Start a team coordination session with multiple agents',
        inputSchema: {
          type: 'object',
          properties: {
            teamLead: {
              type: 'string',
              description: 'Agent ID of the team lead'
            },
            participants: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of participant agent IDs'
            },
            objective: {
              type: 'string',
              description: 'Objective or goal of the coordination session'
            },
            contextCategory: {
              type: 'string',
              enum: ['WORKPLACE', 'PRIVATE', 'PROJECT', 'TECHNICAL', 'FINANCIAL', 'HEALTH', 'EDUCATIONAL', 'CREATIVE', 'ADMINISTRATIVE', 'GENERAL'],
              description: 'Context category for the coordination session'
            },
            projectContext: {
              type: 'object',
              properties: {
                projectId: { type: 'string' },
                projectName: { type: 'string' },
                projectScope: {
                  type: 'string',
                  enum: ['PERSONAL', 'TEAM', 'DEPARTMENT', 'ORGANIZATION', 'PUBLIC', 'CLIENT', 'RESEARCH', 'PROTOTYPE', 'PRODUCTION', 'ARCHIVED']
                }
              },
              description: 'Optional project context for the session'
            }
          },
          required: ['teamLead', 'participants', 'objective', 'contextCategory']
        }
      },

      {
        name: 'nlacs_get_registered_agents',
        description: 'Get list of all registered agents available for coordination',
        inputSchema: {
          type: 'object',
          properties: {
            capability: {
              type: 'string',
              description: 'Filter agents by specific capability (optional)'
            },
            contextCategory: {
              type: 'string',
              enum: ['WORKPLACE', 'PRIVATE', 'PROJECT', 'TECHNICAL', 'FINANCIAL', 'HEALTH', 'EDUCATIONAL', 'CREATIVE', 'ADMINISTRATIVE', 'GENERAL'],
              description: 'Filter agents by context category (optional)'
            },
            status: {
              type: 'string',
              enum: ['online', 'busy', 'offline', 'error'],
              description: 'Filter agents by status (optional)'
            }
          }
        }
      },

      {
        name: 'nlacs_add_coordination_message',
        description: 'Add a message to an existing coordination session',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'ID of the coordination session'
            },
            agentId: {
              type: 'string',
              description: 'ID of the agent sending the message'
            },
            content: {
              type: 'string',
              description: 'Message content'
            },
            messageType: {
              type: 'string',
              enum: ['update', 'question', 'decision', 'action_item'],
              description: 'Type of coordination message',
              default: 'update'
            }
          },
          required: ['sessionId', 'agentId', 'content']
        }
      },

      {
        name: 'nlacs_get_system_status',
        description: 'Get current status of the NLACS system',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },

      {
        name: 'nlacs_acknowledge_message',
        description: 'Acknowledge receipt of a direct message',
        inputSchema: {
          type: 'object',
          properties: {
            messageId: {
              type: 'string',
              description: 'ID of the message to acknowledge'
            },
            respondingAgentId: {
              type: 'string',
              description: 'ID of the agent acknowledging the message'
            }
          },
          required: ['messageId', 'respondingAgentId']
        }
      }
    ];
  }

  // =============================================================================
  // MCP TOOL HANDLERS
  // =============================================================================

  async handleToolCall(name: string, args: any): Promise<any> {
    try {
      switch (name) {
        case 'nlacs_register_agent':
          await this.nlacs.registerAgent({
            agentId: args.agentId,
            agentType: args.agentType,
            capabilities: args.capabilities,
            status: 'online',
            contextCategories: args.contextCategories as ContextCategory[],
            projectScopes: args.projectScopes as ProjectScope[],
            maxPrivacyLevel: args.maxPrivacyLevel as PrivacyLevel,
            metadata: {
              version: '1.0.0',
              responseTime: 0,
              reliability: 1.0
            }
          });
          return {
            success: true,
            message: `Agent ${args.agentId} registered successfully`,
            agentId: args.agentId
          };

        case 'nlacs_send_direct_message':
          const messageId = await this.nlacs.sendDirectMessage(
            args.fromAgentId,
            args.toAgentId,
            args.content,
            args.messageType || 'request',
            args.priority || 'normal',
            args.contextCategory as ContextCategory,
            args.projectContext
          );
          return {
            success: true,
            messageId,
            message: `Direct message sent from ${args.fromAgentId} to ${args.toAgentId}`
          };

        case 'nlacs_start_coordination_session':
          const sessionId = await this.nlacs.startCoordinationSession(
            args.teamLead,
            args.participants,
            args.objective,
            args.contextCategory as ContextCategory,
            args.projectContext
          );
          return {
            success: true,
            sessionId,
            message: `Coordination session started with ${args.participants.length} participants`,
            teamLead: args.teamLead,
            objective: args.objective
          };

        case 'nlacs_get_registered_agents':
          let agents = this.nlacs.getRegisteredAgents();
          
          if (args.capability) {
            agents = this.nlacs.getAgentsByCapability(args.capability);
          }
          if (args.contextCategory) {
            agents = this.nlacs.getAgentsByContext(args.contextCategory as ContextCategory);
          }
          if (args.status) {
            agents = agents.filter(agent => agent.status === args.status);
          }

          return {
            success: true,
            agents: agents.map(agent => ({
              agentId: agent.agentId,
              agentType: agent.agentType,
              capabilities: agent.capabilities,
              status: agent.status,
              contextCategories: agent.contextCategories,
              projectScopes: agent.projectScopes,
              lastSeen: agent.lastSeen
            })),
            totalCount: agents.length
          };

        case 'nlacs_add_coordination_message':
          await this.nlacs.addCoordinationMessage(
            args.sessionId,
            args.agentId,
            args.content,
            args.messageType || 'update'
          );
          return {
            success: true,
            message: `Message added to coordination session ${args.sessionId}`,
            sessionId: args.sessionId,
            agentId: args.agentId
          };

        case 'nlacs_get_system_status':
          const status = this.nlacs.getSystemStatus();
          return {
            success: true,
            status,
            timestamp: new Date().toISOString()
          };

        case 'nlacs_acknowledge_message':
          await this.nlacs.acknowledgeMessage(args.messageId, args.respondingAgentId);
          return {
            success: true,
            message: `Message ${args.messageId} acknowledged by ${args.respondingAgentId}`,
            messageId: args.messageId
          };

        default:
          throw new Error(`Unknown NLACS tool: ${name}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        toolName: name
      };
    }
  }

  // =============================================================================
  // INTEGRATION HELPERS
  // =============================================================================

  setupEventForwarding(): void {
    // Forward NLACS events to external systems via MCP
    this.nlacs.on('agentRegistered', (data) => {
      console.log('[NLACSMCPTools] Agent registered event:', data);
    });

    this.nlacs.on('directMessageSent', (data) => {
      console.log('[NLACSMCPTools] Direct message sent event:', data);
    });

    this.nlacs.on('coordinationSessionStarted', (data) => {
      console.log('[NLACSMCPTools] Coordination session started event:', data);
    });

    this.nlacs.on('messageDelivered', (data) => {
      console.log('[NLACSMCPTools] Message delivered event:', data);
    });

    console.log('[NLACSMCPTools] Event forwarding setup complete');
  }
}
