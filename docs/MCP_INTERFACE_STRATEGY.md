# OneAgent MCP Interface Strategy

> **Strategic Vision**: OneAgent is a standalone, fully functional multi-agent system that can operate independently OR as an MCP server for external clients (VS Code, IDEs, GUI apps, mobile, Electron).

## Executive Summary

\*\*OneAgent's dual-protocol architecture enables cle## Timeline

| Phase                 | Duration    | Target     | Status             |
| --------------------- | ----------- | ---------- | ------------------ |
| Official SDK Adoption | 1 week      | v4.4.2     | ✅ Complete        |
| Hybrid Integration    | 1 day       | v4.5.0     | ✅ Complete        |
| OAuth2 + mTLS         | 1 week      | v4.7.0     | 🚀 Planned         |
| Async Ops + Discovery | 1 week      | v4.7.0     | 🚀 Planned         |
| **Total**             | **3 weeks** | **v4.7.0** | **🔄 In Progress** |

**Phase 1 Complete**: Nov 2024 - Official @modelcontextprotocol/sdk@1.0.4 integrated, A2A v0.3.0 upgraded  
**Phase 2 Complete**: Nov 2024 - Hybrid Express+SDK architecture, unified cache, stdio transport  
**Release Date**: Phases 3-4 aligned with Nov 25, 2025 MCP spec release (RC: Nov 11, 2025)on of concerns:\*\*

- **Internal Communication**: A2A SDK (agent-to-agent, NLACS, GMA, memory audit)
- **External Interface**: MCP SDK (VS Code, GUI apps, mobile, Electron, plugins, third-party integrations)

**MCP is THE canonical interface** for all external interactions. All future UI/UX surfaces will connect exclusively via MCP endpoints.

---

## Current State (v4.4.2)

### ✅ Production-Ready Components

1. **Memory System**: Official FastMCP (Python)
   - Backend: `servers/mem0_fastmcp_server.py`
   - Protocol: MCP HTTP JSON-RPC 2.0 on port 8010
   - Status: ✅ Production-ready, fully canonical

2. **A2A Communication**: Official @a2a-js/sdk
   - Protocol: A2A v0.2.5 (v0.3.0 upgrade in progress)
   - Usage: Internal agent-to-agent communication
   - Status: ✅ Canonical, future-proof

3. **Main MCP Server**: Custom HTTP Implementation
   - File: `coreagent/server/unified-mcp-server.ts`
   - Protocol: Express + manual JSON-RPC 2.0
   - Endpoints: `/mcp`, `/.well-known/agent-card.json`, `/metrics`, health, streaming
   - Status: ⚠️ Custom impl (not using official TypeScript MCP SDK)

### ⚠️ Gaps & Risks

1. **Not Using Official MCP SDK**
   - Maintenance burden: Must track spec changes manually
   - Compatibility risk: Subtle incompatibilities with future IDE clients
   - Feature lag: Missing auto-upgrades, security patches, new extensions

2. **Limited Auth Support**
   - Current: Basic bearer token support
   - Missing: OAuth2, mTLS, Resource Indicators (RFC 8707)

3. **No Async Operations**
   - Current: All operations are blocking/synchronous
   - Impact: Long-running tasks (GMA compilation, BMAD analysis) block clients

4. **Manual Server Discovery**
   - Current: Must connect to server to discover capabilities
   - Impact: Harder for clients to browse available servers

---

## Nov 2025 MCP Spec Update

**Release Date**: Nov 25, 2025 (RC: Nov 11, 2025)

### Key Features

1. **Asynchronous Operations**
   - Long-running tasks with status polling
   - Event streaming for progress updates
   - Non-blocking client experience

2. **Statelessness & Scalability**
   - Improved session handling
   - Horizontal scaling across multiple instances
   - Load balancer friendly

3. **Server Identity**
   - `.well-known` URL metadata for capability discovery
   - No connection required to browse capabilities
   - Automatic catalog aggregation

