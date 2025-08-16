/**
 * Deprecated communication constructs. Any attempt to instantiate will throw.
 * Enforces canonical UnifiedAgentCommunicationService usage.
 */
export class AgentCommunicationService { constructor(){ throw new Error('[DEPRECATED] AgentCommunicationService removed. Use unifiedAgentCommunicationService.'); } }
export class A2ACommunicationService { constructor(){ throw new Error('[DEPRECATED] A2ACommunicationService removed. Use unifiedAgentCommunicationService.'); } }
export class MultiAgentCommunicationService { constructor(){ throw new Error('[DEPRECATED] MultiAgentCommunicationService removed. Use unifiedAgentCommunicationService.'); } }
export function createCommunicationService(): never { throw new Error('[DEPRECATED] createCommunicationService() removed. Use unifiedAgentCommunicationService.'); }
