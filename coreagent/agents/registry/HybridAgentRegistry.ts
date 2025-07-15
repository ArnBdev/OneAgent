import { IAgentRegistry, AgentRegistration, AgentFilter } from '../interfaces/IAgentRegistry';
import { oneAgentConfig } from '../../config/index';

/**
 * HybridAgentRegistry: Canonical registry supporting both A2A (in-memory) and MCP (RESTful) registration.
 * - Uses latest AgentCard schema (version, health, credentials, authorization, etc.)
 * - All registration flows must go through this class.
 */
export class HybridAgentRegistry implements IAgentRegistry {
  // In-memory registry (A2A)
  private inMemoryRegistry: Map<string, AgentRegistration> = new Map();
  
  // MCP connection state tracking
  private mcpConnectionState: 'unknown' | 'connected' | 'failed' = 'unknown';
  private mcpConnectionTested = false;

  // MCP RESTful registry base URL (configurable)
  private mcpBaseUrl: string = process.env.MCP_REGISTRY_URL || `${oneAgentConfig.mcpUrl}/mcp/v4/agents`;

  // Helper: Perform RESTful call to MCP endpoint
  private async mcpRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.mcpBaseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MCP_API_KEY || ''}`,
      'X-MCP-Version': '4.0',
    };
    try {
      const init: RequestInit = {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : null,
      };
      const res = await fetch(url, init);
      if (!res.ok) {
        // Standardized error handling per MCP spec
        const err = await res.json().catch(() => ({}));
        throw new Error(`MCP ${method} ${url} failed: ${res.status} ${res.statusText} - ${err.message || ''}`);
      }
      
      // Mark connection as successful
      if (this.mcpConnectionState !== 'connected') {
        this.mcpConnectionState = 'connected';
        console.log('[HybridAgentRegistry] MCP connection established');
      }
      
      return await res.json();
    } catch (e) {
      // Only log error once, then track state
      if (!this.mcpConnectionTested) {
        console.warn(`[HybridAgentRegistry] MCP connection failed, using in-memory only mode`);
        this.mcpConnectionState = 'failed';
        this.mcpConnectionTested = true;
      }
      throw e;
    }
  }

  async registerAgent(agent: AgentRegistration): Promise<boolean> {
    // Register in-memory
    this.inMemoryRegistry.set(agent.agentId, agent);
    
    // Only try MCP if we haven't already determined it's failed
    if (this.mcpConnectionState !== 'failed') {
      try {
        await this.mcpRequest('POST', '', agent);
      } catch {
        // Don't log error here - already handled in mcpRequest
        // Just continue with in-memory only
      }
    }
    return true;
  }

  async getAgent(agentId: string): Promise<AgentRegistration | null> {
    // Check in-memory first
    const agent = this.inMemoryRegistry.get(agentId);
    if (agent) return agent;
    // Fallback to MCP if not found
    try {
      return await this.mcpRequest('GET', `/${agentId}`);
    } catch {
      return null;
    }
  }

  async listAgents(filter?: AgentFilter): Promise<AgentRegistration[]> {
    let agents = Array.from(this.inMemoryRegistry.values());
    // Apply filtering (in-memory)
    if (filter) {
      if (filter.type) agents = agents.filter(a => a.agentType === filter.type);
      if (filter.capability !== undefined) agents = agents.filter(a => a.capabilities?.includes(filter.capability ?? ''));
      if (filter.skill !== undefined) agents = agents.filter(a => a.skills?.includes(filter.skill ?? ''));
      if (filter.health) agents = agents.filter(a => a.health === filter.health);
      if (filter.version) agents = agents.filter(a => a.version === filter.version);
      if (filter.status) agents = agents.filter(a => a.status === filter.status);
      if (filter.credentialsPresent) agents = agents.filter(a => !!a.credentials);
      if (filter.authorizationScope) agents = agents.filter(a => a.authorization && Object.values(a.authorization).includes(filter.authorizationScope));
    }
    // Merge with MCP registry results (favor MCP as source of truth)
    try {
      const mcpAgents = await this.mcpRequest<AgentRegistration[]>('GET', this.buildMcpQuery(filter));
      // Merge: MCP agents take precedence
      const mcpMap = new Map(mcpAgents.map(a => [a.agentId, a]));
      for (const a of agents) {
        if (!mcpMap.has(a.agentId)) mcpMap.set(a.agentId, a);
        else {
          // Conflict: log if data differs
          const mcpAgent = mcpMap.get(a.agentId);
          if (JSON.stringify(mcpAgent) !== JSON.stringify(a)) {
            console.warn(`[HybridAgentRegistry] Conflict for agent ${a.agentId}: MCP favored, in-memory differs.`);
          }
        }
      }
      return Array.from(mcpMap.values());
    } catch {
      // Fallback: return in-memory only
      console.warn('[HybridAgentRegistry] MCP list failed, returning in-memory only');
      return agents;
    }
  }

  async updateAgent(agent: AgentRegistration): Promise<boolean> {
    // Update in-memory
    this.inMemoryRegistry.set(agent.agentId, agent);
    // Update with MCP RESTful endpoint (PUT)
    try {
      await this.mcpRequest('PUT', `/${agent.agentId}`, agent);
    } catch {
      // Fallback: log error, continue with in-memory only
      console.warn(`[HybridAgentRegistry] MCP update failed, using in-memory only for agent ${agent.agentId}`);
    }
    return true;
  }

  async removeAgent(agentId: string): Promise<boolean> {
    // Remove from in-memory
    this.inMemoryRegistry.delete(agentId);
    // Remove from MCP RESTful endpoint (DELETE)
    try {
      await this.mcpRequest('DELETE', `/${agentId}`);
    } catch {
      // Fallback: log error, continue with in-memory only
      console.warn(`[HybridAgentRegistry] MCP remove failed, using in-memory only for agent ${agentId}`);
    }
    return true;
  }

  // Helper: Build MCP query string from filter
  private buildMcpQuery(filter?: AgentFilter): string {
    if (!filter) return '';
    const params = new URLSearchParams();
    if (filter.type) params.append('type', filter.type);
    if (filter.capability) params.append('capability', filter.capability);
    if (filter.skill) params.append('skill', filter.skill);
    if (filter.health) params.append('health', filter.health);
    if (filter.version) params.append('version', filter.version);
    if (filter.status) params.append('status', filter.status);
    if (filter.credentialsPresent) params.append('credentialsPresent', 'true');
    if (filter.authorizationScope) params.append('authorizationScope', filter.authorizationScope);
    return `?${params.toString()}`;
  }
}
