# OneAgent Consolidated Strategic Roadmap (v4.4.1)

> **⚠️ Canonical File Notice**  
> This is the **ONLY** authoritative roadmap. Do **not** create additional roadmap variants (e.g. `CONSOLIDATED_ROADMAP.md`, `roadmap_v2.md`, `HYBRID_ROADMAP`, etc.). All strategy, release planning, KPI updates and status changes MUST be applied here. Creating parallel roadmap documents is prohibited and will be treated as architecture drift. CI guard (`npm run check:canonical-files`) enforces single roadmap at `docs/ROADMAP.md`.
>
> Change Protocol: (1) Open PR with rationale + diff summary, (2) If adding/removing release objectives, reference supporting RFC or issue ID, (3) Update Immediate Action Queue status table accordingly, (4) Note significant alterations in CHANGELOG under "Roadmap Updates".

> Canonical roadmap superseding ad‑hoc/fragmented roadmap references. Existing roadmap & vision docs remain as historical context; this file is the single planning source of truth going forward.

OneAgent v4.4.1 achieves **Orchestration Excellence** with Circuit Breaker Pattern, Performance-Weighted Agent Selection, and Real-Time Event Streaming (12 event types). The codebase maintains Grade A+ quality (80%+ standard) with zero ESLint warnings, 100% Constitutional AI compliance, and complete canonical system adherence. All cross-cutting caches unified, all agent communication via UnifiedAgentCommunicationService (A2A v0.2.5 + NLACS + memory audit), observability enhanced with Prometheus exposition. **Strategic pivot**: Epic 18 (GMA spec-driven development + A2A v0.3.0 upgrade) approved for v4.5.0-v4.6.0 phased implementation; MCP Protocol Modernization (official SDK + Nov 2025 spec) planned for v4.7.0. OneAgent is a **standalone, fully functional multi-agent system** with MCP as the **canonical interface** for all external interactions (VS Code, GUI apps, mobile, Electron, plugins). Focus: (1) **MCP Interface Excellence** (official SDK, OAuth2/mTLS, async ops) 🚀, (2) **Reactive Observability** (event-driven metrics streaming), (3) **GMA MVP** (Markdown specifications driving agent workflows), (4) **A2A v0.3.0** (protocol modernization + GMA formalization), (5) **NLACS & PlannerAgent intelligence**, (6) **UI/UX platform surfaces** (all via MCP).

## 2. Current State Snapshot (Maturity Matrix) — v4.4.1

| Pillar                               | Scope                                         | Status       | Maturity (1-5) | Notes                                                                                  |
| ------------------------------------ | --------------------------------------------- | ------------ | -------------- | -------------------------------------------------------------------------------------- |
| Code Quality & Standards             | Zero warnings, canonical compliance           | ✅ Complete  | 5              | 35 ESLint warnings eliminated; Grade A+ achieved; 100% Constitutional AI compliance    |
| Canonical Core Systems               | Time, ID, Memory, Cache, Unified Cache Policy | ✅ Complete  | 5              | All caches unified; negative caching, TTL/backoff; **Memory: CERTIFIED v4.4.0** ✅     |
| **Agent Systems Canonical**          | **All 7 agents + infrastructure unified**     | ✅ Complete  | 5              | **v4.4.2: 24 violations fixed, 100% compliance, TemplateAgent ready** ✅               |
| Communication Layer (A2A v0.2.5)     | A2A + NLACS + memory audit                    | ✅ Complete  | 5              | Production-ready; A2A v0.3.0 upgrade planned v4.6.0 (Epic 18 Phase 2)                  |
| Monitoring & Metrics                 | Prometheus gauges, error rate, health, cache  | ✅ Enhanced  | 5              | Mission gauges, error rate, health aggregation, cache health, memory backend health    |
| **Memory Backend Health**            | **Health monitoring, triage, remediation**    | ✅ Complete  | 5              | **v4.4.1**: Phase 1 & 2 complete, <0.3% overhead, Grade A (95%) ✅                     |
| Orchestration (Circuit Breaker)      | TaskQueue with circuit breakers               | ✅ Complete  | 5              | Per-executor isolation, self-healing, 9 event types (v4.4.1 ✅)                        |
| Orchestration (Performance Tracking) | Weighted agent selection                      | ✅ Complete  | 5              | 30% perf + 70% similarity, adaptive learning, 3 event types (v4.4.1 ✅)                |
| Orchestration (Event Streaming)      | Real-time Mission Control events              | ✅ Complete  | 5              | 12 event types (9 TaskQueue + 3 AgentMatcher), production-ready (v4.4.1 ✅)            |
| Error Handling & Taxonomy            | Canonical registry + mapped metrics           | 🚧 Advancing | 4              | Taxonomy codes in error handler, monitoring, metrics; policy console next              |
| NLACS / Emergent Intelligence        | NLACS, entity extraction, memory audit        | 🚧 Advancing | 3              | NLACS extension, entity extraction, memory audit; cross-session insights planned       |
| Planner (Strategic)                  | Decomposition & dynamic replanning            | ✅ Complete  | 5              | **GMA MVP complete v4.5.0** (Epic 18 Phase 1) ✅ - PlannerAgent unified                |
| UI / Visualization                   | VS Code extension, dashboard, metrics         | 🚧 Advancing | 2              | VS Code compiles, dashboard metrics planned; **reactive observability v4.3.0** 🚀      |
| Resilience & Reliability             | Circuit breakers, fallback, retries           | ✅ Enhanced  | 4              | Circuit breakers live (v4.4.1 ✅); chaos tests & advanced policies next                |
| Security / Privacy / Compliance      | Baseline privacy metadata                     | 🚧 Partial   | 2              | Policy enforcement & audit dashboards needed                                           |
| Extensibility / Plugin Model         | Tool registry, release workflow, lint guards  | 🚧 Advancing | 3              | Release workflow, plugin manifest spec, static lint guards, public packaging planned   |
| Performance & Scale                  | Local dev scale, cache perf, CI/CD            | 🚧 Advancing | 3              | Cache perf, release automation, clustering design doc planned                          |
| Governance & Change Control          | Release train, CI/CD, roadmap guard           | ✅ Enhanced  | 4              | CI/CD release workflow, **canonical roadmap guard** (`check:canonical-files`) ✅       |
| **Epic 18: GMA Spec-Driven Dev**     | Markdown specs → agent workflows              | ✅ Complete  | 5              | **v4.5.0**: PlannerAgent GMA, GMACompiler, MissionBrief.md (Epic 18 Phase 1) ✅        |
| **Epic 18: A2A v0.3.0 Upgrade**      | Protocol modernization + extensions           | 🚧 Progress  | 4              | **v4.6.0**: Official SDK adopted, v0.3.0 compliant, GMA extension (Epic 18 Phase 2) 🚀 |
| **MCP Protocol & Interface Layer**   | **Official MCP SDK, OAuth2, Enterprise Auth** | ⚠️ Custom    | 3              | **Custom HTTP impl; official SDK adoption needed for Nov 2025 spec update** 🚧         |

## 3. Strategic Pillars (2025–2026, v4.4.1+)

