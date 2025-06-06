/**
 * Agent Registry Interface
 * Legacy interface for backward compatibility - redirects to orchestrator interfaces
 * @deprecated Use IAgentRegistry from orchestrator/interfaces instead
 */

export type { 
    IAgentRegistry,
    AgentRegistrationRequest,
    AgentStatus,
    RegistryStatistics,
    AgentHealthCheck
} from '../orchestrator/interfaces/IAgentRegistry';