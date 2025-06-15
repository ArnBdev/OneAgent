/**
 * AgentAutoRegistration - Lightweight auto-registration for specialized agents
 * 
 * This allows specialized agents (DevAgent, OfficeAgent, etc.) to automatically
 * respond to CoreAgent's "Who's awake?" discovery broadcasts and register themselves
 * without requiring manual MCP tool calls.
 * 
 * Usage: Each specialized agent imports this and calls startAutoRegistration()
 */

import { AgentDiscoveryService, AgentCapabilityResponse } from './AgentDiscoveryService';
import { oneAgentConfig } from '../../config/index';

export interface AgentRegistrationConfig {
  agentId: string;
  agentType: string;
  capabilities: Array<{
    name: string;
    description: string;
    version: string;
    qualityThreshold: number;
  }>;
  endpoint: string;
  qualityScore: number;
  port?: number;
  sharedDiscoveryService?: AgentDiscoveryService; // Use shared discovery service
}

/**
 * Lightweight auto-registration service for specialized agents
 * Automatically responds to discovery broadcasts from CoreAgent
 */
export class AgentAutoRegistration {
  private discoveryService: AgentDiscoveryService;
  private config: AgentRegistrationConfig;
  private isRegistered: boolean = false;

  constructor(config: AgentRegistrationConfig) {
    this.config = config;    // Use shared discovery service if provided, otherwise create new one
    this.discoveryService = config.sharedDiscoveryService || 
      new AgentDiscoveryService(config.agentId, config.port || oneAgentConfig.mcpPort);
    this.setupAutoDiscovery();
  }

  /**
   * Start auto-registration - agent will respond to "Who's awake?" broadcasts
   */
  async startAutoRegistration(): Promise<void> {
    console.log(`🎯 ${this.config.agentId}: Starting auto-registration...`);
    
    const capabilityResponse: AgentCapabilityResponse = {
      agentId: this.config.agentId,
      agentType: this.config.agentType,
      capabilities: this.config.capabilities,
      endpoint: this.config.endpoint,
      qualityScore: this.config.qualityScore,
      status: 'online',
      metadata: {
        autoRegistered: true,
        registrationTime: new Date(),
        version: '4.0.0'
      }
    };

    // Set up response to discovery broadcasts
    await this.discoveryService.respondToDiscovery(capabilityResponse);
    this.isRegistered = true;
    
    console.log(`✅ ${this.config.agentId}: Auto-registration active - will respond to CoreAgent discovery`);
    console.log(`📢 Ready to say "Hey, what's up!" when CoreAgent asks "Who's awake?"`);
  }

  /**
   * Stop auto-registration and clean shutdown
   */
  async stopAutoRegistration(): Promise<void> {
    if (this.isRegistered) {
      await this.discoveryService.shutdown(this.config.agentId);
      this.isRegistered = false;
      console.log(`👋 ${this.config.agentId}: Auto-registration stopped`);
    }
  }

  /**
   * Check if agent is currently registered
   */
  isActive(): boolean {
    return this.isRegistered;
  }

  /**
   * Update agent capabilities dynamically
   */
  updateCapabilities(newCapabilities: Array<{
    name: string;
    description: string;
    version: string;
    qualityThreshold: number;
  }>): void {
    this.config.capabilities = newCapabilities;
    console.log(`🔄 ${this.config.agentId}: Updated capabilities (${newCapabilities.length} total)`);
  }

  /**
   * Setup automatic discovery response
   */
  private setupAutoDiscovery(): void {
    // Listen for network events
    this.discoveryService.on('discovery_message', (message) => {
      if (message.type === 'DISCOVER_AGENTS') {
        console.log(`📡 ${this.config.agentId}: Heard CoreAgent asking "Who's awake?" - responding!`);
      }
    });

    console.log(`🎯 ${this.config.agentId}: Auto-discovery setup complete`);
  }

  /**
   * Get current agent status
   */
  getStatus(): {
    agentId: string;
    isRegistered: boolean;
    lastSeen: Date;
    capabilities: number;
    qualityScore: number;
  } {
    return {
      agentId: this.config.agentId,
      isRegistered: this.isRegistered,
      lastSeen: new Date(),
      capabilities: this.config.capabilities.length,
      qualityScore: this.config.qualityScore
    };
  }
}

