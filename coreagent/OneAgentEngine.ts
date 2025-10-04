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

console.log('[ENGINE] 📦 OneAgentEngine module loading START');
import { EventEmitter } from 'events';
console.log('[ENGINE] ✅ EventEmitter imported');
import { UnifiedBackboneService } from './utils/UnifiedBackboneService';
console.log('[ENGINE] ✅ UnifiedBackboneService imported');

// Import canonical types
console.log('[ENGINE] Importing types...');
import type {
  OneAgentRequestParams,
  OneAgentResponseData,
  ErrorDetails,
  RequestContext,
  ToolResult,
  ConstitutionalPrinciple,
} from './types/oneagent-backbone-types';
console.log('[ENGINE] ✅ Types imported');

// Import core systems
console.log('[ENGINE] Importing ConstitutionalAI...');
import { ConstitutionalAI } from './agents/base/ConstitutionalAI';
console.log('[ENGINE] ✅ ConstitutionalAI imported');

console.log('[ENGINE] Importing BMADElicitationEngine...');
import { BMADElicitationEngine } from './agents/base/BMADElicitationEngine';
console.log('[ENGINE] ✅ BMADElicitationEngine imported');

console.log('[ENGINE] Importing OneAgentMemory...');
import { OneAgentMemory } from './memory/OneAgentMemory';
console.log('[ENGINE] ✅ OneAgentMemory imported');

console.log('[ENGINE] Importing getOneAgentMemory...');
import { getOneAgentMemory } from './utils/UnifiedBackboneService';
console.log('[ENGINE] ✅ getOneAgentMemory imported');

console.log('[ENGINE] Importing unified timestamp/ID...');
import {
  createUnifiedTimestamp,
  createUnifiedId,
  OneAgentUnifiedBackbone,
} from './utils/UnifiedBackboneService';
console.log('[ENGINE] ✅ Unified utilities imported');

// Import unified tools
console.log('[ENGINE] Importing toolRegistry...');
import { toolRegistry } from './tools/ToolRegistry';
console.log('[ENGINE] ✅ toolRegistry imported');

console.log('[ENGINE] Importing UnifiedWebSearchTool...');
import { UnifiedWebSearchTool } from './tools/UnifiedWebSearchTool';
console.log('[ENGINE] ✅ UnifiedWebSearchTool imported');

console.log('[ENGINE] Importing unifiedAgentCommunicationService...');
import { unifiedAgentCommunicationService } from './utils/UnifiedAgentCommunicationService';
console.log('[ENGINE] ✅ unifiedAgentCommunicationService imported');

console.log('[ENGINE] Importing SyncService...');
import SyncService from './services/SyncService';
console.log('[ENGINE] ✅ SyncService imported');

console.log('[ENGINE] Importing ConstitutionValidator...');
import { ConstitutionValidator } from './validation/ConstitutionValidator';
console.log('[ENGINE] ✅ ConstitutionValidator imported');

console.log('[ENGINE] Importing proactiveObserverService...');
import { proactiveObserverService } from './services/ProactiveTriageOrchestrator';
console.log('[ENGINE] ✅ proactiveObserverService imported');

console.log('[ENGINE] Importing taskDelegationService...');
import { taskDelegationService } from './services/TaskDelegationService';
console.log('[ENGINE] ✅ taskDelegationService imported');

console.log('[ENGINE] Importing unifiedMonitoringService...');
import { unifiedMonitoringService } from './monitoring/UnifiedMonitoringService';
console.log('[ENGINE] ✅ unifiedMonitoringService imported');

console.log('[ENGINE] Importing TOOL_SETS...');
import { TOOL_SETS, DEFAULT_ALWAYS_ALLOWED_TOOLS } from './tools/ToolSets';
console.log('[ENGINE] ✅ TOOL_SETS imported');