1. **Code Quality & Standards Excellence** (Zero warnings, Constitutional AI, Grade A+ maintained).
2. **Reliability & Observability Excellence** (SLOs, structured errors, resilience, event-driven metrics).
3. **Intelligence Elevation** (NLACS advanced, **GMA spec-driven development** 🚀, PlannerAgent strategic pipeline).
4. **Experience & Adoption** (Web dashboard, VS Code extension, reactive observability, Electron/mobile apps, **all via MCP interface** 🚀).
5. **MCP Interface Excellence** (Official TypeScript SDK, OAuth2/mTLS, enterprise auth, async ops, server discovery) 🚀.
6. **Life Domains & Privacy Compartmentalization** (domain profiles, default-deny bridges, consent, DLP, audit).
7. **Model-Agnostic Routing** (UnifiedModelPicker, cost/quality/latency, hot-swap, fallback, telemetry).
8. **Extensibility & Ecosystem** (Plugin/extension SDK, connectors, **A2A v0.3.0 extensions** 🚀).
9. **Performance & Scale** (Cache perf, clustering, adaptive sampling, histograms, CI/CD automation).
10. **Governance & Compliance** (Policy layer, audit visualizations, data retention, roadmap guard ✅, RFC workflow).
11. **Research & Innovation** (Emergent insight detection, knowledge graph, **spec-driven AI workflows** 🚀).

## 4. Release Train & High-Level Timeline (Indicative, v4.4.1+)

| Release | Target Window | Theme Focus                                     | Exit Criteria                                                                                                     |
| ------- | ------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| v4.4.2  | 2025-01-04    | Agent Systems Canonical Compliance ✅           | ✅ All violations fixed: 7 agents (24) + utilities (10) = 34 → 0 violations, 100% compliance, TemplateAgent ready |
| v4.4.1  | 2025-10-03    | Memory Backend Health Monitoring ✅             | ✅ Phase 1 & 2: HealthMonitoringService, ProactiveTriageOrchestrator, TriageAgent integration complete            |
| v4.5.0  | 2025-10-05    | **Epic 18 Phase 1: GMA Consolidation** ✅       | **PlannerAgent GMA integrated, GMACompilerService operational, PlannerAgentGMA consolidated** ✅                  |
| v4.6.0  | 2025-10-07    | **MCP SDK Integration + A2A v0.3.0** ✅         | **Official MCP SDK adopted, hybrid architecture, unified cache, stdio transport, A2A v0.3.0 complete** ✅         |
| v4.3.0  | +12 weeks     | Reactive Observability & Event-Driven Streaming | Live dashboard auto-refresh, metrics_tick integration, health_delta banner, reconnect strategy, event-driven arch |
| v4.4.0  | +16 weeks     | PlannerAgent Strategic Layer (Classic)          | Task decomposition, dynamic replanning, memory-driven optimization                                                |
| v4.7.0  | 2025-11-25    | **MCP OAuth2/mTLS + Async Operations** 🚀       | **OAuth2/mTLS enterprise auth, async operations, server discovery, stateless scaling** 🚀                         |
| v5.0    | +32 weeks     | Hybrid Intelligence Launch                      | Full NLACS + GMA + Planner integration, cross-session learning reports, stability SLA                             |
| v5.1    | +40 weeks     | Extensibility & Plugin SDK                      | Signed plugin packages, sandbox execution policies, marketplace seed                                              |
| v5.2    | +48 weeks     | Scale & Multi-Instance                          | Cluster orchestration, shared memory index, distributed monitoring                                                |
| v6.0    | 2026 H1       | Enterprise Platform                             | Compliance packs, advanced anomaly detection, multi-tenant isolation, governance workflows                        |

## 5. Thematic Backlogs & Acceptance Criteria (v4.4.1+)

### 5.0 Orchestration Excellence (COMPLETED ✅ v4.4.1)

**Achievement Summary**:

- ✅ **Circuit Breaker Pattern**: Per-executor failure isolation, 5 failures/60s threshold, half-open recovery, 9 event types
- ✅ **Performance-Weighted Agent Selection**: 30% performance + 70% similarity, adaptive learning, success rate/quality/speed tracking, 3 event types
- ✅ **Real-Time Event Streaming**: 12 event types total (TaskQueue: task_added, task_started, task_completed, task_failed, task_retry, task_blocked, circuit_opened, circuit_closed, queue_processed; AgentMatcher: match_found, match_failed, performance_updated)
- ✅ Zero ESLint warnings maintained
- ✅ Grade A+ code quality (80%+ standard)
- ✅ 100% Constitutional AI compliance

**Patterns Established**:

- Circuit Breaker: Self-healing with exponential backoff, half-open testing, state tracking
- Performance Tracking: Weighted scoring, adaptive learning, transparent metrics
- Event Streaming: Mission Control ready, comprehensive operation lifecycle

**Files Modified**:

- `coreagent/orchestration/TaskQueue.ts`: Circuit breaker implementation (~150 lines)
- `coreagent/orchestration/EmbeddingBasedAgentMatcher.ts`: Performance tracking (~120 lines)

**Next Steps**: Integrate events into Mission Control UI (v4.3.0), reactive observability dashboard.

### 5.1 Memory Backend Health Monitoring (COMPLETED ✅ v4.4.1)

**Achievement Summary**:

- ✅ **Phase 1**: HealthMonitoringService integration (30s health checks, latency thresholds, capabilities tracking)
- ✅ **Phase 2**: ProactiveTriageOrchestrator integration (45s snapshots, intelligent triage, user-facing explanations)
- ✅ **Performance**: <0.3% system overhead (negligible impact)
- ✅ **Quality**: Grade A (95%), 0 errors, 0 warnings, 357 files compiled
- ✅ **Canonical**: Zero parallel systems, proper dependency injection

**Memory Backend Health Tracking**:

- Status: healthy/degraded/unhealthy

### 5.2 Agent Systems Canonical Compliance (COMPLETED ✅ v4.4.2)

**Achievement Summary**:

- ✅ **7 Specialized Agents**: All 24 violations fixed (ValidationAgent: 9, TriageAgent: 3, AlitaAgent: 5, FitnessAgent: 3, CoreAgent: 2, OfficeAgent: 1, PlannerAgent: 1)
- ✅ **3 Utility Files**: All 10 violations fixed (AdvancedCodeAnalysisEngine: 2, ALITAAutoEvolution: 4, ProfileManager: 4)
- ✅ **Agent Infrastructure**: UnifiedAgentCommunicationService (18 canonical usages), AgentFactory (2 canonical usages), A2AProtocol (0 violations), NLACS integration (canonical)
- ✅ **TemplateAgent**: 100% canonical compliant, ready for new agent development
- ✅ **Quality**: 95% Grade A, 0 errors, 0 warnings, 367 files compiled
- ✅ **Testing**: A2A/NLACS integration tests passing
- ✅ **Total**: 34 violations → 0 violations = **100% compliance**

**Canonical Patterns Established**:

- Time: `createUnifiedTimestamp()` (UnifiedBackboneService)
- IDs: `createUnifiedId('operation','context')` (UnifiedBackboneService)
- Memory: `BaseAgent.memoryClient` (OneAgentMemory singleton)
- Communication: `UnifiedAgentCommunicationService` (A2A + NLACS + memory audit)

**Files Modified**: 7 specialized agents + 3 utility files + verification of agent infrastructure

**Documentation**:

- `docs/reports/AGENT_SYSTEMS_CANONICAL_UNIFICATION_COMPLETE.md` - Complete verification report
- `docs/reports/AGENT_CANONICAL_COMPLIANCE_REMEDIATION_COMPLETE.md` - Remediation details
- `docs/reports/AGENT_CANONICAL_COMPLIANCE_AUDIT_2025-01-04.md` - Initial audit findings

**Status**: ✅ **COMPLETE - Zero violations remaining**

### 5.3 MCP SDK Integration - Hybrid Architecture (COMPLETED ✅ v4.6.0)

**Achievement Summary**:

- ✅ **Official MCP SDK Adoption**: @modelcontextprotocol/sdk@1.0.4 integrated with hybrid Express + SDK architecture
- ✅ **Unified Cache Migration**: Eliminated in-memory Maps, migrated to `OneAgentUnifiedBackbone.getInstance().cache`
- ✅ **VS Code Stdio Transport**: SDK stdio transport ready for VS Code MCP client integration
- ✅ **Tool Registration Bridge**: `registerToolsWithSDK()` bridges OneAgentEngine → MCPSDKService
- ✅ **SDK Diagnostic Endpoint**: GET /mcp/sdk-info shows SDK version, tool counts, transport status
- ✅ **Zero Breaking Changes**: 100% backward compatibility maintained for existing Express HTTP clients
- ✅ **Build Quality**: 0 errors, 0 warnings (Grade A+), 367 files compiled successfully
- ✅ **Legacy Cleanup**: Removed `.well-known/agent.json` (A2A v0.2.5) - now using agent-card.json (A2A v0.3.0)

**Architecture Benefits**:

- **Hybrid Coexistence**: Express HTTP (existing) + SDK stdio (new) both delegate to oneAgent.processRequest()
- **Progressive Enhancement**: Gradual client migration with zero risk
- **Canonical Compliance**: No parallel systems - unified cache throughout
- **Timeline Performance**: 3 hours actual vs 1 day estimate (75% faster)

**Files Modified**:

- `coreagent/server/mcp-sdk-service.ts`: Unified cache migration (~400 lines)
- `coreagent/server/unified-mcp-server.ts`: SDK integration, tool bridge, diagnostic endpoint (~1850 lines)

**Documentation Created**:

- `docs/implementation/PHASE2_MCP_MIGRATION_PLAN.md`: Comprehensive migration plan (259 lines)
- `docs/testing/PHASE2_TESTING_GUIDE.md`: 6 detailed testing scenarios
- `docs/testing/PHASE2_QUICK_REFERENCE.md`: Quick start commands and troubleshooting
- `docs/implementation/PHASE2_COMPLETION_SUMMARY.md`: Full achievement report
- `docs/MCP_INTERFACE_STRATEGY.md`: Updated to v1.2.0 with Phase 2 completion
- `CHANGELOG.md`: v4.6.0 entry with full achievement summary

**Manual Testing Status**: Servers running successfully (memory + MCP), stdio transport connected, ready for VS Code integration testing.

---

### 5.4 OAuth2/mTLS & Async Operations (PLANNED — v4.7.0) 🚀

**Concept**: With MCP SDK foundation complete (v4.6.0), add enterprise-grade security and async operations for Nov 2025 spec compliance.

**Current State** (post-v4.6.0):

- ✅ **Memory System**: Official FastMCP (Python) for mem0 backend—production-ready, MCP/JSON-RPC compliant
- ✅ **A2A Communication**: Official @a2a-js/sdk for internal agent-to-agent communication—canonical, future-proof
- ✅ **Main MCP Server**: Official @modelcontextprotocol/sdk@1.0.4 with hybrid Express + stdio architecture
- ⚠️ **Auth**: Basic bearer token support—no OAuth2, mTLS, or Resource Indicators (RFC 8707)
- ✅ **Endpoints**: `/mcp`, `/.well-known/agent-card.json`, `/metrics`, health, streaming (NDJSON + WebSocket)
- ✅ **Protocol Version**: Current (June 2025 spec)—upcoming Nov 2025 spec brings async ops and enhanced security

**Nov 2025 MCP Spec Updates** (Release: Nov 25, 2025; RC: Nov 11, 2025):

1. **Asynchronous Operations**: Long-running tasks with status polling (vs blocking calls)
2. **Statelessness & Scalability**: Improved session handling for horizontal scaling
3. **Server Identity**: `.well-known` URL metadata for capability discovery (no connection required)
4. **OAuth2 Enhancements**: Resource Server classification, Resource Indicators (RFC 8707), token mis-redemption prevention
5. **Security Best Practices**: Expanded guidance, authentication patterns, audit requirements

**Remaining Deliverables** (~2-3 weeks focused work):

1. **Implement OAuth2 + mTLS (Nov 2025 Spec)**
1. **Implement OAuth2 + mTLS (Nov 2025 Spec)**
   - Files: `coreagent/server/auth/*` (new), `unified-mcp-server.ts` (updates)
   - OAuth2 Resource Server classification
   - Resource Indicators (RFC 8707) for token mis-redemption prevention
   - mTLS support with certificate verification
   - Bearer token enhancements (audience validation, scope enforcement)

1. **Async Operations Support**
   - Files: `coreagent/server/async-ops.ts` (new), tool implementations (updates)
   - Long-running tool execution with status polling
   - Task ID generation and tracking
   - Event streaming for async progress updates
   - **Integration**: Wire into existing TaskQueue and circuit breakers

1. **Server Identity & Discovery**
   - Files: `unified-mcp-server.ts` (updates), `types/AgentCard.ts` (enhancements)
   - Enhanced `.well-known/agent-card.json` with full capability metadata
   - Tool catalog exposure (no connection required for discovery)
   - Resource catalog exposure (prompts, templates, docs)
   - **Integration**: Use existing AgentCard with SDK-compliant extensions

1. **Stateless Session Management**
   - Files: `coreagent/server/session-manager.ts` (new), middleware (updates)
   - Stateless session tokens (JWT-based)
   - Session state externalization (Redis/distributed cache)
   - Horizontal scaling support (load balancer friendly)
   - **Migration Path**: Gradual rollout with feature flag

1. **Testing & Validation**
   - SDK conformance tests (official test suite)
   - OAuth2/mTLS integration tests
   - Async operations E2E tests
   - Backward compatibility tests (ensure existing clients work)
   - Performance benchmarks (<10% latency regression)

**Acceptance Criteria**:
**Acceptance Criteria**:

- OAuth2 Resource Server with Resource Indicators implemented
- mTLS support with certificate verification
- Async operations working for long-running tools (GMA compilation, BMAD analysis, etc.)
- Server identity discoverable via `.well-known` URLs (no connection required)
- Stateless session management with horizontal scaling
- All existing endpoints backward compatible
- Performance: < 10% latency regression from v4.6.0
- Documentation: Migration guide, auth setup, async patterns

**Risk Mitigation**:

- **Auth Complexity**: Start with OAuth2 basics, add mTLS incrementally; keep simple bearer for local dev
- **Performance**: Benchmark critical paths; async ops should improve perceived latency
- **Migration Effort**: ~2-3 weeks focused work; builds on v4.6.0 SDK foundation

---

### 5.5 Reactive Observability & Event Streaming (CRITICAL PRIORITY — v4.3.0)

**Backend Priorities**:

- Event-driven streaming: Emit latency updates on operation completion (no fixed intervals)
- Metrics tick throttle: Batch operations within 2s window
- Unified channel registry: Abstract subscription handler map
- Health delta refactor: Push updates only on status changes

**Frontend Priorities**:

- WS store & reducers: Shared state for latency series, health, connection
- Live merge logic: Integrate metrics_tick into latency chart
- Health banner & timeline: Visual + accessible health delta
- Reconnect strategy: Exponential backoff with fallback to REST

**Testing Priorities**:

- WS contract tests: JSON schema validation for outbound messages
- Reconnect simulation: Heartbeat loss scenario testing

**Acceptance Criteria**:

- Live dashboard refresh < 2s latency
- WebSocket reconnect < 5s average
- Health status changes visible within 500ms
- Zero polling for metrics updates
- > 95% WS uptime in development usage
- Contract tests cover 100% of WS message types

### 5.2 Epic 18 Phase 1: GMA Spec-Driven Development MVP (NEW — v4.5.0) 🚀

**Concept**: Markdown specifications drive AI agent workflows (proven pattern from GitHub engineer Tomas Vesely). Specs are canonical source, agents "compile" specs to actions, documentation synced with implementation.

**Foundational Evidence**:

- GitHub blog: "Spec-driven development using Markdown as a programming language when building with AI"
- Production validation: GitHub Brain MCP Server built entirely using `main.md` → `main.go` compilation
- OneAgent alignment: BMAD stories (`docs/stories/*.md`) already use Markdown spec pattern
- Solves: Context loss problem, documentation/implementation drift, language lock-in

**Deliverables** (~2 weeks focused work):

1. **MissionBrief.md Specification Format**
   - File: `docs/specs/MissionBrief.md` (template)
   - Structure: Goal, Context, Tasks (BMAD-style), Acceptance Criteria, Resources
   - Integration: Memory storage with structured metadata
   - Validation: JSON schema for specification format

2. **PlannerAgent GMA Extension**
   - File: `coreagent/agents/specialized/PlannerAgent.ts` (enhancement)
   - Capability: Generate MissionBrief.md from user goals
   - Process: Goal decomposition → Markdown spec → Memory storage
   - Constitutional AI validation: Ensure accuracy, transparency, helpfulness

3. **GMACompiler Orchestration**
   - File: `coreagent/orchestration/GMACompiler.ts` (new)
   - Function: Parse MissionBrief.md → Task queue → Agent assignment
   - Integration: TaskQueue with circuit breakers, AgentMatcher with performance tracking
   - Event streaming: Emit compilation events for observability

4. **SpecLintingAgent**
   - File: `coreagent/agents/specialized/SpecLintingAgent.ts` (new)
   - Purpose: Review and optimize Markdown specifications
   - Features: Clarity scoring, completeness checks, BMAD compliance validation
   - Quality target: 80%+ Grade A specifications

**Acceptance Criteria**:

- MissionBrief.md template validated with JSON schema
- PlannerAgent generates valid specifications from natural language goals
- GMACompiler successfully orchestrates multi-agent workflows from specs
- SpecLintingAgent achieves 80%+ accuracy on BMAD story validation
- Memory storage preserves specification lineage and versioning
- Constitutional AI validation applied to all generated specs
- Integration tests cover end-to-end workflow (goal → spec → execution)

**Risk Mitigation**:

- Spec complexity: Start with simple BMAD-style templates, iterate based on usage
- Agent execution: Leverage existing TaskQueue/AgentMatcher (proven in v4.4.1)
- Quality control: SpecLintingAgent provides automated review layer
- Memory audit: Full traceability via UnifiedAgentCommunicationService

### 5.3 Epic 18 Phase 2: A2A v0.3.0 Protocol Upgrade & GMA Formalization (NEW — v4.6.0) 🚀

**Concept**: Upgrade A2A protocol from v0.2.5 to v0.3.0 (released Jul 30, 2025) and formalize GMA as official A2A extension. Enables standardized multi-agent collaboration on Markdown specifications.

**Breaking Changes** (v0.2.5 → v0.3.0):

1. **Well-Known URI**: `/.well-known/agent.json` → `/.well-known/agent-card.json`
2. **Message Format**: `message.type` now REQUIRED field (was optional)
3. **Metadata Structure**: `message.metadata` schema CHANGED
4. **Authentication**: Basic auth REMOVED, bearer token format CHANGED
5. **API Paths**: Modified endpoints for task management

**New Features** (v0.3.0):

1. **Extensions Mechanism**: `AgentCard.extensions` array for capability advertising
2. **Signatures**: `AgentCard.signatures` for cryptographic verification
3. **OAuth2 Metadata**: `AgentCard.oauthMetadataUrl` field for secure auth
4. **mTLS Support**: `SecuritySchemes` for mutual TLS
5. **Skills Security**: Skills can specify required security schemes

**GMA Protocol Formalization**:

1. **Extension Registration**: `oneagent/gma/v1.0` extension in AgentCard
2. **Message Types**:
   - `gma.create`: Create new MissionBrief specification
   - `gma.update_section`: Update specification section
   - `gma.update_task_status`: Mark task complete/in-progress
   - `gma.query_spec`: Retrieve current specification state
3. **Metadata Fields**:
   - `specId`: Unique specification identifier
   - `version`: Specification version (semantic versioning)
   - `lineage`: Parent specification IDs (for forking/branching)

**Deliverables** (~2-3 weeks focused work):

1. **A2A Protocol Migration**
   - File: `coreagent/protocols/a2a/A2AProtocol.ts` (major update)
   - Scope: Update 1300+ lines to v0.3.0 compliance
   - Testing: Comprehensive integration tests for breaking changes
   - Documentation: Migration guide for existing agents

2. **Well-Known URI Update**
   - File: `coreagent/server/unified-mcp-server.ts` (update)
   - Change: Implement new `/.well-known/agent-card.json` endpoint
   - Backward compatibility: Maintain legacy endpoint with deprecation warning
   - Monitoring: Track usage of both endpoints

3. **GMA Extension Implementation**
   - File: `coreagent/protocols/a2a/extensions/GMAExtension.ts` (new)
   - Purpose: Implement GMA message types and metadata schema
   - Integration: Wire into UnifiedAgentCommunicationService
   - Validation: JSON-RPC 2.0 compliance for all GMA messages

4. **AgentCard Enhancement**
   - Files: `coreagent/types/AgentCard.ts`, `coreagent/protocols/a2a/AgentCardManager.ts`
   - Updates: Add extensions, signatures, oauthMetadataUrl fields
   - Security: Implement signature verification
   - Discovery: Update agent discovery to advertise GMA capability

**Acceptance Criteria**:

- A2A v0.3.0 compliance: All breaking changes resolved
- GMA extension registered and discoverable via AgentCard
- Message types validated against JSON-RPC 2.0 specification
- Integration tests cover all GMA message types
- Security: Signatures verified, OAuth2 metadata accessible
- Performance: < 10% latency regression from v0.2.5
- Migration guide complete with code examples
- Backward compatibility period: 2 releases (deprecation warnings)

**Risk Mitigation**:

- Breaking changes: Phased rollout with feature flags, comprehensive testing
- Community alignment: A2A v0.3.0 is official release (Jul 30, 2025), mature ecosystem (20k stars)
- GMA adoption: Start with internal agents, document extension for external use
- Performance: Benchmark critical paths, optimize hot paths if needed

