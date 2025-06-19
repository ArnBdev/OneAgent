/**
 * NLACS Integration Layer - Complete System Integration
 * Connects Enhanced NLACS, MCP Tools, and Standalone Systems
 * 
 * @version 1.0.0-INTEGRATED
 * @author OneAgent Professional Development Platform
 */

import { EnhancedNLACSCore } from './EnhancedNLACSCore.js';
import { NLACSMCPTools } from './NLACSMCPTools.js';
import { StandaloneNLACSSystem } from './StandaloneNLACSSystem.js';
import { ContextCategory } from '../types/oneagent-backbone-types.js';

export interface NLACSIntegrationConfig {
  enableMCPTools: boolean;
  enableStandaloneMode: boolean;
  systemId?: string;
  autoDiscovery: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Complete NLACS Integration System
 * Provides unified access to all NLACS capabilities
 */
export class NLACSIntegration {
  private core: EnhancedNLACSCore;
  private mcpTools?: NLACSMCPTools;
  private standaloneSystem?: StandaloneNLACSSystem;
  private config: NLACSIntegrationConfig;

  constructor(config: Partial<NLACSIntegrationConfig> = {}) {
    this.config = {
      enableMCPTools: true,
      enableStandaloneMode: false,
      autoDiscovery: true,
      logLevel: 'info',
      ...config
    };

    // Initialize core NLACS
    this.core = new EnhancedNLACSCore();
    
    // Initialize MCP tools if enabled
    if (this.config.enableMCPTools) {
      this.mcpTools = new NLACSMCPTools(this.core);
      this.mcpTools.setupEventForwarding();
    }

    // Initialize standalone system if enabled
    if (this.config.enableStandaloneMode && this.config.systemId) {
      this.standaloneSystem = StandaloneNLACSSystem.createDevelopmentSystem(this.config.systemId);
    }

    this.log('info', 'NLACS Integration initialized', { config: this.config });
  }

  // =============================================================================
  // UNIFIED API
  // =============================================================================

  /**
   * Start all enabled NLACS subsystems
   */
  async start(): Promise<void> {
    try {
      if (this.standaloneSystem) {
        await this.standaloneSystem.start();
        this.log('info', 'Standalone NLACS system started');
      }

      this.log('info', 'NLACS Integration fully operational');
    } catch (error) {
      this.log('error', 'Failed to start NLACS Integration', { error });
      throw error;
    }
  }

  /**
   * Stop all NLACS subsystems
   */
  async stop(): Promise<void> {
    try {
      if (this.standaloneSystem) {
        await this.standaloneSystem.stop();
        this.log('info', 'Standalone NLACS system stopped');
      }

      this.log('info', 'NLACS Integration stopped');
    } catch (error) {
      this.log('error', 'Error stopping NLACS Integration', { error });
      throw error;
    }
  }

  // =============================================================================
  // CORE NLACS ACCESS
  // =============================================================================

  getCore(): EnhancedNLACSCore {
    return this.core;
  }

  async registerAgent(agentConfig: any): Promise<void> {
    return await this.core.registerAgent(agentConfig);
  }

  async sendDirectMessage(
    fromAgentId: string,
    toAgentId: string,
    content: string,
    contextCategory: ContextCategory,
    options: any = {}
  ): Promise<string> {
    return await this.core.sendDirectMessage(
      fromAgentId,
      toAgentId,
      content,
      options.messageType || 'request',
      options.priority || 'normal',
      contextCategory,
      options.projectContext
    );
  }

  async startCoordination(
    teamLead: string,
    participants: string[],
    objective: string,
    contextCategory: ContextCategory,
    projectContext?: any
  ): Promise<string> {
    return await this.core.startCoordinationSession(
      teamLead,
      participants,
      objective,
      contextCategory,
      projectContext
    );
  }

  // =============================================================================
  // MCP TOOLS ACCESS
  // =============================================================================

