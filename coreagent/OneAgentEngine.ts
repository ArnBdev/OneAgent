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
import axios from 'axios';

// Import canonical types
import {
  UnifiedTimestamp,
  UnifiedMetadata,
  OneAgentRequestParams,
  OneAgentResponseData,
  ErrorDetails,
  RequestContext,
  ConstitutionalValidation,
  ToolResult,
  AgentAction,
  AgentCapability
} from './types/oneagent-backbone-types';

// Import core systems
import { ConstitutionalAI } from './agents/base/ConstitutionalAI';
import { BMADElicitationEngine } from './agents/base/BMADElicitationEngine';
import { OneAgentMemory, OneAgentMemoryConfig } from './memory/OneAgentMemory';
import { agentBootstrap } from './agents/communication/AgentBootstrapService';
import { createUnifiedTimestamp } from './utils/UnifiedBackboneService';

// Import unified tools
import { toolRegistry } from './tools/ToolRegistry';
import { WebSearchTool } from './tools/webSearch';
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
  params: OneAgentRequestParams;
  context?: RequestContext;
  timestamp: string;
}

export interface OneAgentResponse {
  id: string;
  success: boolean;
  data?: OneAgentResponseData;
  error?: ErrorDetails;
  constitutionalValidated: boolean;
  qualityScore?: number;
  timestamp: string;
}

// Type definitions for dynamic registration
export interface ToolDescriptor {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute?: (params: OneAgentRequestParams) => Promise<ToolResult> | ToolResult;
}

export interface ResourceDescriptor {
  uri: string;
  name: string;
  description: string;
  mimeType?: string;
  get?: () => Promise<ToolResult> | ToolResult;
}

export interface PromptDescriptor {
  name: string;
  description: string;
  arguments?: Array<{ name: string; description: string; required: boolean }>;
  invoke?: (params: OneAgentRequestParams) => Promise<ToolResult> | ToolResult;
}
export interface ResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}
export interface PromptDefinition {
  name: string;
  description: string;
  arguments: Array<{ name: string; description: string; required: boolean }>;
}

// A2A Multi-Agent Communication Interfaces
export interface A2AGroupSession {
  id: string;
  name: string;
  participants: string[];
  mode: 'collaborative' | 'competitive' | 'hierarchical';
  topic?: string;
  messages: A2AMessage[];
  createdAt: Date;
  status: 'active' | 'paused' | 'completed';
  metadata?: Record<string, unknown>;
}