console.log('[ENGINE] 🎉 ALL IMPORTS COMPLETE - OneAgentEngine module loaded successfully');

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
  private cache = OneAgentUnifiedBackbone.getInstance().cache;
  private dynamicToolsKey = 'dynamicTools';
  private dynamicResourcesKey = 'dynamicResources';
  private dynamicPromptsKey = 'dynamicPrompts';
  private constitutionalAI!: ConstitutionalAI;
  private bmadEngine!: BMADElicitationEngine;
  private constitutionValidator: ConstitutionValidator = new ConstitutionValidator({
    topK: 5,
    threshold: 0.32,
  });
  // Tools and services
  private unifiedWebSearch?: UnifiedWebSearchTool;
  private memorySystem: OneAgentMemory;
  private taskDispatchTimer?: NodeJS.Timeout;
  private readonly TASK_DISPATCH_BASE_INTERVAL =
    parseInt(process.env.ONEAGENT_TASK_DISPATCH_INTERVAL_MS || '10000', 10) || 10000; // configurable base (default 10s)
  // Active tool-set management (canonical)
  private activeToolSetIds: Set<string> = new Set(Object.keys(TOOL_SETS));
  private readonly ALWAYS_ALLOWED_PREFIXES = ['oneagent_a2a_'];
  /**
   * @param opts.memorySystem Optionally inject a canonical OneAgentMemory instance (DI preferred)
   * @param _config Optionally override backbone config (rare; for test/migration only)
   */
  constructor(
    opts: { memorySystem?: OneAgentMemory } = {},
    _config?: Partial<typeof UnifiedBackboneService.config>,
  ) {
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

    // Canonical: Prefer DI, fallback to canonical accessor
    this.memorySystem = opts.memorySystem || getOneAgentMemory();
    this.initializeCoreSystems();
  }

  // Deprecated: static singleton pattern is forbidden. Use DI and explicit instantiation.
  // static getInstance(config?: Partial<typeof UnifiedBackboneService.config>): OneAgentEngine {
  //   if (!OneAgentEngine.instance) {
  //     OneAgentEngine.instance = new OneAgentEngine(config);
  //   }
  //   return OneAgentEngine.instance;
  // }

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

      // Skip memory probe if flag is set (for quick startup during development)
      if (process.env.ONEAGENT_SKIP_MEMORY_PROBE !== '1') {
        // One-time constitution sync with memory readiness gating
        console.log('[ENGINE] 🔍 Checking memory server readiness...');
        try {
          const memUrl =
            process.env.MEM0_API_URL ||
            `http://127.0.0.1:${process.env.ONEAGENT_MEMORY_PORT || '8010'}`;
          const readyUrl = `${memUrl.replace(/\/$/, '')}/health/ready`;
          console.log('[ENGINE] 📡 Memory probe URL:', readyUrl);
          const authKey = process.env.MEM0_API_KEY || process.env.MEM0_API_TOKEN || '';
          const startWait = createUnifiedTimestamp().unix;
          const timeoutMs = 15000; // 15s max wait
          let ready = false;
          for (let attempt = 0; attempt < 30; attempt++) {
            if (createUnifiedTimestamp().unix - startWait > timeoutMs) break;
            try {
              console.log(`[ENGINE] 🔄 Memory probe attempt ${attempt + 1}/30...`);
              const controller = new AbortController();
              const t = setTimeout(() => controller.abort(), 2500);
              const resp = await fetch(readyUrl, {
                method: 'GET',
                headers: {
                  Authorization: authKey ? `Bearer ${authKey}` : '',
                  'MCP-Protocol-Version': '2025-06-18',
                },
                signal: controller.signal,
              }).catch((e) => {
                console.log('[ENGINE] ⚠️  Memory probe fetch failed:', e.message);
                throw e;
              });
              clearTimeout(t);
              if (resp && resp.ok) {
                ready = true;
                console.log('[ENGINE] ✅ Memory server ready!');
                break;
              }
              console.log('[ENGINE] ⚠️  Memory probe non-OK response:', resp.status);
            } catch {
              console.log('[ENGINE] ⚠️  Memory probe attempt failed, retrying...');
              // swallow and retry
            }
            await new Promise((r) => setTimeout(r, 500));
          }
          if (!ready) {
            console.warn(
              '⚠️ Memory readiness probe timed out; continuing without pre-sync (will retry async)',
            );
            // Fire and forget background sync attempt later
            setTimeout(() => {
              new SyncService()
                .syncConstitution()
                .catch((e) => console.warn('⚠️ Deferred SyncService failed:', e));
            }, 5000);
          } else {
            console.log('[ENGINE] 🔄 Running SyncService.syncConstitution...');
            const sync = new SyncService();
            await sync.syncConstitution();
            console.log('[ENGINE] ✅ SyncService completed');
          }
        } catch (e) {
          console.warn('⚠️ SyncService failed (continuing startup):', e);
        }
      } else {
        console.log('[ENGINE] ⏭️  Skipping memory probe (ONEAGENT_SKIP_MEMORY_PROBE=1)');
      }

      console.log('[ENGINE] 🔄 Initializing ConstitutionalAI...');
      await this.initializeConstitutionalAI();
      console.log('[ENGINE] ✅ ConstitutionalAI initialized');

      console.log('[ENGINE] 🔄 Initializing BMAD...');
      await this.initializeBMAD();
      console.log('[ENGINE] ✅ BMAD initialized');

      console.log('[ENGINE] 🔄 Initializing Tools...');
      await this.initializeTools();
      console.log('[ENGINE] ✅ Tools initialized');

      // Optional: start ProactiveObserver (Epic 6) if enabled via env flag
      if (process.env.ONEAGENT_PROACTIVE_OBSERVER === '1') {
        try {
          proactiveObserverService.start();
          console.log('🛰  ProactiveObserverService started (Epic 6 baseline)');
        } catch (e) {
          console.warn('⚠️ Failed to start ProactiveObserverService:', e);
        }
      }

      this.initialized = true;
      this.emit('initialized', { mode, timestamp: createUnifiedTimestamp().iso });

      console.log('✅ OneAgent Engine initialized successfully');
      console.log(`📊 Mode: ${mode}`);
      console.log(
        `🧠 Constitutional AI: ${this.config.constitutional.enabled ? 'ACTIVE' : 'DISABLED'}`,
      );
      console.log(`💾 Memory: ${this.config.memory.enabled ? 'ACTIVE' : 'DISABLED'}`);

      // Start task dispatch loop (Epic 7 proactive delegation)
      if (process.env.ONEAGENT_PROACTIVE_AUTO_DELEGATE === '1') {
        this.startTaskDispatchLoop();
      }
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
    (async () => {
      const tools =
        ((await this.cache.get(this.dynamicToolsKey)) as Record<string, ToolDescriptor>) || {};
      tools[tool.name] = tool;
      await this.cache.set(this.dynamicToolsKey, tools);
      this.emit('toolsChanged', { tools: await this.getAvailableTools() });
    })();
  }

  /**
   * Dynamically remove a tool and emit toolsChanged event
   */
  removeTool(toolName: string): void {
    (async () => {
      const tools =
        ((await this.cache.get(this.dynamicToolsKey)) as Record<string, ToolDescriptor>) || {};
      delete tools[toolName];
      await this.cache.set(this.dynamicToolsKey, tools);
      this.emit('toolsChanged', { tools: await this.getAvailableTools() });
    })();
  }

  /**
   * Dynamically add a resource and emit resourcesChanged event
   */
  addResource(resource: ResourceDefinition): void {
    (async () => {
      const resources =
        ((await this.cache.get(this.dynamicResourcesKey)) as Record<string, ResourceDescriptor>) ||
        {};
      resources[resource.uri] = resource as ResourceDescriptor;
      await this.cache.set(this.dynamicResourcesKey, resources);
      this.emit('resourcesChanged', { resources: await this.getAvailableResources() });
    })();
  }

  /**
   * Dynamically remove a resource and emit resourcesChanged event
   */
  removeResource(resourceUri: string): void {
    (async () => {
      const resources =
        ((await this.cache.get(this.dynamicResourcesKey)) as Record<string, ResourceDescriptor>) ||
        {};
      delete resources[resourceUri];
      await this.cache.set(this.dynamicResourcesKey, resources);
      this.emit('resourcesChanged', { resources: await this.getAvailableResources() });
    })();
  }

  /**
   * Dynamically add a prompt and emit promptsChanged event
   */
  addPrompt(prompt: PromptDefinition): void {
    (async () => {
      const prompts =
        ((await this.cache.get(this.dynamicPromptsKey)) as Record<string, PromptDescriptor>) || {};
      prompts[prompt.name] = prompt as PromptDescriptor;
      await this.cache.set(this.dynamicPromptsKey, prompts);
      this.emit('promptsChanged', { prompts: await this.getAvailablePrompts() });
    })();
  }

  /**
   * Dynamically remove a prompt and emit promptsChanged event
   */
  removePrompt(promptName: string): void {
    (async () => {
      const prompts =
        ((await this.cache.get(this.dynamicPromptsKey)) as Record<string, PromptDescriptor>) || {};
      delete prompts[promptName];
      await this.cache.set(this.dynamicPromptsKey, prompts);
      this.emit('promptsChanged', { prompts: await this.getAvailablePrompts() });
    })();
  }

  /**
   * Get available tools for MCP server
   */
  async getAvailableTools(): Promise<ToolDescriptor[]> {
    const tools = await toolRegistry.getToolSchemas();
    const dynamicObj = (await this.cache.get(this.dynamicToolsKey)) || {};
    const dynamic = Object.values(dynamicObj) as ToolDescriptor[];
    // OneAgent meta-tools (listing only; execution handled via registry if present)
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
      {
        name: 'oneagent_toolsets_toggle',
        description:
          'Activate a subset of tool sets to control available tools (keeps always-allowed tools)',
        inputSchema: {
          setIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Tool set IDs to activate',
          },
        },
      },
    ];
    const a2aTools = unifiedAgentCommunicationService.getToolSchemas();

    // Apply active tool-set filtering
    const allowed = this.getAllowedToolNames();
    // Ensure management tool is always discoverable
    allowed.add('oneagent_toolsets_toggle');
    const merged = [...tools, ...dynamic, ...oneAgentTools, ...a2aTools];
    const filtered = merged.filter((t) => this.isToolAllowed(t.name, allowed));
    return filtered;
  }

  getAvailableResources(): ResourceDescriptor[] {
    // This method must be async now
    throw new Error('getAvailableResources must be called as getAvailableResourcesAsync');
  }

  getAvailablePrompts(): PromptDescriptor[] {
    // This method must be async now
    throw new Error('getAvailablePrompts must be called as getAvailablePromptsAsync');
  }

  async getAvailableResourcesAsync(): Promise<ResourceDescriptor[]> {
    const resourcesObj = (await this.cache.get(this.dynamicResourcesKey)) || {};
    return Object.values(resourcesObj) as ResourceDescriptor[];
  }

  async getAvailablePromptsAsync(): Promise<PromptDescriptor[]> {
    const promptsObj = (await this.cache.get(this.dynamicPromptsKey)) || {};
    return Object.values(promptsObj) as PromptDescriptor[];
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
    // Memory system is already initialized in constructor via DI or canonical accessor
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
    console.log('[ENGINE] 🔧 Registering UnifiedWebSearchTool...');
    await toolRegistry.registerTool(this.unifiedWebSearch);
    console.log('[ENGINE] ✅ UnifiedWebSearchTool registered');

    // MultimodalEmbeddingService er nå canonical og leverandøragnostisk.
    // TODO: Integrer MultimodalEmbeddingService som standard embedding/multimodal verktøy.

    console.log('✅ Standard tools initialized.');
  }
  private async handleToolCall(request: OneAgentRequest): Promise<ToolResult> {
    // Check for A2A communication tools first
    if (request.method.startsWith('oneagent_a2a_')) {
      return this.handleA2AToolCall(request);
    }
    // Handle engine-native toggle tool
    if (request.method === 'oneagent_toolsets_toggle') {
      const ids = Array.isArray((request.params as unknown as { setIds?: unknown }).setIds)
        ? ((request.params as unknown as { setIds: unknown[] }).setIds as string[])
        : [];
      const status = await this.setActiveToolSetIds(ids);
      return {
        success: true,
        data: status,
        timestamp: createUnifiedTimestamp(),
      };
    }
    // Enforce active tool-set restriction (except always-allowed and A2A)
    const allowed = this.getAllowedToolNames();
    if (!this.isToolAllowed(request.method, allowed)) {
      return {
        success: false,
        error: {
          code: 'TOOL_SET_RESTRICTED',
          message:
            'This tool is not currently enabled. Activate its tool set via oneagent_toolsets_toggle or tools/sets/activate.',
          timestamp: createUnifiedTimestamp(),
        } as ErrorDetails,
        timestamp: createUnifiedTimestamp(),
      };
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
    const tool = await toolRegistry.getTool(request.method);
    if (!tool || !tool.execute) {
      throw new Error(`Tool not found or not executable: ${request.method}`);
    }
    const result = await tool.execute(request.params);
    return { ...(result as ToolResult), timestamp: createUnifiedTimestamp() };
  }

  // =======================
  // Tool-sets management
  // =======================
  public getActiveToolSetIds(): string[] {
    return Array.from(this.activeToolSetIds);
  }

  public async setActiveToolSetIds(ids: string[]): Promise<{
    active: string[];
    appliedCount: number;
    totalToolCount: number;
  }> {
    const valid = ids.filter((id) => Object.prototype.hasOwnProperty.call(TOOL_SETS, id));
    // Fallback: ensure at least one set stays active
    const next = new Set(valid.length ? valid : ['system-management']);
    this.activeToolSetIds = next;
    const allowed = this.getAllowedToolNames();
    // Notify listeners that tools list may have changed
    this.emit('toolsChanged', { tools: await this.getAvailableTools() });
    const totalToolCount = (await toolRegistry.getToolSchemas()).length;
    return {
      active: Array.from(this.activeToolSetIds),
      appliedCount: allowed.size,
      totalToolCount,
    };
  }

  private getAllowedToolNames(): Set<string> {
    const names = new Set<string>();
    for (const id of this.activeToolSetIds) {
      const set = TOOL_SETS[id];
      if (set) {
        for (const n of set.tools) names.add(n);
      }
    }
    for (const n of DEFAULT_ALWAYS_ALLOWED_TOOLS) names.add(n);
    return names;
  }

  private isToolAllowed(name: string, allowed: Set<string>): boolean {
    if (allowed.has(name)) return true;
    if (this.ALWAYS_ALLOWED_PREFIXES.some((p) => name.startsWith(p))) return true;
    return false;
  }

  // Public helper for server-side enforcement without duplicating logic
  public isToolCurrentlyAllowed(name: string): boolean {
    const allowed = this.getAllowedToolNames();
    return this.isToolAllowed(name, allowed);
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
    if (this.taskDispatchTimer) clearTimeout(this.taskDispatchTimer);
    // Add cleanup logic here
  }

  // =========================================================================
  // PROACTIVE TASK DISPATCH LOOP (Epic 7)
  // =========================================================================
  private startTaskDispatchLoop(): void {
    const schedule = () => {
      // Canonical jitter: use a hash of a unified ID for deterministic pseudo-randomness
      const baseId = createUnifiedId('task', createUnifiedTimestamp().iso);
      // Simple hash function for demo (replace with a better one if needed)
      let hash = 0;
      for (let i = 0; i < baseId.length; i++) {
        hash = (hash << 5) - hash + baseId.charCodeAt(i);
        hash |= 0;
      }
      const jitter = Math.abs(hash % 2000); // up to 2s jitter, deterministic per call
      const delay = this.TASK_DISPATCH_BASE_INTERVAL + jitter;
      this.taskDispatchTimer = setTimeout(async () => {
        try {
          await this.dispatchQueuedTasks();
        } catch (err) {
          unifiedMonitoringService.trackOperation('TaskDelegation', 'dispatch_cycle', 'error', {
            error: err instanceof Error ? err.message : String(err),
          });
        } finally {
          schedule();
        }
      }, delay);
      this.taskDispatchTimer.unref?.();
    };
    schedule();
    unifiedMonitoringService.trackOperation('TaskDelegation', 'dispatch_loop', 'success', {
      intervalMs: this.TASK_DISPATCH_BASE_INTERVAL,
    });
  }

  private async dispatchQueuedTasks(): Promise<void> {
    const queued = taskDelegationService.getQueuedTasks();
    if (!queued.length) return;
    const now = createUnifiedTimestamp();
    // Filter out tasks that are not yet eligible due to backoff schedule
    const eligible = queued.filter((t) => !t.nextAttemptUnix || t.nextAttemptUnix <= now.unix);
    if (eligible.length < queued.length) {
      // Emit a single aggregated skip event to avoid noisy per-task metrics
      unifiedMonitoringService.trackOperation('TaskDelegation', 'retry_backoff_skip', 'success', {
        skipped: queued.length - eligible.length,
      });
    }
    for (const task of eligible.slice(0, 5)) {
      // limit per cycle to avoid burst
      // Mark dispatched first (idempotent)
      const marked = taskDelegationService.markDispatched(task.id);
      if (!marked) continue;
      const start = createUnifiedTimestamp();
      try {
        if (!task.targetAgent) {
          // Structured dispatch failure: no suitable agent inferred
          taskDelegationService.markDispatchFailure(
            task.id,
            'no_target_agent',
            'No target agent inferred for action',
          );
          taskDelegationService.maybeRequeue(task.id);
          continue;
        }
        unifiedMonitoringService.trackOperation('TaskDelegation', 'dispatch', 'success', {
          taskId: task.id,
          targetAgent: task.targetAgent,
        });
        await this.executeDelegatedTask(task.id);
      } catch (err) {
        unifiedMonitoringService.trackOperation('TaskDelegation', 'dispatch', 'error', {
          taskId: task.id,
          error: err instanceof Error ? err.message : String(err),
        });
      } finally {
        const end = createUnifiedTimestamp();
        unifiedMonitoringService.trackOperation('TaskDelegation', 'dispatch_latency', 'success', {
          taskId: task.id,
          ms: end.unix - start.unix,
        });
      }
    }
  }

  /** Placeholder execution layer (to be replaced with real remediation invocation). */
  private async executeDelegatedTask(taskId: string): Promise<void> {
    const execStart = createUnifiedTimestamp();
    try {
      // Future pluggable execution adapter: resolved lazily to prevent circular deps
      const adapter = (
        globalThis as unknown as {
          __oneagentExecutionAdapter?: {
            execute: (
              taskId: string,
            ) => Promise<{ success: boolean; errorCode?: string; errorMessage?: string }>;
          };
        }
      ).__oneagentExecutionAdapter;
      let res: { success: boolean; errorCode?: string; errorMessage?: string } | undefined;
      if (adapter && typeof adapter.execute === 'function') {
        try {
          res = await adapter.execute(taskId);
        } catch (adapterErr) {
          unifiedMonitoringService.trackOperation('TaskDelegation', 'execute_adapter', 'error', {
            taskId,
            error: adapterErr instanceof Error ? adapterErr.message : String(adapterErr),
          });
          res = { success: false, errorCode: 'adapter_error', errorMessage: String(adapterErr) };
        }
      } else {
        // Default placeholder success
        res = { success: true };
      }
      const execEndInner = createUnifiedTimestamp();
      const durationMs = execEndInner.unix - execStart.unix;
      taskDelegationService.markExecutionResult(
        taskId,
        !!res.success,
        !res.success ? res.errorCode : undefined,
        !res.success ? res.errorMessage : undefined,
        durationMs,
      );
    } catch (execErr) {
      const execEndInner = createUnifiedTimestamp();
      const durationMs = execEndInner.unix - execStart.unix;
      taskDelegationService.markExecutionResult(
        taskId,
        false,
        'execution_failure',
        execErr instanceof Error ? execErr.message : String(execErr),
        durationMs,
      );
    }
  }
}
