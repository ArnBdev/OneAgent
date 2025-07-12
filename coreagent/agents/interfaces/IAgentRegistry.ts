export interface AgentCard {
  agentId: string;
  agentType: string;
  capabilities: string[];
  version: string;
  status: 'active' | 'inactive' | 'pending' | 'retired';
  health: 'healthy' | 'degraded' | 'offline';
  lastHeartbeat: number;
  credentials?: Record<string, any>;
  authorization?: Record<string, any>;
  [key: string]: any;
}

export interface AgentRegistration extends AgentCard {
  qualityScore: number;
  endpoint?: string;
  loadLevel?: number;
  lastSeen?: Date;
}

export interface AgentFilter {
  type?: string;
  capability?: string;
  skill?: string;
  health?: string;
  version?: string;
  credentials?: string;
  authorization?: string;
  [key: string]: any;
}

export interface IAgentRegistry {
  registerAgent(agent: AgentRegistration): Promise<boolean>;
  getAgent(agentId: string): Promise<AgentRegistration | null>;
  listAgents(filter?: AgentFilter): Promise<AgentRegistration[]>;
  updateAgent(agent: AgentRegistration): Promise<boolean>;
  removeAgent(agentId: string): Promise<boolean>;
}