4. **OAuth2 Enhancements**
   - Resource Server classification
   - Resource Indicators (RFC 8707) - prevents token mis-redemption
   - mTLS support with certificate verification

5. **Official Extensions**
   - Curated collection of proven patterns
   - Industry-specific extensions (healthcare, finance, education)
   - Standardized capability advertising

6. **SDK Support Standardization**
   - Clear tiering system for SDK compliance
   - Feature completeness scoring
   - Maintenance responsiveness tracking

---

## Proposed Architecture (v4.7.0)

### MCP Interface Layer

```
┌─────────────────────────────────────────────────────────────┐
│                    OneAgent System                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────┐       │
│  │   Internal Agent Communication (A2A SDK)         │       │
│  │   - Agent-to-agent messaging                     │       │
│  │   - NLACS extension                              │       │
│  │   - GMA protocol (v0.3.0)                        │       │
│  │   - Memory audit trails                          │       │
│  └──────────────────────────────────────────────────┘       │
│                         ▲                                    │
│                         │                                    │
│                         ▼                                    │
│  ┌──────────────────────────────────────────────────┐       │
│  │   7 Specialized Agents + Infrastructure          │       │
│  │   - ValidationAgent, TriageAgent, PlannerAgent   │       │
│  │   - AlitaAgent, FitnessAgent, CoreAgent, Office  │       │
│  └──────────────────────────────────────────────────┘       │
│                         ▲                                    │
│                         │                                    │
│                         ▼                                    │
│  ┌──────────────────────────────────────────────────┐       │
│  │   MCP Interface Layer (Official TypeScript SDK)  │       │
│  │   - Tools: oneagent_*, memory_*, bmad_*          │       │
│  │   - Resources: prompts, templates, docs          │       │
│  │   - Async ops: Long-running tasks                │       │
│  │   - Auth: OAuth2, mTLS, Resource Indicators      │       │
│  │   - Discovery: .well-known metadata              │       │
│  └──────────────────────────────────────────────────┘       │
│                         ▲                                    │
└─────────────────────────┼────────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────────┐
        │   External Clients (MCP Protocol)   │
        ├─────────────────────────────────────┤
        │  - VS Code Extension                │
        │  - Web Dashboard (React)            │
        │  - Mobile Apps (iOS/Android)        │
        │  - Electron Desktop App             │
        │  - Third-party Integrations         │
        │  - Voice/AR/VR Interfaces (future)  │
        └─────────────────────────────────────┘
```

### Clean Separation of Concerns

1. **A2A SDK (Internal)**
   - Purpose: OneAgent's internal multi-agent coordination
   - Scope: Agent-to-agent messaging, NLACS, GMA, memory audit
   - Status: v0.2.5 (v0.3.0 upgrade in progress)

2. **MCP SDK (External)**
   - Purpose: Interface for all external clients
   - Scope: VS Code, GUI apps, mobile, Electron, plugins
   - Status: Custom impl (official SDK adoption planned v4.7.0)

3. **No Overlap**
   - A2A handles internal coordination
   - MCP handles external exposure
   - Zero protocol confusion or parallel APIs

---

## Migration Plan (v4.7.0)

### Phase 1: Official SDK Adoption (~1 week)

1. **Replace Custom Implementation**
   - File: `coreagent/server/unified-mcp-server.ts` (major refactor)
   - Replace Express + manual JSON-RPC with official SDK
   - Use SDK types for all protocol objects
   - Leverage SDK transport layer (HTTP, WebSocket, NDJSON)

2. **Maintain Backward Compatibility**
   - Keep existing endpoints and behavior
   - No breaking changes for current clients
   - Rollback plan: Archive custom impl for emergency fallback

3. **Testing**
   - SDK conformance tests (official test suite)
   - Backward compatibility tests (ensure VS Code still works)
   - Performance benchmarks (<10% latency regression)

### Phase 2: OAuth2 + mTLS (~1 week)

