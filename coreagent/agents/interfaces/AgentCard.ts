// Canonical AgentCard schema (A2A/MCP, July 2025)
export interface AgentCard {
  agentId: string;
  displayName: string;
  agentType: string;
  version: string;
  status: 'active' | 'inactive' | 'error' | 'pending';
  capabilities: string[];
  skills?: string[];
  health?: string;
  lastHeartbeat: number;
  credentials?: Record<string, any>; // e.g., apiKey, oauth, etc.
  authorization?: Record<string, any>; // e.g., scopes, roles
  endpoints?: {
    a2a?: string;
    mcp?: string;
  };
  metadata?: Record<string, any>;
}

export type AgentFilter = {
  type?: string;
  capability?: string;
  skill?: string;
  health?: string;
  version?: string;
  status?: string;
  credentials?: any;
  authorization?: any;
};
