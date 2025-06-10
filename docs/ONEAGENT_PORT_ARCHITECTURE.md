# 🚀 OneAgent Port Architecture - DEFINITIVE CONFIGURATION

**Date**: June 10, 2025  
**Status**: OFFICIAL - Do not change these port assignments  
**Purpose**: Prevent configuration drift and establish stable server architecture

---

## 📋 **OFFICIAL PORT ASSIGNMENTS**

| Service | Port | Purpose | Server File | Status |
|---------|------|---------|-------------|--------|
| **OneAgent MCP Server** | **8080** | Chat API, MCP Protocol | `coreagent/server/index-simple-mcp.ts` | ✅ STABLE |
| **OneAgent Main Server** | **8081** | System Status, WebSocket, Performance API | `coreagent/server/index.ts` | ✅ STABLE |
| **OneAgent UI (Dev)** | **3001** | React Development Server (Vite) | `ui/` via `npm run dev` | ✅ STABLE |

---

## 🔧 **SERVER STARTUP SEQUENCE**

### **CRITICAL: Always start servers in this exact order:**

1. **First: MCP Server (Port 8080)**
   ```powershell
   cd c:\Users\arne\.cline\mcps\OneAgent
   npx tsx coreagent/server/index-simple-mcp.ts
   ```

2. **Second: Main Server (Port 8081)**
   ```powershell
   cd c:\Users\arne\.cline\mcps\OneAgent
   $env:PORT=8081
   npx tsx coreagent/server/index.ts
   ```

3. **Third: UI Development Server (Port 3001)**
   ```powershell
   cd c:\Users\arne\.cline\mcps\OneAgent\ui
   npm run dev
   ```

---

## 🧠 **SERVICE RESPONSIBILITIES**

### **MCP Server (Port 8080)**
- **Chat API**: `/api/chat` - Main chat functionality
- **Health Check**: `/api/health` - MCP server status
- **MCP Endpoint**: `/mcp` - Model Context Protocol
- **Memory Management**: Mem0 integration for chat context

### **Main Server (Port 8081)**
- **System Status**: `/api/system/status` - Overall system health
- **Performance Metrics**: `/api/performance/metrics` - Performance data
- **Memory Analytics**: `/api/memories/analytics` - Memory insights
- **WebSocket**: Real-time updates for UI dashboard
- **Configuration**: `/api/config` - System configuration

### **UI Development Server (Port 3001)**
- **React Application**: Modern TypeScript frontend
- **Vite Development**: Hot reload and fast development
- **shadcn/ui Components**: Professional UI component library
- **API Integration**: Connects to both 8080 (chat) and 8081 (system)

---

## 🔌 **CONNECTION ARCHITECTURE**

```
OneAgent UI (3001)
├── Chat Functions → MCP Server (8080)
│   ├── /api/chat
│   ├── /api/chat/history
│   └── /api/health
└── System Functions → Main Server (8081)
    ├── /api/system/status
    ├── /api/performance/metrics
    ├── /api/memories/analytics
    └── WebSocket connection
```

---

## ⚠️ **CRITICAL RULES**

### **DO NOT CHANGE THESE PORTS**
- **8080**: Always MCP Server - Chat functionality
- **8081**: Always Main Server - System status and WebSocket
- **3001**: Always UI Development Server

### **STARTUP TROUBLESHOOTING**
1. **Port Already in Use**: Kill the specific process, don't change ports
2. **Connection Failed**: Check if required server is actually running
3. **API Errors**: Verify correct server is running on expected port

### **KILL PROCESSES COMMANDS**
```powershell
# Find process on specific port
netstat -ano | findstr ":8080"
netstat -ano | findstr ":8081"

# Kill by PID (replace XXXX with actual PID)
Stop-Process -Id XXXX -Force
```

---

## 🎯 **CURRENT UI API SERVICE CONFIGURATION**

The UI uses `oneAgentAPI.ts` service with these endpoints:

```typescript
// Chat API - MCP Server (Port 8080)
private chatBaseUrl = 'http://localhost:8080'

// System API - Main Server (Port 8081)  
private systemBaseUrl = 'http://localhost:8081'

// WebSocket - Main Server (Port 8081)
private ws = new WebSocket('ws://localhost:8081')
```

---

## 📊 **VERIFICATION CHECKLIST**

Before reporting "connection issues", verify:

- [ ] MCP Server running on 8080: `curl http://localhost:8080/api/health`
- [ ] Main Server running on 8081: `curl http://localhost:8081/api/system/status`  
- [ ] UI Server running on 3001: Browser to `http://localhost:3001`
- [ ] No port conflicts: `netstat -an | findstr "808"`

---

## 🚫 **FORBIDDEN ACTIONS**

- ❌ Do not change port numbers in configuration files
- ❌ Do not start multiple servers on same port
- ❌ Do not modify `oneAgentAPI.ts` port configuration
- ❌ Do not use random available ports - stick to the architecture

---

## ✅ **IMPLEMENTATION STATUS**

- **Port Assignment**: ✅ DOCUMENTED
- **Startup Sequence**: ✅ DOCUMENTED  
- **Connection Architecture**: ✅ DOCUMENTED
- **API Service**: ✅ IMPLEMENTED
- **Troubleshooting**: ✅ DOCUMENTED

**Next Step**: Follow startup sequence exactly and verify all three services are running before testing UI functionality.
