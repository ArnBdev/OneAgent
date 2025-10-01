# OneAgent v4.3.0 - Startup Troubleshooting Guide

> Created: October 1, 2025  
> For: Windows PowerShell Environment

## Common Issues & Solutions

### Issue #1: Memory Server Window Closes Immediately ❌

**Symptoms**:
- Memory server terminal window opens and closes instantly
- Error in logs: `[WinError 32] Prosessen får ikke tilgang til filen` (File locked)
- Startup script reports: "Memory server TIMEOUT"

**Root Cause**:
Qdrant vector database file is locked by a previous Python process that didn't shut down cleanly.

**Solution**:
```powershell
# Stop all OneAgent servers
.\scripts\stop-oneagent-system.ps1 -Force

# Or manually:
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Clean up locked database
Remove-Item "/tmp/qdrant" -Recurse -Force -ErrorAction SilentlyContinue

# Restart servers
.\scripts\start-oneagent-system.ps1
```

**Prevention**:
Always use `stop-oneagent-system.ps1` instead of closing terminal windows directly.

---

### Issue #2: MCP Server Health Check Timeout ⚠️

**Symptoms**:
- MCP server terminal shows successful tool registrations
- But startup script reports: "MCP server TIMEOUT"
- Health check fails within 60 seconds

**Root Cause**:
MCP server takes 2-4 seconds to fully initialize (tool registration), but health endpoint only becomes available AFTER all tools are registered.

**Solution**:
This is expected behavior. The MCP server IS running correctly. The health check timeout is just informational - the memory server will still start.

**Verification**:
Check the MCP server terminal window - if you see this, it's working:
```
🌟 OneAgent Unified MCP Server Started Successfully!
📡 Server Information:
   • HTTP MCP Endpoint: http://127.0.0.1:8083/mcp
```

**Prevention**:
Future versions will increase the health check timeout or start health checks earlier.

---

### Issue #3: Health Monitoring Skipped (INTENTIONAL) ✅

**Symptoms**:
- Log message: `🏥 HealthMonitoringService instantiation skipped (auto monitoring disabled)`

**Root Cause**:
Environment variable `ONEAGENT_DISABLE_AUTO_MONITORING=1` is set (from previous test runs or development).

**Impact**:
- **LOW** - Health monitoring still works on-demand via `/health` endpoint
- Background monitoring timers are disabled for faster startup
- This is CORRECT behavior for development/testing

**Solution**:
No action needed. This is intentional for faster startup.

**To Enable Background Monitoring**:
```powershell
# Remove or set to 0
Remove-Item Env:ONEAGENT_DISABLE_AUTO_MONITORING -ErrorAction SilentlyContinue
# OR
$env:ONEAGENT_DISABLE_AUTO_MONITORING = "0"

# Then restart
.\scripts\start-oneagent-system.ps1
```

---

### Issue #4: Port Already in Use

**Symptoms**:
- Error: `EADDRINUSE` or `Address already in use`
- MCP port 8083 or Memory port 8010 is occupied

**Solution**:
```powershell
# Find what's using the ports
Get-NetTCPConnection -LocalPort 8083,8010 -ErrorAction SilentlyContinue | 
  Select-Object LocalPort, OwningProcess | 
  ForEach-Object { 
    $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
    [PSCustomObject]@{
      Port = $_.LocalPort
      PID = $_.OwningProcess
      ProcessName = $proc.ProcessName
    }
  }

# Stop OneAgent servers
.\scripts\stop-oneagent-system.ps1 -Force

# Restart
.\scripts\start-oneagent-system.ps1
```

---

### Issue #5: Missing Python Dependencies

**Symptoms**:
- Memory server crashes with `ModuleNotFoundError`
- Missing `mem0ai`, `fastmcp`, `chromadb`, etc.

**Solution**:
```powershell
# Activate virtual environment (if using one)
.\venv\Scripts\Activate.ps1

# Reinstall dependencies
pip install -r servers/requirements.txt

# Verify installation
pip list | Select-String "mem0|fastmcp|chromadb|google-genai"

# Should show:
# - mem0ai 0.1.118
# - fastmcp 2.12.4
# - chromadb 1.1.0
# - google-genai 1.39.1
```

---

### Issue #6: `Wait-HttpReady` Not Recognized (PowerShell)

**Symptoms**:
- Error: `The term 'Wait-HttpReady' is not recognized`
- Startup script fails at line 59

**Root Cause**:
Old version of `start-oneagent-system.ps1` with function declaration order bug.

**Solution**:
```powershell
# Pull latest changes
git pull origin main

# Verify version
Get-Content scripts/start-oneagent-system.ps1 | Select-String "v4.3.0"

# Should show: # OneAgent System Startup Script (v4.3.0)
```

---

## Diagnostic Commands

