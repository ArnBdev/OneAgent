/**
 * MCP SDK Service
 *
 * Canonical wrapper around official @modelcontextprotocol/sdk for OneAgent.
 * Provides backward compatibility, unified error handling, and Constitutional AI compliance.
 *
 * CRITICAL: This is the ONLY interface to MCP protocol. No parallel implementations.
 *
 * Phase 1 Foundation:
 * - Official SDK integration
 * - Simple in-memory registry (unified cache integration in Phase 2)
 * - stdio transport (VS Code ready)
 * - Tool/resource/prompt registration
 *
 * @module coreagent/server/mcp-sdk-service
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ReadResourceRequestSchema,
  Tool,
  Resource,
  Prompt,
  TextContent,
  ImageContent,
  EmbeddedResource,
} from '@modelcontextprotocol/sdk/types.js';
import { UnifiedBackboneService, createUnifiedTimestamp } from '../utils/UnifiedBackboneService';
import { OneAgentUnifiedBackbone } from '../utils/UnifiedBackboneService';

// Phase 2: Unified cache storage with index tracking
// Registry is now backed by OneAgentUnifiedBackbone.getInstance().cache
// We maintain indices to list registered items without full cache scan
interface MCPRegistry {
  toolNames: Set<string>; // Index of registered tool names
  resourceUris: Set<string>; // Index of registered resource URIs
  promptNames: Set<string>; // Index of registered prompt names
}

export interface MCPServerConfig {
  name: string;
  version: string;
  description?: string;
  protocol?: 'stdio' | 'sse' | 'http';
  capabilities?: {
    tools?: boolean;
    resources?: boolean;
    prompts?: boolean;
    logging?: boolean;
  };
}

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
  handler: (args: Record<string, unknown>) => Promise<unknown>;
}

export interface MCPResourceDefinition {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  handler: () => Promise<string | Uint8Array>;
}

export interface MCPPromptDefinition {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
  handler: (args: Record<string, string>) => Promise<{
    messages: Array<{
      role: 'user' | 'assistant';
      content: TextContent | ImageContent | EmbeddedResource;
    }>;
  }>;
}

/**
 * MCPSDKService - Canonical MCP Interface
 *
 * Wraps official @modelcontextprotocol/sdk with OneAgent patterns:
 * - Constitutional AI compliance
 * - Unified error handling
 * - Canonical time generation
 * - Metrics and monitoring integration
 */
export class MCPSDKService {
  private static instance: MCPSDKService;
  private server: Server;
  private config: MCPServerConfig;
  private backbone = UnifiedBackboneService;
  private cache = OneAgentUnifiedBackbone.getInstance().cache;

  // Phase 2: Index-based registry (data stored in unified cache)
  private registry: MCPRegistry = {
    toolNames: new Set(),
    resourceUris: new Set(),
    promptNames: new Set(),
  };

  private constructor(config: MCPServerConfig) {
    this.config = config;
    this.server = new Server(
      {
        name: config.name,
        version: config.version,
      },
      {
        capabilities: {
          tools: config.capabilities?.tools ? {} : undefined,
          resources: config.capabilities?.resources ? {} : undefined,
          prompts: config.capabilities?.prompts ? {} : undefined,
          logging: config.capabilities?.logging ? {} : undefined,
        },
      },
    );

    this.setupHandlers();
  }

  /**
   * Get singleton instance (canonical pattern)
   */
  public static getInstance(config?: MCPServerConfig): MCPSDKService {
    if (!MCPSDKService.instance) {
      if (!config) {
        throw new Error('MCPSDKService.getInstance() requires config on first call');
      }
      MCPSDKService.instance = new MCPSDKService(config);
    }
    return MCPSDKService.instance;
  }