  getMCPTools(): any[] {
    return this.mcpTools?.getTools() || [];
  }

  async handleMCPToolCall(toolName: string, args: any): Promise<any> {
    if (!this.mcpTools) {
      throw new Error('MCP tools not enabled');
    }
    return await this.mcpTools.handleToolCall(toolName, args);
  }

  // =============================================================================
  // STANDALONE SYSTEM ACCESS
  // =============================================================================

  getStandaloneSystem(): StandaloneNLACSSystem | undefined {
    return this.standaloneSystem;
  }

  async enableStandaloneMode(systemId: string, systemType: 'development' | 'qa' | 'documentation' = 'development'): Promise<void> {
    if (this.standaloneSystem) {
      this.log('warn', 'Standalone system already enabled');
      return;
    }

    switch (systemType) {
      case 'development':
        this.standaloneSystem = StandaloneNLACSSystem.createDevelopmentSystem(systemId);
        break;
      case 'qa':
        this.standaloneSystem = StandaloneNLACSSystem.createQASystem(systemId);
        break;
      case 'documentation':
        this.standaloneSystem = StandaloneNLACSSystem.createDocumentationSystem(systemId);
        break;
    }

    await this.standaloneSystem.start();
    this.log('info', 'Standalone system enabled', { systemId, systemType });
  }

  // =============================================================================
  // SYSTEM STATUS & MONITORING
  // =============================================================================

  getSystemStatus() {
    return {
      core: this.core.getSystemStatus(),
      mcpToolsEnabled: !!this.mcpTools,
      standaloneEnabled: !!this.standaloneSystem,
      standaloneStatus: this.standaloneSystem?.getSystemStatus(),
      config: this.config,
      timestamp: new Date().toISOString()
    };
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private log(level: string, message: string, data?: any): void {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const configLevel = levels[this.config.logLevel];
    const messageLevel = levels[level as keyof typeof levels];

    if (messageLevel >= configLevel) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [NLACSIntegration] [${level.toUpperCase()}] ${message}`, data || '');
    }
  }

  // =============================================================================
  // FACTORY METHODS
  // =============================================================================

  /**
   * Create NLACS Integration for GitHub Copilot MCP usage
   */
  static forMCPIntegration(): NLACSIntegration {
    return new NLACSIntegration({
      enableMCPTools: true,
      enableStandaloneMode: false,
      autoDiscovery: true,
      logLevel: 'info'
    });
  }

  /**
   * Create NLACS Integration for standalone OneAgent system
   */
  static forStandaloneSystem(systemId: string): NLACSIntegration {
    return new NLACSIntegration({
      enableMCPTools: true,
      enableStandaloneMode: true,
      systemId,
      autoDiscovery: true,
      logLevel: 'info'
    });
  }
  /**
   * Create full NLACS Integration with all features
   */
  static fullIntegration(systemId?: string): NLACSIntegration {
    const config: Partial<NLACSIntegrationConfig> = {
      enableMCPTools: true,
      enableStandaloneMode: !!systemId,
      autoDiscovery: true,
      logLevel: 'debug'
    };
    
    if (systemId) {
      config.systemId = systemId;
    }
    
    return new NLACSIntegration(config);
  }
}

// =============================================================================
// EXPORT CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Quick setup for GitHub Copilot MCP integration
 */
export async function setupNLACSForMCP(): Promise<NLACSIntegration> {
  const integration = NLACSIntegration.forMCPIntegration();
  await integration.start();
  return integration;
}

/**
 * Quick setup for standalone OneAgent system
 */
export async function setupNLACSForStandalone(systemId: string): Promise<NLACSIntegration> {
  const integration = NLACSIntegration.forStandaloneSystem(systemId);
  await integration.start();
  return integration;
}

/**
 * Get all available NLACS MCP tools for registration
 */
export function getNLACSMCPTools(): any[] {
  const integration = NLACSIntegration.forMCPIntegration();
  return integration.getMCPTools();
}
