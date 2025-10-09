# OneAgent Chat Interface - Getting Started Guide

**Version**: v4.7.0  
**Date**: October 9, 2025  
**Feature**: Epic 21 - Chat Interface Implementation

---

## 🎯 Overview

OneAgent now includes a **fully functional chat interface** that allows you to interact directly with OneAgent's Constitutional AI system. The interface provides:

- ✅ **Real-time chat** with Constitutional AI validation
- ✅ **Split-screen layout** (Chat + Mission Control)
- ✅ **Memory-driven context** (conversations persist)
- ✅ **Quality scoring** with Constitutional AI badges
- ✅ **WebSocket live updates** (thinking states, health monitoring)
- ✅ **REST API fallback** (works without WebSocket)

---

## 🚀 Quick Start (3 Steps)

### Step 1: Start the Backend Server

```powershell
# From project root
npm run server:unified
```

**Expected Output**:

```
✅ OneAgent Unified MCP Server ready
🌐 HTTP Server: http://127.0.0.1:8083
📡 WebSocket: ws://127.0.0.1:8083/ws/mission-control
💬 Chat API: http://127.0.0.1:8083/api/chat
```

### Step 2: Start the UI Development Server

```powershell
# In a new terminal
npm run dev
```

**Expected Output**:

```
VITE v5.x.x ready in xxx ms

➜ Local:   http://localhost:3000/
➜ Network: use --host to expose
```

### Step 3: Open Your Browser

Navigate to: **http://localhost:3000**

You should see:

- **Left side**: Chat interface with input field
- **Right side**: Mission Control panel with system metrics

---

## 💬 Using the Chat Interface

### Sending Your First Message

1. Type a message in the input field at the bottom
2. Click "Send" or press **Enter**
3. Watch for:
   - Your message appears immediately (blue bubble)
   - Agent response appears after processing (gray bubble)
   - Constitutional AI quality badge (if applicable)

### Example Questions to Try

#### **General Queries**

```
"What is OneAgent?"
"Explain Constitutional AI principles"
"What can you help me with?"
```

#### **Technical Questions**

```
"How does memory persistence work?"
"What is the BMAD framework?"
"Show me available agents"
```

#### **System Status**

```
"What is the system health?"
"Show me current metrics"
"Are all agents operational?"
```

---

## 🎨 Interface Features

### Chat Panel (Left Side)

**Header**:

- Title: "OneAgent Chat"
- Subtitle: "Constitutional AI • Memory-Driven • Quality-First"
- Live status indicator: ● Live / ◐ Connecting / ○ Offline

**Message Display**:

- **User messages**: Blue bubbles on the right
- **Agent responses**: Gray bubbles on the left
- **System messages**: Yellow bubbles (errors/warnings)
- **Metadata tags**: Agent type, quality score, Constitutional AI compliance

**Thinking Indicator**:

- Appears when agent is processing (WebSocket-driven)
- Shows animated dots + thinking text
- Optional progress bar for long operations

**Input Area**:

- Text input field with placeholder
- "Send" button (disabled when loading)
- Status footer: "Press Enter to send • WebSocket: Connected"

### Mission Control Panel (Right Side)

**Real-time Metrics**:

- System health status
- Active agent count
- WebSocket connection status
- Recent events and notifications

**Live Updates**:

- Health deltas (CPU, memory, agent status)
- Mission progress notifications
- Error/warning alerts

---

## 🔧 Architecture Overview

### Event Separation (Gemini's Correct Design)

**REST API** (Synchronous - Final Responses Only):

- `POST /api/chat` → Send message, get final response
- `GET /api/chat/history/:userId` → Retrieve chat history
- `DELETE /api/chat/history/:userId` → Clear chat history

**WebSocket** (Asynchronous - Intermediate States Only):

- `agent:thinking` → Agent processing thought
- `agent:done` → Agent finished processing
- `health:update` → System health change
- `mission:progress` → Mission step update

**No Duplication**: REST returns final answer, WebSocket shows intermediate states. They never overlap!

### Technology Stack

**Frontend**:

- React 18 + TypeScript
- Vite (dev server on port 3000)
- Tailwind CSS (styling)
- **shadcn/ui** (professional component library - Card, Button, Input, Badge, ScrollArea, Avatar)
- WebSocket API (real-time updates)
- Fetch API (REST communication)

**Backend**:

- Express.js (HTTP server on port 8083)
- WebSocket (ws library)
- ChatAPI (Constitutional AI integration)
- OneAgentMemory (canonical memory system)
- UnifiedBackboneService (time, ID, metadata)

---

## 🧪 Testing Your Setup

### Manual Test Flow

1. **Open browser**: http://localhost:3000
2. **Check status indicators**:
   - Header: "System Operational" (green dot)
   - Chat panel: "● Live" (green badge)
   - Mission Control: WebSocket status "open"
3. **Send test message**: "Hello OneAgent!"
4. **Verify response**:
   - Response appears in gray bubble
   - No duplicate messages
   - Metadata shows agent type
5. **Check Mission Control**:
   - Should show recent activity
   - WebSocket metrics update in real-time

### Expected Behavior

