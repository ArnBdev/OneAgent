/**
 * IChatInterface - Interface for chat communication and management
 * 
 * This interface defines the contract for managing chat sessions,
 * message handling, and real-time communication.
 */

import { AgentResponse, Message } from '../../agents/base/BaseAgent_new';
import { ISpecializedAgent } from '../../agents/base/ISpecializedAgent';

export interface IChatInterface {
  /**
   * Start a new chat session
   */
  startSession(userId: string, sessionConfig?: SessionConfig): Promise<ChatSession>;

  /**
   * End a chat session
   */
  endSession(sessionId: string): Promise<void>;

  /**
   * Send a message in a chat session
   */
  sendMessage(sessionId: string, message: string, metadata?: MessageMetadata): Promise<ChatResponse>;

  /**
   * Get chat session history
   */
  getSessionHistory(sessionId: string, limit?: number): Promise<Message[]>;

  /**
   * Get active chat sessions for a user
   */
  getActiveSessions(userId: string): Promise<ChatSession[]>;

  /**
   * Set typing indicator
   */
  setTypingIndicator(sessionId: string, isTyping: boolean): Promise<void>;

  /**
   * Register message listener for real-time updates
   */
  onMessage(callback: MessageCallback): void;

  /**
   * Register session event listener
   */
  onSessionEvent(callback: SessionEventCallback): void;

  /**
   * Switch active agent in session
   */
  switchAgent(sessionId: string, agentId: string): Promise<void>;
}

export interface ChatSession {
  id: string;
  userId: string;
  activeAgent?: ISpecializedAgent;
  startTime: Date;
  lastActivity: Date;
  messageCount: number;
  status: SessionStatus;
  config: SessionConfig;
  metadata: Record<string, any>;
}

export type SessionStatus = 'active' | 'paused' | 'ended' | 'error';

export interface SessionConfig {
  agentId?: string;
  maxMessages?: number;
  timeoutMinutes?: number;
  enableMemory?: boolean;
  autoSave?: boolean;
  context?: Record<string, any>;
}

export interface ChatResponse {
  message: Message;
  agentResponse: AgentResponse;
  sessionInfo: SessionInfo;
  suggestions?: string[];
  actions?: ChatAction[];
}

export interface SessionInfo {
  sessionId: string;
  messageCount: number;
  activeAgent: string;
  memoryUpdated: boolean;
  processingTime: number;
}

export interface MessageMetadata {
  timestamp?: Date;
  priority?: 'low' | 'normal' | 'high';
  context?: Record<string, any>;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  type: string;
  name: string;
  size: number;
  data: string; // base64 or URL
}

export interface ChatAction {
  id: string;
  type: string;
  label: string;
  description: string;
  parameters: Record<string, any>;
}

export type MessageCallback = (sessionId: string, message: Message, response?: AgentResponse) => void;

export type SessionEventCallback = (event: SessionEvent) => void;

export interface SessionEvent {
  type: SessionEventType;
  sessionId: string;
  timestamp: Date;
  data?: any;
}

export type SessionEventType = 
  | 'session_started'
  | 'session_ended'
  | 'agent_switched'
  | 'typing_started'
  | 'typing_stopped'
  | 'error'
  | 'memory_updated';

export interface ChatMetrics {
  sessionId: string;
  totalMessages: number;
  averageResponseTime: number;
  userSatisfaction?: number;
  agentSwitches: number;
  errors: number;
}