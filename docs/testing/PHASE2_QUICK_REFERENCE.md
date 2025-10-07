# Phase 2 Quick Testing Reference

## 🚀 Quick Start (PowerShell)

```powershell
# 1. Start memory server (Terminal 1)
npm run memory:server

# 2. Start MCP server (Terminal 2, wait 5 seconds after step 1)
npm run server:unified

# 3. Test health (Terminal 3)
Invoke-RestMethod http://localhost:8010/health  # Memory server
Invoke-RestMethod http://localhost:8083/mcp/sdk-info  # MCP server

# 4. Test backward compatibility (Express endpoint)
$body = @{jsonrpc="2.0";id=1;method="tools/list";params=@{}} | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:8083/mcp -Method POST -ContentType application/json -Body $body
```

## ✅ Success Indicators

### Memory Server (Port 8010)

- ✅ Console shows: `Uvicorn running on http://127.0.0.1:8010`
- ✅ Health check returns: `{"status": "healthy"}`
- ✅ No connection errors in logs

### MCP Server (Port 8083)

- ✅ Console shows: `Hybrid mode active: Express HTTP + SDK stdio`
- ✅ Console shows: `Registering 15+ tools with MCP SDK...`
- ✅ `/mcp/sdk-info` returns: `"transportStatus": "stdio active"`
- ✅ Express `/mcp` endpoint responds with tool list

### VS Code (Stdio Transport)

- ✅ `.vscode/mcp.json` configured correctly
- ✅ Copilot Chat recognizes `oneagent_*` tools
- ✅ Tools execute without errors
- ✅ Results displayed in chat

## 🔍 Quick Diagnostics

```powershell
# Check if ports are in use
Get-NetTCPConnection -LocalPort 8010  # Memory server
Get-NetTCPConnection -LocalPort 8083  # MCP server

# Kill processes if needed
Get-NetTCPConnection -LocalPort 8010 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
Get-NetTCPConnection -LocalPort 8083 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# Verify build
npm run verify  # Should show: 0 errors, 1 warning
```

## 📋 Testing Checklist

- [ ] Memory server starts on port 8010
- [ ] MCP server starts on port 8083 (hybrid mode)
- [ ] Express `/mcp` endpoint works (backward compat)
- [ ] SDK `/mcp/sdk-info` shows stdio active
- [ ] VS Code recognizes tools via stdio
- [ ] Tool execution succeeds (e.g., `oneagent_memory_search`)
- [ ] No errors in server logs
- [ ] Performance <10% regression

## 🚨 Common Issues

| Issue                        | Solution                                                                                     |
| ---------------------------- | -------------------------------------------------------------------------------------------- |
| Port 8010 in use             | Kill process: `Stop-Process -Id (Get-NetTCPConnection -LocalPort 8010).OwningProcess -Force` |
| Port 8083 in use             | Kill process: `Stop-Process -Id (Get-NetTCPConnection -LocalPort 8083).OwningProcess -Force` |
| Memory connection failed     | Start memory server first, wait 5 seconds before starting MCP server                         |
| VS Code tools not recognized | Check `.vscode/mcp.json`, restart VS Code                                                    |
| Tool execution timeout       | Increase timeout in `.env`: `ONEAGENT_MCP_TIMEOUT=30000`                                     |
| SDK not initialized          | Set `.env`: `ONEAGENT_MCP_STDIO=1` (default: enabled)                                        |

## 📖 Full Documentation

- **Testing Guide**: `docs/testing/PHASE2_TESTING_GUIDE.md` (6 detailed scenarios)
- **Migration Plan**: `docs/implementation/PHASE2_MCP_MIGRATION_PLAN.md`
- **Architecture**: `docs/MCP_INTERFACE_STRATEGY.md`

## 🎯 Expected Performance

- Tool listing: <50ms per request
- Memory operations: <300ms per request
- Server startup: <5 seconds
- VS Code tool discovery: <2 seconds

---

**Quick Reference v1.0.0** | Phase 2 Complete | See full guide for details
