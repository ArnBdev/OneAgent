# OneAgent MCP Connection Troubleshooting

## Current Status
- ✅ OneAgent MCP Server is running on port 8082
- ✅ MCP protocol implementation is working correctly
- ✅ All 10 tools are available and responding
- ⚠️ Cline showing yellow dot (connection issue)

## Troubleshooting Steps

### 1. Restart Cline
Try restarting VSCode or the Cline extension to refresh the MCP connection.

### 2. Check Server Logs
The OneAgent server should show connection attempts from Cline in the terminal logs.

### 3. Verify Configuration
Cline MCP settings file: `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`

```json
{
  "mcpServers": {
    "OneAgent": {
      "url": "http://localhost:8082/mcp",
      "disabled": false,
      "autoApprove": [],
      "headers": {
        "Content-Type": "application/json",
        "User-Agent": "cline-mcp-client"
      }
    }
  }
}
```

### 4. Manual Connection Test
Run this to verify the connection works:
```bash
node test_mcp_connection.js
```

### 5. Check Firewall/Antivirus
Ensure Windows Firewall or antivirus software isn't blocking the connection.

### 6. Alternative Configurations
Try these alternative configurations if the current one doesn't work:

**Option A: Without custom headers**
```json
{
  "mcpServers": {
    "OneAgent": {
      "url": "http://localhost:8082/mcp",
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

**Option B: Using 127.0.0.1 instead of localhost**
```json
{
  "mcpServers": {
    "OneAgent": {
      "url": "http://127.0.0.1:8082/mcp",
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

### 7. Verify Tools Are Working
Once connected, you should see these 10 tools:
- memory_search
- memory_create
- web_search
- ai_chat
- ai_summarize
- ai_analyze
- embedding_generate
- similarity_search
- workflow_help
- system_status

## Server Endpoints
- **MCP Endpoint**: http://localhost:8082/mcp
- **Health Check**: http://localhost:8082/api/health
- **Chat API**: http://localhost:8082/api/chat

## Common Issues
1. **Port Conflict**: Make sure no other service is using port 8082
2. **IPv6/IPv4 Issues**: Try using 127.0.0.1 instead of localhost
3. **Caching**: Restart VSCode to clear any cached configurations
4. **Permissions**: Ensure the Cline extension has network permissions

## Success Indicators
- Green dot next to "OneAgent" in Cline MCP settings
- 10 tools visible in Cline's tool list
- Server logs showing successful MCP connections
