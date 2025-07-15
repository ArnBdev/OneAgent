import { AgentCard, AgentRegistration, AgentFilter } from '../../types/AgentCard';

// Re-export canonical types
export { AgentCard, AgentRegistration, AgentFilter };

export interface IAgentRegistry {
  registerAgent(agent: AgentRegistration): Promise<boolean>;
  getAgent(agentId: string): Promise<AgentRegistration | null>;
  listAgents(filter?: AgentFilter): Promise<AgentRegistration[]>;
  updateAgent(agent: AgentRegistration): Promise<boolean>;
  removeAgent(agentId: string): Promise<boolean>;
}
