import { AgentRegistration, AgentFilter } from './IAgentRegistry';

export interface IAgentDiscovery {
  findAgentsByType(type: string): Promise<AgentRegistration[]>;
  findAgentsByCapability(capability: string): Promise<AgentRegistration[]>;
  findAgentsBySkill(skill: string): Promise<AgentRegistration[]>;
  listAgents?(filter?: AgentFilter): Promise<AgentRegistration[]>;
}
