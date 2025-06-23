# OneAgent Scripts Directory

This directory contains operational and utility scripts for OneAgent system management.

## ⚡ Quick Start

```powershell
# Quick start (recommended) - from project root
.\start.ps1

# Or use the full system script
.\scripts\start-oneagent-system.ps1
```

## 🚀 System Management Scripts (Added June 2025)

### Primary System Control
- **`start-oneagent-system.ps1`** - Complete system startup (Memory + MCP servers)
- **`start-oneagent-system.bat`** - Batch wrapper for Windows users
- **`stop-oneagent-system.ps1`** - Graceful system shutdown
- **`status-oneagent-system.ps1`** - System status monitoring

### Individual Service Control
- **`start-memory-server.ps1`** - Memory server only
- **`start-mcp-server.ps1`** - MCP server only (renamed from start-mcp-copilot.ps1)
- **`start-mcp-server.bat`** - Batch version of MCP server startup
- **`restart-mcp-server.ps1`** - MCP server restart (renamed from restart-optimized-server.ps1)

## 📖 Usage Examples

### Start Complete System
```powershell
# Start everything (recommended)
.\scripts\start-oneagent-system.ps1

# Start with specific options
.\scripts\start-oneagent-system.ps1 -SkipDependencies
.\scripts\start-oneagent-system.ps1 -MemoryOnly
.\scripts\start-oneagent-system.ps1 -MCPOnly
```

### Monitor System
```powershell
# Check status once
.\scripts\status-oneagent-system.ps1

# Continuous monitoring
.\scripts\status-oneagent-system.ps1 -Watch

# Detailed diagnostics
.\scripts\status-oneagent-system.ps1 -Detailed
```

### Stop System
```powershell
# Graceful shutdown
.\scripts\stop-oneagent-system.ps1

# Force stop
.\scripts\stop-oneagent-system.ps1 -Force
```

### Individual Services
```powershell
# Memory server only
.\scripts\start-memory-server.ps1

# Custom port
.\scripts\start-memory-server.ps1 -Port 8002

# MCP server only
.\scripts\start-mcp-server.ps1
```

## 🔧 System Architecture

The OneAgent system consists of two main components:

1. **Memory Server** (Port 8001)
   - Python FastAPI server
   - ChromaDB vector storage
   - Google Gemini embeddings
   - RESTful API for memory operations

2. **MCP Server** (Port 8083)
   - TypeScript/Node.js server
   - GitHub Copilot integration
   - Tool orchestration
   - Constitutional AI validation

## 🔒 Security Note

Scripts in this directory should:
- ✅ Never contain hardcoded API keys or secrets
- ✅ Use environment variables for sensitive data
- ✅ Be safe to commit to version control
- ✅ Handle errors gracefully
- ✅ Provide clear feedback to users
