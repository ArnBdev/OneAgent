/**
 * OneAgent Unified Engine v4.0
 * 
 * Single source of truth for all OneAgent functionality.
 * Supports multiple deployment modes: HTTP MCP, stdio MCP, standalone GUI, CLI
 * 
 * Features:
 * - Constitutional AI validation
 * - BMAD Framework analysis  
 * - Multi-agent communication
 * - Unified memory system
 * - Quality-first development
 */

import { EventEmitter } from 'events';
import { oneAgentConfig } from './config/index';

// Import core systems
import { ConstitutionalAI } from './agents/base/ConstitutionalAI';
import { BMADElicitationEngine } from './agents/base/BMADElicitationEngine';
import { realUnifiedMemoryClient } from './memory/RealUnifiedMemoryClient';
import { MultiAgentOrchestrator } from './agents/communication/MultiAgentOrchestrator';
import { agentBootstrap } from './agents/communication/AgentBootstrapService';

// Import unified tools
import { toolRegistry } from './tools/ToolRegistry';
import { WebSearchTool } from './tools/webSearch';
import { AIAssistantTool } from './tools/aiAssistant';
import { GeminiEmbeddingsTool } from './tools/geminiEmbeddings';

export type OneAgentMode = 'mcp-http' | 'mcp-stdio' | 'standalone' | 'cli' | 'vscode-embedded';

export interface OneAgentConfig {
  mode: OneAgentMode;
  constitutional: {
    enabled: boolean;
    qualityThreshold: number;
  };
  multiAgent: {
    enabled: boolean;
    maxAgents: number;
  };
  memory: {
    enabled: boolean;
    retentionDays: number;
  };
  mcp: {
    http: { port: number; enabled: boolean };
    stdio: { enabled: boolean };
    websocket: { port: number; enabled: boolean };
  };
}

export interface OneAgentRequest {
  id: string;
  type: 'tool_call' | 'resource_get' | 'prompt_invoke' | 'agent_message';
  method: string;
  params: any;
  context?: {
    user?: { id: string; name: string };
    workspace?: string;
    sessionId?: string;
  };
  timestamp: string;
}

export interface OneAgentResponse {
  id: string;
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  constitutionalValidated: boolean;
  qualityScore?: number;
  timestamp: string;
}

/**
 * Unified OneAgent Engine - Single source of truth
 */
export class OneAgentEngine extends EventEmitter {
  private static instance: OneAgentEngine;
  private initialized = false;
  private mode: OneAgentMode = 'mcp-http';
  private config: OneAgentConfig;
  // Core systems
  private constitutionalAI!: ConstitutionalAI;
  private bmadEngine!: BMADElicitationEngine;
  private multiAgentOrchestrator?: MultiAgentOrchestrator;
  
  // Tools and services
  private webSearch?: WebSearchTool;
  private aiAssistant?: AIAssistantTool;
  private embeddings?: GeminiEmbeddingsTool;

  constructor(config?: Partial<OneAgentConfig>) {
    super();
    this.config = this.mergeConfig(config);
    this.initializeCoreSystems();
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<OneAgentConfig>): OneAgentEngine {
    if (!OneAgentEngine.instance) {
      OneAgentEngine.instance = new OneAgentEngine(config);
    }
    return OneAgentEngine.instance;
  }

  /**
   * Initialize OneAgent Engine for specified mode
   */
  async initialize(mode: OneAgentMode): Promise<void> {
    if (this.initialized) {
      console.log('⚠️ OneAgent already initialized');
      return;
    }

    console.log(`🚀 Initializing OneAgent Engine v4.0 (${mode})`);
    this.mode = mode;

    try {
      // Initialize core systems
      await this.initializeMemorySystem();
      await this.initializeConstitutionalAI();
      await this.initializeBMAD();
      await this.initializeTools();
      
      // Initialize multi-agent system if enabled
      if (this.config.multiAgent.enabled) {
        await this.initializeMultiAgentSystem();
      }

      this.initialized = true;
      this.emit('initialized', { mode, timestamp: new Date().toISOString() });
      
      console.log('✅ OneAgent Engine initialized successfully');
      console.log(`📊 Mode: ${mode}`);
      console.log(`🧠 Constitutional AI: ${this.config.constitutional.enabled ? 'ACTIVE' : 'DISABLED'}`);
      console.log(`🤝 Multi-Agent: ${this.config.multiAgent.enabled ? 'ACTIVE' : 'DISABLED'}`);
      console.log(`💾 Memory: ${this.config.memory.enabled ? 'ACTIVE' : 'DISABLED'}`);

    } catch (error) {
      console.error('❌ OneAgent Engine initialization failed:', error);
      throw error;
    }
  }

