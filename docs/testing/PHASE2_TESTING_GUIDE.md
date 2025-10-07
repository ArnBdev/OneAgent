# Phase 2 MCP SDK Testing Guide

**Status**: 📋 Manual Testing Pending  
**Version**: 1.0.0  
**Last Updated**: 2025-10-07 (Phase 2 Complete)

## Overview

This guide provides comprehensive instructions for testing the Phase 2 MCP SDK integration with hybrid Express + SDK architecture. All automated tests pass; manual testing focuses on stdio transport and memory operations.

## Prerequisites

### System Requirements

- **Node.js**: v18+ (verify: `node --version`)
- **TypeScript**: v5.7+ (verify: `npm run typecheck`)
- **Python**: 3.11+ (for memory server, verify: `python --version`)
- **VS Code**: v1.104+ (for stdio transport testing)

### Build Verification

Before testing, ensure all verification gates pass:

```powershell
# Run full verification suite
npm run verify

# Expected output:
# ✅ Canonical Files Guard: PASS
# ✅ Banned Metrics Guard: PASS
# ✅ Deprecated Deps Guard: PASS
# ✅ TypeScript type check: 0 errors (367 files)
# ✅ UI type check: 0 errors
# ✅ ESLint check: 0 errors, 1 warning (acceptable)
```

### Environment Configuration

Create or verify `.env` file in project root:

```ini
# MCP SDK Configuration
ONEAGENT_MCP_STDIO=1              # Enable SDK stdio transport (default: enabled)
ONEAGENT_MCP_PORT=8083            # HTTP server port (default: 8083)

# Memory Server Configuration
ONEAGENT_MEMORY_HOST=localhost    # Memory server host (default: localhost)
ONEAGENT_MEMORY_PORT=8010         # Memory server port (default: 8010)

# Testing Configuration
ONEAGENT_FAST_TEST_MODE=1         # Speed up initialization for tests
ONEAGENT_DISABLE_AUTO_MONITORING=1 # Disable auto health monitoring during tests
```

## Testing Scenarios

### Scenario 1: Memory Server Startup

**Purpose**: Verify Python memory server (mem0_fastmcp_server) starts correctly and serves on port 8010.

**Steps**:

1. **Start Memory Server** (PowerShell):

   ```powershell
   # Navigate to project root
   cd c:\Dev\OneAgent

   # Start memory server (runs in background)
   npm run memory:server

   # Expected output:
   # > oneagent-professional@4.6.0 memory:server
   # > python servers/mem0_fastmcp_server.py
   #
   # INFO:     Started server process [PID]
   # INFO:     Waiting for application startup.
   # INFO:     Application startup complete.
   # INFO:     Uvicorn running on http://127.0.0.1:8010 (Press CTRL+C to quit)
   ```

2. **Verify Server Health** (new PowerShell window):

   ```powershell
   # Test memory server health endpoint
   Invoke-RestMethod -Uri "http://localhost:8010/health" -Method GET

   # Expected output:
   # {
   #   "status": "healthy",
   #   "version": "1.0.0",
   #   "timestamp": "2025-10-07..."
   # }
   ```

