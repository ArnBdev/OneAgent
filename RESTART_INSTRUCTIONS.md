# 🚨 RESTART REQUIRED - Action Plan

## Status

- ✅ All fixes applied to source code
- ✅ TypeScript build completed successfully (`npm run build`)
- ⏳ **SERVERS STILL RUNNING OLD CODE** - restart needed!

## What Was Fixed

### Fix 1: Embedder Verification ✅

**File**: `servers/mem0_fastmcp_server.py`

- Changed attribute lookup from `memory.embedder` → `memory.embedding_model`
- Enhanced logging with model name and client info

### Fix 2: Readiness Probe Endpoint ✅

**Files**:

- `coreagent/OneAgentEngine.ts` - Updated probe URL to `/health/ready`
- `servers/mem0_fastmcp_server.py` - Added `/readyz` backward-compatible alias

### Fix 3: Model Name Display ✅

**File**: `servers/mem0_fastmcp_server.py`

- Added `getattr(embedder, 'model', 'unknown')` to show model name in logs

## 🎯 RESTART PROCEDURE

### Step 1: Stop Both Servers

```powershell
# In each terminal running a server, press: Ctrl+C
```

### Step 2: Restart Memory Backend

```powershell
# Terminal 1
npm run memory:server
```

**Expected Clean Logs**:

```
2025-10-04 XX:XX:XX,XXX - __main__ - INFO - ✅ Memory initialization successful
2025-10-04 XX:XX:XX,XXX - __main__ - INFO - ✅ OpenAI embedder verified: OpenAIEmbedding
2025-10-04 XX:XX:XX,XXX - __main__ - INFO -    Client: OpenAI
2025-10-04 XX:XX:XX,XXX - __main__ - INFO -    Model: text-embedding-3-small  ← SHOULD SHOW MODEL NAME
2025-10-04 XX:XX:XX,XXX - __main__ - INFO -    mem0 0.1.118 correctly sends input as array
2025-10-04 XX:XX:XX,XXX - __main__ - INFO -    Empty query guard active in search_memories
```

### Step 3: Restart OneAgent

```powershell
# Terminal 2
npm run server:unified
```

**Expected Clean Logs**:

```
[ENGINE] 🔍 Checking memory server readiness...
[ENGINE] 📡 Memory probe URL: http://127.0.0.1:8010/health/ready  ← CORRECT URL
[ENGINE] 🔄 Memory probe attempt 1/30...
[ENGINE] ✅ Memory server ready!  ← SHOULD SUCCEED ON FIRST TRY
[INFO] XXXX-XX-XXTXX:XX:XX.XXXZ Initializing MCP session { baseUrl: 'http://127.0.0.1:8010/mcp' }
[INFO] XXXX-XX-XXTXX:XX:XX.XXXZ MCP session established { sessionId: 'xxxxxxxx...', protocolVersion: '2025-06-18' }
```

### Step 4: Verify Memory Backend Logs

**Check for ZERO 406 errors**:

```
✅ GOOD: INFO: 127.0.0.1:60XXX - "GET /health/ready HTTP/1.1" 200 OK
❌ BAD:  INFO: 127.0.0.1:60XXX - "GET /mcp HTTP/1.1" 406 Not Acceptable
```

## ✅ Success Criteria

1. **Memory Backend Startup**:
   - ✅ Shows `✅ OpenAI embedder verified: OpenAIEmbedding`
   - ✅ Shows `Model: text-embedding-3-small` (not "unknown")
   - ✅ NO warnings about embedder=None

2. **OneAgent Startup**:
   - ✅ Probe URL shows `/health/ready` (not `/readyz`)
   - ✅ Memory server ready on first or second attempt (not 20+ retries)
   - ✅ MCP session established successfully

3. **Memory Backend After OneAgent Starts**:
   - ✅ ZERO "406 Not Acceptable" errors
   - ✅ Shows successful GET requests to `/health/ready` or `/readyz`
   - ✅ Shows successful POST requests to `/mcp` for MCP protocol

## 🔍 If Issues Persist

### Issue: Still see "Model: unknown"

**Cause**: mem0 0.1.118 might store model under different attribute  
**Debug**: Run this in Python:

```python
from mem0 import Memory
from mem0.configs.embeddings import EmbedderConfig

config = {
    "embedder": {
        "provider": "openai",
        "config": {
            "model": "text-embedding-3-small",
            "api_key": "your-key-here"
        }
    }
}
memory = Memory.from_config(config)
embedder = memory.embedding_model
print(f"Embedder attributes: {dir(embedder)}")
print(f"Model: {embedder.model if hasattr(embedder, 'model') else 'N/A'}")
print(f"Config: {embedder.config if hasattr(embedder, 'config') else 'N/A'}")
```

### Issue: Still see 406 errors

**Cause**: Something else is probing /mcp with GET (not OneAgent)  
**Debug**: Check if browser tab open, curl script running, or health monitor  
**Workaround**: These are cosmetic - MCP protocol uses POST and works fine

### Issue: Memory probe still fails

**Cause**: Rebuild didn't pick up changes OR wrong URL  
**Debug**: Check built file `dist/coreagent/OneAgentEngine.js` for `/health/ready`  
**Fix**: Run `npm run build` again, confirm no errors

## 📊 Quality Check

After restart, run full verification:

```powershell
# Should pass all checks
npm run verify
```

## 📝 Documentation

See complete fix documentation:

- `docs/reports/MEMORY_BACKEND_COSMETIC_FIXES_2025-10-04.md`

---

**Ready to restart? Follow Steps 1-4 above!** 🚀
