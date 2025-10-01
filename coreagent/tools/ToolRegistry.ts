/**
 * Unified MCP Tool Registry (Canonical)
 * ------------------------------------------------------------
 * Central registry for all unified MCP tools with strict canonicalization:
 *   - Category-based organization (ToolCategory)
 *   - Capability flags (exposeToMCP, internalOnly, experimental)
 *   - Full metadata and performance tracking
 *   - NLACS integration for agent coordination
 *   - MCP protocol compliance (JSON-RPC 2.0)
 *   - Async, cache-backed registry (OneAgentUnifiedBackbone.cache)
 *
 * Constitutional AI Implementation:
 *   - Accuracy: Canonical tool registration and execution patterns
 *   - Transparency: Clear tool categorization, metadata, and performance metrics
 *   - Helpfulness: Unified tool discovery, validation, and analytics
 *   - Safety: Comprehensive error handling, quality validation, and auditability
 *
 * Usage:
 *   - All tool registration, lookup, and execution must go through this registry
 *   - No parallel/legacy/adhoc tool systems permitted
 *   - All cache access is async and type-safe
 *   - All errors routed through canonical error handler
 *
 * See AGENTS.md for architectural authority and anti-parallel protocol.
 */

import { UnifiedMCPTool, ToolExecutionResult } from './UnifiedMCPTool';
import {
  createUnifiedTimestamp,
  createUnifiedId,
  OneAgentUnifiedBackbone,
} from '../utils/UnifiedBackboneService';
import { OneAgentMemory } from '../memory/OneAgentMemory';
import { getOneAgentMemory } from '../utils/UnifiedBackboneService';

import { EnhancedSearchTool } from './EnhancedSearchTool';
import { SystemHealthTool } from './SystemHealthTool';
import { UnifiedWebSearchTool } from './UnifiedWebSearchTool';
import { UnifiedWebFetchTool } from './UnifiedWebFetchTool';

// REMOVED: EnhancedAIAssistantTool - maintaining clear separation of concerns
import { CodeAnalysisTool } from './CodeAnalysisTool';
// Context7MCPIntegration import removed (deprecated)
import { ConversationRetrievalTool } from './ConversationRetrievalTool';
import { ConversationSearchTool } from './ConversationSearchTool';
import { OneAgentMemorySearchTool } from './OneAgentMemorySearchTool';
import { OneAgentMemoryAddTool } from './OneAgentMemoryAddTool';
import { OneAgentMemoryEditTool } from './OneAgentMemoryEditTool';
import { OneAgentMemoryDeleteTool } from './OneAgentMemoryDeleteTool';

export enum ToolCategory {
  CORE_SYSTEM = 'core_system',
  MEMORY_CONTEXT = 'memory_context',
  WEB_RESEARCH = 'web_research',
  AGENT_COMMUNICATION = 'agent_communication',
  DEVELOPMENT = 'development',
}

export interface ToolMetadata {
  category: ToolCategory;
  constitutionalLevel: 'basic' | 'enhanced' | 'critical';
  dependencies?: string[];
  priority: number; // 1-10, higher = more important
  exposeToMCP?: boolean; // Only surfaced if true
  internalOnly?: boolean; // Not surfaced externally
  experimental?: boolean; // For future/unstable tools
  version?: string;
  description?: string;
}

export interface ToolRegistration {
  tool: UnifiedMCPTool;
  metadata: ToolMetadata;
  registeredAt: Date;
  lastUsed?: Date;
  usageCount: number;
}

/**
 * Canonical Tool Performance Metrics
 */
export interface ToolPerformanceMetrics {
  toolName: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  lastExecutionTime: number;
  successRate: number;
  qualityScore: number;
}

/**
 * Canonical Tool Execution Context
 */
export interface ToolExecutionContext {
  executionId: string;
  toolName: string;
  timestamp: string;
  category: ToolCategory;
  constitutionalLevel: 'basic' | 'enhanced' | 'critical';
  userId?: string;
  sessionId?: string;
}

