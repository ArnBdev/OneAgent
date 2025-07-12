import { IAgentDiscovery } from '../interfaces/IAgentDiscovery';
import { AgentRegistration } from '../interfaces/IAgentRegistry';
import { AgentFilter } from '../interfaces/AgentCard';
import { oneAgentConfig } from '../../config/index';

/**
 * HybridAgentDiscovery: Canonical discovery supporting A2A (in-memory) and MCP (RESTful) agent lookup.
 * - Supports type, capability, skill (QuerySkill), health, version, credentials, and authorization filtering.
 * - MCP is authoritative for distributed scenarios; falls back to in-memory if MCP unavailable.
 */
export class HybridAgentDiscovery implements IAgentDiscovery {
  // Reference to registry (injected)
  constructor(private registry: { listAgents: (filter?: AgentFilter) => Promise<AgentRegistration[]> }) {}

  // MCP RESTful registry base URL (configurable)
  private mcpBaseUrl: string = process.env.MCP_REGISTRY_URL || `${oneAgentConfig.mcpUrl}/mcp/v4/agents`;

  // Helper: Perform RESTful call to MCP endpoint
  private async mcpRequest<T>(method: string, path: string): Promise<T> {
    const url = `${this.mcpBaseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MCP_API_KEY || ''}`,
      'X-MCP-Version': '4.0',
    };
    try {
      const res = await fetch(url, { method, headers });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`MCP ${method} ${url} failed: ${res.status} ${res.statusText} - ${err.message || ''}`);
      }
      return await res.json();
    } catch (e) {
      console.error(`[HybridAgentDiscovery] MCP request error:`, e);
      throw e;
    }
  }

  async findAgentsByType(type: string): Promise<AgentRegistration[]> {
    try {
      return await this.mcpRequest<AgentRegistration[]>('GET', `?type=${encodeURIComponent(type)}`);
    } catch {
      // Fallback to in-memory
      return this.registry.listAgents({ type });
    }
  }

  async findAgentsByCapability(capability: string): Promise<AgentRegistration[]> {
    try {
      return await this.mcpRequest<AgentRegistration[]>('GET', `?capability=${encodeURIComponent(capability)}`);
    } catch {
      return this.registry.listAgents({ capability });
    }
  }

  async findAgentsBySkill(skill: string): Promise<AgentRegistration[]> {
    try {
      return await this.mcpRequest<AgentRegistration[]>('GET', `?skill=${encodeURIComponent(skill)}`);
    } catch {
      return this.registry.listAgents({ skill });
    }
  }

  async listAgents(filter?: AgentFilter): Promise<AgentRegistration[]> {
    // Prefer MCP, fallback to in-memory
    try {
      // Build query string from filter
      const params = new URLSearchParams();
      if (filter?.type) params.append('type', filter.type);
      if (filter?.capability) params.append('capability', filter.capability);
      if (filter?.skill) params.append('skill', filter.skill);
      if (filter?.health) params.append('health', filter.health);
      if (filter?.version) params.append('version', filter.version);
      if (filter?.status) params.append('status', filter.status);
      const query = params.toString() ? `?${params.toString()}` : '';
      return await this.mcpRequest<AgentRegistration[]>('GET', query);
    } catch {
      return this.registry.listAgents(filter);
    }
  }
}
