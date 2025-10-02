# Known Issues - OneAgent

> **Last Updated**: 2025-10-02 (v4.4.0)

## Active Issues

### (No active issues currently)

All previously tracked issues have been resolved. This section will be populated as new issues are discovered during development and production use.

---

## Resolved Issues

### Memory System

#### ~~HTTP 400 "Missing session ID" from FastMCP Server~~

**Status**: ✅ **RESOLVED** (2025-10-02 - v4.4.0)  
**Resolution**: Implemented complete MCP Specification 2025-06-18 Session Management

**What Was Fixed**:

Implemented full MCP session lifecycle management in Mem0MemoryClient, including:

1. **3-Step Session Handshake**:
   - Send `initialize` request with protocol version and capabilities
   - Extract `Mcp-Session-Id` from response header
   - Send `notifications/initialized` notification (CRITICAL - was missing)
   - Include session ID in all subsequent requests

2. **SSE Response Parsing**:
   - FastMCP returns `text/event-stream` for ALL responses (not just notifications)
   - Handle Windows line endings (`\r\n`) with `trim()` in SSE parser
   - Parse multiple SSE events in single response

3. **FastMCP Response Unwrapping**:
   - FastMCP wraps tool results in `result.structuredContent`
   - Implemented automatic unwrapping to extract actual tool results

4. **Session Lifecycle**:
   - Lazy initialization (first request triggers)
   - Promise caching (prevents concurrent init)
   - Session expiry handling (HTTP 404 → reinit → retry)
   - Proper cleanup (DELETE on close)

**Test Results**:

**Before Implementation**:

```
❌ HTTP 400 errors: 13/13 memory operations failed
❌ Error: "Missing session ID"
❌ Memory persistence: Fallback IDs only (not stored in backend)
❌ Session management: None
```

**After Implementation**:

```
✅ HTTP 200 success: All memory operations succeed
✅ Session established: Mcp-Session-Id extracted and included
✅ Initialized notification: HTTP 202 Accepted
✅ Tool calls: HTTP 200, backend executing successfully
✅ SSE parsing: Windows line endings handled correctly
✅ Response unwrapping: structuredContent extracted properly
✅ Memory persistence: Verified with mem0 backend
```

**Server Log Evidence** (mem0 backend execution):

```
2025-10-02 21:51:33 - add_memory: content_length=237
2025-10-02 21:51:45 - mem0.memory.main - INFO - {'id': '0', 'text': 'Name is Alex Thompson', 'event': 'ADD'}
2025-10-02 21:51:51 - mem0.memory.main - INFO - {'id': '1', 'text': 'Prefers TypeScript for development', 'event': 'ADD'}
2025-10-02 21:51:51 - mem0.memory.main - INFO - {'id': '2', 'text': 'Works on the OneAgent project', 'event': 'ADD'}
2025-10-02 21:51:51 - mem0.memory.main - INFO - {'id': '3', 'text': 'Deadline for memory system integration is October 15th, 2025', 'event': 'ADD'}
2025-10-02 21:51:59 - mem0.memory.main - INFO - {'id': '4', 'text': 'Prefers dark mode for IDE', 'event': 'ADD'}
2025-10-02 21:51:59 - mem0.memory.main - INFO - {'id': '5', 'text': 'Uses VS Code as primary editor', 'event': 'ADD'}
2025-10-02 21:51:59 - ✅ Added 6 memories for user test-user

2025-10-02 21:58:14 - search_memories: query=Alex Thompson TypeScript...
2025-10-02 21:58:14 - ✅ Found 6 memories for user test-user
```

**Key Discoveries**:

1. **Missing initialized notification**: FastMCP requires `notifications/initialized` after `initialize` (3-step handshake, not 2-step)
2. **SSE for everything**: FastMCP returns SSE format for ALL responses, not just server-initiated events
3. **Windows line endings**: SSE streams use `\r\n`, required `trim()` for proper parsing
4. **Response structure**: FastMCP wraps results in `structuredContent` property

**Implementation Details**:

- **Files Modified**: `coreagent/memory/clients/Mem0MemoryClient.ts` (+250 lines)
- **Lines Changed**: Session init (86-215), notification (217-267), parsing (269-347), unwrapping (420-445)
- **Test**: `tests/debug/test-single-memory-add.ts` with factual content (name, preferences, deadlines)
- **Backend**: mem0 0.1.118 with OpenAI gpt-4o-mini for fact extraction

**References**:

- MCP Specification 2025-06-18: https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#session-management
- FastMCP 2.12.4 Documentation
- Implementation PR: [To be added]
- Comprehensive Audit: `docs/reports/MEMORY_SYSTEM_AUDIT_2025-10-02.md`

---

## Configuration System

### (No known issues currently)

---

## Agent Communication

### (No known issues currently)

---

## How to Report New Issues

When discovering new issues, please document them using the following format:

### Issue Title

**Status**: 🐛 **ACTIVE** | ⚠️ **INVESTIGATING** | 🔧 **IN PROGRESS** | ✅ **RESOLVED**  
**Severity**: 🔴 **CRITICAL** | 🟠 **HIGH** | 🟡 **MEDIUM** | 🟢 **LOW**  
**Discovered**: Date (version)

**Symptom**: Brief description of the observable problem  
**Root Cause**: Technical explanation of the underlying issue (if known)  
**Impact**: Who/what is affected and how severely  
**Workaround**: Temporary solution or mitigation (if available)  
**Solution**: Planned or implemented fix  
**References**: Links to related docs, PRs, issues

---

_This document is actively maintained. Issues are moved to "Resolved" section upon fix and verification._