export class ToolRegistry {
  private cache = OneAgentUnifiedBackbone.getInstance().cache;
  private toolsKey = 'toolRegistry.tools';
  private categoriesKey = 'toolRegistry.categories';
  private metricsKey = 'toolRegistry.performanceMetrics';
  private initialized = false;
  private memorySystem: OneAgentMemory | null = null;

  /**
   * Construct the canonical ToolRegistry singleton.
   * Note: Async initialization is not supported in constructors; use an init() method if needed.
   * Registers all non-memory tools and initializes categories in the unified cache.
   * Logging is handled in registerTool and logCategoryStatus.
   */
  /**
   * @param opts.memorySystem Optionally inject a canonical OneAgentMemory instance (DI preferred)
   */
  constructor(opts: { memorySystem?: OneAgentMemory } = {}) {
    this.memorySystem = opts.memorySystem || null;
    // NOTE: Async initialization deferred - call ensureInitialized() before use
    // Constructor must remain synchronous; async operations moved to lazy init
    this.initialized = false;
  }

  /**
   * Lazy initialization - ensures registry is ready before first use.
   * Idempotent - safe to call multiple times.
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    // CRITICAL: Set flag FIRST to prevent infinite recursion when registerTool calls ensureInitialized
    this.initialized = true;

    try {
      console.log('[ToolRegistry] 🔄 Initializing categories...');
      await this.initializeCategories();
      console.log('[ToolRegistry] ✅ Categories initialized');

      console.log('[ToolRegistry] 🔄 Registering non-memory tools...');
      await this.registerNonMemoryTools();
      console.log('[ToolRegistry] ✅ Non-memory tools registered');

      console.log('[ToolRegistry] 🔄 Registering memory tools...');
      await this.registerMemoryTools();
      console.log('[ToolRegistry] ✅ Memory tools registered');

      console.log('[ToolRegistry] 🎉 Initialization complete');
    } catch (error) {
      // Reset flag on error so next call retries
      this.initialized = false;
      console.error('[ToolRegistry] ❌ Initialization FAILED:', error);
      throw error;
    }
  } /**
   * Set the shared memory system and (re)register memory tools.
   * @param memorySystem The canonical OneAgentMemory instance.
   */
  setMemorySystem(memorySystem: OneAgentMemory): void {
    this.memorySystem = memorySystem;
    this.registerMemoryTools();
  }

  /**
   * Initialize tool categories in the unified cache.
   * Ensures all ToolCategory values are present as keys.
   */
  private async initializeCategories(): Promise<void> {
    try {
      console.log('[ToolRegistry] 📝 Creating category structure...');
      const categories: Record<string, string[]> = {};
      for (const category of Object.values(ToolCategory)) {
        categories[category as ToolCategory] = [];
      }
      // Cache categories (now that cache system is fixed)
      await this.cache.set(this.categoriesKey, categories);
      console.log('[ToolRegistry] ✅ Categories structure created and cached');
    } catch (error) {
      console.error('[ToolRegistry] ❌ initializeCategories FAILED:', error);
      throw error;
    }
  }

  /**
   * Register all non-memory tools (idempotent).
   * Called at construction and when memory system is set.
   * Only canonical, MCP-compliant tools are registered here.
   */
  private async registerNonMemoryTools(): Promise<void> {
    // Web Research Tools
    await this.registerTool(new EnhancedSearchTool(), {
      category: ToolCategory.WEB_RESEARCH,
      constitutionalLevel: 'enhanced',
      priority: 7,
      exposeToMCP: true,
    });

    await this.registerTool(new UnifiedWebSearchTool(), {
      category: ToolCategory.WEB_RESEARCH,
      constitutionalLevel: 'enhanced',
      priority: 8,
      exposeToMCP: true,
    });
    await this.registerTool(new UnifiedWebFetchTool(), {
      category: ToolCategory.WEB_RESEARCH,
      constitutionalLevel: 'enhanced',
      priority: 7,
      exposeToMCP: true,
    });

    await this.registerTool(new ConversationRetrievalTool(), {
      category: ToolCategory.AGENT_COMMUNICATION,
      constitutionalLevel: 'enhanced',
      priority: 7,
      exposeToMCP: true,
    });

    await this.registerTool(new ConversationSearchTool(), {
      category: ToolCategory.AGENT_COMMUNICATION,
      constitutionalLevel: 'enhanced',
      priority: 7,
      exposeToMCP: true,
    });

    // System Health and Monitoring
    await this.registerTool(new SystemHealthTool(), {
      category: ToolCategory.CORE_SYSTEM,
      constitutionalLevel: 'basic',
      priority: 6,
      exposeToMCP: true,
    });

    // Context7 documentation tools (now with real integration)
    // Context7 integration now handled via canonical backbone. Legacy instance removed.

    // Context7 documentation query tool registration removed; use canonical backbone integration only.

    // TODO: Fix UnifiedContext7StoreTool - currently has broken imports/stubs causing undefined registration
    // this.registerTool(new UnifiedContext7StoreTool(), {
    //   category: ToolCategory.MEMORY_CONTEXT,
    //   constitutionalLevel: 'enhanced',
    //   priority: 7
    // });

    // Development and Professional Tools
    await this.registerTool(new CodeAnalysisTool(), {
      category: ToolCategory.DEVELOPMENT,
      constitutionalLevel: 'enhanced',
      priority: 8,
      exposeToMCP: true,
    });

    // Memory tools are registered in registerMemoryTools()
  }