/**
 * Factory function to create auto-registration for common agent types
 */
export class AgentAutoRegistrationFactory {  static createDevAgent(sharedDiscoveryService?: AgentDiscoveryService): AgentAutoRegistration {
    const config: AgentRegistrationConfig = {
      agentId: 'DevAgent-v4.0',
      agentType: 'development',
      capabilities: [
        {
          name: 'code_analysis',
          description: 'TypeScript and JavaScript code analysis with quality metrics',
          version: '4.0.0',
          qualityThreshold: 88
        },
        {
          name: 'test_generation',
          description: 'Automated test generation with comprehensive coverage',
          version: '4.0.0',
          qualityThreshold: 86
        },
        {
          name: 'documentation_update',
          description: 'Intelligent documentation generation and maintenance',
          version: '4.0.0',
          qualityThreshold: 92
        },
        {
          name: 'refactoring_assistance',
          description: 'Code refactoring with safety guarantees',
          version: '4.0.0',
          qualityThreshold: 90
        },
        {
          name: 'performance_optimization',
          description: 'Performance analysis and optimization recommendations',
          version: '4.0.0',
          qualityThreshold: 89
        }
      ],
      endpoint: `http://localhost:${oneAgentConfig.mcpPort}/agents/dev`,
      qualityScore: 89
    };    
    if (sharedDiscoveryService) {
      config.sharedDiscoveryService = sharedDiscoveryService;
    }
    
    return new AgentAutoRegistration(config);
  }

  static createOfficeAgent(sharedDiscoveryService?: AgentDiscoveryService): AgentAutoRegistration {
    const config: AgentRegistrationConfig = {
      agentId: 'OfficeAgent-v2.0',
      agentType: 'office-productivity',
      capabilities: [
        {
          name: 'document_create',
          description: 'Create new documents with templates',
          version: '1.5.0',
          qualityThreshold: 89
        },
        {
          name: 'calendar_schedule',
          description: 'Schedule calendar events and meetings',
          version: '1.5.0',
          qualityThreshold: 91
        },
        {
          name: 'email_draft',
          description: 'Draft professional emails with tone control',
          version: '1.5.0',
          qualityThreshold: 93
        },
        {
          name: 'task_organize',
          description: 'Organize tasks by priority and criteria',
          version: '1.5.0',
          qualityThreshold: 88
        },
        {
          name: 'meeting_summarize',
          description: 'Summarize meeting notes and extract action items',
          version: '1.5.0',
          qualityThreshold: 94
        }
      ],
      endpoint: `http://localhost:${oneAgentConfig.mcpPort}/agents/office`,
      qualityScore: 91
    };
    
    if (sharedDiscoveryService) {
      config.sharedDiscoveryService = sharedDiscoveryService;
    }
    
    return new AgentAutoRegistration(config);
  }

  static createFitnessAgent(sharedDiscoveryService?: AgentDiscoveryService): AgentAutoRegistration {
    const config: AgentRegistrationConfig = {
      agentId: 'FitnessAgent-v1.0',
      agentType: 'fitness-wellness',
      capabilities: [
        {
          name: 'workout_plan',
          description: 'Create personalized workout plans based on goals and equipment',
          version: '1.3.0',
          qualityThreshold: 92
        },
        {
          name: 'nutrition_track',
          description: 'Track nutrition, calories, and macronutrients',
          version: '1.3.0',
          qualityThreshold: 89
        },
        {
          name: 'progress_monitor',
          description: 'Monitor fitness progress and metrics',
          version: '1.3.0',
          qualityThreshold: 90
        },
        {
          name: 'goal_set',
          description: 'Set and track fitness goals with timelines',
          version: '1.3.0',
          qualityThreshold: 88
        },
        {
          name: 'exercise_recommend',
          description: 'Recommend exercises by body part and difficulty',
          version: '1.3.0',
          qualityThreshold: 91
        }
      ],
      endpoint: `http://localhost:${oneAgentConfig.mcpPort}/agents/fitness`,
      qualityScore: 90
    };
    
    if (sharedDiscoveryService) {
      config.sharedDiscoveryService = sharedDiscoveryService;
    }
    
    return new AgentAutoRegistration(config);
  }

