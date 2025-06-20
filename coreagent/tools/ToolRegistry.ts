/**
 * Unified MCP Tool Registry
 * Central registry for all unified MCP tools with categorized organization
 * NLACS Integration: Modern agent coordination via NLACS orchestrator
 */

import { UnifiedMCPTool } from './UnifiedMCPTool';
import { MemoryCreateTool } from './MemoryCreateTool';
import { MemorySearchTool } from './MemorySearchTool';
import { EnhancedSearchTool } from './EnhancedSearchTool';
import { SystemHealthTool } from './SystemHealthTool';
import { UnifiedWebSearchTool } from './UnifiedWebSearchTool';
import { UnifiedWebFetchTool } from './UnifiedWebFetchTool';
import { UnifiedContext7QueryTool } from './UnifiedContext7QueryTool';
import { UnifiedContext7StoreTool } from './UnifiedContext7StoreTool';
// REMOVED: EnhancedAIAssistantTool - maintaining clear separation of concerns
import { CodeAnalysisTool } from './CodeAnalysisTool';
import { Context7MCPIntegration } from '../mcp/Context7MCPIntegration';
import { ConversationRetrievalTool } from './ConversationRetrievalTool';
import { ConversationSearchTool } from './ConversationSearchTool';
// NLACS Integration for modern agent coordination
import { NLACSCoordinationTool } from './NLACSCoordinationTool';

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

export class ToolRegistry {
  private tools: Map<string, ToolRegistration> = new Map();
  private categories: Map<ToolCategory, string[]> = new Map();
  private initialized = false;

  constructor() {
    this.initializeCategories();
    this.registerDefaultTools();
    this.initialized = true;
  }

  /**
   * Initialize tool categories
   */
  private initializeCategories(): void {
    for (const category of Object.values(ToolCategory)) {
      this.categories.set(category as ToolCategory, []);
    }
  }  /**
   * Register default unified tools with metadata
   */
  private registerDefaultTools(): void {
    // Memory management tools (Constitutional AI compliant - append-only)
    this.registerTool(new MemoryCreateTool(), {
      category: ToolCategory.MEMORY_CONTEXT,
      constitutionalLevel: 'critical',
      priority: 9
    });
    
    this.registerTool(new MemorySearchTool(), {
      category: ToolCategory.MEMORY_CONTEXT,
      constitutionalLevel: 'enhanced',
      priority: 8
    });

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

    // Modern Agent Communication & Coordination via NLACS
    this.registerTool(new NLACSCoordinationTool(), {
      category: ToolCategory.AGENT_COMMUNICATION,
      constitutionalLevel: 'critical',
      priority: 9
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
    const context7Integration = new Context7MCPIntegration();
    
    this.registerTool(new UnifiedContext7QueryTool(context7Integration), {
      category: ToolCategory.MEMORY_CONTEXT,
      constitutionalLevel: 'enhanced',
      priority: 8
    });

    this.registerTool(new UnifiedContext7StoreTool(context7Integration), {
      category: ToolCategory.MEMORY_CONTEXT,
      constitutionalLevel: 'enhanced',
      priority: 7
    });    // Development and Professional Tools
    this.registerTool(new CodeAnalysisTool(), {
      category: ToolCategory.DEVELOPMENT,
      constitutionalLevel: 'enhanced',
      priority: 8
    });
    
    // NOTE: EnhancedAIAssistantTool REMOVED to maintain clear separation of concerns
    // Memory operations are handled by dedicated MemoryCreateTool and MemorySearchTool
    // AI assistance should be separate from memory management for clarity
    
    console.log(`[ToolRegistry] Registered ${this.tools.size} unified tools across ${this.categories.size} categories`);
    this.logCategoryStatus();
  }

  /**
   * Register a new tool with metadata
   */
  public registerTool(tool: UnifiedMCPTool, metadata?: Partial<ToolMetadata>): void {
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
  public getToolSchemas(): Array<{name: string, description: string, inputSchema: any}> {
    return Array.from(this.tools.values()).map(registration => ({
      name: registration.tool.name,
      description: registration.tool.description,
      inputSchema: registration.tool.schema
    }));
  }

  /**
   * Execute a tool by name with usage tracking
   */
  public async executeTool(name: string, args: any, id: any): Promise<any> {
    const registration = this.tools.get(name);
    if (!registration) {
      throw new Error(`Tool not found: ${name}`);
    }

    // Update usage tracking
    registration.usageCount++;
    registration.lastUsed = new Date();

    console.log(`[ToolRegistry] Executing ${name} (category: ${registration.metadata.category}, usage: ${registration.usageCount})`);
    return await registration.tool.execute(args, id);
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

    for (const [name, registration] of this.tools) {
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
    for (const [category, tools] of this.categories) {
      console.log(`  ${category}: ${tools.length} tools`);
    }
  }
}

// Export singleton instance
export const toolRegistry = new ToolRegistry();
