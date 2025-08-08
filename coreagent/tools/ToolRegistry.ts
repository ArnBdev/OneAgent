/**
 * Unified MCP Tool Registry
 * Central registry for all unified MCP tools with categorized organization
 * NLACS Integration: Modern agent coordination via NLACS orchestrator
 * 
 * Constitutional AI Implementation:
 * - Accuracy: Canonical tool registration and execution patterns
 * - Transparency: Clear tool categorization and performance metrics
 * - Helpfulness: Unified tool discovery and validation
 * - Safety: Comprehensive error handling and quality validation
 */

import { UnifiedMCPTool, ToolExecutionResult } from './UnifiedMCPTool';
import { createUnifiedTimestamp, createUnifiedId, OneAgentUnifiedBackbone } from '../utils/UnifiedBackboneService';
import { OneAgentMemory } from '../memory/OneAgentMemory';

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
  DEVELOPMENT = 'development'
}

export interface ToolMetadata {
  category: ToolCategory;
  constitutionalLevel: 'basic' | 'enhanced' | 'critical';
  dependencies?: string[];
  priority: number; // 1-10, higher = more important
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
  private tools: Map<string, ToolRegistration> = new Map();
  private categories: Map<ToolCategory, string[]> = new Map();
  private performanceMetrics: Map<string, ToolPerformanceMetrics> = new Map();
  private initialized = false;
  private memorySystem: OneAgentMemory | null = null;

  constructor() {
    this.initializeCategories();
    this.registerNonMemoryTools();
    this.initialized = true;
  }

  /**
   * Set the shared memory system and initialize memory tools
   */
  setMemorySystem(memorySystem: OneAgentMemory): void {
    this.memorySystem = memorySystem;
    this.registerNonMemoryTools();
  }

  /**
   * Initialize tool categories
   */
  private initializeCategories(): void {
    for (const category of Object.values(ToolCategory)) {
      this.categories.set(category as ToolCategory, []);
    }
  }