1. **OAuth2 Resource Server**
   - Files: `coreagent/server/auth/*` (new)
   - Resource Server classification
   - Resource Indicators (RFC 8707) for token mis-redemption prevention
   - Bearer token enhancements (audience validation, scope enforcement)

2. **mTLS Support**
   - Certificate verification
   - Mutual authentication
   - Enterprise-grade security

3. **Backward Compatibility**
   - Keep simple bearer token for local dev
   - Gradual rollout with feature flags

### Phase 3: Async Operations & Server Identity (~1 week)

1. **Async Operations**
   - Files: `coreagent/server/async-ops.ts` (new)
   - Long-running tool execution with status polling
   - Task ID generation and tracking
   - Event streaming for progress updates

2. **Server Identity**
   - Enhanced `.well-known/agent-card.json` with full metadata
   - Tool catalog exposure (no connection required)
   - Resource catalog exposure (prompts, templates, docs)

3. **Stateless Session Management**
   - Stateless session tokens (JWT-based)
   - Session state externalization (Redis/distributed cache)
   - Horizontal scaling support

---

## Benefits

### 1. Ecosystem Compatibility

- Works seamlessly with VS Code, JetBrains, Claude Desktop, and future clients
- Automatic compatibility with new MCP clients (no custom integration)
- Community-driven improvements (thousands of MCP servers in production)

### 2. Enterprise Readiness

- OAuth2 + mTLS for secure deployments
- Resource Indicators prevent token mis-redemption
- Audit-ready security best practices

### 3. Future-Proof Architecture

- Official SDK tracks spec updates automatically
- No manual migration for each MCP release
- Access to new features (async ops, extensions, etc.)

### 4. Reduced Maintenance

- SDK handles protocol complexity
- OneAgent focuses on agent intelligence
- Community support for SDK issues

### 5. Clean Interface Design

- A2A for internal comms, MCP for external interface
- No protocol confusion or parallel APIs
- Single source of truth for external capabilities

---

## UI/UX Platform Strategy

**All future UI/UX surfaces will connect via MCP interface:**

### Web Dashboard (React)

- **Connection**: MCP client consuming tools/resources/async ops
- **Features**: Metrics, agents, memory explorer, GMA spec viewer
- **Auth**: OAuth2 with Resource Indicators
- **Real-time**: WebSocket streaming for live updates

### Mobile Apps (iOS/Android)

- **Connection**: Native MCP client (Swift/Kotlin)
- **Features**: Agent monitoring, task status, notifications
- **Auth**: OAuth2 with mobile-optimized flow
- **Offline**: Local cache with sync on reconnect

### Electron Desktop App

- **Connection**: Node.js MCP client
- **Features**: Full OneAgent capabilities, native integrations
- **Auth**: OS-level credential storage + OAuth2
- **Performance**: Direct HTTP/WebSocket, no browser overhead

### Voice/AR/VR Interfaces (Future)

- **Connection**: MCP client with streaming audio/video
- **Features**: Voice commands, spatial visualization, immersive analytics
- **Auth**: Biometric + OAuth2
- **Latency**: Sub-100ms for real-time interaction

---

## Risk Mitigation

### 1. Breaking Changes

- **Risk**: SDK adoption introduces breaking changes
- **Mitigation**: Phased rollout with feature flags, comprehensive testing, 2-release backward compat period

### 2. Auth Complexity

- **Risk**: OAuth2/mTLS adds complexity for local dev
- **Mitigation**: Keep simple bearer token for local dev; enterprise features opt-in

### 3. SDK Lock-in

- **Risk**: Dependent on official SDK maintainers
- **Mitigation**: SDK is open-source (MIT), active community, used by major IDEs

### 4. Performance

- **Risk**: SDK overhead increases latency
- **Mitigation**: Benchmark critical paths; SDK is optimized for production use

### 5. Migration Effort

