# 🚀 QUICK START (2025-07-07)

**Unified startup is required. All legacy and redundant scripts have been deleted.**

| Task                | PowerShell Command                                 | Batch Command                                 |
|---------------------|----------------------------------------------------|-----------------------------------------------|
| Unified Startup     | `./scripts/start-oneagent-system.ps1`              | `./scripts/start-oneagent-system.bat`         |
| MCP Server Only     | `npx tsx coreagent/server/unified-mcp-server.ts`   | `npx tsx coreagent/server/unified-mcp-server.ts`|
| Memory Server Only  | `uvicorn servers.oneagent_memory_server:app --host 127.0.0.1 --port 8010 --reload` | Same as PowerShell |

> **IMPORTANT:**
> - Use ONLY the scripts above for all development and production startup.
> - All legacy and redundant scripts (e.g., `start.ps1`, `start.bat`, `start-unified.ps1`, `start-memory-server.ps1`) have been deleted for safety and clarity.

---

# OneAgent Scripts Directory

This directory contains operational and utility scripts for OneAgent system management.

## 🔧 System Architecture

The OneAgent system consists of two main components:

1. **Memory Server** (Port 8010)
   - Python FastAPI server
2. **MCP Server** (Port 8083)
   - Node.js/TypeScript (TSX)

See the main README for more details.