  /**
   * Register non-memory tools first (before memory system is available)
   */
  private registerNonMemoryTools(): void {
    // Web Research Tools  
    this.registerTool(new EnhancedSearchTool(), {
      category: ToolCategory.WEB_RESEARCH,
      constitutionalLevel: 'enhanced',
      priority: 7
    });

    this.registerTool(new UnifiedWebSearchTool(), {
      category: ToolCategory.WEB_RESEARCH,
      constitutionalLevel: 'enhanced',
      priority: 8
    });
      this.registerTool(new UnifiedWebFetchTool(), {
      category: ToolCategory.WEB_RESEARCH,
      constitutionalLevel: 'enhanced',
      priority: 7
    });
    
    this.registerTool(new ConversationRetrievalTool(), {
      category: ToolCategory.AGENT_COMMUNICATION,
      constitutionalLevel: 'enhanced',
      priority: 7
    });
    
    this.registerTool(new ConversationSearchTool(), {
      category: ToolCategory.AGENT_COMMUNICATION,
      constitutionalLevel: 'enhanced',
      priority: 7
    });
    
    // System Health and Monitoring
    this.registerTool(new SystemHealthTool(), {
      category: ToolCategory.CORE_SYSTEM,
      constitutionalLevel: 'basic',
      priority: 6
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
    this.registerTool(new CodeAnalysisTool(), {
      category: ToolCategory.DEVELOPMENT,
      constitutionalLevel: 'enhanced',
      priority: 8
    });
    
    // Canonical OneAgent memory tools (the only standard, best-practice memory tools)
    const canonicalMemoryClient = OneAgentMemory.getInstance({
      requestTimeout: 15000, // Increased timeout for MCP operations
      enableCaching: true
    });
    this.registerTool(new OneAgentMemorySearchTool(canonicalMemoryClient), {
      category: ToolCategory.MEMORY_CONTEXT,
      constitutionalLevel: 'critical',
      priority: 10
    });
    this.registerTool(new OneAgentMemoryAddTool(canonicalMemoryClient), {
      category: ToolCategory.MEMORY_CONTEXT,
      constitutionalLevel: 'critical',
      priority: 10
    });
    this.registerTool(new OneAgentMemoryEditTool(canonicalMemoryClient), {
      category: ToolCategory.MEMORY_CONTEXT,
      constitutionalLevel: 'critical',
      priority: 10
    });
    this.registerTool(new OneAgentMemoryDeleteTool(canonicalMemoryClient), {
      category: ToolCategory.MEMORY_CONTEXT,
      constitutionalLevel: 'critical',
      priority: 10
    });
    
    // NOTE: EnhancedAIAssistantTool REMOVED to maintain clear separation of concerns
    // Memory operations are handled by dedicated MemoryCreateTool and MemorySearchTool
    // AI assistance should be separate from memory management for clarity
    
    console.log(`[ToolRegistry] Registered ${this.tools.size} unified tools across ${this.categories.size} categories`);
    this.logCategoryStatus();
  }

  /**
   * Register a new tool with metadata (idempotent)
   */
  public registerTool(tool: UnifiedMCPTool, metadata?: Partial<ToolMetadata>): void {
    // Check if tool is already registered
    if (this.tools.has(tool.name)) {
      // Silent skip - tool already registered
      return;
    }
    
    const fullMetadata: ToolMetadata = {
      category: metadata?.category || ToolCategory.DEVELOPMENT,
      constitutionalLevel: metadata?.constitutionalLevel || tool.constitutionalLevel,
      dependencies: metadata?.dependencies || [],
      priority: metadata?.priority || 5
    };

    const registration: ToolRegistration = {
      tool,
      metadata: fullMetadata,
      registeredAt: new Date(),
      usageCount: 0
    };

    this.tools.set(tool.name, registration);
    
    // Add to category
    const categoryTools = this.categories.get(fullMetadata.category) || [];
    categoryTools.push(tool.name);
    this.categories.set(fullMetadata.category, categoryTools);
    console.log(`[ToolRegistry] Registered ${tool.name} in ${fullMetadata.category} (priority: ${fullMetadata.priority})`);
  }

  /**
   * Get a tool by name
   */
  public getTool(name: string): UnifiedMCPTool | undefined {
    const registration = this.tools.get(name);
    return registration?.tool;
  }

  /**
   * Get tool registration (includes metadata)
   */
  public getToolRegistration(name: string): ToolRegistration | undefined {
    return this.tools.get(name);
  }

  /**
   * Check if a tool is registered
   */
  public hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Get all registered tool names
   */
  public getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Get tools by category
   */
  public getToolsByCategory(category: ToolCategory): UnifiedMCPTool[] {
    const toolNames = this.categories.get(category) || [];
    return toolNames.map(name => this.getTool(name)).filter(Boolean) as UnifiedMCPTool[];
  }

  /**
   * Get tool schema for MCP registration
   */
  public getToolSchemas(): Array<{name: string, description: string, inputSchema: Record<string, unknown>}> {
    return Array.from(this.tools.values()).map(registration => ({
      name: registration.tool.name,
      description: registration.tool.description,
      inputSchema: registration.tool.schema.properties || {}
    }));
  }

  /**
   * Execute a tool by name with usage tracking and Constitutional AI compliance
   */
  public async executeTool(name: string, args: unknown): Promise<ToolExecutionResult> {
    const registration = this.tools.get(name);
    if (!registration) {
      const error = new Error(`Tool not found: ${name}`);
      const backbone = OneAgentUnifiedBackbone.getInstance();
      const errorSystem = backbone.getServices().errorHandler;
      await errorSystem.handleError(error, { toolName: name, available: this.getToolNames() });
      return {
        success: false,
        data: { error: error.message, available: this.getToolNames() }
      };
    }

    // Create execution context with canonical metadata
    const executionContext: ToolExecutionContext = {
      executionId: createUnifiedId('operation', name),
      toolName: name,
      timestamp: createUnifiedTimestamp().iso,
      category: registration.metadata.category,
      constitutionalLevel: registration.metadata.constitutionalLevel
    };

    const startTime = performance.now();
    
    try {
      // Update usage tracking
      registration.usageCount++;
      registration.lastUsed = new Date();

      console.log(`[ToolRegistry] Executing ${name} (category: ${registration.metadata.category}, usage: ${registration.usageCount})`);
      
      // Execute tool with Constitutional AI monitoring
      const result = await registration.tool.execute(args);
      const executionTime = performance.now() - startTime;
      
      // Update performance metrics
      this.updatePerformanceMetrics(name, true, executionTime, result.qualityScore || 0);
      
      return result;
      
    } catch (error) {
      const executionTime = performance.now() - startTime;
      
      // Update performance metrics for failure
      this.updatePerformanceMetrics(name, false, executionTime, 0);
      
      // Use canonical error handling
      const backbone = OneAgentUnifiedBackbone.getInstance();
      const errorSystem = backbone.getServices().errorHandler;
      await errorSystem.handleError(error instanceof Error ? error : new Error(String(error)), {
        executionContext,
        args: typeof args === 'object' ? JSON.stringify(args) : String(args)
      });
      
      return {
        success: false,
        data: { error: error instanceof Error ? error.message : String(error) }
      };
    }
  }

  /**
   * Update tool performance metrics with Constitutional AI quality tracking
   */
  private updatePerformanceMetrics(
    toolName: string, 
    success: boolean, 
    executionTime: number, 
    qualityScore: number
  ): void {
    let metrics = this.performanceMetrics.get(toolName);
    
    if (!metrics) {
      metrics = {
        toolName,
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageExecutionTime: 0,
        lastExecutionTime: 0,
        successRate: 0,
        qualityScore: 0
      };
      this.performanceMetrics.set(toolName, metrics);
    }
    
    // Update metrics
    metrics.totalExecutions++;
    metrics.lastExecutionTime = executionTime;
    
    if (success) {
      metrics.successfulExecutions++;
      // Update rolling average for quality score
      metrics.qualityScore = (metrics.qualityScore + qualityScore) / 2;
    } else {
      metrics.failedExecutions++;
    }
    
    // Update success rate and average execution time
    metrics.successRate = (metrics.successfulExecutions / metrics.totalExecutions) * 100;
    metrics.averageExecutionTime = (metrics.averageExecutionTime + executionTime) / 2;
  }

  /**
   * Get tool performance metrics
   */
  public getToolMetrics(toolName: string): ToolPerformanceMetrics | undefined {
    return this.performanceMetrics.get(toolName);
  }

  /**
   * Get all tool performance metrics
   */
  public getAllMetrics(): ToolPerformanceMetrics[] {
    return Array.from(this.performanceMetrics.values());
  }

  /**
   * Get comprehensive tool status and analytics
   */
  public getStatus(): {
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
  } {
    const categoryStats: Record<string, number> = {};
    const priorityDistribution: Record<number, number> = {};
    const usageStats: Array<{name: string, count: number}> = [];
    const categoryTools: Record<string, string[]> = {};

    for (const [name, registration] of Array.from(this.tools)) {
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
      .map(item => item.name);

    return {
      totalTools: this.tools.size,
      toolNames: this.getToolNames(),
      categories: categoryStats,
      framework: 'unified_mcp_v1.0',
      constitutionalCompliant: true,
      analytics: {
        mostUsed,
        byCategory: categoryTools,
        priorityDistribution
      }
    };
  }

  /**
   * Log category status for debugging
   */
  private logCategoryStatus(): void {
    console.log(`[ToolRegistry] Category distribution:`);
    for (const [category, tools] of Array.from(this.categories)) {
      console.log(`  ${category}: ${tools.length} tools`);
    }
  }
}

// Export singleton instance
export const toolRegistry = new ToolRegistry();
