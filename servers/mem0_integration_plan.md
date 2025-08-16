# Mem0 Integration Plan for OneAgent

## Strategic Decision: Replace Custom Memory Server with Mem0

### Why Mem0?

1. **Production-Ready**: Battle-tested memory system with all advanced features
2. **Gemini Support**: Native Google Gemini integration already implemented
3. **Feature Complete**: LLM-based fact extraction, conflict resolution, deduplication
4. **Maintained**: Active development, regular updates, community support
5. **Time Efficiency**: Days to integrate vs weeks to debug custom implementation

### Integration Architecture

```typescript
// OneAgent Memory Client (TypeScript)
// File: coreagent/memory/Mem0MemoryClient.ts
export class Mem0MemoryClient implements MemoryClient {
  private mem0Client: Mem0Client;

  constructor(config: Mem0Config) {
    this.mem0Client = new Mem0Client({
      provider: 'gemini',
      apiKey: config.geminiApiKey,
      model: 'gemini-2.5-flash',
      embeddingModel: 'gemini-embedding-exp-03-07',
    });
  }

  async createMemory(content: string, userId: string, metadata?: any): Promise<Memory> {
    return await this.mem0Client.add(content, userId, metadata);
  }

  async searchMemories(query: string, userId: string, limit?: number): Promise<Memory[]> {
    return await this.mem0Client.search(query, userId, { limit });
  }

  async deleteMemory(memoryId: string, userId: string): Promise<boolean> {
    return await this.mem0Client.delete(memoryId, userId);
  }
}
```

### Installation Steps

1. **Install Mem0**:

```bash
npm install mem0ai
# or
pip install mem0ai
```

2. **Configure Gemini Integration**:

```python
# Python configuration
from mem0 import Memory

config = {
    "llm": {
        "provider": "gemini",
        "config": {
            "model": "gemini-2.5-flash",
            "api_key": os.getenv("GEMINI_API_KEY")
        }
    },
    "embedder": {
        "provider": "gemini",
        "config": {
            "model": "gemini-embedding-exp-03-07",
            "api_key": os.getenv("GEMINI_API_KEY")
        }
    },
    "vector_store": {
        "provider": "chroma",
        "config": {
            "collection_name": "oneagent_memories",
            "path": "./oneagent_memory"
        }
    }
}

memory = Memory.from_config(config)
```

3. **Replace OneAgent Memory Server**:
   - Remove `oneagent_memory_server.py`
   - Create thin wrapper service around Mem0
   - Update all memory client calls to use Mem0 API

### Benefits

✅ **Immediate**: Working memory system in hours vs weeks  
✅ **Reliable**: Production-tested with thousands of users  
✅ **Advanced**: All mem0 features (LLM processing, deduplication, etc.)  
✅ **Maintained**: Regular updates and bug fixes  
✅ **Focus**: Developers can focus on OneAgent's unique collaborative features

### Migration Timeline

- **Day 1**: Install mem0, basic configuration
- **Day 2**: Replace memory client calls, test basic operations
- **Day 3**: Advanced features (metadata, deduplication)
- **Day 4**: Integration testing with OneAgent core
- **Day 5**: Performance optimization and deployment

### Configuration

```env
# .env additions
MEM0_PROVIDER=gemini
MEM0_MODEL=gemini-2.5-flash
MEM0_EMBEDDING_MODEL=gemini-embedding-exp-03-07
MEM0_VECTOR_STORE=chroma
MEM0_COLLECTION=oneagent_memories
```

This strategic pivot allows OneAgent to focus on its unique value proposition: collaborative agent meetings and multi-agent intelligence, while leveraging a proven memory foundation.
