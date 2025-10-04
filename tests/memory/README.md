# OneAgent Memory Test Suite

This directory contains all canonical, production-grade tests for the OneAgent memory system. All tests use the unified `OneAgentMemory` interface and canonical helpers from `memoryTestUtils.ts`.

## 🧠 Canonical Memory System

- **Backend**: mem0+FastMCP (default), Memgraph (optional)
- **Interface**: All memory operations use the `IMemoryClient` interface via `OneAgentMemory.getInstance()`
- **No Parallel Systems**: All test helpers and test files use only canonical memory, time, and ID systems
- **Health Checks**: All tests validate backend health before running
- **Backend Contract Validation**: `backend-contract-validation.test.ts` fails fast if the backend contract is broken

## Test Files

- `memoryTestUtils.ts`: Canonical test helpers (setup/teardown, health checks, contract validation, diagnostics)
- `backend-contract-validation.test.ts`: Validates backend embedding API contract
- `crud-canonical-memory.test.ts`: CRUD and error handling tests
- `search-canonical-metadata.test.ts`: Metadata and search tests
- `batch-canonical-metadata.test.ts`: Batch add/search tests
- `batch-canonical-metadata.fixed.test.ts`: Batch add/search (fixed variant)
- `memory-integration.test.ts`: Embedding and search integration

## Running Memory Tests

1. **Start both servers** (see below):
   - `npm run memory:server` (mem0+FastMCP)
   - `npm run server:unified` (MCP server)
2. **Run all memory tests:**
   - `npx jest tests/memory --detectOpenHandles --runInBand --verbose`

## Environment & Requirements

- **Node.js**: v22+
- **TypeScript**: 5.9+
- **Python**: 3.13.3+
- **mem0ai**: 0.1.118+
- **google-genai**: 1.39.1+
- **chromadb**: 1.1.0+
- **neo4j**: 6.0.1+
- **fastmcp**: 2.12.4+
- **python-dotenv**: 1.1.1+
- **numpy**: 2.3.3+

See `servers/requirements.txt` for the full Python dependency list.

## Backend Health & Troubleshooting

- **Health endpoints:**
  - `GET http://localhost:8010/health` (liveness)
  - `GET http://localhost:8010/health/ready` (readiness)
- **Common issues:**
  - Backend not healthy: Check logs, ensure all dependencies are installed, verify API keys
  - Embedding errors: Ensure `ONEAGENT_EMBEDDINGS_URL` is set and reachable
  - Contract failures: See `backend-contract-validation.test.ts` for diagnostics

## Canonical References

- [docs/memory-system-architecture.md](../../docs/memory-system-architecture.md)
- [docs/DEPENDENCY_UPDATE_OCT2025.md](../../docs/DEPENDENCY_UPDATE_OCT2025.md)
- [servers/requirements.txt](../../servers/requirements.txt)
- [CHANGELOG.md](../../CHANGELOG.md)

## Test Patterns & Best Practices

- All tests use `ensureMemoryServerReady()` to validate backend health
- Use `clearTestMemories(userId)` for test isolation
- Use `generateTestUserId()` for unique test users
- All test data is tagged with `userId` and `type: 'test'` in metadata
- Never use direct REST calls or legacy helpers—always use canonical memory interface

---

_This README is canonical for the OneAgent memory test suite. All test helpers, requirements, and troubleshooting steps are up to date as of October 2025._
