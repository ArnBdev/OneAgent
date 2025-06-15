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

  /**
   * Create auto-registration for SecurityAgent - Security and Compliance Specialist
   */
  static createSecurityAgent(sharedDiscoveryService?: AgentDiscoveryService): AgentAutoRegistration {
    const config: AgentRegistrationConfig = {
      agentId: 'SecurityAgent-v4.0',
      agentType: 'security',
      capabilities: [
        {
          name: 'security_audit',
          description: 'Comprehensive security audits and vulnerability assessment',
          version: '4.0.0',
          qualityThreshold: 95
        },
        {
          name: 'dependency_scan',
          description: 'Scan dependencies for known vulnerabilities',
          version: '4.0.0',
          qualityThreshold: 93
        },
        {
          name: 'compliance_check',
          description: 'Check compliance with security standards (OWASP, GDPR, SOC2)',
          version: '4.0.0',
          qualityThreshold: 94
        },
        {
          name: 'encryption_validate',
          description: 'Validate encryption implementations and key management',
          version: '4.0.0',
          qualityThreshold: 96
        },
        {
          name: 'penetration_test',
          description: 'Automated penetration testing and security validation',
          version: '4.0.0',
          qualityThreshold: 92
        },
        {
          name: 'secure_coding',
          description: 'Secure coding review and security best practices',
          version: '4.0.0',
          qualityThreshold: 91
        }
      ],
      endpoint: `http://localhost:${oneAgentConfig.mcpPort}/agents/security`,
      qualityScore: 94
    };
    
    if (sharedDiscoveryService) {
      config.sharedDiscoveryService = sharedDiscoveryService;
    }
    
    return new AgentAutoRegistration(config);
  }

  /**
   * Create auto-registration for DataAgent - Data Analysis and ML Specialist
   */
  static createDataAgent(sharedDiscoveryService?: AgentDiscoveryService): AgentAutoRegistration {
    const config: AgentRegistrationConfig = {
      agentId: 'DataAgent-v4.0',
      agentType: 'data-analytics',
      capabilities: [
        {
          name: 'data_analysis',
          description: 'Statistical analysis and data pattern recognition',
          version: '4.0.0',
          qualityThreshold: 90
        },
        {
          name: 'visualization_create',
          description: 'Create charts, graphs, and interactive visualizations',
          version: '4.0.0',
          qualityThreshold: 88
        },
        {
          name: 'ml_insights',
          description: 'Machine learning model insights and predictions',
          version: '4.0.0',
          qualityThreshold: 92
        },
        {
          name: 'data_cleaning',
          description: 'Data cleaning, validation, and preprocessing',
          version: '4.0.0',
          qualityThreshold: 89
        },
        {
          name: 'performance_metrics',
          description: 'System performance metrics analysis and recommendations',
          version: '4.0.0',
          qualityThreshold: 91
        },
        {
          name: 'report_generation',
          description: 'Automated report generation with insights and recommendations',
          version: '4.0.0',
          qualityThreshold: 87
        }
      ],
      endpoint: `http://localhost:${oneAgentConfig.mcpPort}/agents/data`,
      qualityScore: 90
    };
    
    if (sharedDiscoveryService) {
      config.sharedDiscoveryService = sharedDiscoveryService;
    }
    
    return new AgentAutoRegistration(config);
  }

  /**
   * Create auto-registration for UIAgent - UI/UX Design and Component Specialist
   */
  static createUIAgent(sharedDiscoveryService?: AgentDiscoveryService): AgentAutoRegistration {
    const config: AgentRegistrationConfig = {
      agentId: 'UIAgent-v4.0',
      agentType: 'ui-ux',
      capabilities: [
        {
          name: 'component_design',
          description: 'Design and create reusable UI components',
          version: '4.0.0',
          qualityThreshold: 90
        },
        {
          name: 'accessibility_audit',
          description: 'Accessibility audits and WCAG compliance validation',
          version: '4.0.0',
          qualityThreshold: 93
        },
        {
          name: 'responsive_design',
          description: 'Responsive design implementation and testing',
          version: '4.0.0',
          qualityThreshold: 89
        },
        {
          name: 'ux_optimization',
          description: 'User experience optimization and usability testing',
          version: '4.0.0',
          qualityThreshold: 92
        },
        {
          name: 'design_system',
          description: 'Design system creation and maintenance',
          version: '4.0.0',
          qualityThreshold: 91
        },
        {
          name: 'style_guide',
          description: 'Style guide generation and CSS optimization',
          version: '4.0.0',
          qualityThreshold: 88
        }
      ],
      endpoint: `http://localhost:${oneAgentConfig.mcpPort}/agents/ui`,
      qualityScore: 91
    };
    
    if (sharedDiscoveryService) {
      config.sharedDiscoveryService = sharedDiscoveryService;
    }
    
    return new AgentAutoRegistration(config);
  }
  /**
   * Create auto-registration for APIAgent - API Design and Integration Specialist
   */
  static createAPIAgent(sharedDiscoveryService?: AgentDiscoveryService): AgentAutoRegistration {
    const config: AgentRegistrationConfig = {
      agentId: 'APIAgent-v4.0',
      agentType: 'api-integration',
      capabilities: [
        {
          name: 'api_design',
          description: 'RESTful API design with OpenAPI/Swagger documentation',
          version: '4.0.0',
          qualityThreshold: 92
        },
        {
          name: 'endpoint_testing',
          description: 'Automated API endpoint testing and validation',
          version: '4.0.0',
          qualityThreshold: 90
        },
        {
          name: 'integration_setup',
          description: 'Third-party API integration and authentication setup',
          version: '4.0.0',
          qualityThreshold: 91
        },
        {
          name: 'schema_validation',
          description: 'API schema validation and contract testing',
          version: '4.0.0',
          qualityThreshold: 93
        },
        {
          name: 'rate_limiting',
          description: 'Rate limiting and API performance optimization',
          version: '4.0.0',
          qualityThreshold: 89
        },
        {
          name: 'webhook_management',
          description: 'Webhook implementation and event-driven architecture',
          version: '4.0.0',
          qualityThreshold: 88
        }
      ],
      endpoint: `http://localhost:${oneAgentConfig.mcpPort}/agents/api`,
      qualityScore: 91
    };
    
    if (sharedDiscoveryService) {
      config.sharedDiscoveryService = sharedDiscoveryService;
    }
    
    return new AgentAutoRegistration(config);
  }
}
