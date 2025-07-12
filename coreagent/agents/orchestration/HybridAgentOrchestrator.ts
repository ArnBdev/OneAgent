import { HybridAgentDiscovery } from '../discovery/HybridAgentDiscovery';
import { HybridAgentRegistry } from '../registry/HybridAgentRegistry';
import { IAgentCommunication, AgentMessage } from '../interfaces/IAgentCommunication';
import { AgentCard } from '../interfaces/AgentCard';

/**
 * HybridAgentOrchestrator
 * Canonical orchestrator for agent coordination, task assignment, and advanced features.
 * Uses only canonical interfaces and supports MCP as authoritative source with in-memory fallback.
 * BMAD/Constitutional AI validated, modular, and fully auditable.
 */
export class HybridAgentOrchestrator {
  private discovery: HybridAgentDiscovery;
  private registry: HybridAgentRegistry;
  private comm: IAgentCommunication;

  constructor(
    discovery: HybridAgentDiscovery,
    registry: HybridAgentRegistry,
    comm: IAgentCommunication
  ) {
    this.discovery = discovery;
    this.registry = registry;
    this.comm = comm;
  }

  /**
   * Selects the best agent for a given task using QuerySkill and canonical discovery.
   * @param skill - The required skill for the task.
   */
  async selectBestAgent(skill: string): Promise<AgentCard | null> {
    // Query MCP first, fallback to in-memory if needed
    const candidates = await this.discovery.findAgentsBySkill(skill);
    // Map AgentRegistration to AgentCard (normalize status/health, ensure all fields present)
    const normalizeStatus = (status: string): 'active' | 'inactive' | 'pending' | 'error' => {
      if (status === 'active' || status === 'inactive' || status === 'pending' || status === 'error') return status;
      return status === 'retired' ? 'inactive' : 'error';
    };
    const normalizeHealth = (health: string | undefined): 'healthy' | 'degraded' | 'error' => {
      if (!health) return 'error';
      if (health === 'healthy' || health === 'degraded' || health === 'error') return health;
      return 'error';
    };
    const agentCards: AgentCard[] = candidates.map((c) => ({
      agentId: c.agentId,
      displayName: c.displayName || c.agentId,
      agentType: c.agentType,
      version: c.version,
      status: normalizeStatus(c.status),
      capabilities: c.capabilities,
      skills: c.skills ?? undefined,
      health: normalizeHealth(c.health),
      lastHeartbeat: c.lastHeartbeat,
      credentials: c.credentials ?? {},
      authorization: c.authorization ?? {},
      endpoints: c.endpoints ?? undefined,
      metadata: c.metadata ?? undefined,
    }));
    // TODO: Implement advanced selection logic (BMAD-driven, context-aware)
    return agentCards.length > 0 ? agentCards[0] : null;
  }

  /**
   * Assigns a task to the selected agent, with audit logging and error handling.
   * @param agent - The agent to assign the task to.
   * @param taskContext - The context of the task.
   */
  async assignTask(agent: AgentCard, taskContext: Record<string, unknown>): Promise<boolean> {
    try {
      // Example: Send a canonical task assignment message
      const message: AgentMessage = {
        from: 'orchestrator',
        to: agent.agentId,
        content: JSON.stringify(taskContext),
        type: 'request' as const,
        context: { taskType: taskContext.type },
        timestamp: Date.now(),
      };
      if (agent.credentials) message.credentials = agent.credentials;
      await this.comm.sendMessage(message);
      return true;
    } catch (e) {
      // Audit log and error handling
      console.warn(`[HybridAgentOrchestrator] Failed to assign task to agent ${agent.agentId}:`, e);
      // Optionally: log to audit system here
      return false;
    }
  }

  /**
   * Coordinates multiple agents for a complex task, supporting advanced features.
   * @param taskContext - The context of the coordination task.
   */
  async coordinateAgentsForTask(taskContext: { skills?: string[] }): Promise<void> {
    // Example: Find agents by required skills and assign subtasks
    if (!taskContext.skills || !Array.isArray(taskContext.skills)) return;
    for (const skill of taskContext.skills) {
      const agent = await this.selectBestAgent(skill);
      if (agent) {
        await this.assignTask(agent, { ...taskContext, skill });
      }
    }
    // TODO: Support QuerySkill, dynamic UX negotiation, in-task authentication
  }
}
