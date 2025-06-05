# Gemini Embeddings - Quick Reference

## 🚀 Quick Start

```typescript
import { GeminiClient } from './coreagent/tools/geminiClient';
import { semanticSearch } from './coreagent/tools/geminiEmbeddings';

// Initialize client
const client = new GeminiClient({ apiKey: process.env.GOOGLE_API_KEY });

// Generate embeddings
const embedding = await client.generateEmbedding("Hello world");
const embeddings = await client.generateBatchEmbeddings([
  { content: "Document 1" },
  { content: "Document 2" }
]);

// Semantic search
const results = await semanticSearch("query", documents, { threshold: 0.7 });
```

## 📊 Key Features

### ✅ Working Features
- **Single Embedding Generation** - 768-dimensional vectors
- **Batch Processing** - Efficient bulk operations
- **Cosine Similarity** - Semantic similarity scoring
- **Memory Integration** - Store with embeddings (when Mem0 available)
- **Error Handling** - Graceful API failure recovery
- **Mock Fallbacks** - Development-friendly testing

### 🔧 Configuration
```typescript
// Environment variables
GOOGLE_API_KEY=your_google_ai_studio_key      # Required - Your Google AI Studio API key
GOOGLE_MODEL=gemini-2.5-pro-preview-05-06     # Optional - Default chat model
EMBEDDING_MODEL=text-embedding-004             # Optional - Default embedding model
SIMILARITY_THRESHOLD=0.7                       # Optional - Semantic search threshold
```

### 📈 Performance
- **Dimensions**: 768 (text-embedding-004)
- **Processing**: ~100ms per embedding
- **Batch Size**: Optimized for API limits
- **Memory**: Efficient vector operations

## 🧪 Testing Commands

```bash
# Test API key and embeddings functionality
npx ts-node test-real-api.ts

# Test imports
npx ts-node test-import.ts

# Run main agent
npx ts-node coreagent/main.ts

# Build TypeScript
npm run build

# Development mode
npm run dev
```

## 🔍 API Methods

```typescript
// GeminiClient core methods
generateEmbedding(text: string, options?: EmbeddingOptions): Promise<EmbeddingResult>
generateBatchEmbeddings(items: BatchEmbeddingItem[]): Promise<BatchEmbeddingResponse>
chat(prompt: string, options?: ChatOptions): Promise<string>

// Static utility methods
GeminiClient.calculateCosineSimilarity(emb1: number[], emb2: number[]): number

// Semantic search utilities (geminiEmbeddings.ts)
semanticSearch(query: string, docs: string[], options?: SearchOptions)
storeWithEmbedding(content: string, metadata?: any): Promise<Mem0Memory>
```

## 🎯 Status Summary

**✅ COMPLETE**: Core embeddings functionality with verified Google AI Studio API key
**✅ COMPLETE**: 768-dimensional embedding generation and batch processing  
**✅ COMPLETE**: Cosine similarity calculations and semantic search utilities
**✅ COMPLETE**: Comprehensive documentation and quick reference guides
**⏳ PENDING**: Local Mem0 server setup (optional for memory features)
**🚀 READY**: Production deployment with working API integration

---
*Last updated: June 5, 2025 | For detailed implementation see: EMBEDDINGS_IMPLEMENTATION.md*
