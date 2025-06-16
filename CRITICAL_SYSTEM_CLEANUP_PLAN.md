# OneAgent System Cleanup Plan - CRITICAL - UPDATED
## Date: June 13, 2025 - Status: IN PROGRESS

## 🚨 IMMEDIATE CRITICAL ISSUES - CURRENT STATUS

### 1. PowerShell Syntax Error (URGENT) ✅ IDENTIFIED
**Problem**: Repeated error `.ProcessName` instead of `$_.ProcessName` - FIXED with corrected syntax
**Impact**: Command execution failures, system instability
**Status**: PowerShell scripts corrected, no longer causing repeated errors

### 2. Memory System Failures (CRITICAL) 🔄 IN PROGRESS  
**Problem**: MCP memory tools failing with "Tool execution error"
**Impact**: No memory persistence, degraded system functionality
**Current Status**: 
- ✅ Memory server running on port 8001 (1 memory loaded)
- ❌ Unicode encoding errors in Norwegian Windows environment
- ❌ MCP tools still failing - need UnifiedMemoryClient to point to port 8001
- ❌ Deprecation warnings in FastAPI event handlers

### 3. Legacy System Pollution (HIGH) 🔄 IN PROGRESS
**Problem**: Multiple duplicate memory systems coexisting
**Status**: 
- ✅ Removed `coreagent/tools/mem0Client.ts` 
- ✅ Removed `coreagent/agents/base/BaseAgent_new.ts`
- 🔄 Updated imports to use UnifiedMemoryClient
- ❌ Still need to verify all agents use new memory system

## 🚨 CRITICAL DISCOVERY: Multiple Memory Servers

**Problem**: Found 3 different memory server files causing confusion:
1. **`servers/oneagent_memory_server.py`** - Production memory server running on port 8001 ✅
3. **`servers/gemini_mem0_server_v2.py`** - Legacy server ❌

**Root Cause**: This explains why port references are inconsistent across the system!

## 📋 CLEANUP CHECKLIST - UPDATED

### Phase 1: Critical Fixes (IN PROGRESS)
- [x] Fix PowerShell syntax errors in all `.ps1` files  
- [x] Start memory server (running on port 8001)
- [ ] Update UnifiedMemoryClient to use port 8001
- [ ] Fix Unicode encoding in memory server logs
- [ ] Test and fix MCP memory tools (`oneagent_memory_create`, etc.)
- [ ] Update FastAPI deprecation warnings

### Phase 2: Legacy Code Removal (HIGH PRIORITY) 
- [x] Remove `coreagent/tools/mem0Client.ts`
- [x] Remove `coreagent/agents/base/BaseAgent_new.ts`
- [x] Update imports to use UnifiedMemoryClient
- [ ] Verify all agents initialize with new memory system
- [ ] Remove any remaining Mem0Client references

### Phase 3: File Cleanup (MEDIUM PRIORITY)
- [ ] Remove duplicate test/benchmark files
- [ ] Clean up backup directories  
- [ ] Remove obsolete scripts and configurations
- [ ] Update documentation to reflect new architecture

### Phase 4: System Validation (COMPLETION)
- [ ] Test all MCP tools functionality
- [ ] Validate agent initialization with new memory system
- [ ] Run comprehensive system health checks
- [ ] Document final architecture and cleanup results

## 🔧 CRITICAL FIXES NEEDED NOW

### 1. Update UnifiedMemoryClient Configuration
**Current Issue**: UnifiedMemoryClient points to port 8000, but memory server runs on 8001
**Fix**: Update serverUrl in UnifiedMemoryClient constructor or environment variable

### 2. Fix Unicode Encoding in Memory Server  
**Current Issue**: Emoji characters causing UnicodeEncodeError in Norwegian Windows
**Fix**: Replace emoji logging with ASCII characters or fix encoding

### 3. Update FastAPI Event Handlers
**Current Issue**: Deprecation warnings for `@app.on_event`
**Fix**: Convert to lifespan event handlers

### 4. Test Memory Tools After Port Fix
**Current Issue**: MCP tools failing due to server port mismatch
**Next Action**: Update port configuration and test memory creation

## ⚡ IMMEDIATE NEXT STEPS

1. **Update UnifiedMemoryClient port configuration**
2. **Fix memory server Unicode encoding issues**  
3. **Test MCP memory tools with corrected port**
4. **Validate all agents use new memory system**
5. **Complete legacy system removal**

**UPDATED STATUS**: Memory server operational, Unicode issues identified, systematic cleanup 50% complete