- **Risk**: ~3 weeks of focused work
- **Mitigation**: High ROI (ecosystem alignment, security, maintainability); can defer if needed

---

## Timeline

| Phase                 | Duration    | Target     | Status            |
| --------------------- | ----------- | ---------- | ----------------- |
| Official SDK Adoption | 1 week      | v4.4.2     | ✅ Complete       |
| OAuth2 + mTLS         | 1 week      | v4.7.0     | 🚀 Planned        |
| Async Ops + Discovery | 1 week      | v4.7.0     | 🚀 Planned        |
| **Total**             | **3 weeks** | **v4.7.0** | **� In Progress** |

**Phase 1 Complete**: Nov 2024 - Official @modelcontextprotocol/sdk@1.0.4 integrated, A2A v0.3.0 upgraded  
**Release Date**: Phases 2-3 aligned with Nov 25, 2025 MCP spec release (RC: Nov 11, 2025)

### Phase 1 Completion (v4.4.2) ✅

**Date**: October 2025

**Deliverables**:

1. ✅ A2A Protocol upgraded from v0.2.5 → v0.3.0
   - Updated `a2aProtocolVersion` in config
   - Changed well-known path to `/agent-card.json` (v0.3.0 spec)
2. ✅ Official MCP TypeScript SDK integrated
   - Package: `@modelcontextprotocol/sdk@^1.0.4`
   - Dependencies: 29 packages added, 0 vulnerabilities
3. ✅ Canonical MCP SDK wrapper created
   - File: `coreagent/server/mcp-sdk-service.ts`
   - Features: MCPSDKService singleton, tool/resource/prompt registration
   - Transports: stdio (VS Code ready), SSE placeholder
   - Constitutional AI compliant: `createUnifiedTimestamp()`, `UnifiedBackboneService`
4. ✅ Verification passing
   - Type check: ✅ No errors
   - Lint check: ✅ No errors, 3 warnings (acceptable)
   - Canonical files guard: ✅ Pass
   - Banned metrics guard: ✅ Pass
   - Deprecated deps guard: ✅ Pass

**Phase 1 Architecture**:

- ~~Simple in-memory Map registry~~ ✅ **Migrated to unified cache in Phase 2**
- Official SDK types and transport layers
- Backward compatibility maintained
- Foundation ready for Phase 2 refactoring

**Next Steps**: ~~Refactor `unified-mcp-server.ts` to use MCPSDKService (Phase 2)~~ ✅ **Complete!**

### Phase 2 Completion (v4.5.0) ✅

**Date**: October 2025

**Strategy**: Hybrid Architecture (Express + SDK Coexistence)

**Deliverables**:

1. ✅ Unified Cache Migration
   - Migrated MCPSDKService from in-memory Maps → OneAgentUnifiedBackbone.getInstance().cache
   - Architecture: Set-based indices (`toolNames`, `resourceUris`, `promptNames`)
   - Cache keys: `mcp:tool:${name}`, `mcp:resource:${uri}`, `mcp:prompt:${name}`
   - All handlers converted to async with cache integration

2. ✅ Tool Registration Bridge
   - Created `registerToolsWithSDK()` function in unified-mcp-server.ts
   - Bridges OneAgentEngine.getAvailableTools() → MCPSDKService
   - All tools registered with async handlers
   - Execution delegates to `oneAgent.processRequest()` (same path as Express)

3. ✅ Stdio Transport Integration
   - MCPSDKService initializes in `initializeServer()`
   - Stdio transport starts automatically (disable with `ONEAGENT_MCP_STDIO=0`)
   - Express HTTP endpoints unchanged (100% backward compatibility)
   - Hybrid operation: Both Express and SDK work simultaneously

4. ✅ SDK Diagnostic Endpoint
   - New endpoint: `GET /mcp/sdk-info`
   - Exposes: SDK version, server info, tool/resource/prompt counts, transport status
   - Returns 503 if SDK not initialized

