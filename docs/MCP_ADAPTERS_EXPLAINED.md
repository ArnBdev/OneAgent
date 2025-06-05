# MCP Adapters Explained: Local vs HTTP

## 🤖 What is MCP (Model Context Protocol)?

**MCP (Model Context Protocol)** is a standardized protocol for AI agents to communicate with external tools, services, and data sources. It provides a consistent interface for:

- 🔧 **Tool Integration** - Connecting to external APIs and services
- 💾 **Data Access** - Reading from databases, files, or web services
- 🤝 **Service Communication** - Standardized request/response format
- 🔌 **Plugin Architecture** - Extensible tool ecosystem

## 🏠 Local MCP Adapter

### What it does:
- **Internal Communication** - Handles communication within the same process/machine
- **Direct Function Calls** - No network overhead
- **Mock/Testing** - Perfect for development and testing
- **Embedded Tools** - Built-in functionality

### Example Use Cases:
```typescript
// File system operations
await localAdapter.sendRequest('fs.readFile', { path: '/data/config.json' });

// Database queries
await localAdapter.sendRequest('db.query', { sql: 'SELECT * FROM users' });

// Internal calculations
await localAdapter.sendRequest('math.calculate', { expression: '2+2' });
```

### Architecture:
```
OneAgent CoreAgent
       ↓
Local MCP Adapter
       ↓
Built-in Tools (same process)
```

## 🌐 HTTP MCP Adapter

### What it does:
- **External Communication** - Connects to remote MCP servers over HTTP
- **Microservices Integration** - Communicate with distributed services
- **Third-party Tools** - Access external APIs and platforms
- **Scalable Architecture** - Distribute processing across multiple servers

### Example Use Cases:
```typescript
// Remote AI service
await httpAdapter.sendRequest('ai.analyze', { 
  text: 'Analyze this document',
  endpoint: 'https://ai-service.company.com/mcp' 
});

// External database
await httpAdapter.sendRequest('database.query', {
  query: 'SELECT * FROM customers',
  endpoint: 'https://db-api.company.com/mcp'
});

// Third-party API
await httpAdapter.sendRequest('weather.get', {
  location: 'Oslo',
  endpoint: 'https://weather-service.com/mcp'
});
```

### Architecture:
```
OneAgent CoreAgent
       ↓
HTTP MCP Adapter
       ↓
Network (HTTP/HTTPS)
       ↓
Remote MCP Server
       ↓
External Tools/Services
```

## 🔄 Why Both Types Matter

### Local Adapter Benefits:
- ⚡ **Fast** - No network latency
- 🔒 **Secure** - No data leaves the system
- 🧪 **Testable** - Easy to mock and test
- 💰 **Cost-effective** - No external service costs

### HTTP Adapter Benefits:
- 🌍 **Scalable** - Distribute across multiple servers
- 🔌 **Extensible** - Easy to add new external services
- 🏢 **Enterprise** - Integrate with existing company systems
- 🔄 **Updatable** - External services can be updated independently

## 🚀 OneAgent Implementation

### Current Status (Step 2.4 ✅):
```typescript
// Both adapters are now implemented
const localAdapter = createMCPAdapter({
  name: 'CoreAgent Local',
  type: 'local'
});

const httpAdapter = createMCPAdapter({
  name: 'External Service',
  type: 'http',
  endpoint: 'https://api.example.com/mcp'
});
```

### Request Format:
```typescript
interface MCPRequest {
  id: string;           // Unique request identifier
  method: string;       // Method to call (e.g., 'ping', 'search.web')
  params?: object;      // Parameters for the method
  timestamp: string;    // When request was made
}
```

### Response Format:
```typescript
interface MCPResponse {
  id: string;           // Matches request ID
  result?: any;         // Success result
  error?: {             // Error information
    code: number;
    message: string;
    data?: any;
  };
  timestamp: string;    // When response was sent
}
```

## 🎯 Real-World Example

### Scenario: Web Search with External Service

```typescript
// 1. OneAgent receives user request
const userQuery = "What's the weather in Oslo?";

// 2. CoreAgent uses HTTP MCP adapter
const httpAdapter = createMCPAdapter({
  name: 'Weather Service',
  type: 'http',
  endpoint: 'https://weather-api.company.com/mcp'
});

// 3. Send request to external weather service
const response = await httpAdapter.sendRequest('weather.current', {
  location: 'Oslo',
  units: 'metric'
});

// 4. Process response
if (response.result) {
  console.log(`Temperature in Oslo: ${response.result.temperature}°C`);
} else {
  console.error('Weather service error:', response.error);
}
```

## 🔧 Configuration Examples

### Local Adapter:
```typescript
const localConfig: MCPServerConfig = {
  name: 'CoreAgent Local Tools',
  type: 'local'
};
```

### HTTP Adapter:
```typescript
const httpConfig: MCPServerConfig = {
  name: 'Company API Gateway',
  type: 'http',
  endpoint: 'https://api.company.com/mcp',
  port: 443  // Optional, inferred from URL
};
```

## 🏁 Summary

The **HTTP MCP Adapter** (Step 2.4) enables OneAgent to:

1. **Connect to External Services** - Integrate with any HTTP-based MCP server
2. **Scale Beyond Local Machine** - Distribute processing across multiple systems
3. **Access Third-party APIs** - Connect to external platforms and services
4. **Enable Microservices** - Support distributed architecture patterns

This completes the foundation for OneAgent to work in enterprise environments where tools and services are distributed across multiple systems and platforms.
