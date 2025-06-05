# 🧭 OneAgent - Copilot Guidance for Level 2 Development

## 🎯 **Mission Statement**

OneAgent is a **privacy-first AI agent platform** designed to serve humans through contextual assistance while maintaining complete data privacy and operating without cloud dependencies. The agent learns over time through local semantic memory and supports various roles (advisor, assistant, coach, etc.).

---

## 🧱 **BMAD Architecture (Core Framework)**

OneAgent is built on the **BMAD architecture**, separating agent capabilities into four distinct domains:

### **🧠 B - Behavior**
- **Decision-making patterns** and behavioral logic
- **Personality traits** and response styles  
- **Rule-based behavior** configuration
- **Adaptive learning** from interactions

### **💾 M - Memory**
- **Semantic memory storage** with ChromaDB + Gemini embeddings
- **Contextual retrieval** and memory search
- **Persistent learning** across sessions
- **Memory lifecycle management** (add, search, update, delete)

### **⚡ A - Action**
- **Tool integration** and external API usage
- **Web search capabilities** (Brave Search)
- **File operations** and data processing
- **Service orchestration** and workflow execution

### **💬 D - Dialogue**
- **Conversation management** and context preservation
- **Natural language processing** and generation
- **UI communication** and real-time interaction
- **Multi-turn conversation** support

---

## 📊 **Current Status & Achievements**

### ✅ **Level 1.4 COMPLETE** - Foundation & Monitoring
- **🧠 Memory System**: Full local Mem0 integration (19+ memories stored)
- **🚀 Production Server**: HTTP API with OneAgent compatibility
- **⚡ Performance**: 50-150ms memory search, WebSocket real-time updates
- **🎨 React UI**: Memory viewer, performance monitor, configuration panel
- **🔧 Developer Tools**: Automated structure, comprehensive testing

### 🟡 **Level 2 IN PROGRESS** - Advanced UI & Agent Interaction

---

## 🛠️ **Technology Stack (Current)**

### **Backend (Production Ready)**
```typescript
// Core Technologies
- TypeScript (Node.js) - Main application logic
- Python - Memory server (servers/gemini_mem0_server_v2.py)
- Express.js - REST API endpoints
- WebSocket - Real-time communication

// Memory & AI
- ChromaDB - Vector storage (768-dimensional embeddings)
- Google Gemini API - Embeddings and AI processing
- Mem0 OSS - Memory management framework

// Key Files
- coreagent/tools/mem0Client.ts - Memory integration
- coreagent/tools/geminiEmbeddings.ts - AI embeddings
- coreagent/server/index.ts - API server
```

### **Frontend (Established)**
```typescript
// UI Framework
- React 18 - Component framework
- TypeScript - Type safety
- Vite - Build tool and dev server

// Key Components
- ui/src/components/MemoryViewer.tsx - Memory management
- ui/src/components/PerformanceMonitor.tsx - System monitoring  
- ui/src/components/ConfigPanel.tsx - Configuration
- ui/src/hooks/ - API integration hooks
```

---

## 🎯 **Level 2 Development Priorities**

### **Priority 1: Chat Interface Implementation**
```typescript
// Goals
- Real-time chat with conversation flow
- Integration with existing memory system
- Message history and context preservation
- WebSocket-based real-time communication

// Key Implementation Areas
1. Chat UI components (ChatInterface, MessageList, InputBox)
2. Conversation state management
3. Memory context integration for each message
4. Real-time message delivery via WebSocket
```

### **Priority 2: BMAD Configuration System**
```typescript
// Goals  
- Visual configuration for each BMAD component
- Behavior pattern designer
- Memory strategy configuration
- Action/tool management interface

// Key Implementation Areas
1. BMAD configuration models and schemas
2. Visual configuration UI components
3. Behavior pattern templates and presets
4. Real-time configuration preview
```

### **Priority 3: Agent Personality Framework**
```typescript
// Goals
- Agent profile creation and management
- Personality trait configuration
- Role-based agent templates
- Performance analytics and insights

// Key Implementation Areas
1. Agent profile data models
2. Personality configuration UI
3. Template system for common agent roles
4. Analytics dashboard for agent performance
```

---

## 🔧 **Development Guidelines**

### **Code Organization**
```
ui/src/
├── components/
│   ├── chat/           # Chat interface components
│   ├── bmad/           # BMAD configuration components  
│   ├── agent/          # Agent profile management
│   └── shared/         # Reusable UI components
├── hooks/
│   ├── useChat.ts      # Chat state management
│   ├── useBMAD.ts      # BMAD configuration
│   └── useAgent.ts     # Agent profile management
├── types/
│   ├── chat.ts         # Chat-related types
│   ├── bmad.ts         # BMAD configuration types
│   └── agent.ts        # Agent profile types
└── utils/
    ├── api.ts          # API communication
    └── websocket.ts    # Real-time communication
```