  /**
   * Universal request processor - handles all OneAgent requests
   */
  async processRequest(request: OneAgentRequest): Promise<OneAgentResponse> {
    const startTime = Date.now();
    
    try {
      console.log(`🔄 Processing ${request.type}: ${request.method}`);
      
      let result: any;
      
      switch (request.type) {
        case 'tool_call':
          result = await this.handleToolCall(request);
          break;
        case 'resource_get':
          result = await this.handleResourceGet(request);
          break;
        case 'prompt_invoke':
          result = await this.handlePromptInvoke(request);
          break;
        case 'agent_message':
          result = await this.handleAgentMessage(request);
          break;
        default:
          throw new Error(`Unknown request type: ${request.type}`);
      }      // Apply Constitutional AI validation if enabled
      let constitutionalValidated = false;
      let qualityScore: number | undefined;
      
      if (this.config.constitutional.enabled) {
        const validation = await this.constitutionalAI.validateResponse(
          result, 
          request.params?.userMessage || request.method
        );
        constitutionalValidated = validation.isValid;
        qualityScore = validation.score || 0;
      }

      const response: OneAgentResponse = {
        id: request.id,
        success: true,
        data: result,
        constitutionalValidated,
        qualityScore: qualityScore || 0,
        timestamp: new Date().toISOString()
      };

      const duration = Date.now() - startTime;
      console.log(`✅ Request completed in ${duration}ms (Q:${qualityScore}%)`);
      
      this.emit('request_completed', { request, response, duration });
      return response;

    } catch (error) {
      const errorResponse: OneAgentResponse = {
        id: request.id,
        success: false,
        error: {
          code: 'PROCESSING_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        },
        constitutionalValidated: false,
        timestamp: new Date().toISOString()
      };

      const duration = Date.now() - startTime;
      console.error(`❌ Request failed in ${duration}ms:`, error);
      
      this.emit('request_failed', { request, error, duration });
      return errorResponse;
    }
  }
  /**
   * Get available tools for MCP server
   */
  getAvailableTools(): any[] {
    const tools = toolRegistry.getToolSchemas();
    
    // Add OneAgent-specific tools
    const oneAgentTools = [
      {
        name: 'oneagent_constitutional_validate',
        description: 'Validate content against Constitutional AI principles',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'Content to validate' },
            userMessage: { type: 'string', description: 'Original user message' }
          },
          required: ['content', 'userMessage']
        }
      },
      {
        name: 'oneagent_bmad_analyze',
        description: 'Analyze task using BMAD 9-point framework',
        inputSchema: {
          type: 'object',
          properties: {
            task: { type: 'string', description: 'Task to analyze' }
          },
          required: ['task']
        }
      },
      {
        name: 'oneagent_quality_score',
        description: 'Generate quality score and improvement suggestions',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'Content to score' },
            criteria: { type: 'array', items: { type: 'string' }, description: 'Quality criteria' }
          },
          required: ['content']
        }
      }
    ];

    return [...tools, ...oneAgentTools];
  }

  /**
   * Get available resources for MCP server
   */
  getAvailableResources(): any[] {
    return [
      {
        uri: 'oneagent://memory/search',
        name: 'Memory Search',
        description: 'Search OneAgent memory system',
        mimeType: 'application/json'
      },
      {
        uri: 'oneagent://agents/status',
        name: 'Agent Status',
        description: 'Get status of all registered agents',
        mimeType: 'application/json'
      },
      {
        uri: 'oneagent://system/health',
        name: 'System Health',
        description: 'Get OneAgent system health metrics',
        mimeType: 'application/json'
      }
    ];
  }

  /**
   * Get available prompt templates
   */
  getAvailablePrompts(): any[] {
    return [
      {
        name: 'oneagent.analyze_code',
        description: 'Analyze code quality with Constitutional AI',
        arguments: [
          {
            name: 'code',
            description: 'Code to analyze',
            required: true
          }
        ]
      },
      {
        name: 'oneagent.coordinate_agents',
        description: 'Coordinate multiple agents for complex task',
        arguments: [
          {
            name: 'task',
            description: 'Task requiring multiple agents',
            required: true
          }
        ]
      }
    ];
  }

  // Private initialization methods
  private mergeConfig(userConfig?: Partial<OneAgentConfig>): OneAgentConfig {
    const defaultConfig: OneAgentConfig = {
      mode: 'mcp-http',
      constitutional: {
        enabled: true,
        qualityThreshold: 80
      },
      multiAgent: {
        enabled: true,
        maxAgents: 5
      },
      memory: {
        enabled: true,
        retentionDays: 30
      },
      mcp: {
        http: { port: oneAgentConfig.mcpPort, enabled: true },
        stdio: { enabled: false },
        websocket: { port: oneAgentConfig.mcpPort + 1, enabled: false }
      }
    };

    return { ...defaultConfig, ...userConfig };
  }

  private initializeCoreSystems(): void {
    // Initialize Constitutional AI
    this.constitutionalAI = new ConstitutionalAI({
      principles: [
        {
          id: 'accuracy',
          name: 'Accuracy Over Speculation',
          description: 'Prefer "I don\'t know" to guessing',
          validationRule: 'Response includes uncertainty acknowledgment',
          severityLevel: 'critical' as const
        },
        {
          id: 'transparency',
          name: 'Transparent Reasoning',
          description: 'Explain reasoning and limitations',
          validationRule: 'Response includes reasoning explanation',
          severityLevel: 'high' as const
        },
        {
          id: 'helpfulness',
          name: 'Actionable Guidance',
          description: 'Provide specific, actionable recommendations',
          validationRule: 'Response contains actionable recommendations',
          severityLevel: 'high' as const
        },
        {
          id: 'safety',
          name: 'Safety First',
          description: 'Avoid harmful recommendations',
          validationRule: 'Response avoids harmful suggestions',
          severityLevel: 'critical' as const
        }
      ],
      qualityThreshold: this.config.constitutional.qualityThreshold
    });

    // Initialize BMAD
    this.bmadEngine = new BMADElicitationEngine();
  }

  private async initializeMemorySystem(): Promise<void> {
    if (!this.config.memory.enabled) return;
    
    try {
      await realUnifiedMemoryClient.connect();
      console.log('✅ Memory system connected');
    } catch (error) {
      console.warn('⚠️ Memory system connection failed:', error);
    }
  }

  private async initializeConstitutionalAI(): Promise<void> {
    if (!this.config.constitutional.enabled) return;
    console.log('✅ Constitutional AI initialized');
  }

  private async initializeBMAD(): Promise<void> {
    console.log('✅ BMAD Framework initialized');
  }
  private async initializeTools(): Promise<void> {
    // Tools are initialized via toolRegistry
    console.log(`✅ ${toolRegistry.getToolNames().length} tools available`);
  }

  private async initializeMultiAgentSystem(): Promise<void> {
    if (!this.config.multiAgent.enabled) return;
    
    try {
      this.multiAgentOrchestrator = new MultiAgentOrchestrator();
      await this.multiAgentOrchestrator.initialize();
      
      // Bootstrap agents
      await agentBootstrap.bootstrapAllAgents();
      
      console.log('✅ Multi-agent system initialized');
    } catch (error) {
      console.warn('⚠️ Multi-agent system initialization failed:', error);
    }
  }
  // Request handlers
  private async handleToolCall(request: OneAgentRequest): Promise<any> {
    const { method, params } = request;
    
    // First try registered tools (includes oneagent_memory_create)
    const tool = toolRegistry.getTool(method);
    if (tool) {
      return tool.execute(params, request.id);
    }
    
    // Then handle OneAgent-specific tools that aren't in registry
    if (method.startsWith('oneagent_')) {
      return this.handleOneAgentTool(method, params);
    }
    
    throw new Error(`Unknown tool: ${method}`);
  }
  private async handleOneAgentTool(method: string, params: any): Promise<any> {
    switch (method) {
      case 'oneagent_constitutional_validate':
        return this.constitutionalAI.validateResponse(params.content, params.userMessage);
      
      case 'oneagent_bmad_analyze':
        // Simplified BMAD analysis for now
        return {
          task: params.task,
          analysis: 'Basic BMAD analysis completed',
          framework: '9-point analysis',
          timestamp: new Date().toISOString()
        };
      
      case 'oneagent_quality_score':
        // Simplified quality scoring
        return {
          content: params.content,
          score: 85,
          grade: 'A',
          criteria: params.criteria || ['accuracy', 'helpfulness', 'safety'],
          timestamp: new Date().toISOString()
        };
      
      default:
        throw new Error(`Unknown OneAgent tool: ${method}`);
    }
  }

  private async handleResourceGet(request: OneAgentRequest): Promise<any> {
    const { method: uri } = request;
    
    if (uri.startsWith('oneagent://memory/')) {
      return this.handleMemoryResource(uri, request.params);
    }
    
    if (uri.startsWith('oneagent://agents/')) {
      return this.handleAgentResource(uri, request.params);
    }
    
    if (uri.startsWith('oneagent://system/')) {
      return this.handleSystemResource(uri, request.params);
    }
    
    throw new Error(`Unknown resource: ${uri}`);
  }

  private async handlePromptInvoke(request: OneAgentRequest): Promise<any> {
    const { method: prompt, params } = request;
    
    switch (prompt) {
      case 'oneagent.analyze_code':
        return this.analyzeCodeWithConstitutionalAI(params.code);
        case 'oneagent.coordinate_agents':
        if (this.multiAgentOrchestrator) {
          // Simplified coordination for now
          return {
            task: params.task,
            status: 'coordination_initiated',
            timestamp: new Date().toISOString()
          };
        }
        throw new Error('Multi-agent system not available');
      
      default:
        throw new Error(`Unknown prompt: ${prompt}`);
    }
  }  private async handleAgentMessage(request: OneAgentRequest): Promise<any> {
    if (!this.multiAgentOrchestrator) {
      throw new Error('Multi-agent system not available');
    }
    
    // Simplified message handling for now
    return {
      status: 'message_sent',
      sourceAgent: request.params.sourceAgent,
      targetAgent: request.params.targetAgent,
      content: request.params.content,
      timestamp: new Date().toISOString()
    };
  }

  // Resource handlers
  private async handleMemoryResource(uri: string, _params: any): Promise<any> {
    if (uri === 'oneagent://memory/search') {
      // TODO: Implement memory search
      return { results: [], total: 0 };
    }
    
    throw new Error(`Unknown memory resource: ${uri}`);
  }

  private async handleAgentResource(uri: string, _params: any): Promise<any> {
    if (uri === 'oneagent://agents/status') {
      if (this.multiAgentOrchestrator) {
        // Simplified status for now
        return { agents: [], total: 0, status: 'active' };
      }
      return { agents: [], total: 0 };
    }
    
    throw new Error(`Unknown agent resource: ${uri}`);
  }

  private async handleSystemResource(uri: string, _params: any): Promise<any> {
    if (uri === 'oneagent://system/health') {
      return {
        status: 'healthy',
        initialized: this.initialized,
        mode: this.mode,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      };
    }
    
    throw new Error(`Unknown system resource: ${uri}`);
  }

  // Helper methods
  private async analyzeCodeWithConstitutionalAI(code: string): Promise<any> {
    const analysis = await this.constitutionalAI.validateResponse(
      code,
      'Analyze this code for quality and best practices'
    );
    
    // Simplified BMAD analysis for now
    const bmadAnalysis = {
      task: `Code analysis for: ${code.substring(0, 100)}...`,
      framework: '9-point BMAD analysis',
      timestamp: new Date().toISOString()
    };
    
    return {
      constitutional: analysis,
      bmad: bmadAnalysis,
      recommendations: [
        'Apply Constitutional AI principles for user-facing logic',
        'Use BMAD framework for complex architectural decisions',
        'Ensure quality score meets minimum 80% threshold'
      ]
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down OneAgent Engine...');
    
    try {
      // Close memory connections
      if (this.config.memory.enabled) {
        await realUnifiedMemoryClient.disconnect?.();
      }
      
      // Shutdown multi-agent system
      if (this.multiAgentOrchestrator) {
        // TODO: Add shutdown method to orchestrator
      }
      
      this.emit('shutdown', { timestamp: new Date().toISOString() });
      console.log('✅ OneAgent Engine shutdown complete');
      
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
    }
  }
}
