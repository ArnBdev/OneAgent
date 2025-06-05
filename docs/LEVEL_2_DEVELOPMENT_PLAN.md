# 🚀 OneAgent Level 2 Development Plan

## 🎯 **Ready to Start: Chat Interface & BMAD Configuration**

**Status**: Foundation complete, moving to Level 2 implementation  
**Focus**: Interactive agent conversation with memory integration  
**Timeline**: Immediate implementation ready

---

## 🧭 **Copilot Development Instructions**

### **Phase 1: Chat Interface Implementation (Priority 1)**

#### **Step 1: Create Chat UI Components**
```typescript
// Create these files in ui/src/components/chat/

1. ChatInterface.tsx - Main chat container
2. MessageList.tsx - Display conversation history  
3. MessageInput.tsx - User input component
4. MessageBubble.tsx - Individual message display
5. TypingIndicator.tsx - Show when AI is responding
```

#### **Step 2: Chat State Management**
```typescript
// Create these files in ui/src/hooks/

1. useChat.ts - Chat state and message handling
2. useWebSocketChat.ts - Real-time message delivery
3. useMemoryContext.ts - Memory integration for conversations
```

#### **Step 3: Backend Chat API**
```typescript
// Extend existing API in coreagent/api/

1. chatAPI.ts - Chat endpoints and message processing
2. Integrate with existing mem0Client for memory context
3. Add conversation persistence and retrieval
```

### **Phase 2: BMAD Configuration System (Priority 2)**

#### **BMAD Data Models**
```typescript
// Create in ui/src/types/bmad.ts

interface BMADConfig {
  behavior: BehaviorConfig;
  memory: MemoryConfig; 
  action: ActionConfig;
  dialogue: DialogueConfig;
}

interface BehaviorConfig {
  personality: PersonalityTraits;
  responseStyle: ResponseStyle;
  decisionPatterns: DecisionPattern[];
}
```

#### **BMAD Configuration UI**
```typescript
// Create in ui/src/components/bmad/

1. BMADConfigPanel.tsx - Main configuration interface
2. BehaviorEditor.tsx - Personality and behavior settings
3. MemoryStrategyEditor.tsx - Memory usage configuration  
4. ActionToolManager.tsx - Tool and action configuration
5. DialogueFlowEditor.tsx - Conversation flow settings
```

---

## 🛠️ **Implementation Examples**

### **Chat Interface Starter Code**

```typescript
// ui/src/components/chat/ChatInterface.tsx
import React, { useState, useEffect } from 'react';
import { useChat } from '../../hooks/useChat';
import { useMemoryContext } from '../../hooks/useMemoryContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

interface ChatInterfaceProps {
  userId: string;
  agentId?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ userId, agentId }) => {
  const { messages, sendMessage, isLoading } = useChat(userId);
  const { getConversationContext } = useMemoryContext(userId);

  const handleSendMessage = async (content: string) => {
    // Get memory context for the message
    const context = await getConversationContext(content);
    
    // Send message with context
    await sendMessage(content, context);
  };

  return (
    <div className="chat-interface h-full flex flex-col">
      <div className="chat-header p-4 border-b">
        <h2>OneAgent Chat</h2>
        {agentId && <span>Agent: {agentId}</span>}
      </div>
      
      <MessageList 
        messages={messages} 
        isLoading={isLoading}
        className="flex-1 overflow-y-auto"
      />
      
      <MessageInput 
        onSendMessage={handleSendMessage}
        disabled={isLoading}
        className="border-t p-4"
      />
    </div>
  );
};
```

### **Chat Hook Implementation**

