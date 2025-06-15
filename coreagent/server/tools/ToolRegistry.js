"use strict";
/**
 * Unified MCP Tool Registry
 * Central registry for all unified MCP tools with predictable patterns
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.toolRegistry = exports.ToolRegistry = void 0;
const MemoryCreateTool_1 = require("./MemoryCreateTool");
class ToolRegistry {
    constructor() {
        this.tools = new Map();
        this.registerDefaultTools();
    }
    /**
     * Register default unified tools
     */
    registerDefaultTools() {
        // Memory management tools (Constitutional AI compliant - append-only)
        this.registerTool(new MemoryCreateTool_1.MemoryCreateTool());
        console.log(`[ToolRegistry] Registered ${this.tools.size} unified memory tools (append-only for Constitutional AI compliance)`);
    }
    /**
     * Register a new tool
     */
    registerTool(tool) {
        this.tools.set(tool.name, tool);
        console.log(`[ToolRegistry] Registered unified tool: ${tool.name}`);
    }
    /**
     * Get a tool by name
     */
    getTool(name) {
        return this.tools.get(name);
    }
    /**
     * Check if a tool is registered
     */
    hasTool(name) {
        return this.tools.has(name);
    }
    /**
     * Get all registered tool names
     */
    getToolNames() {
        return Array.from(this.tools.keys());
    }
    /**
     * Get tool schema for MCP registration
     */
    getToolSchemas() {
        return Array.from(this.tools.values()).map(tool => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.schema
        }));
    }
    /**
     * Execute a tool by name
     */
    async executeTool(name, args, id) {
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
    getStatus() {
        return {
            totalTools: this.tools.size,
            toolNames: this.getToolNames(),
            framework: 'unified_mcp_v1.0',
            constitutionalCompliant: true
        };
    }
}
exports.ToolRegistry = ToolRegistry;
// Export singleton instance
exports.toolRegistry = new ToolRegistry();
