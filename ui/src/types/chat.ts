export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  agentType?: string;
  memoryContext?: MemoryContext;
  error?: string;
}

export interface MemoryContext {
  relevantMemories: number;
  searchTerms?: string[];
  memories?: Array<{
    id: string;
    content: string;
    relevance: number;
  }>;
}

export interface ChatSession {
  id: string;
  userId: string;
  agentType: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatState {
  currentSession?: ChatSession;
  messages: Message[];
  isTyping: boolean;
  isConnected: boolean;
  error?: string;
}

export interface ChatConfig {
  userId: string;
  agentType: string;
  enableMemoryContext: boolean;
  maxMessages: number;
  websocketUrl?: string;
}

export interface WebSocketMessage {
  type: 'message' | 'typing' | 'error' | 'connection';
  data: any;
  timestamp: Date;
}