### Check System Status
```powershell
# Check running processes
Get-Process python,node -ErrorAction SilentlyContinue | 
  Select-Object Id, ProcessName, StartTime | 
  Format-Table -AutoSize

# Check ports
Get-NetTCPConnection -LocalPort 8083,8010 -ErrorAction SilentlyContinue |
  Select-Object LocalPort, State, OwningProcess

# Check environment variables
Write-Host "MEM0_API_KEY: $(if ($env:MEM0_API_KEY) { 'SET' } else { 'NOT SET' })"
Write-Host "GOOGLE_API_KEY: $(if ($env:GOOGLE_API_KEY) { 'SET' } else { 'NOT SET' })"
Write-Host "AUTO_MONITORING: $(if ($env:ONEAGENT_DISABLE_AUTO_MONITORING) { 'DISABLED' } else { 'ENABLED' })"
```

### Test Server Connectivity
```powershell
# Test MCP server
Invoke-WebRequest -Uri "http://127.0.0.1:8083/health" -UseBasicParsing

# Test Memory server
Invoke-WebRequest -Uri "http://127.0.0.1:8010/health" -UseBasicParsing
```

### View Server Logs
```powershell
# MCP server logs (in its terminal window)
# Look for: "🌟 OneAgent Unified MCP Server Started Successfully!"

# Memory server logs (in its terminal window)
# Look for: "INFO:     Uvicorn running on http://0.0.0.0:8010"
```

---

## Clean Restart Procedure

**Full system restart with cleanup:**

```powershell
# 1. Stop everything
.\scripts\stop-oneagent-system.ps1 -Force

# 2. Wait for processes to fully stop
Start-Sleep -Seconds 3

# 3. Clean up temp files (optional but recommended)
Remove-Item "/tmp/qdrant" -Recurse -Force -ErrorAction SilentlyContinue

# 4. Verify no processes running
Get-Process python,node -ErrorAction SilentlyContinue

# 5. Start fresh
.\scripts\start-oneagent-system.ps1
```

---

## Known Limitations

### Windows-Specific Issues

1. **Terminal Window Management**: PowerShell `Start-Process` creates separate windows that must be manually closed.
   - **Solution**: Use `stop-oneagent-system.ps1` for clean shutdown

2. **File Locking**: Windows holds file locks longer than Linux/Mac.
   - **Solution**: Always wait 2-3 seconds after stopping processes before restart

3. **Port Release Delay**: Windows may take a few seconds to release ports after process termination.
   - **Solution**: Add `Start-Sleep -Seconds 3` between stop and start

### FastMCP Warnings (NON-CRITICAL)

```
DeprecationWarning: websockets.legacy is deprecated
DeprecationWarning: websockets.server.WebSocketServerProtocol is deprecated
```

**Impact**: None - these are warnings from the `websockets` library that FastMCP uses. They don't affect functionality.

**Status**: Will be fixed when FastMCP updates to newer websockets library.

---

## Quick Reference

### Startup (Normal)
```powershell
.\scripts\start-oneagent-system.ps1
```

### Shutdown (Clean)
```powershell
.\scripts\stop-oneagent-system.ps1
```

### Shutdown (Force)
```powershell
.\scripts\stop-oneagent-system.ps1 -Force
```

### Clean Restart
```powershell
.\scripts\stop-oneagent-system.ps1 -Force
Start-Sleep -Seconds 3
.\scripts\start-oneagent-system.ps1
```

### Emergency Kill All
```powershell
Get-Process python,node -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item "/tmp/qdrant" -Recurse -Force -ErrorAction SilentlyContinue
```

---

## Getting Help

### Check Documentation
- **Release Notes**: `docs/v4.3.0-RELEASE-NOTES.md`
- **Startup Analysis**: `docs/STARTUP_ANALYSIS_v4.3.0.md`
- **Architecture**: `docs/ONEAGENT_ARCHITECTURE.md`
- **Migration Guide**: `docs/GOOGLE_GENAI_MIGRATION_OCT2025.md`

### Debug Mode
```powershell
# Enable verbose logging
$env:ONEAGENT_LOG_LEVEL = "DEBUG"

# Then start servers
.\scripts\start-oneagent-system.ps1
```

### Report Issues
When reporting issues, include:
1. Output of `.\scripts\start-oneagent-system.ps1`
2. Contents of MCP server terminal window
3. Contents of memory server terminal window
4. Output of `Get-Process python,node`
5. Output of `python --version` and `node --version`

---

## Success Indicators

### Healthy Startup Looks Like:

**Startup Script Output:**
```
===============================
 ✅ SYSTEM READY
===============================
MCP Server:    http://127.0.0.1:8083
Memory Server: http://127.0.0.1:8010
```

**MCP Server Terminal:**
```
🌟 OneAgent Unified MCP Server Started Successfully!
📡 Server Information:
   • HTTP MCP Endpoint: http://127.0.0.1:8083/mcp
   • Health Check: http://127.0.0.1:8083/health
🎪 Ready for VS Code Copilot Chat! 🎪
```

**Memory Server Terminal:**
```
INFO:     Started server process [XXXXX]
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8010 (Press CTRL+C to quit)
```

---

**Document Version**: 1.0  
**OneAgent Version**: 4.3.0  
**Last Updated**: October 1, 2025
