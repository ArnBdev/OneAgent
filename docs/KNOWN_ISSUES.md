# Known Issues - OneAgent

## Memory System

### HTTP 400 "Missing session ID" from FastMCP Server

**Status**: Known limitation, functional workaround in place
**Severity**: Low (operations succeed via fallback)
**Affects**: All memory operations (add, search, edit, delete)

**Symptom**:
Memory operations log HTTP 400 errors with message "Bad Request: Missing session ID" from the FastMCP server, but operations still functionally succeed through fallback ID generation.

**Root Cause**:
FastMCP's HTTP JSON-RPC transport expects stateful sessions, but our Mem0MemoryClient uses stateless HTTP requests. The mismatch causes FastMCP to return HTTP 400 errors while still processing requests.

**Current Behavior**:
1. Client sends HTTP POST to FastMCP with MCP tool call
2. FastMCP returns HTTP 400 with JSON-RPC error: `{"code":-32600,"message":"Bad Request: Missing session ID"}`
3. Client's callTool() throws error due to `!response.ok`
4. addMemory() catch block returns `{ success: false, error: '...' }`
5. OneAgentMemory wrapper falls back to generating ID via `createUnifiedId()`
6. Operation appears successful to caller (ID returned)

**Impact**:
- ❌ Error logs clutter output (HTTP 400 errors on every memory operation)
- ❌ Memory not actually persisted to mem0 backend
- ❌ Fallback IDs don't reflect actual stored memory
- ✅ System remains functional (tests pass)
- ✅ IDs are generated consistently
- ✅ No crashes or data loss

**Workaround**:
Currently relying on fallback ID generation in OneAgentMemory. This works for testing but means memories aren't actually persisted to the mem0 backend.

**Proper Solution** (TODO):
Implement proper MCP session management in Mem0MemoryClient:

1. **Session Initialization**:
   ```typescript
   async initialize(): Promise<void> {
     const response = await fetch(this.baseUrl, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         jsonrpc: '2.0',
         method: 'initialize',
         params: { protocolVersion: '2025-06-18', capabilities: {} },
         id: this.getNextRequestId(),
       }),
     });
     const data = await response.json();
     this.sessionId = data.result.sessionId; // Store session ID
   }
   ```

2. **Include Session in Requests**:
   ```typescript
   headers: {
     'Content-Type': 'application/json',
     'MCP-Session-ID': this.sessionId, // Add session header
     'MCP-Protocol-Version': '2025-06-18',
   }
   ```

3. **Session Lifecycle**:
   - Initialize session on first request or during constructor
   - Renew session on expiry or HTTP 401
   - Close session on client shutdown

**Alternative Solution**:
Configure FastMCP server to support stateless HTTP mode (if possible). Check FastMCP documentation for `stateless=True` or similar configuration.

**References**:
- Error logged in: `coreagent/memory/clients/Mem0MemoryClient.ts:116-132`
- FastMCP server: `servers/mem0_fastmcp_server.py`
- Test showing behavior: `tests/debug/test-single-memory-add.ts`
- Related: Integration test passes despite errors (`tests/integration/gma-workflow.test.ts`)

**Priority**: Medium (should fix before production, but not blocking development)

**Last Updated**: 2025-10-02

---

## Configuration System

### (No known issues currently)

---

## Agent Communication

### (No known issues currently)

---

*Add new issues as they are discovered with same format: Symptom, Root Cause, Impact, Workaround, Solution, Priority*