5. ✅ Verification Passing
   - Type check: ✅ No errors
   - Lint check: ✅ 0 errors, 1 warning
   - All guards: ✅ Pass

**Phase 2 Architecture**:

- **Hybrid Model**: Express (HTTP/JSON-RPC) + SDK (stdio) coexist
- **Zero Risk**: No breaking changes, Express endpoints unchanged
- **Unified Cache**: All tool/resource/prompt storage via OneAgentUnifiedBackbone
- **Dual Registration**: Tools available via both Express AND SDK
- **Shared Execution**: Both paths delegate to OneAgentEngine.processRequest()
- **Future-Ready**: Foundation for Phase 3 (full HTTP SDK migration)

**Benefits Achieved**:

- ✅ VS Code can connect via native stdio transport
- ✅ HTTP clients continue using Express (no migration required)
- ✅ Canonical cache integration (no parallel systems)
- ✅ Gradual adoption path (clients migrate when ready)
- ✅ Escape hatch available (`ONEAGENT_MCP_STDIO=0`)

**Next Steps**: OAuth2 + mTLS (Phase 3), then Async Operations (Phase 4)

---

## Acceptance Criteria

### Phase 1 (v4.4.2) ✅

- [x] Official TypeScript MCP SDK package installed (@modelcontextprotocol/sdk@1.0.4)
- [x] A2A Protocol upgraded to v0.3.0
- [x] MCPSDKService wrapper created with canonical patterns
- [x] Verification passing (type check, lint check, guards)
- [x] Constitutional AI compliance (unified time, unified backbone)

### Phase 2 (v4.5.0) ✅

- [x] Unified cache migration (OneAgentUnifiedBackbone.getInstance().cache)
- [x] Tool registration bridge (OneAgentEngine → MCPSDKService)
- [x] Stdio transport integration (VS Code ready)
- [x] SDK diagnostic endpoint (/mcp/sdk-info)
- [x] Hybrid architecture (Express + SDK coexistence)
- [x] Zero breaking changes (100% backward compatibility)
- [x] Verification passing (type check, lint check, all guards)

### Phase 3 (v4.7.0) 🚀

- [ ] OAuth2 Resource Server with Resource Indicators implemented
- [ ] mTLS support with certificate verification
- [ ] Full HTTP transport migration (optional - can remain hybrid)

### Phase 4 (v4.7.0) 🚀

- [ ] Async operations working for long-running tools
- [ ] Server identity discoverable via `.well-known` URLs
- [ ] Stateless session management with horizontal scaling

### Overall Quality Gates 🚀

- [ ] SDK conformance tests passing (100%)
- [ ] All existing endpoints backward compatible
- [ ] Performance: < 10% latency regression
- [ ] Documentation: Migration guide, auth setup, async patterns

---

## Conclusion

Adopting the official TypeScript MCP SDK and Nov 2025 spec is **critical for OneAgent's vision** as a standalone, fully functional multi-agent system. MCP is not just for VS Code integration—it's the canonical interface for all external interactions. This architecture enables:

1. **Standalone Operation**: OneAgent runs independently with full multi-agent capabilities
2. **MCP Server Mode**: Same system exposes capabilities via MCP for external clients
3. **Clean Separation**: A2A for internal comms, MCP for external interface
4. **Future-Proof**: Automatic compatibility with new MCP clients and features
5. **Enterprise Ready**: OAuth2, mTLS, and security best practices built-in

By investing ~3 weeks in MCP protocol modernization, OneAgent gains ecosystem compatibility, enterprise security, and a future-proof interface layer that will serve all UI/UX surfaces (web, mobile, desktop, voice, AR/VR) for years to come.

---

**Maintainer**: Lead Developer (OneAgent)  
**Version**: 1.2.0  
**Last Updated**: 2025-10-07 (Phase 2 Complete - Hybrid Architecture)  
**Next Review**: Phase 3 kickoff (OAuth2 + mTLS implementation)