3. **Test Memory Operations** (PowerShell):

   ```powershell
   # Add a test memory
   $body = @{
     content = "Test memory from Phase 2 testing"
     metadata = @{
       category = "test"
       phase = "phase2"
     }
   } | ConvertTo-Json

   Invoke-RestMethod -Uri "http://localhost:8010/api/memories" `
     -Method POST `
     -ContentType "application/json" `
     -Body $body

   # Expected output:
   # {
   #   "id": "mem_...",
   #   "content": "Test memory from Phase 2 testing",
   #   "metadata": {...}
   # }
   ```

**Success Criteria**:

- ✅ Memory server starts without errors
- ✅ Health endpoint returns 200 OK
- ✅ Memory operations (add, search) work correctly

**Troubleshooting**:

- **Port 8010 in use**: Kill existing process (`taskkill /F /PID <pid>`)
- **Python import errors**: Install dependencies (`pip install -r requirements.txt`)
- **Connection refused**: Check firewall settings, ensure localhost access allowed

---

### Scenario 2: Unified MCP Server Startup (Hybrid Mode)

**Purpose**: Verify unified MCP server starts with both Express HTTP and SDK stdio transports.

**Steps**:

1. **Start Unified MCP Server** (new PowerShell window):

   ```powershell
   # Ensure memory server is running first (Scenario 1)

   # Start unified MCP server
   npm run server:unified

   # Expected output:
   # [2024-XX-XX...] INFO: UnifiedBackboneService initialized
   # [2024-XX-XX...] INFO: OneAgentMemory connected to http://localhost:8010
   # [2024-XX-XX...] INFO: Registering 15+ tools with MCP SDK...
   # [2024-XX-XX...] INFO: MCP SDK initialized (stdio transport)
   # [2024-XX-XX...] INFO: MCP server listening on http://localhost:8083
   # [2024-XX-XX...] INFO: Hybrid mode active: Express HTTP + SDK stdio
   ```

2. **Verify Express HTTP Endpoint** (new PowerShell window):

   ```powershell
   # Test Express /mcp endpoint (backward compatibility)
   $body = @{
     jsonrpc = "2.0"
     id = 1
     method = "tools/list"
     params = @{}
   } | ConvertTo-Json

   Invoke-RestMethod -Uri "http://localhost:8083/mcp" `
     -Method POST `
     -ContentType "application/json" `
     -Body $body

   # Expected output:
   # {
   #   "jsonrpc": "2.0",
   #   "id": 1,
   #   "result": {
   #     "tools": [
   #       { "name": "oneagent_memory_search", ... },
   #       { "name": "oneagent_memory_add", ... },
   #       ...
   #     ]
   #   }
   # }
   ```

3. **Verify SDK Diagnostic Endpoint** (PowerShell):

   ```powershell
   # Test SDK status endpoint
   Invoke-RestMethod -Uri "http://localhost:8083/mcp/sdk-info" -Method GET

   # Expected output:
   # {
   #   "sdkVersion": "1.0.4",
   #   "serverInfo": {
   #     "name": "oneagent-professional",
   #     "version": "4.6.0"
   #   },
   #   "capabilities": {
   #     "tools": { "listChanged": true },
   #     "resources": { "subscribe": true, "listChanged": true },
   #     "prompts": { "listChanged": true }
   #   },
   #   "registeredTools": 15,
   #   "registeredResources": 5,
   #   "registeredPrompts": 3,
   #   "transportStatus": "stdio active"
   # }
   ```

**Success Criteria**:

- ✅ Unified server starts without errors
- ✅ Express /mcp endpoint responds correctly (backward compat)
- ✅ SDK diagnostic endpoint shows stdio active
- ✅ Tool counts match expected values (15+ tools)

**Troubleshooting**:

- **Port 8083 in use**: Change `ONEAGENT_MCP_PORT` in `.env`, restart server
- **Memory connection failed**: Ensure memory server running (Scenario 1)
- **SDK not initialized**: Check `ONEAGENT_MCP_STDIO=1` in `.env`

---

### Scenario 3: VS Code MCP Client (Stdio Transport)

**Purpose**: Verify VS Code can connect to OneAgent via stdio transport using the MCP SDK.

**Prerequisites**:

- VS Code v1.104+ installed
- Memory server running (Scenario 1)
- Unified MCP server NOT running (stdio uses direct process invocation)

**Steps**:

1. **Configure VS Code MCP Client**:

   Create or update `.vscode/mcp.json`:

   ```json
   {
     "mcpServers": {
       "oneagent-stdio": {
         "command": "node",
         "args": ["-r", "ts-node/register", "coreagent/server/unified-mcp-server.ts"],
         "env": {
           "ONEAGENT_MCP_STDIO": "1",
           "ONEAGENT_FAST_TEST_MODE": "1",
           "ONEAGENT_DISABLE_AUTO_MONITORING": "1",
           "ONEAGENT_MEMORY_HOST": "localhost",
           "ONEAGENT_MEMORY_PORT": "8010"
         },
         "disabled": false
       }
     }
   }
   ```

2. **Restart VS Code** (to load MCP configuration):
   - Close all VS Code windows
   - Reopen project: `code c:\Dev\OneAgent`

3. **Test MCP Tools in Copilot Chat**:

   Open GitHub Copilot Chat and try:

   ```
   @workspace Use the oneagent_memory_search tool to search for "Phase 2" memories.
   ```

   Expected behavior:
   - Copilot recognizes the tool
   - Tool executes successfully
   - Results returned in chat

4. **Verify Tool Discovery**:

   In Copilot Chat:

   ```
   @workspace List all available OneAgent MCP tools.
   ```

   Expected tools:
   - `oneagent_memory_search`
   - `oneagent_memory_add`
   - `oneagent_quality_score`
   - `oneagent_constitutional_validate`
   - `oneagent_bmad_analyze`
   - `oneagent_web_search`
   - `oneagent_web_fetch`
   - ... (15+ tools total)

**Success Criteria**:

- ✅ VS Code loads MCP configuration without errors
- ✅ Copilot Chat recognizes OneAgent tools
- ✅ Tools execute successfully via stdio transport
- ✅ Results returned correctly to chat interface

**Troubleshooting**:

- **Tools not recognized**: Check `.vscode/mcp.json` syntax, restart VS Code
- **Connection timeout**: Ensure memory server running, check `ONEAGENT_MEMORY_PORT`
- **Tool execution errors**: Check VS Code Output → GitHub Copilot Chat → MCP Servers for logs

---

### Scenario 4: Backward Compatibility Verification

**Purpose**: Verify existing Express HTTP clients continue working (100% backward compatibility).

**Prerequisites**:

- Memory server running (Scenario 1)
- Unified MCP server running in hybrid mode (Scenario 2)

**Steps**:

1. **Test Existing Express Endpoint** (PowerShell):

   ```powershell
   # Test tools/list (unchanged from v4.4.2)
   $body = @{
     jsonrpc = "2.0"
     id = 1
     method = "tools/list"
     params = @{}
   } | ConvertTo-Json

   Invoke-RestMethod -Uri "http://localhost:8083/mcp" `
     -Method POST `
     -ContentType "application/json" `
     -Body $body
   ```

2. **Test Tool Execution** (PowerShell):

   ```powershell
   # Test oneagent_memory_search via Express
   $body = @{
     jsonrpc = "2.0"
     id = 2
     method = "tools/call"
     params = @{
       name = "oneagent_memory_search"
       arguments = @{
         query = "Phase 2 testing"
       }
     }
   } | ConvertTo-Json -Depth 5

   Invoke-RestMethod -Uri "http://localhost:8083/mcp" `
     -Method POST `
     -ContentType "application/json" `
     -Body $body
   ```

3. **Compare with SDK Results**:

   Run same queries via VS Code stdio (Scenario 3) and compare:
   - Tool lists should be identical
   - Execution results should match
   - Performance should be similar (no regression)

**Success Criteria**:

- ✅ All Express endpoints respond correctly
- ✅ Tool execution results match SDK results
- ✅ No performance regression (<10% difference)
- ✅ Error handling consistent across transports

**Troubleshooting**:

- **Different tool lists**: Check unified cache consistency
- **Execution timeouts**: Verify memory server responsive
- **Response format mismatch**: Check JSON-RPC 2.0 compliance

---

### Scenario 5: Cache Consistency Verification

**Purpose**: Verify unified cache stores MCP tools/resources/prompts correctly across both transports.