  static createTriageAgent(sharedDiscoveryService?: AgentDiscoveryService): AgentAutoRegistration {
    const config: AgentRegistrationConfig = {
      agentId: 'TriageAgent-v3.0',
      agentType: 'task-routing',
      capabilities: [
        {
          name: 'route_task',
          description: 'Route tasks to the most appropriate agent',
          version: '3.0.0',
          qualityThreshold: 96
        },
        {
          name: 'check_agent_health',
          description: 'Check health status of all agents',
          version: '3.0.0',
          qualityThreshold: 94
        },
        {
          name: 'get_task_history',
          description: 'Get history of task routing and execution',
          version: '3.0.0',
          qualityThreshold: 92
        },
        {
          name: 'force_recovery',
          description: 'Force recovery procedures for failed tasks',
          version: '3.0.0',
          qualityThreshold: 97
        },
        {
          name: 'memory_system_validation',
          description: 'Memory system validation and reality detection',
          version: '3.0.0',
          qualityThreshold: 95
        }
      ],
      endpoint: `http://localhost:${oneAgentConfig.mcpPort}/agents/triage`,
      qualityScore: 95
    };
    
    if (sharedDiscoveryService) {
      config.sharedDiscoveryService = sharedDiscoveryService;
    }
    
    return new AgentAutoRegistration(config);
  }

  /**
   * Create auto-registration for CoreAgent - System Foundation and Integration Hub
   */
  static createCoreAgent(sharedDiscoveryService?: AgentDiscoveryService): AgentAutoRegistration {    const config: AgentRegistrationConfig = {
      agentId: 'CoreAgent-v4.0',
      agentType: 'core',
      endpoint: `http://localhost:${oneAgentConfig.mcpPort}/core-agent`,
      qualityScore: 95,
      capabilities: [
        {
          name: 'system_coordination',
          description: 'Central system coordination and orchestration',
          version: '4.0.0',
          qualityThreshold: 95
        },
        {
          name: 'agent_integration',
          description: 'Multi-agent integration and lifecycle management',
          version: '4.0.0',
          qualityThreshold: 92
        },
        {
          name: 'service_management',
          description: 'Service delivery orchestration and management',
          version: '4.0.0',
          qualityThreshold: 90
        },
        {
          name: 'health_monitoring',
          description: 'System health monitoring and performance tracking',
          version: '4.0.0',
          qualityThreshold: 88
        },
        {
          name: 'resource_allocation',
          description: 'Resource management and allocation optimization',
          version: '4.0.0',
          qualityThreshold: 85
        },
        {
          name: 'security_management',
          description: 'Security and access control management',
          version: '4.0.0',
          qualityThreshold: 95
        },
        {
          name: 'rise_plus_methodology',
          description: 'R-I-S-E+ framework implementation and coordination',
          version: '4.0.0',
          qualityThreshold: 90
        },
        {
          name: 'constitutional_ai',
          description: 'Constitutional AI principles and validation',
          version: '4.0.0',
          qualityThreshold: 95
        },
        {
          name: 'quality_validation',
          description: 'System-wide quality validation and scoring',
          version: '4.0.0',
          qualityThreshold: 88
        },
        {
          name: 'advanced_prompting',
          description: 'Advanced prompt engineering coordination',
          version: '4.0.0',
          qualityThreshold: 85
        },
        {
          name: 'bmad_analysis',
          description: 'BMAD framework analysis and coordination',
          version: '4.0.0',
          qualityThreshold: 88
        },
        {
          name: 'chain_of_verification',
          description: 'Chain-of-Verification coordination and validation',
          version: '4.0.0',
          qualityThreshold: 90
        }      ],
      port: oneAgentConfig.mcpPort,
      ...(sharedDiscoveryService && { sharedDiscoveryService })
    };

    return new AgentAutoRegistration(config);
  }
}

export default AgentAutoRegistration;