  /**
   * Setup MCP protocol handlers using official SDK
   */
  private setupHandlers(): void {
    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = [];

      // Iterate through registered tool names and fetch from cache
      for (const toolName of this.registry.toolNames) {
        const tool = (await this.cache.get(`mcp:tool:${toolName}`)) as MCPToolDefinition | null;
        if (tool) {
          tools.push({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
          });
        }
      }

      return { tools };
    });

    // Call tool handler
    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request: { params: { name: string; arguments?: Record<string, unknown> } }) => {
        const { name, arguments: args } = request.params;
        const tool = (await this.cache.get(`mcp:tool:${name}`)) as MCPToolDefinition | null;

        if (!tool) {
          throw new Error(`Unknown tool: ${name}`);
        }

        try {
          const startTime = createUnifiedTimestamp().unix;
          const result = await tool.handler(args ?? {});
          const duration = createUnifiedTimestamp().unix - startTime;

          // Metrics (canonical monitoring)
          this.backbone.monitoring?.trackOperation(
            `mcp.tool.${name}`,
            duration.toString(),
            'success',
          );

          return {
            content: [
              {
                type: 'text',
                text: typeof result === 'string' ? result : JSON.stringify(result),
              },
            ],
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Tool execution failed';
          this.backbone.monitoring?.trackOperation(`mcp.tool.${name}`, '0', 'error');
          throw new Error(errorMessage);
        }
      },
    );

    // List resources handler
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resources: Resource[] = [];

      // Iterate through registered resource URIs and fetch from cache
      for (const uri of this.registry.resourceUris) {
        const resource = (await this.cache.get(
          `mcp:resource:${uri}`,
        )) as MCPResourceDefinition | null;
        if (resource) {
          resources.push({
            uri: resource.uri,
            name: resource.name,
            description: resource.description,
            mimeType: resource.mimeType,
          });
        }
      }

      return { resources };
    });

    // Read resource handler
    this.server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request: { params: { uri: string } }) => {
        const { uri } = request.params;
        const resource = (await this.cache.get(
          `mcp:resource:${uri}`,
        )) as MCPResourceDefinition | null;

        if (!resource) {
          throw new Error(`Unknown resource: ${uri}`);
        }

        try {
          const content = await resource.handler();
          const text =
            typeof content === 'string' ? content : Buffer.from(content).toString('utf-8');

          return {
            contents: [
              {
                uri,
                mimeType: resource.mimeType || 'text/plain',
                text,
              },
            ],
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Resource read failed';
          throw new Error(errorMessage);
        }
      },
    );

    // List prompts handler
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      const prompts: Prompt[] = [];

      // Iterate through registered prompt names and fetch from cache
      for (const promptName of this.registry.promptNames) {
        const prompt = (await this.cache.get(
          `mcp:prompt:${promptName}`,
        )) as MCPPromptDefinition | null;
        if (prompt) {
          prompts.push({
            name: prompt.name,
            description: prompt.description,
            arguments: prompt.arguments,
          });
        }
      }

      return { prompts };
    });

    // Get prompt handler
    this.server.setRequestHandler(
      GetPromptRequestSchema,
      async (request: { params: { name: string; arguments?: Record<string, string> } }) => {
        const { name, arguments: args } = request.params;
        const prompt = (await this.cache.get(`mcp:prompt:${name}`)) as MCPPromptDefinition | null;

        if (!prompt) {
          throw new Error(`Unknown prompt: ${name}`);
        }

        try {
          const result = await prompt.handler(args ?? {});
          return result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Prompt execution failed';
          throw new Error(errorMessage);
        }
      },
    );
  }

  /**
   * Register a tool (canonical tool registration)
   */
  public async registerTool(tool: MCPToolDefinition): Promise<void> {
    if (this.registry.toolNames.has(tool.name)) {
      throw new Error(`Tool already registered: ${tool.name}`);
    }
    await this.cache.set(`mcp:tool:${tool.name}`, tool);
    this.registry.toolNames.add(tool.name);
  }

  /**
   * Register multiple tools at once
   */
  public async registerTools(tools: MCPToolDefinition[]): Promise<void> {
    for (const tool of tools) {
      await this.registerTool(tool);
    }
  }

  /**
   * Register a resource
   */
  public async registerResource(resource: MCPResourceDefinition): Promise<void> {
    if (this.registry.resourceUris.has(resource.uri)) {
      throw new Error(`Resource already registered: ${resource.uri}`);
    }
    await this.cache.set(`mcp:resource:${resource.uri}`, resource);
    this.registry.resourceUris.add(resource.uri);
  }

  /**
   * Register a prompt
   */
  public async registerPrompt(prompt: MCPPromptDefinition): Promise<void> {
    if (this.registry.promptNames.has(prompt.name)) {
      throw new Error(`Prompt already registered: ${prompt.name}`);
    }
    await this.cache.set(`mcp:prompt:${prompt.name}`, prompt);
    this.registry.promptNames.add(prompt.name);
  }

  /**
   * Connect to stdio transport (for VS Code, CLI usage)
   */
  public async connectStdio(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    console.log('MCP SDK Service connected via stdio', {
      timestamp: createUnifiedTimestamp(),
      config: this.config,
    });
  }

  /**
   * Get server instance (for advanced SDK usage)
   */
  public getServer(): Server {
    return this.server;
  }

  /**
   * Get server info
   */
  public getInfo(): MCPServerConfig {
    return { ...this.config };
  }

  /**
   * Get registered tools count
   */
  public getToolsCount(): number {
    return this.registry.toolNames.size;
  }

  /**
   * Get registered resources count
   */
  public getResourcesCount(): number {
    return this.registry.resourceUris.size;
  }

  /**
   * Get registered prompts count
   */
  public getPromptsCount(): number {
    return this.registry.promptNames.size;
  }

  /**
   * Shutdown server gracefully
   */
  public async shutdown(): Promise<void> {
    await this.server.close();

    console.log('MCP SDK Service shutdown', {
      timestamp: createUnifiedTimestamp(),
    });
  }
}

/**
 * Helper: Create MCP SDK service instance with OneAgent defaults
 */
export function createMCPService(overrides?: Partial<MCPServerConfig>): MCPSDKService {
  return MCPSDKService.getInstance({
    name: 'oneagent-mcp-server',
    version: '4.4.2',
    description: 'OneAgent Professional AI Development Platform - MCP Interface',
    protocol: 'stdio',
    capabilities: {
      tools: true,
      resources: true,
      prompts: true,
      logging: true,
    },
    ...overrides,
  });
}