**Synergy with Phase 1**:

- GMA MVP (v4.5.0) proves spec-driven development pattern internally
- A2A v0.3.0 (v4.6.0) standardizes pattern for multi-agent collaboration
- Extensions mechanism enables other agents to discover/use GMA capability
- Memory audit captures full specification lifecycle across agent boundaries

### 5.3 Embeddings Cohesion & Canonical Flow (COMPLETED ✅ v4.4.2)

**Achievement Summary**:

- ✅ **Audit Complete**: Both OneAgent and mem0 are configured to use the canonical OneAgent `/api/v1/embeddings` endpoint for all embeddings.
- ✅ **Configuration**: `.env` sets `ONEAGENT_EMBEDDINGS_URL` and `ONEAGENT_EMBEDDINGS_SOURCE=node` for mem0; TypeScript and Python both load from this source.
- ✅ **Documentation**: `ONEAGENT_ARCHITECTURE.md` and `memory-system-architecture.md` updated with a new section on embeddings cohesion, canonical config, startup order, and troubleshooting.
- ✅ **No Fragmentation**: All config is environment-driven and surfaced in both systems; fallback to OpenAI only if endpoint is unavailable.
- ✅ **Startup Order Clarified**: Best practice is to start MCP (OneAgent) before mem0 to ensure endpoint availability.
- ✅ **Troubleshooting**: Checklist and log/error guidance added to docs.

**Next Steps**:

- Phase 4: End-to-end semantic search tests (cross-system memory discoverability)
- Expand monitoring and anomaly alerting for embeddings health/search quality
- User-facing testing and documentation for Copilot Chat and semantic search
- Update CHANGELOG.md with audit and doc changes

### 5.4 Canonical Cache & Release Automation (COMPLETED ✅ v4.2.2)

- All cross-cutting caches unified (`OneAgentUnifiedBackbone.getInstance().cache`)
- Discovery and web findings use canonical cache with TTL/backoff, negative caching
- Prometheus mission gauges, error rate, health aggregation
- Release workflow: tag push/create, verify gate, UI/extension build, error diagnostics, release notes from `RELEASE_NOTES/<tag>.md`
- Lint/static enforcement: no-parallel-cache, prefer-unified-time/id
- CI/CD: npm cache, timeouts, error log tail, artifact upload
- **Canonical roadmap guard**: `npm run check:canonical-files` enforces single `docs/ROADMAP.md`

Acceptance:

- No parallel time/ID/cache/memory/metrics systems ✅
- All caches route through canonical service ✅
- Negative caching and TTL/backoff in place ✅
- Release workflow passes verify, creates release, surfaces errors ✅
- Roadmap fragmentation prevented via CI guard ✅

### 5.5 Reliability & Observability (Expanded)

- Error Taxonomy Registry: `errorCodes.ts` enumerating stable codes; mapping function w/ unit tests ✅
- Histograms: Fixed bucket histogram + Prometheus exposition + tests ✅
- SLO Config: `slo.config.json` listing targets (latency/error budgets) + loader & validator ✅
- Alert Pack: `docs/monitoring/ALERTS.md` curated PromQL + rationale ✅
- Anomaly Detection (Phase 2): Z-score or seasonal baseline; emits structured `monitoring.anomaly` events ⏳
- Stream Uptime & Health: Track MCP `/mcp/stream` NDJSON stream uptime as a gauge; alert when below threshold ⏳

### 5.6 NLACS & Intelligence

- Entity Extraction: Baseline pattern extractor integrated into ChatAPI ✅
- Semantic Analysis: Optional `includeSemanticAnalysis` flag returns entities, intent, sentiment, complexity ✅
- Cross-Session Insights: Memory-driven insight detection ⏳
- Constitutional AI Pipeline: Validation for accuracy, transparency, helpfulness, safety ⏳
- **GMA Integration**: Spec-driven workflows enhance NLACS with structured context (v4.5.0) 🚀

### 5.7 Planner & Orchestration

**Orchestration** (v4.4.1 ✅):

- HybridAgentOrchestrator: Production-ready, BMAD agent selection pending
- ProactiveTriageOrchestrator: Live, circuit breakers integrated
- Event Streaming: 12 event types (TaskQueue: 9, AgentMatcher: 3)
- Performance Tracking: Weighted scoring (30% perf + 70% similarity)

**Patterns** (Canonical communication via UnifiedAgentCommunicationService):

- Reminder delegation: OfficeAgent + calendar connector ⏳
- Team meeting orchestration: Multi-agent session coordination ⏳
- Policy hooks: Governance pre/post checks ⏳
- Workflow controls: Retry/rollback/dynamic reassignment ⏳

**Planner** (Strategic):

- **Classic Approach** (v4.4.0): Task decomposition, dynamic replanning, memory-driven optimization
- **GMA Approach** (v4.5.0 🚀): MissionBrief.md specifications → GMACompiler orchestration
- **Hybrid Integration** (v5.0): Full NLACS + GMA + classic Planner

All agent-to-agent communication is routed through UnifiedAgentCommunicationService with NLACS extension and memory audit. No parallel communication systems permitted.

### 5.8 UI / UX Platform (Expanded)

**Phase A** (v4.5.0):

- Dashboard: Metrics, agents, memory explorer
- HTTP NDJSON stream / WebSocket events
- **Reactive Observability** (v4.3.0): Live auto-refresh < 2s, health delta banner
- Orchestration metrics table: Agent utilization + success rate from canonical events
- Domain selector: Scope views to domain (work/personal/etc.)
- **All UI surfaces connect via MCP interface** (canonical, no parallel APIs) 🚀

**Phase B** (v4.6.0):

- SLO visualization
- Error drill-down with taxonomy management console
- **GMA Specification Viewer**: Display MissionBrief.md with task status 🚀
- **A2A Protocol Inspector**: Visualize agent communication flows 🚀
- **MCP-based integration**: All features consume MCP endpoints (tools, resources, async ops) 🚀

**Phase C** (v5.1): Electron desktop app (MCP client with native integration)

**Phase D** (v5.2): Mobile apps (iOS/Android MCP clients)

Acceptance (Phase A minimum):

- Orchestration metrics table shows agent utilization and success rate ✅
- Live stream viewer connected to `/mcp/stream` with reconnection ⏳
- Health badge with < 500ms update latency ⏳
- Domain selector without cross-domain data leakage ⏳
- **GMA spec viewer with task status tracking** (v4.6.0) 🚀
- **All UI features consume MCP interface exclusively** (no parallel REST APIs) 🚀

### 5.9 Extensibility & Ecosystem (Expanded)

- Plugin Manifest Spec: Signed metadata file w/ declared capabilities, permissions
- Sandbox Execution: Process isolation or VM boundary for untrusted plugin code
- Version & Compatibility: Semver + capability negotiation fallback path
- Marketplace Bootstrap: Static index JSON + publishing CLI; later dynamic service
- Connector Framework: First‑party connectors for calendars, email, tasks, cloud drives; signed and sandboxed
- **A2A v0.3.0 Extensions**: `oneagent/gma/v1.0` enables GMA protocol discovery (v4.6.0) 🚀
- **MCP-based Plugin System**: All plugins connect via MCP interface (canonical, secure, discoverable) 🚀

