/**
 * Canonical communication constants & enums.
 * Single source of truth for agent communication types, statuses, priorities & metadata keys.
 */

export const COMM_METADATA_KEYS = {
  messageType: 'messageType',
  fromAgent: 'fromAgent',
  toAgent: 'toAgent',
  priority: 'priority',
  threadId: 'threadId',
  replyToMessageId: 'replyToMessageId',
  discussionId: 'discussionId',
  contributionType: 'contributionType',
  contributor: 'contributor',
  context: 'context',
  insightId: 'insightId',
  knowledgeId: 'knowledgeId',
} as const;

export type CommunicationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type CommunicationMessageType =
  | 'direct'
  | 'broadcast'
  | 'context'
  | 'learning'
  | 'coordination';

export type ContributionCategory =
  | 'question'
  | 'solution'
  | 'synthesis'
  | 'insight'
  | 'consensus'
  | 'optimization';

export const COMM_OPERATION = {
  sendAgentMessage: 'a2a_send_agent_message',
  sendNaturalLanguage: 'a2a_send_nl_message',
  broadcastNaturalLanguage: 'a2a_broadcast_nl_message',
  createDiscussion: 'a2a_create_discussion',
  joinDiscussion: 'a2a_join_discussion',
  contributeDiscussion: 'a2a_contribute_discussion',
  generateInsights: 'a2a_generate_cross_insights',
  synthesizeKnowledge: 'a2a_synthesize_knowledge',
  detectPatterns: 'a2a_detect_patterns',
  updateAgentStatus: 'a2a_update_agent_status',
  getContext: 'a2a_get_context',
} as const;

export type CommOperation = (typeof COMM_OPERATION)[keyof typeof COMM_OPERATION];