  /**
   * Register canonical OneAgent memory tools using the injected or canonical memory system.
   */
  private async registerMemoryTools(): Promise<void> {
    const memoryClient = this.memorySystem || getOneAgentMemory();
    await this.registerTool(new OneAgentMemorySearchTool(memoryClient), {
      category: ToolCategory.MEMORY_CONTEXT,
      constitutionalLevel: 'critical',
      priority: 10,
      exposeToMCP: true,
    });
    await this.registerTool(new OneAgentMemoryAddTool(memoryClient), {
      category: ToolCategory.MEMORY_CONTEXT,
      constitutionalLevel: 'critical',
      priority: 10,
      exposeToMCP: true,
    });
    await this.registerTool(new OneAgentMemoryEditTool(memoryClient), {
      category: ToolCategory.MEMORY_CONTEXT,
      constitutionalLevel: 'critical',
      priority: 10,
      exposeToMCP: true,
    });
    await this.registerTool(new OneAgentMemoryDeleteTool(memoryClient), {
      category: ToolCategory.MEMORY_CONTEXT,
      constitutionalLevel: 'critical',
      priority: 10,
      exposeToMCP: true,
    });
  }
  // NOTE: EnhancedAIAssistantTool REMOVED to maintain clear separation of concerns
  // Memory operations are handled by dedicated MemoryCreateTool and MemorySearchTool
  // AI assistance should be separate from memory management for clarity

  // Category status logging is now handled in logCategoryStatus()