✅ **User message** → Appears immediately (optimistic UI)  
✅ **Thinking indicator** → Shows "Thinking..." (WebSocket event)  
✅ **Agent response** → Appears after processing (REST response)  
✅ **No duplicates** → Each response appears exactly once  
✅ **Metadata** → Quality score, agent type, Constitutional AI badge  
✅ **History** → Messages persist across page refreshes

---

## ⚠️ Troubleshooting

### Issue: "WebSocket: Disconnected"

**Symptoms**: Red "○ Offline" badge in chat header

**Solutions**:

1. Verify backend is running: `npm run server:unified`
2. Check backend logs for WebSocket errors
3. Ensure port 8083 is not blocked by firewall
4. Try manual connection test:
   ```powershell
   curl http://localhost:8083/health
   ```

### Issue: "Error: Failed to fetch"

**Symptoms**: Yellow error message in chat

**Solutions**:

1. Confirm backend is running on port 8083
2. Check browser console for CORS errors
3. Verify backend health endpoint:
   ```powershell
   curl http://localhost:8083/info
   ```
4. Check backend logs for errors

### Issue: Duplicate Messages

**Symptoms**: Agent response appears twice

**Solutions**:

1. **This should NOT happen** (architecture prevents it!)
2. If it does occur, report as a bug with:
   - Browser console logs
   - Backend server logs
   - Network tab (DevTools) showing requests

### Issue: No Response After Sending Message

**Symptoms**: User message appears, but no agent response

**Solutions**:

1. Check backend logs for errors
2. Verify ChatAPI is initialized:
   ```
   [INIT] 💬 Initializing ChatAPI...
   [INIT] ✅ ChatAPI initialized
   ```
3. Test REST endpoint directly:
   ```powershell
   curl -X POST http://localhost:8083/api/chat `
     -H "Content-Type: application/json" `
     -d '{"message":"test","userId":"debug-user"}'
   ```

### Issue: UI Won't Start (Port 3000 Conflict)

**Symptoms**: "Port 3000 is already in use"

**Solutions**:

1. Kill process using port 3000:
   ```powershell
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```
2. Or use different port:
   ```powershell
   $env:COREAGENT_PORT=3001
   npm run dev
   ```

---

## 📊 System Requirements

### Minimum Requirements

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **RAM**: 4GB available
- **Browser**: Chrome 90+, Firefox 88+, Edge 90+, Safari 14+
- **Ports**: 3000 (UI), 8083 (Backend)

### Recommended Configuration

- **Node.js**: v20.x LTS
- **RAM**: 8GB+ available
- **Browser**: Latest Chrome or Edge (best WebSocket support)
- **Network**: Localhost (no external dependencies)

---

## 🎓 Advanced Usage

### Chat History Retrieval

```powershell
# Get last 50 messages for a user
curl http://localhost:8083/api/chat/history/default-user?limit=50
```

### Clear Chat History

```powershell
# Delete all messages for a user
curl -X DELETE http://localhost:8083/api/chat/history/default-user
```

### Custom User ID

Modify `ChatInterface.tsx` line 28:

```typescript
const userId = useRef('your-custom-user-id').current;
```

### WebSocket Event Monitoring

Open browser DevTools → Network → WS → Select connection → Messages tab

Watch for:

- `{"type":"agent:thinking","payload":{...}}`
- `{"type":"health:update","payload":{...}}`
- `{"type":"mission:progress","payload":{...}}`

---

## 🔒 Security & Privacy

### Data Flow

1. **User input** → Browser (HTTPS in production)
2. **REST request** → Backend (localhost:8083)
3. **Memory storage** → OneAgentMemory (persistent)
4. **Response** → Browser (includes metadata)

### Privacy Considerations

- ✅ All data stays on localhost (no external API calls)
- ✅ Memory backend is local SQLite database
- ✅ No telemetry or tracking
- ✅ Constitutional AI validation for content safety
- ⚠️ Chat history persists until manually deleted

### Production Deployment Notes

For production deployment (not covered in this guide):

- Enable HTTPS/TLS for all connections
- Add authentication middleware
- Implement rate limiting
- Configure CORS properly
- Use environment variables for endpoints
- Add input sanitization

---

## 📚 Related Documentation

- **Architecture**: `docs/ONEAGENT_ARCHITECTURE.md`
- **API Reference**: `docs/API_REFERENCE.md`
- **Constitutional AI**: `docs/BMAD_ONEAGENT_INTEGRATION_PLAN.md`
- **Memory System**: `docs/memory-system-architecture.md`
- **Development Setup**: `docs/IDE_SETUP.md`

---

## 🎉 Success Checklist

After following this guide, you should have:

- ✅ Backend running on port 8083
- ✅ UI running on port 3000
- ✅ Chat interface visible in browser
- ✅ Mission Control showing live metrics
- ✅ Ability to send messages and receive responses
- ✅ WebSocket "● Live" indicator (green)
- ✅ Constitutional AI metadata displayed
- ✅ No duplicate messages or errors

---

**Need Help?**

- Check `AGENTS.md` for development guidelines
- Review `CHANGELOG.md` for recent changes
- Search `docs/` directory for specific topics
- Run `npm run verify` to check system health

**Happy Chatting! 🚀**
