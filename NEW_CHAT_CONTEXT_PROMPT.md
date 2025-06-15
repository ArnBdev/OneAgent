# NEW CHAT CONTEXT PROMPT: OneAgent Automatic Conversation Logging Implementation

## 🎯 PROJECT CONTEXT
I need to implement automatic background conversation logging for OneAgent so that all user messages and AI responses are automatically stored in memory without manual intervention. This will enable true ALITA evolution and cross-session context persistence.

## ✅ CURRENT SYSTEM STATUS
- **Memory System**: Fully operational with ChromaDB backend on port 8001
- **MCP Tools**: Clean architecture with only Constitutional AI-compliant tools active
- **Manual Storage**: Working but requires explicit tool calls for each conversation exchange
- **Environment**: All configs use .env variables (no hardcoded ports)
- **GitHub**: Latest code pushed and committed

## 🔧 CURRENT ARCHITECTURE
```
OneAgent MCP Server (port 8083) ↔ Memory Server (port 8001) ↔ ChromaDB Backend
├── RealUnifiedMemoryClient: Working with correct endpoints (/memory/conversations)
├── ToolRegistry: Only oneagent_memory_create registered (append-only for Constitutional AI)
├── Settings.json: Updated with memory workflow instructions
└── Manual Logging: Functional but requires explicit calls
```

## 🎯 IMPLEMENTATION NEEDED

### **Primary Goal**: Make conversation logging completely automatic and transparent

### **Key Requirements**:
1. **Auto-Log User Messages**: Every user message automatically stored in memory
2. **Auto-Log AI Responses**: Every AI response automatically stored in memory  
3. **Cross-Session Persistence**: New chat instances immediately have full context
4. **Zero Manual Intervention**: No explicit memory tool calls required
5. **ALITA Evolution**: System learns from patterns and auto-updates settings.json
6. **Performance**: < 50ms impact per message

### **Technical Integration Points**:
- **File**: `coreagent/server/oneagent-mcp-copilot.ts` - Add auto-logging hooks to `/mcp` endpoint
- **File**: `coreagent/tools/ConversationLogger.ts` - New automatic logger class (create)
- **File**: `coreagent/tools/SessionContextManager.ts` - Cross-session context manager (create)
- **File**: `coreagent/agents/evolution/ALITAAutoEvolution.ts` - Auto-evolution system (create)

## 📋 IMPLEMENTATION PLAN READY
The complete technical implementation plan is documented in:
- `AUTOMATIC_CONVERSATION_LOGGING_PLAN.md` - Full technical specification
- All required code patterns and integration points defined
- Success metrics and testing criteria established

## 🚀 WHAT TO IMPLEMENT

### **Phase 1**: Core Auto-Logging (Priority: High)
Add ConversationLogger class to MCP server that automatically:
- Captures every user message before processing
- Stores every AI response after processing  
- Uses existing RealUnifiedMemoryClient (endpoints already fixed)
- Handles errors gracefully without breaking chat

### **Phase 2**: Session Context Recovery
Enable new chat instances to automatically load previous conversation context from memory.

### **Phase 3**: ALITA Auto-Evolution
System analyzes conversation patterns and automatically updates GitHub Copilot instructions.

## 🔧 TECHNICAL NOTES
- **Memory Client**: `realUnifiedMemoryClient` is working with correct endpoints
- **No Endpoint Issues**: Previous `/v1/memories` vs `/memory/conversations` mismatch resolved
- **Constitutional AI**: All stored content must maintain 95%+ quality score
- **Environment Variables**: Use `oneAgentConfig.memoryUrl` and `oneAgentConfig.memoryPort`

## ✅ VALIDATION CRITERIA
System is successful when:
- No manual memory tool calls visible in conversations
- New chat instances have immediate context availability
- All conversations automatically preserved in memory
- ALITA evolution updates settings.json based on successful patterns

## 🎯 START IMPLEMENTATION
Begin with Phase 1: Core Auto-Logging integration into the MCP server endpoint. The memory system infrastructure is ready and operational.
