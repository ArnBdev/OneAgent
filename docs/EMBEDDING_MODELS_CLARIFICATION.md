# Embedding Models Clarification

> **Critical Update**: October 2, 2025  
> **Issue**: Inconsistent embedding model usage across codebase  
> **Resolution**: Standardized on current Gemini embedding model

## Problem Discovered

User identified that we were mixing **old Google embeddings** with **new Gemini embeddings** across different parts of the system.

### What Was Wrong

1. **Memory Server (Python)**: Using `models/text-embedding-004` ❌ (deprecated Google model)
2. **TypeScript Code**: Using `gemini-embedding-001` ✅ (correct Gemini model)
3. **Documentation**: Showed incorrect example with `models/text-embedding-004` ❌

## Official Gemini Embedding Models

According to [Google's official documentation](https://ai.google.dev/gemini-api/docs/embeddings#model-versions):

### Current Model (Use This)

```python
from google import genai

client = genai.Client()
result = client.models.embed_content(
    model="gemini-embedding-001",  # ✅ Current stable Gemini model
    contents="What is the meaning of life?"
)
```

**Specifications:**

- **Model Code**: `gemini-embedding-001`
- **Default Dimensions**: 3072 (can be truncated to 128-3072)
- **Recommended Dimensions**: 768, 1536, or 3072
- **Input Token Limit**: 2,048 tokens
- **Latest Update**: June 2025
- **Status**: Stable, production-ready

### Deprecated Models (Don't Use)

These models are being **deprecated in October 2025**:

- ❌ `embedding-001` (legacy Google)
- ❌ `embedding-gecko-001` (legacy Google)
- ❌ `text-embedding-004` (legacy Google, what we were using!)
- ❌ `gemini-embedding-exp-03-07` (experimental, deprecating)

## What We Fixed

### 1. Memory Server Configuration

**Before (WRONG):**

```python
# servers/mem0_fastmcp_server.py
"embedder": {
    "provider": "gemini",
    "config": {
        "model": "models/text-embedding-004",  # ❌ OLD Google model
    }
}
```

**After (CORRECT):**

```python
# servers/mem0_fastmcp_server.py
"embedder": {
    "provider": "gemini",
    "config": {
        "model": "gemini-embedding-001",  # ✅ Current Gemini model
    }
}
```

### 2. Documentation Update

Fixed `docs/MODEL_SELECTION_ARCHITECTURE.md` to show correct model in Memory Server Integration section.

### 3. TypeScript Code

**Already Correct** ✅ - No changes needed:

```typescript
// coreagent/config/UnifiedModelPicker.ts
export function getEmbeddingModel(): string {
  // ... provider selection logic ...
  return 'gemini-embedding-001'; // ✅ Correct
}
```

## Dimension Control

The Gemini embedding model uses **Matryoshka Representation Learning (MRL)**, which means you can truncate to smaller dimensions without significant quality loss:

```python
result = client.models.embed_content(
    model="gemini-embedding-001",
    contents="What is the meaning of life?",
    config=types.EmbedContentConfig(output_dimensionality=768)  # Truncate to 768 dims
)
```

### Quality by Dimension (MTEB Scores)

| Dimensions     | MTEB Score | Use Case                            |
| -------------- | ---------- | ----------------------------------- |
| 3072 (default) | 68.20      | Maximum quality                     |
| 2048           | 68.16      | High quality                        |
| 1536           | 68.17      | Balanced (recommended)              |
| 768            | 67.99      | Standard (recommended, what we use) |
| 512            | 67.55      | Compact                             |
| 256            | 66.19      | Minimal                             |
| 128            | 63.31      | Ultra-compact                       |

**OneAgent uses 768 dimensions** for optimal balance between quality and storage efficiency.

## Task Types

Gemini embeddings support task-specific optimization:

```python
config=types.EmbedContentConfig(
    task_type="RETRIEVAL_DOCUMENT",  # For documents to be searched
    output_dimensionality=768
)
```

### Available Task Types

- `RETRIEVAL_DOCUMENT` - Indexing documents for search
- `RETRIEVAL_QUERY` - Search queries
- `SEMANTIC_SIMILARITY` - Similarity comparison
- `CLASSIFICATION` - Text classification
- `CLUSTERING` - Document clustering
- `CODE_RETRIEVAL_QUERY` - Code search
- `QUESTION_ANSWERING` - QA systems
- `FACT_VERIFICATION` - Fact checking

## Verification Status

✅ **mem0 0.1.118 accepts `gemini-embedding-001`** - Verified by server initialization logs  
✅ **TypeScript code already using correct model** - No changes needed  
✅ **Documentation updated** - Shows correct model  
✅ **Memory server configuration fixed** - Using current Gemini model

## Migration Notes

If you have **existing embeddings** stored using `text-embedding-004`:

1. **They will continue to work** - No immediate breakage
2. **Gradual migration recommended** - Re-embed critical documents with `gemini-embedding-001`
3. **Mixing models is OK** - But use same model for query and documents in a search context
4. **October 2025 deadline** - Legacy models will stop working after deprecation

## Implementation Checklist

- [x] Update mem0 server to use `gemini-embedding-001`
- [x] Update documentation to reflect correct model
- [x] Verify TypeScript code is using correct model (already was)
- [x] Test memory server initialization with new model
- [ ] Re-embed existing memories (optional, gradual migration)
- [ ] Add task_type optimization to embeddings (future enhancement)
- [ ] Benchmark quality difference between 768 and 1536 dimensions (future testing)

## References

- [Official Gemini Embeddings Documentation](https://ai.google.dev/gemini-api/docs/embeddings)
- [Model Versions Table](https://ai.google.dev/gemini-api/docs/embeddings#model-versions)
- [Batch API for Embeddings](https://ai.google.dev/gemini-api/docs/batch-api#batch-embedding) (50% cost reduction for high-throughput)
- [Embeddings Quickstart Notebook](https://github.com/google-gemini/cookbook/blob/main/quickstarts/Embeddings.ipynb)

---

**Bottom Line**: We've standardized on `gemini-embedding-001` (current Gemini model) and removed usage of deprecated `text-embedding-004` (legacy Google model). This ensures OneAgent stays current with Google's latest embedding technology.