  /**
   * Register a new tool with metadata (idempotent, async, canonical).
   * - Loads tools and categories from unified cache.
   * - Skips registration if tool already present.
   * - Updates both tool and category registries.
   * - All metadata is normalized and capability-flagged.
   * @param tool The UnifiedMCPTool instance to register.
   * @param metadata Optional partial ToolMetadata (merged with tool defaults).
   */
  public async registerTool(tool: UnifiedMCPTool, metadata?: Partial<ToolMetadata>): Promise<void> {
    try {
      console.log(`[ToolRegistry] 📥 Starting registration for: ${tool.name}`);
      await this.ensureInitialized();
      console.log(`[ToolRegistry] ✅ Registry initialized for: ${tool.name}`);

      // Load existing tools and categories from cache (now that cache is fixed)
      console.log(`[ToolRegistry] 🔄 Loading cache for: ${tool.name}`);
      const tools =
        ((await this.cache.get(this.toolsKey)) as Record<string, ToolRegistration>) || {};
      const categories =
        ((await this.cache.get(this.categoriesKey)) as Record<string, string[]>) || {};
      console.log(`[ToolRegistry] ✅ Cache loaded for: ${tool.name}`);

      // Check if tool is already registered
      if (tools[tool.name]) {
        console.log(`[ToolRegistry] ⏭️  Tool ${tool.name} already registered, skipping`);
        // Silent skip - tool already registered
        return;
      }

      console.log(`[ToolRegistry] 🔨 Creating registration metadata for: ${tool.name}`);
      const fullMetadata: ToolMetadata = {
        category: metadata?.category || ToolCategory.DEVELOPMENT,
        constitutionalLevel: metadata?.constitutionalLevel || tool.constitutionalLevel,
        dependencies: metadata?.dependencies || [],
        priority: metadata?.priority || 5,
        exposeToMCP: metadata?.exposeToMCP !== false, // default true
        internalOnly: metadata?.internalOnly || false,
        experimental: metadata?.experimental || false,
        version: metadata?.version || '1.0.0',
        description: metadata?.description || tool.description || '',
      };

      console.log(`[ToolRegistry] 📝 Building registration object for: ${tool.name}`);
      const registration: ToolRegistration = {
        tool,
        metadata: fullMetadata,
        registeredAt: new Date(createUnifiedTimestamp().iso),
        usageCount: 0,
      };

      tools[tool.name] = registration;

      // Add to category
      if (!categories[fullMetadata.category]) categories[fullMetadata.category] = [];
      categories[fullMetadata.category].push(tool.name);

      // Store in cache (now that cache system is fixed)
      await this.cache.set(this.toolsKey, tools);
      console.log(`[ToolRegistry] ✅ Tools cached successfully for: ${tool.name}`);

      await this.cache.set(this.categoriesKey, categories);
      console.log(`[ToolRegistry] ✅ Categories cached successfully for: ${tool.name}`);

      console.log(`[ToolRegistry] ✅ Cache saved successfully for: ${tool.name}`);

      if (!(process.env.ONEAGENT_FAST_TEST_MODE === '1' || process.env.NODE_ENV === 'test')) {
        console.log(
          `[ToolRegistry] Registered ${tool.name} in ${fullMetadata.category} (priority: ${fullMetadata.priority})`,
        );
      }
      console.log(`[ToolRegistry] 🎉 Registration complete for: ${tool.name}`);
    } catch (error) {
      console.error(`[ToolRegistry] ❌ registerTool FAILED for ${tool.name}:`, error);
      throw error;
    }
  }

  /**
   * Get a tool instance by name.
   * @param name The tool's canonical name.
   * @returns The UnifiedMCPTool instance, or undefined if not found.
   */
  public async getTool(name: string): Promise<UnifiedMCPTool | undefined> {
    const tools = ((await this.cache.get(this.toolsKey)) as Record<string, ToolRegistration>) || {};
    const registration = tools[name];
    return registration?.tool;
  }

  /**
   * Get tool registration (includes full metadata and usage info).
   * @param name The tool's canonical name.
   * @returns ToolRegistration object, or undefined if not found.
   */
  public async getToolRegistration(name: string): Promise<ToolRegistration | undefined> {
    const tools = ((await this.cache.get(this.toolsKey)) as Record<string, ToolRegistration>) || {};
    return tools[name];
  }

  /**
   * Check if a tool is registered by name.
   * @param name The tool's canonical name.
   * @returns True if registered, false otherwise.
   */
  public async hasTool(name: string): Promise<boolean> {
    const tools = ((await this.cache.get(this.toolsKey)) as Record<string, ToolRegistration>) || {};
    return !!tools[name];
  }

  /**
   * Get all registered tool names (canonical).
   * @returns Array of tool names.
   */
  public async getToolNames(): Promise<string[]> {
    const tools = ((await this.cache.get(this.toolsKey)) as Record<string, ToolRegistration>) || {};
    return Object.keys(tools);
  }

  /**
   * Get all tools in a given category.
   * @param category The ToolCategory enum value.
   * @returns Array of UnifiedMCPTool instances in the category.
   */
  public async getToolsByCategory(category: ToolCategory): Promise<UnifiedMCPTool[]> {
    const categories =
      ((await this.cache.get(this.categoriesKey)) as Record<string, string[]>) || {};
    const toolNames: string[] = categories[category] || [];
    const tools = ((await this.cache.get(this.toolsKey)) as Record<string, ToolRegistration>) || {};
    return toolNames.map((name: string) => tools[name]?.tool).filter(Boolean) as UnifiedMCPTool[];
  }