### **API Patterns**
```typescript
// Memory Integration (Existing)
const memory = await mem0Client.addMemory(userId, message);
const results = await mem0Client.searchMemory(userId, query);

// Chat API (To Implement)
POST /api/chat/message - Send chat message with memory context
GET /api/chat/history - Retrieve conversation history
WebSocket /ws/chat - Real-time message delivery

// BMAD Configuration (To Implement)  
GET /api/bmad/config - Get current BMAD configuration
POST /api/bmad/config - Update BMAD settings
GET /api/bmad/templates - Get behavior templates

// Agent Profiles (To Implement)
GET /api/agents - List agent profiles
POST /api/agents - Create new agent profile
PUT /api/agents/:id - Update agent profile
```

---

## 💡 **Immediate Development Tasks**

### **Phase 1: Chat Interface Foundation**
1. **Create Chat Components**
   ```typescript
   // ui/src/components/chat/ChatInterface.tsx
   // ui/src/components/chat/MessageList.tsx
   // ui/src/components/chat/MessageInput.tsx
   ```

2. **Implement Chat State Management**
   ```typescript
   // ui/src/hooks/useChat.ts - Chat state and WebSocket integration
   // ui/src/types/chat.ts - Message, conversation types
   ```

3. **Backend Chat API**
   ```typescript
   // coreagent/api/chatAPI.ts - Chat endpoints
   // Integration with existing mem0Client for context
   ```

### **Phase 2: BMAD Configuration**
1. **BMAD Data Models**
   ```typescript
   // Define configuration schemas for each BMAD component
   // Create validation and serialization logic
   ```

2. **Configuration UI**
   ```typescript
   // Visual editors for behavior patterns
   // Memory strategy configuration panels
   // Action/tool management interface
   ```

### **Phase 3: Agent Profiles**
1. **Agent Management System**
   ```typescript
   // Profile creation and editing
   // Personality trait configuration
   // Role-based templates
   ```

---

## 🔍 **Key Integration Points**

### **Memory System Integration**
```typescript
// Existing working integration
import { mem0Client } from '../tools/mem0Client';

// Usage in chat
const addMessageToMemory = async (userId: string, message: string) => {
  await mem0Client.addMemory(userId, message);
};

const getConversationContext = async (userId: string, query: string) => {
  return await mem0Client.searchMemory(userId, query);
};
```

### **WebSocket Real-time Communication**
```typescript
// Existing WebSocket server at ws://localhost:8081
// Use for real-time chat, memory updates, and system monitoring
```

### **Performance Monitoring**
```typescript
// Existing performance API at /api/performance/metrics
// Integrate chat performance and BMAD metrics
```

---

## 🚀 **Success Criteria for Level 2**

### **Chat Interface**
- [ ] Real-time bidirectional chat communication
- [ ] Memory-integrated conversation context
- [ ] Message history persistence and retrieval
- [ ] Multi-user conversation support

### **BMAD Configuration**
- [ ] Visual configuration for all BMAD components
- [ ] Behavior pattern templates and customization
- [ ] Real-time configuration preview and testing
- [ ] Export/import configuration profiles

### **Agent Profiles**
- [ ] Complete agent profile management system
- [ ] Personality trait configuration with presets
- [ ] Role-based agent templates (assistant, coach, advisor)
- [ ] Agent performance analytics and insights

---

## 📚 **Available Resources**

### **Documentation**
- **[Updated Roadmap](docs/ONEAGENT_ROADMAP_2025.md)** - Complete development plan
- **[Mem0 Integration Report](docs/MEM0_INTEGRATION_FINAL_REPORT.md)** - Memory system details
- **[Milestone 1.4 Report](docs/MILESTONE_1_4_COMPLETION_REPORT.md)** - UI and monitoring implementation

### **Working Code Examples**
- **Memory Operations**: `tests/complete_integration_test.js`
- **UI Components**: `ui/src/components/` directory
- **API Integration**: `ui/src/hooks/` directory
- **WebSocket Usage**: Performance monitoring implementation

---

## 🎯 **Copilot Action Items**

### **Immediate Tasks**
1. **Analyze existing UI components** and propose chat interface design
2. **Create BMAD configuration data models** with TypeScript types
3. **Design agent profile management system** with personality traits
4. **Propose conversation flow integration** with memory system

### **Development Approach**
- **Build on existing foundation** - leverage current memory and UI systems
- **Maintain type safety** - comprehensive TypeScript usage
- **Real-time focused** - WebSocket integration for live updates
- **Memory-centric** - every interaction should leverage semantic memory
- **Modular design** - BMAD components should be independently configurable

---

## 🚀 **Ready to Begin Level 2 Development!**

OneAgent has a **solid foundation** with working memory, performance monitoring, and UI framework. The next phase focuses on **agent interaction, personality, and advanced user experience**.

**Current Status**: Production-ready memory system + React UI foundation  
**Next Goal**: Interactive chat interface with BMAD configuration  
**Success Metric**: Functional AI agent with configurable personality and memory-driven conversations

---

*Guidance Document - June 6, 2025 - Ready for Level 2 Development*
