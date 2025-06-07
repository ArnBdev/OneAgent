/**
 * OneAgent Level 2 Conversation Types
 * Comprehensive type definitions for conversation management and context handling
 */

/**
 * Represents a single message in a conversation
 */
export interface ConversationMessage {
    /** Message ID (UUID v4 format) */
    id: string;
    timestamp: Date;
    sender: 'user' | 'agent' | 'system';
    content: string;
    type: MessageType;
    metadata?: MessageMetadata;
    /** Agent ID (UUID v4 format if applicable) */
    agentId?: string;
    /** Session ID (UUID v4 format) */
    sessionId: string;
}

/**
 * Types of messages that can be exchanged
 */
export type MessageType = 
    | 'text'
    | 'command'
    | 'response'
    | 'error'
    | 'system'
    | 'notification'
    | 'status'
    | 'memory_update';

/**
 * Additional metadata for messages
 */
export interface MessageMetadata {
    confidence?: number;
    intent?: string;
    entities?: Array<{
        type: string;
        value: string;
        confidence: number;
    }>;
    responseTime?: number;
    processingSteps?: string[];
    memoryUpdates?: MemoryUpdate[];
}

/**
 * Represents a complete conversation session
 */
export interface ConversationSession {
    /** Session ID (UUID v4 format) */
    id: string;
    /** User ID (UUID v4 format) */
    userId: string;
    startTime: Date;
    lastActivity: Date;
    status: ConversationStatus;
    messages: ConversationMessage[];
    context: ConversationContext;
    /** Active agent IDs (UUID v4 format if applicable) */
    activeAgents: string[];
    settings: ConversationSettings;
}

/**
 * Status of a conversation session
 */
export type ConversationStatus = 
    | 'active'
    | 'paused'
    | 'completed'
    | 'archived'
    | 'error';

/**
 * Context information for a conversation
 */
export interface ConversationContext {
    topic?: string;
    domain?: string;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    tags: string[];
    goals: string[];
    constraints: string[];
    preferences: UserPreferences;
}

/**
 * User preferences for conversation handling
 */
export interface UserPreferences {
    communicationStyle: 'formal' | 'casual' | 'professional' | 'friendly';
    responseLength: 'brief' | 'moderate' | 'detailed';
    expertise: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    notifications: boolean;
    memoryRetention: 'session' | 'temporary' | 'permanent';
}

/**
 * Settings for conversation management
 */
export interface ConversationSettings {
    maxMessages: number;
    timeout: number; // in milliseconds
    autoSave: boolean;
    memoryEnabled: boolean;
    multiAgentEnabled: boolean;
    debugMode: boolean;
}

/**
 * Memory update information
 */
export interface MemoryUpdate {
    type: 'add' | 'update' | 'delete';
    category: string;
    key: string;
    value?: any;
    timestamp: Date;
    importance: number; // 0-1 scale
}

/**
 * Turn in a conversation (request-response pair)
 */
export interface ConversationTurn {
    id: string;
    request: ConversationMessage;
    response: ConversationMessage;
    processingTime: number;
    agentId: string;
    confidence: number;
    feedback?: TurnFeedback;
}

/**
 * Feedback on a conversation turn
 */
export interface TurnFeedback {
    rating: number; // 1-5 scale
    helpful: boolean;
    accurate: boolean;
    relevant: boolean;
    comments?: string;
    timestamp: Date;
}

/**
 * Summary of a conversation
 */
export interface ConversationSummary {
    sessionId: string;
    totalMessages: number;
    duration: number; // in milliseconds
    topics: string[];
    outcomes: string[];
    satisfaction: number; // 0-1 scale
    keyPoints: string[];
    nextSteps: string[];
    agentsInvolved: string[];
}

/**
 * Analytics data for conversations
 */
export interface ConversationAnalytics {
    sessionCount: number;
    avgDuration: number;
    avgSatisfaction: number;
    topTopics: Array<{topic: string, count: number}>;
    agentUsage: Array<{agentId: string, usage: number}>;
    timeDistribution: Array<{hour: number, count: number}>;
    userEngagement: number;
}

/**
 * Request to create a new conversation
 */
export interface CreateConversationRequest {
    /** User ID (UUID v4 format) */
    userId: string;
    initialMessage?: string;
    context?: Partial<ConversationContext>;
    settings?: Partial<ConversationSettings>;
    /** Preferred agent IDs (UUID v4 format if applicable) */
    preferredAgents?: string[];
}

/**
 * Response when creating a conversation
 */
export interface CreateConversationResponse {
    sessionId: string;
    status: 'created' | 'error';
    message?: string;
    initialResponse?: ConversationMessage;
}

/**
 * Request to send a message in a conversation
 */
export interface SendMessageRequest {
    sessionId: string;
    content: string;
    type?: MessageType;
    metadata?: Partial<MessageMetadata>;
    targetAgent?: string;
}

/**
 * Response after sending a message
 */
export interface SendMessageResponse {
    messageId: string;
    response: ConversationMessage;
    sessionStatus: ConversationStatus;
    nextPossibleActions?: string[];
}

/**
 * Utility type for conversation state management
 */
export type ConversationState = {
    current: ConversationSession | null;
    history: ConversationSession[];
    pending: ConversationMessage[];
    error: string | null;
    loading: boolean;
};