  /**
   * Get tool schemas for MCP registration (JSON-RPC 2.0 compliant).
   * Only tools with exposeToMCP=true and internalOnly=false are included.
   * @returns Array of tool schema objects (name, description, inputSchema, etc).
   */
  public async getToolSchemas(): Promise<
    Array<{
      name: string;
      description: string;
      inputSchema: Record<string, unknown>;
      version?: string;
      experimental?: boolean;
    }>
  > {
    const tools = ((await this.cache.get(this.toolsKey)) as Record<string, ToolRegistration>) || {};
    return Object.values(tools)
      .filter(
        (registration) => registration.metadata.exposeToMCP && !registration.metadata.internalOnly,
      )
      .map((registration) => ({
        name: registration.tool.name,
        description: registration.metadata.description || registration.tool.description,
        inputSchema: registration.tool.schema.properties || {},
        version: registration.metadata.version,
        experimental: registration.metadata.experimental,
      }));
  }

  /**
   * Execute a tool by name with usage tracking and Constitutional AI compliance.
   * - Tracks usage, updates metrics, and routes errors through canonical handler.
   * - All execution is monitored for quality and performance.
   * @param name The tool's canonical name.
   * @param args Arguments to pass to the tool's execute method.
   * @returns ToolExecutionResult (success, data, error, etc).
   */
  public async executeTool(name: string, args: unknown): Promise<ToolExecutionResult> {
    const tools = ((await this.cache.get(this.toolsKey)) as Record<string, ToolRegistration>) || {};
    const registration = tools[name];
    if (!registration) {
      const error = new Error(`Tool not found: ${name}`);
      const backbone = OneAgentUnifiedBackbone.getInstance();
      const errorSystem = backbone.getServices().errorHandler;
      await errorSystem.handleError(error, {
        toolName: name,
        available: await this.getToolNames(),
      });
      return {
        success: false,
        data: { error: error.message, available: await this.getToolNames() },
      };
    }

    // Create execution context with canonical metadata
    const executionContext: ToolExecutionContext = {
      executionId: createUnifiedId('operation', name),
      toolName: name,
      timestamp: createUnifiedTimestamp().iso,
      category: registration.metadata.category,
      constitutionalLevel: registration.metadata.constitutionalLevel,
    };

    const startTime = performance.now();

    try {
      // Update usage tracking
      registration.usageCount++;
      registration.lastUsed = new Date(createUnifiedTimestamp().iso);

      // Save updated usage to cache
      tools[name] = registration;
      await this.cache.set(this.toolsKey, tools);

      if (!(process.env.ONEAGENT_FAST_TEST_MODE === '1' || process.env.NODE_ENV === 'test')) {
        console.log(
          `[ToolRegistry] Executing ${name} (category: ${registration.metadata.category}, usage: ${registration.usageCount})`,
        );
      }

      // Execute tool with Constitutional AI monitoring
      const result = await registration.tool.execute(args);
      const executionTime = performance.now() - startTime;

      // Update performance metrics
      await this.updatePerformanceMetrics(name, true, executionTime, result.qualityScore || 0);

      return result;
    } catch (error) {
      const executionTime = performance.now() - startTime;

      // Update performance metrics for failure
      await this.updatePerformanceMetrics(name, false, executionTime, 0);

      // Use canonical error handling
      const backbone = OneAgentUnifiedBackbone.getInstance();
      const errorSystem = backbone.getServices().errorHandler;
      await errorSystem.handleError(error instanceof Error ? error : new Error(String(error)), {
        executionContext,
        args: typeof args === 'object' ? JSON.stringify(args) : String(args),
      });

      return {
        success: false,
        data: { error: error instanceof Error ? error.message : String(error) },
      };
    }
  }

