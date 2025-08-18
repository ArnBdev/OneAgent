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
import { UnifiedBackboneService } from './utils/UnifiedBackboneService';

// Import canonical types
import type {
  OneAgentRequestParams,
  OneAgentResponseData,
  ErrorDetails,
  RequestContext,
  ToolResult,
  ConstitutionalPrinciple,
} from './types/oneagent-backbone-types';

// Import core systems
import { ConstitutionalAI } from './agents/base/ConstitutionalAI';
import { BMADElicitationEngine } from './agents/base/BMADElicitationEngine';
import { OneAgentMemory, OneAgentMemoryConfig } from './memory/OneAgentMemory';
import { createUnifiedTimestamp } from './utils/UnifiedBackboneService';

// Import unified tools
import { toolRegistry } from './tools/ToolRegistry';
import { UnifiedWebSearchTool } from './tools/UnifiedWebSearchTool';
import { unifiedAgentCommunicationService } from './utils/UnifiedAgentCommunicationService';
import SyncService from './services/SyncService';
import { ConstitutionValidator } from './validation/ConstitutionValidator';

export type OneAgentMode = 'mcp-http' | 'mcp-stdio' | 'standalone' | 'cli' | 'vscode-embedded';

export interface OneAgentRequest {
  id: string;
  method: string;
  type: string; // Added missing type property
  params: OneAgentRequestParams;
  meta?: RequestContext;
  timestamp?: string; // Added missing timestamp property
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

/**
 * Unified OneAgent Engine - Single source of truth
 */
export class OneAgentEngine extends EventEmitter {
  private static instance: OneAgentEngine;
  private config: typeof UnifiedBackboneService.config;
  private initialized = false;
  private mode: OneAgentMode = 'mcp-http';
  private dynamicTools: Map<string, ToolDescriptor> = new Map();
  private dynamicResources: Map<string, ResourceDescriptor> = new Map();
  private dynamicPrompts: Map<string, PromptDescriptor> = new Map();
  private constitutionalAI!: ConstitutionalAI;
  private bmadEngine!: BMADElicitationEngine;
  private constitutionValidator: ConstitutionValidator = new ConstitutionValidator({
    topK: 5,
    threshold: 0.32,
  });
  // Tools and services
  private unifiedWebSearch?: UnifiedWebSearchTool;
  private memorySystem: OneAgentMemory;
  constructor(_config?: Partial<typeof UnifiedBackboneService.config>) {
    super();
    this.config = UnifiedBackboneService.config;

    // Initialize safe config defaults if properties are missing
    if (!this.config) {
      this.config = {} as typeof UnifiedBackboneService.config;
    }
    if (!this.config.memory) {
      this.config.memory = {
        enabled: true,
        provider: 'mem0',
        config: {},
      };
    }
    if (!this.config.constitutional) {
      this.config.constitutional = {
        enabled: true,
        principles: [] as ConstitutionalPrinciple[],
        qualityThreshold: 0.8,
      };
    }

    // Initialize canonical memory system
    let memoryConfig: OneAgentMemoryConfig;
    if (process.env.MEM0_API_URL) {
      // Local mem0 server: set dummy apiKey to satisfy client
      memoryConfig = {
        apiUrl: process.env.MEM0_API_URL,
        endpoint: process.env.MEM0_API_URL,
        apiKey: process.env.MEM0_API_KEY || 'local-dev',
      };
    } else {
      // Cloud mem0: require real apiKey
      memoryConfig = {
        apiKey: process.env.MEM0_API_KEY || 'demo-key',
      };
    }
    this.memorySystem = OneAgentMemory.getInstance(memoryConfig);
    this.initializeCoreSystems();
  }