```typescript
// ui/src/hooks/useChat.ts
import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  memoryContext?: any[];
}

export const useChat = (userId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const ws = useWebSocket('ws://localhost:8081');

  const sendMessage = useCallback(async (content: string, context?: any[]) => {
    setIsLoading(true);
    
    const userMessage: Message = {
      id: crypto.randomUUID(),
      content,
      sender: 'user',
      timestamp: new Date(),
      memoryContext: context
    };
    
    setMessages(prev => [...prev, userMessage]);

    try {
      // Send to backend API
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          content,
          context
        })
      });

      const agentResponse = await response.json();
      
      const agentMessage: Message = {
        id: crypto.randomUUID(),
        content: agentResponse.content,
        sender: 'agent',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, agentMessage]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  return {
    messages,
    sendMessage,
    isLoading
  };
};
```

### **BMAD Configuration Starter**

```typescript
// ui/src/components/bmad/BMADConfigPanel.tsx
import React, { useState } from 'react';
import { BMADConfig } from '../../types/bmad';
import BehaviorEditor from './BehaviorEditor';
import MemoryStrategyEditor from './MemoryStrategyEditor';
import ActionToolManager from './ActionToolManager';
import DialogueFlowEditor from './DialogueFlowEditor';

export const BMADConfigPanel: React.FC = () => {
  const [config, setConfig] = useState<BMADConfig>({
    behavior: {
      personality: { helpfulness: 0.8, formality: 0.5, creativity: 0.7 },
      responseStyle: 'conversational',
      decisionPatterns: []
    },
    memory: {
      strategy: 'semantic_search',
      retentionPolicy: 'persistent',
      searchDepth: 10
    },
    action: {
      enabledTools: ['web_search', 'memory_operations'],
      permissions: ['read', 'write']
    },
    dialogue: {
      conversationStyle: 'adaptive',
      contextWindow: 20,
      memoryIntegration: true
    }
  });

  const [activeTab, setActiveTab] = useState<'behavior' | 'memory' | 'action' | 'dialogue'>('behavior');

  return (
    <div className="bmad-config-panel h-full">
      <div className="tabs flex border-b">
        {(['behavior', 'memory', 'action', 'dialogue'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`tab-button p-3 ${activeTab === tab ? 'active border-b-2' : ''}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="tab-content p-4 flex-1">
        {activeTab === 'behavior' && (
          <BehaviorEditor 
            config={config.behavior}
            onChange={(behavior) => setConfig(prev => ({ ...prev, behavior }))}
          />
        )}
        {activeTab === 'memory' && (
          <MemoryStrategyEditor 
            config={config.memory}
            onChange={(memory) => setConfig(prev => ({ ...prev, memory }))}
          />
        )}
        {activeTab === 'action' && (
          <ActionToolManager 
            config={config.action}
            onChange={(action) => setConfig(prev => ({ ...prev, action }))}
          />
        )}
        {activeTab === 'dialogue' && (
          <DialogueFlowEditor 
            config={config.dialogue}
            onChange={(dialogue) => setConfig(prev => ({ ...prev, dialogue }))}
          />
        )}
      </div>
    </div>
  );
};
```

---

## 🎯 **Immediate Action Plan for Copilot**

### **Start Here:**
1. **Examine existing UI structure** in `ui/src/components/`
2. **Review memory integration** in `coreagent/tools/mem0Client.ts`
3. **Understand WebSocket setup** from existing performance monitoring
4. **Create chat interface** following the examples above

### **Development Sequence:**
1. **Chat Interface** → Get basic conversation working
2. **Memory Integration** → Add context to conversations  
3. **BMAD Configuration** → Add agent personality customization
4. **Agent Profiles** → Multi-agent support

### **Key Integration Points:**
- **Memory System**: Already working at `localhost:8000`
- **API Server**: Running on `localhost:8081`
- **WebSocket**: Available at `ws://localhost:8081`
- **UI Framework**: React with TypeScript in `ui/`

---

## ✅ **Ready for Development!**

**Foundation Status**: ✅ Complete  
**Next Phase**: 🚀 Chat Interface Implementation  
**Goal**: Interactive AI agent with memory-driven conversations

The roadmap is **perfectly aligned** and we're ready to build the conversational AI interface on our solid memory foundation!

---

*Development Plan - June 6, 2025 - Ready for Level 2 Implementation*
