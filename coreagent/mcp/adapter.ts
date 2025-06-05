/**
 * MCP (Model Context Protocol) Adapter for CoreAgent
 * 
 * Handles communication with MCP servers, supporting both local and HTTP communication.
 */

export interface MCPRequest {
  id: string;
  method: string;
  params?: Record<string, any> | undefined;
  timestamp: string;
}

export interface MCPResponse {
  id: string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  timestamp: string;
}

export interface MCPServerConfig {
  name: string;
  type: 'local' | 'http';
  endpoint?: string;
  port?: number;
}

/**
 * Local MCP Adapter
 * Handles basic MCP communication for local operations
 */
export class LocalMCPAdapter {
  private serverConfig: MCPServerConfig;

  constructor(config: MCPServerConfig) {
    this.serverConfig = config;
    console.log(`[MCP] Initializing ${config.name} adapter (${config.type})`);
  }
  /**
   * Send a request to MCP server
   * @param method - MCP method to call
   * @param params - Parameters for the method
   * @returns Promise<MCPResponse>
   */
  async sendRequest(method: string, params?: Record<string, any>): Promise<MCPResponse> {
    const request: MCPRequest = {
      id: this.generateRequestId(),
      method,
      params: params || undefined,
      timestamp: new Date().toISOString()
    };

    console.log(`[MCP] Sending request to ${this.serverConfig.name}:`, request);

    // TODO: Implement actual MCP communication
    // For now, return a mock response
    const response: MCPResponse = {
      id: request.id,
      result: {
        status: 'success',
        data: null,
        message: `Mock response for method: ${method} on ${this.serverConfig.name}`
      },
      timestamp: new Date().toISOString()
    };

    return response;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `mcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * HTTP MCP Adapter
 * Handles HTTP-based communication with external MCP servers
 */
export class HttpMCPAdapter {
  private serverConfig: MCPServerConfig;

  constructor(config: MCPServerConfig) {
    this.serverConfig = config;
    console.log(`[MCP] Initializing ${config.name} HTTP adapter (${config.endpoint})`);
    
    if (!config.endpoint) {
      throw new Error('HTTP MCP adapter requires an endpoint URL');
    }
  }

  /**
   * Send a request to HTTP MCP server
   * @param method - MCP method to call
   * @param params - Parameters for the method
   * @returns Promise<MCPResponse>
   */
  async sendRequest(method: string, params?: Record<string, any>): Promise<MCPResponse> {
    const request: MCPRequest = {
      id: this.generateRequestId(),
      method,
      params: params || undefined,
      timestamp: new Date().toISOString()
    };

    console.log(`[MCP] Sending HTTP request to ${this.serverConfig.endpoint}:`, request);

    try {
      // Use fetch for HTTP communication
      const response = await fetch(this.serverConfig.endpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Validate response format
      if (!data.id || data.id !== request.id) {
        throw new Error('Invalid MCP response: missing or mismatched ID');
      }

      const mcpResponse: MCPResponse = {
        id: data.id,
        result: data.result,
        error: data.error,
        timestamp: data.timestamp || new Date().toISOString()
      };

      console.log(`[MCP] Received HTTP response:`, mcpResponse);
      return mcpResponse;

    } catch (error) {
      console.error(`[MCP] HTTP request failed:`, error);
      
      // Return error response
      const errorResponse: MCPResponse = {
        id: request.id,
        error: {
          code: -32603,
          message: `HTTP MCP request failed: ${error}`,
          data: { endpoint: this.serverConfig.endpoint }
        },
        timestamp: new Date().toISOString()
      };

      return errorResponse;
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `mcp_http_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Test connection to HTTP MCP server
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.sendRequest('ping', { test: true });
      return !response.error;
    } catch (error) {
      console.error(`[MCP] Connection test failed:`, error);
      return false;
    }
  }
}

/**
 * Create MCP adapter instance based on configuration
 */
export function createMCPAdapter(config: MCPServerConfig): LocalMCPAdapter | HttpMCPAdapter {
  switch (config.type) {
    case 'local':
      return new LocalMCPAdapter(config);
    case 'http':
      return new HttpMCPAdapter(config);
    default:
      throw new Error(`Unsupported MCP adapter type: ${config.type}`);
  }
}

/**
 * Default MCP server configuration
 */
export const defaultMCPConfig: MCPServerConfig = {
  name: 'CoreAgent-Local',
  type: 'local',
  port: 3001
};

/**
 * Example HTTP MCP server configuration
 */
export const exampleHttpMCPConfig: MCPServerConfig = {
  name: 'External-MCP-Server',
  type: 'http',
  endpoint: 'http://localhost:8080/mcp',
  port: 8080
};