  static getInstance(config?: Partial<typeof UnifiedBackboneService.config>): OneAgentEngine {
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
      // One-time constitution sync (ingest /specs/*.spec.md into memory with embeddings)
      try {
        const sync = new SyncService();
        await sync.syncConstitution();
      } catch (e) {
        console.warn('⚠️ SyncService failed (continuing startup):', e);
      }
      await this.initializeConstitutionalAI();
      await this.initializeBMAD();
      await this.initializeTools();

      this.initialized = true;
      this.emit('initialized', { mode, timestamp: createUnifiedTimestamp().iso });

      console.log('✅ OneAgent Engine initialized successfully');
      console.log(`📊 Mode: ${mode}`);
      console.log(
        `🧠 Constitutional AI: ${this.config.constitutional.enabled ? 'ACTIVE' : 'DISABLED'}`,
      );
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
    const startTime = createUnifiedTimestamp();
    try {
      console.log(`🔄 Processing ${request.type}: ${request.method}`);
      let result: ToolResult;
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
        'oneagent_memory_search',
      ];
      if (this.config.constitutional.enabled && !canonicalMemoryTools.includes(request.method)) {
        const validation = await this.constitutionalAI.validateResponse(
          String(result.data || result.success),
          request.params?.userMessage || request.method,
        );
        constitutionalValidated = validation.isValid;
        qualityScore = validation.score || 0;
      }
      const response: OneAgentResponse = {
        id: request.id,
        success: true,
        data: result.data as OneAgentResponseData,
        constitutionalValidated,
        qualityScore: qualityScore || 0,
        timestamp: createUnifiedTimestamp().iso,
      };
      const duration = createUnifiedTimestamp().unix - startTime.unix;
      console.log(`✅ Request completed in ${duration}ms (Q:${qualityScore || 0}%)`);
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
          timestamp: createUnifiedTimestamp(),
        },
        constitutionalValidated: false,
        timestamp: createUnifiedTimestamp().iso,
      };

