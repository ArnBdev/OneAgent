/**
 * Unified MCP Tool Registry
 * Central registry for all unified MCP tools with predictable patterns
 */

import { UnifiedMCPTool } from './UnifiedMCPTool';
import { MemoryCreateTool } from './MemoryCreateTool';
import { MemorySearchTool } from './MemorySearchTool';
import { EnhancedSearchTool } from './EnhancedSearchTool';
import { AgentCoordinationTool } from './AgentCoordinationTool';
import { SystemHealthTool } from './SystemHealthTool';

export class ToolRegistry {
  private tools: Map<string, UnifiedMCPTool> = new Map();

  constructor() {
    this.registerDefaultTools();
  }  /**
   * Register default unified tools
   */
  private registerDefaultTools(): void {
    // Memory management tools (Constitutional AI compliant - append-only)
    this.registerTool(new MemoryCreateTool());
    this.registerTool(new MemorySearchTool());
    
    // Enhanced search with quality filtering
    this.registerTool(new EnhancedSearchTool());
    
    // Multi-agent coordination
    this.registerTool(new AgentCoordinationTool());
    
    // System monitoring and health
    this.registerTool(new SystemHealthTool());
    
    console.log(`[ToolRegistry] Registered ${this.tools.size} unified tools (Constitutional AI compliant)`);
  }

  /**
   * Register a new tool
   */
  public registerTool(tool: UnifiedMCPTool): void {
    this.tools.set(tool.name, tool);
    console.log(`[ToolRegistry] Registered unified tool: ${tool.name}`);
  }

  /**
   * Get a tool by name
   */
  public getTool(name: string): UnifiedMCPTool | undefined {
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
   * Get tool schema for MCP registration
   */
  public getToolSchemas(): Array<{name: string, description: string, inputSchema: any}> {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.schema
    }));
  }

  /**
   * Execute a tool by name
   */
  public async executeTool(name: string, args: any, id: any): Promise<any> {
    const tool = this.getTool(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    console.log(`[ToolRegistry] Executing unified tool: ${name}`);
    return await tool.execute(args, id);
  }

  /**
   * Get unified tools count and status
   */
  public getStatus(): {
    totalTools: number;
    toolNames: string[];
    framework: string;
    constitutionalCompliant: boolean;
  } {
    return {
      totalTools: this.tools.size,
      toolNames: this.getToolNames(),
      framework: 'unified_mcp_v1.0',
      constitutionalCompliant: true
    };
  }
}

// Export singleton instance
export const toolRegistry = new ToolRegistry();