**Key Insight**: OneAgent's dual-protocol architecture enables clean separation:

- **Internal Comms**: A2A SDK (agent-to-agent, NLACS, GMA, memory audit)
- **External Interface**: MCP SDK (VS Code, GUI apps, plugins, third-party integrations)
- **No Overlap**: A2A is for OneAgent's internal multi-agent coordination; MCP is for external world interaction

### 5.10 Performance & Scale (Expanded)

- Adaptive Sampling: Keep full detail for errors & tail latencies; sample high-volume successes
- Clustering: Stateless MCP frontends + shared memory + distributed event bus (NATS/Redis candidate)
- Cache Strategy: Multi-layer (in-memory + optional Redis) with TTL & invalidation events ✅
- Load / Stress Benchmarks: `scripts/perf/*.ts` harness + automated regression thresholds

Acceptance (initial):

- Baseline single-node sustained ops/sec published and guarded in CI perf check ⏳
- Adaptive sampling enabled for high-volume operations ⏳
- **GMA overhead**: Spec compilation < 100ms for typical MissionBrief (v4.5.0) 🚀

### 5.11 Governance & Compliance (Expanded)

- RFC Process: `docs/rfc/RFC-XXXX-title.md` template; merge gating for major changes
- Data Retention Policy: Configurable retention windows for memory categories
- Audit Dashboard: UI pane sourced from audit log queries
- Policy Engine: Declarative YAML rules for message content, PII redaction, export controls

Quality Gates (expanded):

- CI guard prevents non-canonical roadmap files (`*roadmap*.md` outside `docs/ROADMAP.md`) ✅
- Lint rule/guard to prevent banned metric names and non-taxonomy error strings
- **A2A v0.3.0 compliance check**: Automated validation of protocol conformance (v4.6.0) 🚀

### 5.12 Life Domains & Privacy (Expanded)

- Domain Profiles: Work, Personal, Health, Finance, Creative profiles—context compartments
- Consent Bridges: Default‑deny cross‑domain sharing; explicit, auditable consent required
- DLP Rules: Redaction and content filters tailored per domain
- Domain Switch UX: Explicit domain switcher in UI; automatic inference requires user confirmation
- Audit & Residency: Memory audit trails carry `domain` metadata; per‑domain retention policies

Acceptance:

- Cross‑domain leakage conformance tests pass (deny by default; explicit consent audited) ⏳
- Per‑domain metrics and policy counters visible in JSON + Prometheus ⏳
- **GMA specs respect domain boundaries**: No cross-domain task leakage (v4.5.0) 🚀

### 5.13 Model-Agnostic Routing (Expanded)

- UnifiedModelPicker Policies: Route by cost/quality/latency per role
- Hot‑Swap & Fallback: Seamless provider swap with minimal downtime
- Telemetry: Record route decisions, MTMS (mean time to model swap), task success by model class
- **GMA compilation routing**: Select models based on spec complexity (v4.5.0) 🚀

Acceptance:

- Policy tests demonstrate correct routing and fallbacks ⏳
- MTMS reported; cost per 1K tokens trend visible ⏳
- **GMA model selection**: Cheap models for simple specs, premium for complex (v4.5.0) 🚀

### 5.14 Research & Innovation (Expanded)

- Autonomous Improvement Loops: Agent proposes + validates code path enhancements
- Semantic Regression Detection: Diff embeddings between releases to flag behavioral drift
- Insight Ranking Model: Train lightweight model scoring emergent insights by impact
- **Spec Evolution Analysis**: Track MissionBrief.md patterns, suggest template improvements (v4.5.0+) 🚀
- **Agent Collaboration Graphs**: Visualize GMA-based multi-agent workflows (v4.6.0+) 🚀

## 6. Dependency Graph (High-Level)

```
Error Taxonomy → SLO Config → Alert Pack → UI Error Analytics
Histograms → Accurate p95/p99 + SLO reliability
Entity Extraction → Emergent Insights → Knowledge Graph → Planner Optimization
Circuit Breakers (v4.4.1 ✅) → Reactive Observability (v4.3.0) → Live Dashboard
Performance Tracking (v4.4.1 ✅) → Agent Selection Optimization → GMA Task Assignment
Event Streaming (v4.4.1 ✅) → Mission Control UI → Reactive Observability

**Epic 18 Dependencies**:
GMA MVP (v4.5.0) → PlannerAgent → GMACompiler → SpecLintingAgent
A2A v0.3.0 (v4.6.0) → GMA Protocol Formalization → Multi-Agent Spec Collaboration
GMA Specs → Memory Storage → Cross-Session Learning → Planner Optimization
Canonical roadmap guard (✅) → No parallel roadmaps → Clean governance

Planner Core → Dynamic Replanning → Capability Forecasting
Web UI Phase A → Phase B (SLO/Error/GMA views) → Phase C (Electron) → Phase D (Mobile)
Plugin Manifest → Sandbox Execution → Marketplace Launch
Adaptive Sampling → Clustering → Distributed Monitoring → Enterprise Scale (v6.0)
```

## 7. Risks & Mitigations

| Risk                              | Impact                    | Mitigation                                                                                   |
| --------------------------------- | ------------------------- | -------------------------------------------------------------------------------------------- |
| Error code explosion              | Metrics cardinality, cost | Enforce registry + sanitization + cap fallback `other`                                       |
| UI scope creep                    | Delayed releases          | Phased MVP; freeze scope per release branch                                                  |
| Planner complexity overrun        | Unstable planning         | Start heuristic baseline; **GMA provides simpler spec-driven alternative** 🚀                |
| Distributed state race conditions | Data inconsistency        | Event-sourced or idempotent operations + version checks                                      |
| Plugin security vulnerabilities   | Supply chain risk         | Mandatory signing + sandbox + permission manifest                                            |
| Observability overhead            | Latency inflation         | Sampling + async snapshot collection                                                         |
| Insight false positives           | User trust erosion        | Confidence scoring + manual review toggle                                                    |
| Roadmap fragmentation             | Architecture drift        | **CI guard enforces single roadmap** (`check:canonical-files`) ✅                            |
| Cross‑domain leakage              | Privacy breach, trust     | Default‑deny consent bridges; DLP rules; isolation tests in CI                               |
| Model provider cost/outage        | Cost spikes, instability  | Routing policies, hot‑swap providers, budget alerts                                          |
| **GMA spec complexity**           | Unusable templates        | **Start simple BMAD-style, iterate based on usage; SpecLintingAgent provides guardrails** 🚀 |
| **A2A v0.3.0 breaking changes**   | Migration effort          | **Phased rollout, feature flags, comprehensive testing, 2-release backward compat** 🚀       |

## 8. KPIs & Operational Metrics