  /**
   * Update tool performance metrics with Constitutional AI quality tracking.
   * - Updates rolling averages, success rates, and quality scores.
   * - All metrics are stored in the unified cache.
   * @param toolName The tool's canonical name.
   * @param success Whether the execution was successful.
   * @param executionTime Execution duration in ms.
   * @param qualityScore Quality score (0-100).
   */
  private async updatePerformanceMetrics(
    toolName: string,
    success: boolean,
    executionTime: number,
    qualityScore: number,
  ): Promise<void> {
    const metrics =
      ((await this.cache.get(this.metricsKey)) as Record<string, ToolPerformanceMetrics>) || {};
    let toolMetrics = metrics[toolName];

    if (!toolMetrics) {
      toolMetrics = {
        toolName,
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageExecutionTime: 0,
        lastExecutionTime: 0,
        successRate: 0,
        qualityScore: 0,
      };
    }

    // Update metrics
    toolMetrics.totalExecutions++;
    toolMetrics.lastExecutionTime = executionTime;

    if (success) {
      toolMetrics.successfulExecutions++;
      // Update rolling average for quality score
      toolMetrics.qualityScore = (toolMetrics.qualityScore + qualityScore) / 2;
    } else {
      toolMetrics.failedExecutions++;
    }

    // Update success rate and average execution time
    toolMetrics.successRate =
      (toolMetrics.successfulExecutions / toolMetrics.totalExecutions) * 100;
    toolMetrics.averageExecutionTime = (toolMetrics.averageExecutionTime + executionTime) / 2;

    metrics[toolName] = toolMetrics;
    await this.cache.set(this.metricsKey, metrics);
  }

  /**
   * Get tool performance metrics by tool name.
   * @param toolName The tool's canonical name.
   * @returns ToolPerformanceMetrics object, or undefined if not found.
   */
  public async getToolMetrics(toolName: string): Promise<ToolPerformanceMetrics | undefined> {
    const metrics =
      ((await this.cache.get(this.metricsKey)) as Record<string, ToolPerformanceMetrics>) || {};
    return metrics[toolName];
  }

  /**
   * Get all tool performance metrics (all registered tools).
   * @returns Array of ToolPerformanceMetrics objects.
   */
  public async getAllMetrics(): Promise<ToolPerformanceMetrics[]> {
    const metrics =
      ((await this.cache.get(this.metricsKey)) as Record<string, ToolPerformanceMetrics>) || {};
    return Object.values(metrics);
  }

  /**
   * Get comprehensive tool status and analytics (for MCP/monitoring).
   * Includes total count, category stats, usage analytics, and compliance flags.
   * @returns Object with tool counts, categories, analytics, and compliance info.
   */
  public async getStatus(): Promise<{
    totalTools: number;
    toolNames: string[];
    categories: Record<string, number>;
    framework: string;
    constitutionalCompliant: boolean;
    analytics: {
      mostUsed: string[];
      byCategory: Record<string, string[]>;
      priorityDistribution: Record<number, number>;
    };
  }> {
    const tools = ((await this.cache.get(this.toolsKey)) as Record<string, ToolRegistration>) || {};
    const categoryStats: Record<string, number> = {};
    const priorityDistribution: Record<number, number> = {};
    const usageStats: Array<{ name: string; count: number }> = [];
    const categoryTools: Record<string, string[]> = {};

    for (const [name, registration] of Object.entries(tools)) {
      const category = registration.metadata.category;
      const priority = registration.metadata.priority;

      categoryStats[category] = (categoryStats[category] || 0) + 1;
      priorityDistribution[priority] = (priorityDistribution[priority] || 0) + 1;
      usageStats.push({ name, count: registration.usageCount });

      if (!categoryTools[category]) categoryTools[category] = [];
      categoryTools[category].push(name);
    }

    const mostUsed = usageStats
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((item) => item.name);

    return {
      totalTools: Object.keys(tools).length,
      toolNames: Object.keys(tools),
      categories: categoryStats,
      framework: 'unified_mcp_v1.0',
      constitutionalCompliant: true,
      analytics: {
        mostUsed,
        byCategory: categoryTools,
        priorityDistribution,
      },
    };
  }

  /**
   * Log category status for debugging (stub).
   * (Category distribution logging removed; see AGENTS.md for canonical logging guidance.)
   */
  private async logCategoryStatus(): Promise<void> {
    if (!(process.env.ONEAGENT_FAST_TEST_MODE === '1' || process.env.NODE_ENV === 'test')) {
      // Category distribution logging removed (see AGENTS.md for canonical logging guidance)
    }
  }
}

// Export singleton instance
export const toolRegistry = new ToolRegistry();