      const duration = createUnifiedTimestamp().unix - startTime.unix;
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
    this.dynamicResources.set(resource.uri, resource as ResourceDescriptor);
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
    this.dynamicPrompts.set(prompt.name, prompt as PromptDescriptor);
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
    // Add OneAgent-specific tools (ensure inputSchema is Record<string, unknown>)
    const oneAgentTools: ToolDescriptor[] = [
      {
        name: 'oneagent_constitutional_validate',
        description: 'Validate content against Constitutional AI principles',
        inputSchema: {
          content: { type: 'string', description: 'Content to validate (alias: response)' },
          response: { type: 'string', description: 'Content to validate (alias: content)' },
          userMessage: { type: 'string', description: 'Original user message' },
        },
      },
      {
        name: 'oneagent_bmad_analyze',
        description: 'Analyze task using BMAD 9-point framework',
        inputSchema: {
          task: { type: 'string', description: 'Task to analyze' },
        },
      },
      {
        name: 'oneagent_quality_score',
        description: 'Generate quality score and improvement suggestions',
        inputSchema: {
          content: { type: 'string', description: 'Content to score' },
          criteria: { type: 'array', items: { type: 'string' }, description: 'Quality criteria' },
        },
      },
    ];
    const a2aTools = unifiedAgentCommunicationService.getToolSchemas();
    return [...tools, ...dynamic, ...oneAgentTools, ...a2aTools];
  }

  getAvailableResources(): ResourceDescriptor[] {
    return Array.from(this.dynamicResources.values());
  }

  getAvailablePrompts(): PromptDescriptor[] {
    return Array.from(this.dynamicPrompts.values());
  }

  private async initializeCoreSystems(): Promise<void> {
    this.constitutionalAI = new ConstitutionalAI({
      principles: this.config.constitutional.principles,
      qualityThreshold: this.config.constitutional.qualityThreshold,
    });
    this.bmadEngine = new BMADElicitationEngine();
  }

  private async initializeMemorySystem(): Promise<void> {
    // Memory system is always enabled in OneAgent - we have a canonical memory system
    console.log('💾 Initializing OneAgent Memory System...');
    // Memory system is already initialized in constructor via OneAgentMemory singleton
    console.log('✅ Memory System Initialized.');
  }

  private async initializeConstitutionalAI(): Promise<void> {
    if (this.config.constitutional.enabled) {
      console.log('🧠 Initializing Constitutional AI...');
      // Already initialized in initializeCoreSystems
      console.log('✅ Constitutional AI Initialized.');
    }
  }

  private async initializeBMAD(): Promise<void> {
    console.log('📊 Initializing BMAD Elicitation Engine...');
    // Already initialized in initializeCoreSystems
    console.log('✅ BMAD Elicitation Engine Initialized.');
  }

  private async initializeTools(): Promise<void> {
    console.log('🛠️  Initializing standard tools...');

    this.unifiedWebSearch = new UnifiedWebSearchTool();
    toolRegistry.registerTool(this.unifiedWebSearch);

    // Note: GeminiEmbeddingsTool needs to be converted to unified format
    // For now, we'll skip it until a UnifiedGeminiEmbeddingsTool is created

    console.log('✅ Standard tools initialized.');
  }
  private async handleToolCall(request: OneAgentRequest): Promise<ToolResult> {
    // Check for A2A communication tools first
    if (request.method.startsWith('oneagent_a2a_')) {
      return this.handleA2AToolCall(request);
    }
    // Pre-execution constitutional compliance check (skip canonical memory tools)
    const canonicalMemoryTools = [
      'oneagent_memory_add',
      'oneagent_memory_edit',
      'oneagent_memory_delete',
      'oneagent_memory_search',
    ];
    if (!canonicalMemoryTools.includes(request.method)) {
      try {
        const desc = request.params?.userMessage || request.params?.task || request.method;
        const compliance = await this.constitutionValidator.check(String(desc));
        if (!compliance.allowed) {
          return {
            success: false,
            error: {
              code: 'CONSTITUTION_BLOCK',
              message: `Blocked by Constitution: ${compliance.reason}`,
              timestamp: createUnifiedTimestamp(),
            } as ErrorDetails,
            metadata: undefined,
            timestamp: createUnifiedTimestamp(),
          };
        }
      } catch (e) {
        console.warn('Constitutional pre-check failed, allowing execution:', e);
      }
    }
    // Standard tool call logic
    const tool = toolRegistry.getTool(request.method);
    if (!tool || !tool.execute) {
      throw new Error(`Tool not found or not executable: ${request.method}`);
    }
    const result = await tool.execute(request.params);
    return { ...(result as ToolResult), timestamp: createUnifiedTimestamp() };
  }

  private async handleResourceGet(_request: OneAgentRequest): Promise<never> {
    // Implementation for getting resources
    throw new Error('handleResourceGet not implemented');
  }

  private async handlePromptInvoke(_request: OneAgentRequest): Promise<never> {
    // Implementation for invoking prompts
    throw new Error('handlePromptInvoke not implemented');
  }

  private async handleAgentMessage(_request: OneAgentRequest): Promise<never> {
    // This is for direct agent-to-agent messaging if needed outside of sessions
    throw new Error('handleAgentMessage not implemented');
  }

  // =========================================================================
  // A2A MULTI-AGENT COMMUNICATION (Unified Implementation)
  // =========================================================================

  /**
   * Routes all `oneagent_a2a_*` tool calls to the unified communication service.
   */
  private async handleA2AToolCall(request: OneAgentRequest): Promise<ToolResult> {
    const { method, params } = request;
    console.log(`📡 Handling A2A tool call: ${method}`);

    const timestamp = createUnifiedTimestamp();

    try {
      let result: unknown;

      switch (method) {
        case 'oneagent_a2a_register_agent':
          result = await unifiedAgentCommunicationService.registerAgent(
            params as import('./types/oneagent-backbone-types').AgentRegistration,
          );
          break;
        case 'oneagent_a2a_discover_agents':
          result = await unifiedAgentCommunicationService.discoverAgents(
            params as import('./types/oneagent-backbone-types').AgentFilter,
          );
          break;
        case 'oneagent_a2a_create_session':
          result = await unifiedAgentCommunicationService.createSession(
            params as unknown as import('./types/oneagent-backbone-types').SessionConfig,
          );
          break;
        case 'oneagent_a2a_join_session':
          result = await unifiedAgentCommunicationService.joinSession(
            params.sessionId as string,
            params.agentId as string,
          );
          break;
        case 'oneagent_a2a_send_message':
          result = await unifiedAgentCommunicationService.sendMessage(
            params as unknown as import('./types/oneagent-backbone-types').AgentMessage,
          );
          break;
        case 'oneagent_a2a_broadcast_message':
          result = await unifiedAgentCommunicationService.sendMessage({
            ...(params as unknown as import('./types/oneagent-backbone-types').AgentMessage),
            toAgent: undefined,
          });
          break;
        case 'oneagent_a2a_get_message_history':
          result = await unifiedAgentCommunicationService.getMessageHistory(
            params.sessionId as string,
            Number(params.limit),
          );
          break;
        case 'oneagent_a2a_get_session_info':
          result = await unifiedAgentCommunicationService.getSessionInfo(
            params.sessionId as string,
          );
          break;
        default:
          throw new Error(`Unknown A2A tool call: ${method}`);
      }

      return {
        success: true,
        data: result,
        timestamp,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : String(error),
          code: 'A2A_TOOL_ERROR',
        } as ErrorDetails,
        timestamp,
      };
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    this.emit('shutdown');
    console.log('OneAgent shutting down...');
    // Add cleanup logic here
  }
}