| Category      | KPI                                   | Target v5.0 | Target v6.0 | v4.4.1 Status |
| ------------- | ------------------------------------- | ----------- | ----------- | ------------- |
| Reliability   | p95 core op latency                   | < 750ms     | < 500ms     | ~800ms        |
| Reliability   | Error budget burn (monthly)           | < 25%       | < 15%       | ~30%          |
| Reliability   | Circuit breaker effectiveness         | > 95%       | > 98%       | ✅ Tracked    |
| Observability | Alert MTTA                            | < 5m        | < 3m        | Not measured  |
| Intelligence  | Validated emergent insights / week    | 10          | 30          | 0             |
| Planning      | Avg plan success (no replan)          | 70%         | 85%         | Not measured  |
| Adoption      | Active plugins installed (avg)        | 5           | 25          | 0             |
| Scale         | Sustained ops/sec (single node)       | 150         | 400         | ~100          |
| Scale         | Cluster horizontal scaling efficiency | 70%         | 85%         | N/A           |
| Availability  | NDJSON stream uptime (monthly)        | 99.0%       | 99.9%       | ~98%          |
| UX            | Dashboard p95 load latency            | < 2s        | < 1s        | Not measured  |
| Privacy       | Domain leakage incidents (monthly)    | 0           | 0           | 0             |
| Routing       | MTMS (mean time to model swap)        | < 5m        | < 1m        | Not measured  |
| Routing       | Task success by model class (delta)   | +5%         | +10%        | Not measured  |
| Domains       | Domain switch latency p95             | < 500ms     | < 300ms     | Not measured  |
| **GMA**       | **Spec compilation success rate**     | **> 90%**   | **> 95%**   | **N/A** 🚀    |
| **GMA**       | **Avg spec-to-execution latency**     | **< 200ms** | **< 100ms** | **N/A** 🚀    |
| **MCP**       | **MCP official SDK adoption rate**    | **100%**    | **100%**    | **0%** 🚧     |
| **MCP**       | **OAuth2/mTLS auth success rate**     | **> 99%**   | **> 99.9%** | **N/A** 🚧    |
| **MCP**       | **Async operation completion rate**   | **> 95%**   | **> 98%**   | **N/A** �     |

## 9. Sunset / Decommission Plan

| Legacy Aspect                          | Action                           | Timeline   | Status         |
| -------------------------------------- | -------------------------------- | ---------- | -------------- |
| Ad-hoc error strings                   | Replace with registry codes      | v4.1       | ✅ Done        |
| Sequential metrics fetch               | Completed removal                | v4.0.7     | ✅ Done        |
| Placeholder NLACS fields w/ dummy data | Replace with real providers      | v4.3       | 🚧 Partial     |
| Lack of histograms                     | Implement HDR/buckets            | v4.2       | ✅ Done        |
| Non-structured alerts                  | Provide canonical pack           | v4.1       | ✅ Done        |
| Parallel roadmap documents             | Enforce single canonical         | v4.1       | ✅ Done        |
| **A2A v0.2.5**                         | **Upgrade to v0.3.0**            | **v4.6.0** | **Planned** 🚀 |
| **Classic planner without GMA**        | **Enhance with spec-driven dev** | **v4.5.0** | **Planned** 🚀 |
| **Legacy `/.well-known/agent.json`**   | **Deprecate, migrate to v0.3.0** | **v4.6.0** | **Planned** 🚀 |

## 10. Governance & Change Control

- Release Cadence: 4-week minor, 8-week strategic checkpoints
- RFC Threshold: Any new public API, storage schema, plugin contract, metric label addition, **protocol upgrades** 🚀
- Quality Gates: `npm run verify`, smoke tests, perf baseline delta (<10% regression), security lint
  - **CI Guard**: Fail build if a new `*roadmap*.md` appears outside `docs/ROADMAP.md` ✅
  - **A2A Compliance Check**: Automated v0.3.0 conformance validation (v4.6.0) 🚀
- Definition of Done: Code + tests + docs + changelog + **roadmap delta recorded** + **GMA specs validated** (v4.5.0+) 🚀

## 11. Implementation Principles (Reaffirmed)

- Single Source of Truth: Augment existing canonical services; never fork logic ✅
- Derivational Metrics: Prometheus exposition remains read-only, no shadow accumulators ✅
- Stability First: Introduce advanced features behind flags where risk > moderate ✅
- Progressive Enhancement: MVP → harden → optimize → extend sequence ✅
- Measured Ambition: Dream big (emergent intelligence & autonomous optimization) while grounding each milestone with observable KPIs ✅
- **Spec-Driven Development**: Markdown specifications as canonical source for agent workflows (v4.5.0+) 🚀
- **Protocol Evolution**: Embrace A2A ecosystem standards while maintaining OneAgent architectural integrity (v4.6.0+) 🚀

## 12. Immediate Action Queue (Execution Kickoff / Status) — v4.4.1+