**Prerequisites**:

- Memory server running (Scenario 1)
- Unified MCP server running (Scenario 2)

**Steps**:

1. **Inspect Cache Contents** (Node.js REPL):

   ```javascript
   // Start Node.js REPL
   // node

   const { OneAgentUnifiedBackbone } = require('./dist/coreagent/utils/UnifiedBackboneService');

   // Get unified cache instance
   const cache = OneAgentUnifiedBackbone.getInstance().cache;

   // List all MCP tool keys
   const toolKeys = Array.from(cache.keys()).filter((k) => k.startsWith('mcp:tool:'));
   console.log('Registered tools:', toolKeys.length);
   console.log(
     'Tool names:',
     toolKeys.map((k) => k.replace('mcp:tool:', '')),
   );

   // Inspect a specific tool
   const tool = cache.get('mcp:tool:oneagent_memory_search');
   console.log('Tool definition:', JSON.stringify(tool, null, 2));
   ```

2. **Verify Set Indices**:

   ```javascript
   // Get Set indices from cache
   const toolNames = cache.get('mcp:tool:names');
   console.log('Tool names Set:', Array.from(toolNames || []));

   const resourceUris = cache.get('mcp:resource:uris');
   console.log('Resource URIs Set:', Array.from(resourceUris || []));

   const promptNames = cache.get('mcp:prompt:names');
   console.log('Prompt names Set:', Array.from(promptNames || []));
   ```

3. **Test Cache Persistence**:
   - Restart unified MCP server (Ctrl+C, then `npm run server:unified`)
   - Re-run REPL inspection (Step 1)
   - Verify tool definitions persist (cache TTL respected)

**Success Criteria**:

- ✅ All tools stored with `mcp:tool:${name}` keys
- ✅ Set indices (`mcp:tool:names`, etc.) populated correctly
- ✅ Tool definitions complete (name, description, inputSchema, handler)
- ✅ Cache persistence across server restarts (TTL dependent)

**Troubleshooting**:

- **Empty cache**: Check registerToolsWithSDK() execution during startup
- **Missing indices**: Verify Set-based storage in MCPSDKService
- **Stale data**: Clear cache (`cache.clear()`) and restart server

---

### Scenario 6: Performance Baseline

**Purpose**: Verify hybrid architecture introduces minimal overhead (<10% regression).

**Prerequisites**:

- Memory server running (Scenario 1)
- Unified MCP server running (Scenario 2)

**Steps**:

1. **Baseline Express Performance** (PowerShell):

   ```powershell
   # Measure Express /mcp tool listing (100 iterations)
   Measure-Command {
     for ($i=0; $i -lt 100; $i++) {
       $body = @{
         jsonrpc = "2.0"
         id = $i
         method = "tools/list"
         params = @{}
       } | ConvertTo-Json

       Invoke-RestMethod -Uri "http://localhost:8083/mcp" `
         -Method POST `
         -ContentType "application/json" `
         -Body $body | Out-Null
     }
   }

   # Expected: ~2-5 seconds for 100 requests (20-50ms per request)
   ```

2. **Measure Memory Operations** (PowerShell):

   ```powershell
   # Measure memory search performance (50 iterations)
   Measure-Command {
     for ($i=0; $i -lt 50; $i++) {
       $body = @{
         jsonrpc = "2.0"
         id = $i
         method = "tools/call"
         params = @{
           name = "oneagent_memory_search"
           arguments = @{ query = "test query $i" }
         }
       } | ConvertTo-Json -Depth 5

       Invoke-RestMethod -Uri "http://localhost:8083/mcp" `
         -Method POST `
         -ContentType "application/json" `
         -Body $body | Out-Null
     }
   }

   # Expected: ~5-15 seconds for 50 requests (100-300ms per request)
   ```

3. **Compare with v4.4.2 Baseline**:

   If available, compare results with pre-Phase 2 performance:
   - Tool listing: <10% regression acceptable
   - Memory operations: <10% regression acceptable
   - Cold start time: <20% regression acceptable

**Success Criteria**:

- ✅ Tool listing: <50ms per request average
- ✅ Memory operations: <300ms per request average
- ✅ No >10% regression vs v4.4.2 baseline
- ✅ CPU/memory usage within acceptable bounds

**Troubleshooting**:

- **High latency**: Check network, memory server responsiveness
- **Timeout errors**: Increase timeout settings, optimize cache access
- **Memory leaks**: Monitor process memory over time (Task Manager)

---

## Quick Start Commands

### Start Full System (PowerShell)

```powershell
# Terminal 1: Memory server
npm run memory:server

# Terminal 2: Unified MCP server (wait for memory server to be ready)
npm run server:unified

# Terminal 3: Verification
npm run verify

# Terminal 4: Testing
# Run scenarios 1-6 as needed
```

### Stop All Servers (PowerShell)

```powershell
# Find and kill memory server (port 8010)
Get-NetTCPConnection -LocalPort 8010 | ForEach-Object {
  Stop-Process -Id $_.OwningProcess -Force
}

# Find and kill MCP server (port 8083)
Get-NetTCPConnection -LocalPort 8083 | ForEach-Object {
  Stop-Process -Id $_.OwningProcess -Force
}
```

## Test Results Template

Use this template to document manual testing results:

```markdown
## Phase 2 Manual Testing Results

**Date**: YYYY-MM-DD  
**Tester**: [Your Name]  
**Environment**: Windows/macOS/Linux, Node v18.x, Python v3.11+

### Scenario 1: Memory Server Startup

- [ ] Memory server starts without errors
- [ ] Health endpoint responds correctly
- [ ] Memory operations work (add, search)
- **Notes**: ...

### Scenario 2: Unified MCP Server Startup

- [ ] Server starts in hybrid mode (Express + SDK)
- [ ] Express /mcp endpoint responsive
- [ ] SDK diagnostic endpoint shows stdio active
- [ ] Tool counts correct (15+)
- **Notes**: ...

### Scenario 3: VS Code MCP Client

- [ ] MCP configuration loaded correctly
- [ ] Tools recognized in Copilot Chat
- [ ] Tool execution successful via stdio
- [ ] Results displayed correctly
- **Notes**: ...

### Scenario 4: Backward Compatibility

- [ ] Express endpoints unchanged
- [ ] Tool execution matches SDK results
- [ ] No performance regression
- [ ] Error handling consistent
- **Notes**: ...

### Scenario 5: Cache Consistency

- [ ] Tools stored with correct keys
- [ ] Set indices populated
- [ ] Cache persists across restarts
- **Notes**: ...

### Scenario 6: Performance Baseline

- [ ] Tool listing <50ms average
- [ ] Memory ops <300ms average
- [ ] <10% regression vs baseline
- **Notes**: ...

### Summary

- **Overall Status**: ✅ PASS / ⚠️ PARTIAL / ❌ FAIL
- **Critical Issues**: None / [List issues]
- **Recommendations**: ...
```

## Next Steps After Testing

1. **Document Results**: Fill out test results template above
2. **Update Documentation**: Add findings to PHASE2_MCP_MIGRATION_PLAN.md
3. **Mark Complete**: Update todo list and CHANGELOG.md
4. **Phase 3 Planning**: Begin OAuth2 + mTLS implementation planning

## Support & Resources

- **Documentation**: `docs/implementation/PHASE2_MCP_MIGRATION_PLAN.md`
- **Architecture**: `docs/MCP_INTERFACE_STRATEGY.md`
- **AGENTS.md**: Repository root - canonical agent instructions
- **Issues**: GitHub Issues with `phase2` label

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-07 (Phase 2 Complete)  
**Next Review**: After Phase 3 kickoff