export interface A2AMessage {
  id: string;
  sessionId: string;
  fromAgent: string;
  toAgent?: string; // Optional for broadcast messages
  message: string;
  messageType: 'update' | 'question' | 'decision' | 'action' | 'insight';
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface A2AAgent {
  id: string;
  name: string;
  capabilities: string[];
  lastActive: Date;
  status: 'online' | 'offline' | 'busy';
  metadata?: Record<string, unknown>;
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
  
  // Tools and services
  private webSearch?: WebSearchTool;
  private embeddings?: GeminiEmbeddingsTool;
  private memorySystem: OneAgentMemory;

  // Internal dynamic registries
  private dynamicTools: Map<string, ToolDescriptor> = new Map();
  private dynamicResources: Map<string, ResourceDefinition> = new Map();
  private dynamicPrompts: Map<string, PromptDefinition> = new Map();
  
  // A2A Multi-Agent Communication State
  private a2aSessions: Map<string, A2AGroupSession> = new Map();
  private a2aAgents: Map<string, A2AAgent> = new Map();
  private a2aMessageHistory: Map<string, A2AMessage[]> = new Map();

  constructor(config?: Partial<OneAgentConfig>) {
    super();
    this.config = this.mergeConfig(config);
    // Initialize canonical memory system
    let memoryConfig: OneAgentMemoryConfig;
    if (process.env.MEM0_API_URL) {
      // Local mem0 server: set dummy apiKey to satisfy client
      memoryConfig = {
        apiUrl: process.env.MEM0_API_URL,
        endpoint: process.env.MEM0_API_URL,
        apiKey: process.env.MEM0_API_KEY || 'local-dev'
      };
    } else {
      // Cloud mem0: require real apiKey
      memoryConfig = {
        apiKey: process.env.MEM0_API_KEY || 'demo-key'
      };
    }
    this.memorySystem = new OneAgentMemory(memoryConfig);
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
      }
      // Apply Constitutional AI validation ONLY to user-facing tools (not canonical memory tools)
      let constitutionalValidated = false;
      let qualityScore: number | undefined;
      // List of canonical memory tool names
      const canonicalMemoryTools = [
        'oneagent_memory_add',
        'oneagent_memory_edit',
        'oneagent_memory_delete',
        'oneagent_memory_search'
      ];
      if (
        this.config.constitutional.enabled &&
        !canonicalMemoryTools.includes(request.method)
      ) {
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
          details: error,
          timestamp: createUnifiedTimestamp()
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
   * Dynamically register a tool and emit toolsChanged event
   */
  registerTool(tool: ToolDescriptor): void {
    this.dynamicTools.set(tool.name, tool);
    this.emit('toolsChanged', { tools: this.getAvailableTools() });
  }

  /**
   * Dynamically remove a tool and emit toolsChanged event
   */
  removeTool(toolName: string): void {
    this.dynamicTools.delete(toolName);
    this.emit('toolsChanged', { tools: this.getAvailableTools() });
  }

  /**
   * Dynamically add a resource and emit resourcesChanged event
   */
  addResource(resource: ResourceDefinition): void {
    this.dynamicResources.set(resource.uri, resource);
    this.emit('resourcesChanged', { resources: this.getAvailableResources() });
  }

  /**
   * Dynamically remove a resource and emit resourcesChanged event
   */
  removeResource(resourceUri: string): void {
    this.dynamicResources.delete(resourceUri);
    this.emit('resourcesChanged', { resources: this.getAvailableResources() });
  }

  /**
   * Dynamically add a prompt and emit promptsChanged event
   */
  addPrompt(prompt: PromptDefinition): void {
    this.dynamicPrompts.set(prompt.name, prompt);
    this.emit('promptsChanged', { prompts: this.getAvailablePrompts() });
  }

  /**
   * Dynamically remove a prompt and emit promptsChanged event
   */
  removePrompt(promptName: string): void {
    this.dynamicPrompts.delete(promptName);
    this.emit('promptsChanged', { prompts: this.getAvailablePrompts() });
  }

  /**
   * Get available tools for MCP server
   */
  getAvailableTools(): ToolDescriptor[] {
    const tools = toolRegistry.getToolSchemas();
    const dynamic = Array.from(this.dynamicTools.values());
    
    // Add OneAgent-specific tools
    const oneAgentTools = [
      {
        name: 'oneagent_constitutional_validate',
        description: 'Validate content against Constitutional AI principles',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'Content to validate (alias: response)' },
            response: { type: 'string', description: 'Content to validate (alias: content)' },
            userMessage: { type: 'string', description: 'Original user message' }
          },
          anyOf: [
            { required: ['content', 'userMessage'] },
            { required: ['response', 'userMessage'] }
          ]
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
      },
      // A2A Multi-Agent Communication Tools
      {
        name: 'oneagent_a2a_register_agent',
        description: 'Register an agent for multi-agent communication',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Agent ID' },
            name: { type: 'string', description: 'Agent name' },
            capabilities: { type: 'array', items: { type: 'string' }, description: 'Agent capabilities' },
            metadata: { type: 'object', description: 'Additional metadata' }
          },
          required: ['id', 'name', 'capabilities']
        }
      },
      {
        name: 'oneagent_a2a_discover_agents',
        description: 'Discover agents by capabilities',
        inputSchema: {
          type: 'object',
          properties: {
            capabilities: { type: 'array', items: { type: 'string' }, description: 'Required capabilities' },
            status: { type: 'string', enum: ['online', 'offline', 'busy'], description: 'Agent status filter' },
            limit: { type: 'number', description: 'Maximum number of results' }
          }
        }
      },
      {
        name: 'oneagent_a2a_create_session',
        description: 'Create a multi-agent collaboration session',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Session name' },
            participants: { type: 'array', items: { type: 'string' }, description: 'Participant agent IDs' },
            mode: { type: 'string', enum: ['collaborative', 'competitive', 'hierarchical'], description: 'Session mode' },
            topic: { type: 'string', description: 'Session topic' },
            metadata: { type: 'object', description: 'Additional metadata' }
          },
          required: ['name', 'participants']
        }
      },
      {
        name: 'oneagent_a2a_join_session',
        description: 'Join an existing multi-agent session',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string', description: 'Session ID' },
            agentId: { type: 'string', description: 'Agent ID' }
          },
          required: ['sessionId', 'agentId']
        }
      },
      {
        name: 'oneagent_a2a_send_message',
        description: 'Send a message to a specific agent',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string', description: 'Session ID' },
            fromAgent: { type: 'string', description: 'Sender agent ID' },
            toAgent: { type: 'string', description: 'Recipient agent ID' },
            message: { type: 'string', description: 'Message content' },
            messageType: { type: 'string', enum: ['update', 'question', 'decision', 'action', 'insight'], description: 'Message type' },
            metadata: { type: 'object', description: 'Additional metadata' }
          },
          required: ['sessionId', 'fromAgent', 'toAgent', 'message']
        }
      },
      {
        name: 'oneagent_a2a_broadcast_message',
        description: 'Broadcast a message to all participants in a session',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string', description: 'Session ID' },
            fromAgent: { type: 'string', description: 'Sender agent ID' },
            message: { type: 'string', description: 'Message content' },
            messageType: { type: 'string', enum: ['update', 'question', 'decision', 'action', 'insight'], description: 'Message type' },
            metadata: { type: 'object', description: 'Additional metadata' }
          },
          required: ['sessionId', 'fromAgent', 'message']
        }
      },
      {
        name: 'oneagent_a2a_get_message_history',
        description: 'Get message history for a session',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string', description: 'Session ID' },
            limit: { type: 'number', description: 'Maximum number of messages' },
            offset: { type: 'number', description: 'Offset for pagination' }
          },
          required: ['sessionId']
        }
      },
      {
        name: 'oneagent_a2a_get_session',
        description: 'Get details of a specific session',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string', description: 'Session ID' }
          },
          required: ['sessionId']
        }
      },
      {
        name: 'oneagent_a2a_list_sessions',
        description: 'List all sessions with optional filtering',
        inputSchema: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['active', 'paused', 'completed'], description: 'Session status filter' },
            participantId: { type: 'string', description: 'Filter by participant ID' },
            limit: { type: 'number', description: 'Maximum number of results' }
          }
        }
      }
      // NOTE: Legacy hardcoded OURA v3.0 tools removed - all tools now managed via ToolRegistry
      // This eliminates duplicate coordinate_agents, send_agent_message, register_agent, etc.
      // Modern NLACS tools are available via the unified ToolRegistry system
    ];

    return [...tools, ...dynamic, ...oneAgentTools] as ToolDescriptor[];
  }

  /**
   * Get available resources for MCP server
   */
  getAvailableResources(): ResourceDescriptor[] {
    const staticResources = [
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
    const dynamic = Array.from(this.dynamicResources.values());
    return [...staticResources, ...dynamic];
  }

  /**
   * Get available prompt templates
   */
  getAvailablePrompts(): PromptDescriptor[] {
    const staticPrompts = [
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
    const dynamic = Array.from(this.dynamicPrompts.values());
    return [...staticPrompts, ...dynamic];
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
      // No connect needed for canonical memory, but can add health check if needed
      console.log('✅ Canonical memory system (OneAgentMemory) ready');
    } catch (error) {
      console.warn('⚠️ Canonical memory system initialization failed:', error);
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
      // Bootstrap agents - they will now register with NLACS
      await agentBootstrap.bootstrapAllAgents();
      
      console.log('✅ Multi-agent system initialized');
      console.log('🔗 Agents can now communicate through NLACS conversations');
    } catch (error) {
      console.warn('⚠️ Multi-agent system initialization failed:', error);
    }
  }
  // Request handlers
  private async handleToolCall(request: OneAgentRequest): Promise<OneAgentResponseData> {
    const { method, params } = request;
    
    // First try registered tools (includes oneagent_memory_create)
    const tool = toolRegistry.getTool(method);
    if (tool) {
      const result = await tool.execute(params);
      return result as unknown as OneAgentResponseData;
    }
    
    // Then handle OneAgent-specific tools that aren't in registry
    if (method.startsWith('oneagent_')) {
      const result = await this.handleOneAgentTool(method, params);
      return result as OneAgentResponseData;
    }
    
    throw new Error(`Unknown tool: ${method}`);
  }
  private async handleOneAgentTool(method: string, params: OneAgentRequestParams): Promise<unknown> {
    // Unwrap nested 'arguments' property if present (MCP tool call compatibility)
    let unwrapped = params;
    while (unwrapped && typeof unwrapped === 'object' && 'arguments' in unwrapped && Object.keys(unwrapped).length === 1) {
      unwrapped = unwrapped.arguments as OneAgentRequestParams;
    }
    params = unwrapped;
    console.log('[DEBUG] handleOneAgentTool final params:', params);
    switch (method) {
      case 'oneagent_constitutional_validate': {
        // Debug: Log params for diagnosis
        console.log('[DEBUG] oneagent_constitutional_validate params:', params);
        // Accept both 'content' and 'response' as input, prefer 'response' if both present
        let response: string | undefined = undefined;
        if (typeof params.response === 'string' && params.response) {
          response = params.response;
        } else if (typeof params.content === 'string' && params.content) {
          response = params.content;
        }
        console.log('[DEBUG] oneagent_constitutional_validate resolved response:', response);
        if (!response) {
          throw new Error('Invalid input: either content or response must be a non-empty string');
        }
        const userMessage = typeof params.userMessage === 'string' ? params.userMessage : (typeof params.input === 'string' ? params.input : undefined);
        if (!userMessage) {
          throw new Error('Invalid input: userMessage must be a string');
        }
        return this.constitutionalAI.validateResponse(response, userMessage, params.context as Record<string, unknown>);
      }
      
      case 'oneagent_bmad_analyze':
        if (!params.task) {
          throw new Error('task parameter is required for oneagent_bmad_analyze');
        }
        return this.bmadEngine.applyNinePointElicitation(
          params.task,
          { user: { id: 'system', name: 'System' }, sessionId: 'bmad-analysis' } as any,
          'general'
        );
      
      case 'oneagent_quality_score': {
        if (!params.content) {
          throw new Error('content parameter is required for oneagent_quality_score');
        }
        const validation = await this.constitutionalAI.validateResponse(
          params.content, 
          'Quality assessment'
        );
        return {
          content: params.content,
          score: validation.score,
          grade: validation.score >= 90 ? 'A' : validation.score >= 80 ? 'B' : validation.score >= 70 ? 'C' : 'D',
          criteria: params.criteria || ['accuracy', 'helpfulness', 'safety'],
          violations: validation.violations,
          suggestions: validation.suggestions,
          timestamp: new Date().toISOString()
        };
      }

      // A2A Multi-Agent Communication Tools
      case 'oneagent_a2a_register_agent':
        return this.handleA2ARegisterAgent(params as unknown as {
          id: string;
          name: string;
          capabilities: string[];
          metadata?: Record<string, unknown>;
        });
      
      case 'oneagent_a2a_discover_agents':
        return this.handleA2ADiscoverAgents(params);
      
      case 'oneagent_a2a_create_session':
        return this.handleA2ACreateSession(params as unknown as {
          name: string;
          participants: string[];
          mode?: 'collaborative' | 'competitive' | 'hierarchical';
          topic?: string;
          metadata?: Record<string, unknown>;
        });
      
      case 'oneagent_a2a_join_session':
        return this.handleA2AJoinSession(params as unknown as {
          sessionId: string;
          agentId: string;
        });
      
      case 'oneagent_a2a_send_message':
        return this.handleA2ASendMessage(params as unknown as {
          sessionId: string;
          fromAgent: string;
          toAgent: string;
          message: string;
          messageType?: 'question' | 'insight' | 'update' | 'decision' | 'action';
          metadata?: Record<string, unknown>;
        });
      
      case 'oneagent_a2a_broadcast_message':
        return this.handleA2ABroadcastMessage(params as unknown as {
          sessionId: string;
          fromAgent: string;
          message: string;
          messageType?: 'question' | 'insight' | 'update' | 'decision' | 'action';
          metadata?: Record<string, unknown>;
        });
      
      case 'oneagent_a2a_get_message_history':
        return this.handleA2AGetMessageHistory(params as unknown as {
          sessionId: string;
          limit?: number;
          offset?: number;
        });
      
      case 'oneagent_a2a_get_session':
        return this.handleA2AGetSession(params as unknown as {
          sessionId: string;
        });
      
      case 'oneagent_a2a_list_sessions':
        return this.handleA2AListSessions(params as unknown as {
          status?: 'active' | 'paused' | 'completed';
          participantId?: string;
          limit?: number;
        });

      // NOTE: Legacy OURA v3.0 tool cases removed (coordinate_agents, send_agent_message, register_agent, query_agent_capabilities)
      // These are now handled via the unified ToolRegistry system to eliminate duplicates

      case 'get_agent_network_health':
        throw new Error('Multi-agent network health is not available: NLACS is deprecated.');
      
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
        if (!params.code) {
          throw new Error('code parameter is required for oneagent.analyze_code');
        }
        return this.analyzeCodeWithConstitutionalAI(params.code as string);
      case 'oneagent.coordinate_agents':
        // NLACS/multiAgentOrchestrator is deprecated; return not available
        throw new Error('Agent coordination is not available: NLACS is deprecated.');
      default:
        throw new Error(`Unknown prompt: ${prompt}`);
    }
  }  private async handleAgentMessage(_request: OneAgentRequest): Promise<any> {
    // NLACS/multiAgentOrchestrator is deprecated; return not available
    throw new Error('Agent messaging is not available: NLACS is deprecated.');
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
      // NLACS/multiAgentOrchestrator is deprecated; return not available
      return { agents: [], total: 0, status: 'NLACS deprecated' };
    }
    throw new Error(`Unknown agent resource: ${uri}`);
  }

  private async handleSystemResource(uri: string, _params: any): Promise<any> {
    if (uri === 'oneagent://system/health') {
      // Query memory server health with diagnostics
      let memoryHealth: Record<string, any> = { status: 'unknown' };
      try {
        const resp = await axios.get(process.env.MEM0_API_URL + '/health');
        memoryHealth = resp.data;
        memoryHealth.checkedAt = new Date().toISOString();
      } catch (err: any) {
        memoryHealth = {
          status: 'unreachable',
          error: err?.message || String(err),
          checkedAt: new Date().toISOString()
        };
      }
      return {
        status: 'healthy',
        initialized: this.initialized,
        mode: this.mode,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        memoryServer: memoryHealth,
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
        await this.memorySystem.close?.();
      }
      // NLACS/multiAgentOrchestrator is deprecated; nothing to shutdown
      this.emit('shutdown', { timestamp: new Date().toISOString() });
      console.log('✅ OneAgent Engine shutdown complete');
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
    }
  }

  // A2A Multi-Agent Communication Handlers
  private async handleA2ARegisterAgent(params: {
    id: string;
    name: string;
    capabilities: string[];
    metadata?: Record<string, unknown>;
  }): Promise<{ success: boolean; agentId: string }> {
    const agent: A2AAgent = {
      id: params.id,
      name: params.name,
      capabilities: params.capabilities,
      lastActive: new Date(),
      status: 'online',
      ...(params.metadata && { metadata: params.metadata })
    };

    this.a2aAgents.set(params.id, agent);
    
    console.log(`🤖 A2A Agent registered: ${params.name} (${params.id})`);
    console.log(`   Capabilities: ${params.capabilities.join(', ')}`);
    
    return { success: true, agentId: params.id };
  }

  private async handleA2ADiscoverAgents(params: {
    capabilities?: string[];
    status?: 'online' | 'offline' | 'busy';
    limit?: number;
  } = {}): Promise<A2AAgent[]> {
    let agents = Array.from(this.a2aAgents.values());
    
    // Filter by capabilities
    if (params.capabilities && params.capabilities.length > 0) {
      agents = agents.filter(agent => 
        params.capabilities!.some(cap => agent.capabilities.includes(cap))
      );
    }
    
    // Filter by status
    if (params.status) {
      agents = agents.filter(agent => agent.status === params.status);
    }
    
    // Apply limit
    if (params.limit) {
      agents = agents.slice(0, params.limit);
    }
    
    console.log(`🔍 A2A Discovered ${agents.length} agents matching criteria`);
    
    return agents;
  }

  private async handleA2ACreateSession(params: {
    name: string;
    participants: string[];
    mode?: 'collaborative' | 'competitive' | 'hierarchical';
    topic?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ sessionId: string; session: A2AGroupSession }> {
    const sessionId = `a2a_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: A2AGroupSession = {
      id: sessionId,
      name: params.name,
      participants: params.participants,
      mode: params.mode || 'collaborative',
      messages: [],
      createdAt: new Date(),
      status: 'active',
      ...(params.topic && { topic: params.topic }),
      ...(params.metadata && { metadata: params.metadata })
    };
    
    this.a2aSessions.set(sessionId, session);
    this.a2aMessageHistory.set(sessionId, []);
    
    console.log(`🎯 A2A Group session created: ${params.name} (${sessionId})`);
    console.log(`   Participants: ${params.participants.join(', ')}`);
    console.log(`   Mode: ${session.mode}`);
    
    return { sessionId, session };
  }

  private async handleA2AJoinSession(params: {
    sessionId: string;
    agentId: string;
  }): Promise<{ success: boolean; session: A2AGroupSession }> {
    const session = this.a2aSessions.get(params.sessionId);
    if (!session) {
      throw new Error(`A2A Session not found: ${params.sessionId}`);
    }
    
    if (!session.participants.includes(params.agentId)) {
      session.participants.push(params.agentId);
      
      console.log(`🤝 A2A Agent ${params.agentId} joined session ${params.sessionId}`);
    }
    
    return { success: true, session };
  }

  private async handleA2ASendMessage(params: {
    sessionId: string;
    fromAgent: string;
    toAgent: string;
    message: string;
    messageType?: 'update' | 'question' | 'decision' | 'action' | 'insight';
    metadata?: Record<string, unknown>;
  }): Promise<{ messageId: string; success: boolean }> {
    const session = this.a2aSessions.get(params.sessionId);
    if (!session) {
      throw new Error(`A2A Session not found: ${params.sessionId}`);
    }
    
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const message: A2AMessage = {
      id: messageId,
      sessionId: params.sessionId,
      fromAgent: params.fromAgent,
      toAgent: params.toAgent,
      message: params.message,
      messageType: params.messageType || 'update',
      timestamp: new Date(),
      ...(params.metadata && { metadata: params.metadata })
    };
    
    session.messages.push(message);
    
    const history = this.a2aMessageHistory.get(params.sessionId) || [];
    history.push(message);
    this.a2aMessageHistory.set(params.sessionId, history);
    
    console.log(`📤 A2A Message sent: ${params.fromAgent} → ${params.toAgent} in ${params.sessionId}`);
    
    return { messageId, success: true };
  }

  private async handleA2ABroadcastMessage(params: {
    sessionId: string;
    fromAgent: string;
    message: string;
    messageType?: 'update' | 'question' | 'decision' | 'action' | 'insight';
    metadata?: Record<string, unknown>;
  }): Promise<{ messageId: string; success: boolean }> {
    const session = this.a2aSessions.get(params.sessionId);
    if (!session) {
      throw new Error(`A2A Session not found: ${params.sessionId}`);
    }
    
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const message: A2AMessage = {
      id: messageId,
      sessionId: params.sessionId,
      fromAgent: params.fromAgent,
      message: params.message,
      messageType: params.messageType || 'update',
      timestamp: new Date(),
      ...(params.metadata && { metadata: params.metadata })
    };
    
    session.messages.push(message);
    
    const history = this.a2aMessageHistory.get(params.sessionId) || [];
    history.push(message);
    this.a2aMessageHistory.set(params.sessionId, history);
    
    console.log(`📢 A2A Message broadcast: ${params.fromAgent} in ${params.sessionId}`);
    console.log(`   Message: ${params.message}`);
    
    return { messageId, success: true };
  }

  private async handleA2AGetMessageHistory(params: {
    sessionId: string;
    limit?: number;
    offset?: number;
  }): Promise<A2AMessage[]> {
    const history = this.a2aMessageHistory.get(params.sessionId) || [];
    
    let messages = history;
    
    if (params.offset) {
      messages = messages.slice(params.offset);
    }
    
    if (params.limit) {
      messages = messages.slice(0, params.limit);
    }
    
    return messages;
  }

  private async handleA2AGetSession(params: { sessionId: string }): Promise<A2AGroupSession> {
    const session = this.a2aSessions.get(params.sessionId);
    if (!session) {
      throw new Error(`A2A Session not found: ${params.sessionId}`);
    }
    
    return session;
  }

  private async handleA2AListSessions(params: {
    status?: 'active' | 'paused' | 'completed';
    participantId?: string;
    limit?: number;
  } = {}): Promise<A2AGroupSession[]> {
    let sessions = Array.from(this.a2aSessions.values());
    
    // Filter by status
    if (params.status) {
      sessions = sessions.filter(session => session.status === params.status);
    }
    
    // Filter by participant
    if (params.participantId) {
      sessions = sessions.filter(session => 
        session.participants.includes(params.participantId!)
      );
    }
    
    // Apply limit
    if (params.limit) {
      sessions = sessions.slice(0, params.limit);
    }
    
    return sessions;
  }
}