| #      | Item                                                           | Target     | Status     | Notes                                                                                |
| ------ | -------------------------------------------------------------- | ---------- | ---------- | ------------------------------------------------------------------------------------ |
| 1      | Error Taxonomy Registry (`errorCodes.ts`)                      | v4.1       | ✅ Done    | Wired into Prometheus + JSON metrics + unified & secure handlers + monitoring events |
| 2      | Alert Pack (`docs/monitoring/ALERTS.md`)                       | v4.1       | ✅ Done    | Initial pack drafted                                                                 |
| 3      | Histogram layer in `PerformanceMonitor`                        | v4.2       | ✅ Done    | Fixed bucket histogram + Prometheus exposition + tests                               |
| 4      | NLACS entity extraction provider interface                     | v4.3       | ✅ Done    | Baseline pattern extractor integrated into ChatAPI                                   |
| 5      | Web UI scaffolding (`ui/web`) with metrics JSON                | v4.5       | 🚧 Partial | Scaffold + JSON endpoint live                                                        |
| 6      | SLO Config scaffold (`slo.config.json` + loader)               | v4.1       | ✅ Done    | Needs integration into alerting phase                                                |
| 7      | Error budget burn & remaining gauges (Prometheus + JSON)       | v4.1       | ✅ Done    | Gauges + JSON errorBudgets array derived from opSummary                              |
| 8      | Optional semanticAnalysis exposure in ChatAPI response         | v4.3       | ✅ Done    | Flag `includeSemanticAnalysis` returns entities, intent, sentiment, complexity       |
| 9      | Hybrid Orchestrator: BMAD agent selection                      | v4.4.0     | ⏳ Planned | Replace basic selection with BMAD + CAI validation                                   |
| 10     | Orchestration metrics: agent utilization + success rate        | v4.1       | ✅ Done    | Exposed via JSON + Prometheus; Phase A UI table pending                              |
| 11     | Orchestration policy hooks (governance pre/post checks)        | v4.4.0     | ⏳ Planned | Pluggable policies for message/task; audited denials                                 |
| 12     | Workflow controls: retry/rollback/dynamic reassignment         | v4.4.0     | ⏳ Planned | Step-level control with clear audit trail                                            |
| 13     | Clustering design doc for orchestrator                         | v4.5.0     | ⏳ Planned | Stateless frontends, shared memory index, distributed events                         |
| 14     | CI guard to prevent parallel roadmap files                     | v4.2.3     | ✅ Done    | `npm run check:canonical-files` enforces single `docs/ROADMAP.md`                    |
| 15     | Anomaly detection prototype (latency Z-score → events)         | v4.3.0     | ⏳ Planned | Emit `monitoring.anomaly` events; validate with synthetic spikes                     |
| 16     | NDJSON stream uptime gauge + alert                             | v4.3.0     | ⏳ Planned | Gauge + alert rule; surface in JSON + Prometheus                                     |
| 17     | Domain Profiles + Consent Bridges (MVP, policies + tests)      | v4.4.0     | ⏳ Planned | Implement domain compartments; CI conformance tests                                  |
| 18     | Model routing v1 (cost/quality/latency)                        | v4.4.0     | ⏳ Planned | Strengthen UnifiedModelPicker policies + telemetry                                   |
| 19     | Reminder delegation pattern (OfficeAgent + calendar connector) | v4.4.0     | ⏳ Planned | Orchestrator → OfficeAgent via unified comms; memory audit                           |
| 20     | Team meeting orchestration sample (multi‑agent session)        | v4.4.0     | ⏳ Planned | Orchestrator convenes agents; decisions/tasks stored in memory                       |
| 21     | Connector framework spec + initial adapters (calendar/email)   | v4.5.0     | ⏳ Planned | Signed/sandboxed connectors under Plugin SDK                                         |
| 22     | Canonical cache enforcement, release workflow automation       | v4.2.2     | ✅ Done    | All caches unified, negative caching, release workflow, lint enforcement             |
| 23     | **Circuit Breaker Pattern for TaskQueue**                      | v4.4.1     | ✅ Done    | Per-executor isolation, self-healing, 9 event types (v4.4.1 ✅)                      |
| 24     | **Performance-Weighted Agent Selection**                       | v4.4.1     | ✅ Done    | 30% perf + 70% similarity, adaptive learning, 3 event types (v4.4.1 ✅)              |
| 25     | **Real-Time Event Streaming (12 events)**                      | v4.4.1     | ✅ Done    | Mission Control ready (v4.4.1 ✅)                                                    |
| **26** | **GMA MVP: MissionBrief.md format & PlannerAgent**             | **v4.5.0** | **🚀 NEW** | **Spec template, PlannerAgent GMA, memory integration (~1 week)** 🚀                 |
| **27** | **GMA MVP: GMACompiler orchestrator & SpecLintingAgent**       | **v4.5.0** | **🚀 NEW** | **Compilation engine, spec linting, integration tests (~1 week)** 🚀                 |
| **28** | **A2A v0.3.0: Breaking changes migration**                     | **v4.6.0** | **🚀 NEW** | **Protocol upgrade, well-known URI, message format, auth (~2 weeks)** 🚀             |
| **29** | **A2A v0.3.0: GMA protocol formalization**                     | **v4.6.0** | **🚀 NEW** | **Extension registration, message types, AgentCard enhancement (~1 week)** 🚀        |
| **30** | **MCP Protocol: Official TypeScript SDK adoption**             | **v4.7.0** | **🚀 NEW** | **Replace custom impl with official SDK, OAuth2/mTLS foundation (~2 weeks)** 🚀      |
| **31** | **MCP Protocol: Async operations & server identity**           | **v4.7.0** | **🚀 NEW** | **Long-running tasks, .well-known discovery, stateless sessions (~1 week)** 🚀       |
| 32     | Reactive Observability: Event-driven metrics streaming         | v4.3.0     | ⏳ Planned | Live dashboard auto-refresh, WebSocket reconnect, health delta                       |
| 33     | Memory System: Search result caching (TTL-based)               | BACKLOG    | 💡 FUTURE  | Optional optimization; trigger: performance bottleneck identified                    |
| 34     | Memory System: Batch operations (bulk add/edit/delete)         | BACKLOG    | 💡 FUTURE  | Optional optimization; trigger: user demand for bulk imports/migrations              |
| 35     | Memory System: Memgraph backend completion                     | BACKLOG    | 💡 FUTURE  | Optional alternative backend; trigger: user demand for graph database                |

**Next Up (Prioritized)**:

1. **MCP Protocol Modernization** (v4.7.0): Official TypeScript SDK, OAuth2/mTLS, async ops, server identity (~3 weeks) 🚀
2. **Reactive Observability** (v4.3.0): Event-driven metrics streaming, live dashboard auto-refresh
3. **GMA MVP Phase 1** (v4.5.0): MissionBrief.md, PlannerAgent GMA, GMACompiler (~2 weeks) 🚀
4. **A2A v0.3.0 Phase 2** (v4.6.0): Protocol upgrade, GMA formalization (~2-3 weeks) 🚀
5. Anomaly detection prototype (operation latency Z-score events)
6. Enhanced entity extraction (model-based NER pipeline)
7. NLACS constitutional validation pipeline

## 13. Moonshot / Long-Horizon Initiatives

All moonshot initiatives use canonical UnifiedAgentCommunicationService with NLACS extension and memory audit. No parallel communication systems permitted. **All UI/UX surfaces connect via MCP interface** (no parallel APIs).

- Autonomous Refactoring Agent: Observes hotspots, drafts patch PRs with quality validation
- Self-Tuning Planner: Uses reinforcement signals to optimize decomposition strategies
- Federated Multi-Agent Mesh: Secure cross-instance collaboration with cryptographic capability tokens
- Temporal Analytics Engine: Time-series correlation across memory, operations, and insights
- **Spec Evolution Engine**: Analyzes MissionBrief.md patterns, suggests template improvements (GMA Phase 3) 🚀
- **Agent Collaboration Graphs**: Visualizes multi-agent workflows driven by GMA specifications (v4.6.0+) 🚀
- **Self-Optimizing GMA Templates**: Learns from successful specs, auto-improves templates (v5.0+) 🚀
- **MCP-Powered Multi-Modal Interface**: Voice, AR/VR, IoT devices all connect via MCP protocol (v6.0+) 🚀

## 14. Acceptance & Review

This roadmap is considered active once merged to `main`. Quarterly review cycle; monthly checkpoint updates appended in CHANGELOG "Roadmap Updates" section.

**v4.4.1 Milestone Achievements**:

- ✅ Orchestration Excellence: Circuit Breaker, Performance Tracking, Event Streaming
- ✅ Zero warnings, Grade A+ quality maintained
- ✅ 100% Constitutional AI compliance
- ✅ Canonical roadmap guard enforced
- 🚀 **Epic 18 approved**: GMA (v4.5.0) + A2A v0.3.0 (v4.6.0) phased implementation

**Strategic Pivot Rationale**:

Epic 18 represents proven pattern validation (GitHub engineer Tomas Vesely) and ecosystem alignment (A2A v0.3.0 official release). GMA solves context loss problem while maintaining OneAgent architectural integrity. A2A v0.3.0 extensions mechanism enables standardized multi-agent collaboration. Constitutional AI validation (92% Grade A+) confirms synergy and architectural fit.

**MCP Interface Strategy**:

OneAgent is a **standalone, fully functional multi-agent system** that operates independently OR as an MCP server. MCP is the **canonical interface layer** for all external interactions:

- **Internal Comms**: A2A SDK (agent-to-agent, NLACS, GMA, memory audit)
- **External Interface**: MCP SDK (VS Code, GUI apps, mobile, Electron, plugins)
- **No Overlap**: Clean separation ensures protocol integrity and maintainability

All future UI/UX surfaces (web dashboard, mobile apps, Electron app, voice interfaces) will connect exclusively via MCP endpoints. Adopting the official TypeScript MCP SDK and Nov 2025 spec ensures ecosystem compatibility, enterprise security (OAuth2/mTLS), and future-proof architecture.

---

**Maintainer**: Lead Developer (OneAgent)  
**Version**: 1.1.0 (Aligned to platform v4.4.1 + Epic 18)  
**Last Updated**: 2025-10-02  
**Next Review**: +30 days from merge
