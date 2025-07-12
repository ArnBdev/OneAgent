// Canonical interface for agent communication (A2A/MCP hybrid)
export interface AgentMessage {
  from: string;
  to: string;
  content: string;
  type: 'request' | 'response' | 'notification' | 'broadcast';
  context?: Record<string, any>;
  credentials?: Record<string, any>;
  ux?: Record<string, any>;
  timestamp?: number;
}

export interface IAgentCommunication {
  sendMessage(message: AgentMessage): Promise<boolean>;
  receiveMessage(message: AgentMessage): Promise<void>;
}
