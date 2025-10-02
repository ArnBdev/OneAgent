# OneAgent AGENTS.md — Canonical Agent Instructions

> Scope: Repository-wide. This is the single source of truth for agent instructions. Do not create parallel agent instruction files. If path-specific guidance is needed, prefer `.github/instructions/**/*.instructions.md` that reference this file.

## Project Overview

OneAgent is a professional multi-agent AI platform with canonical systems for time, ID, memory, cache, monitoring, and unified agent communication (A2A) with NLACS extension and full memory audit. The platform targets reliability, observability, privacy, model-agnostic routing, and extensibility.

- Canonical services: UnifiedBackboneService, OneAgentMemory, OneAgentUnifiedBackbone.cache, UnifiedAgentCommunicationService (A2A + NLACS + memory audit)
- Highest priority: Keep agent communication consolidated; no parallel implementations
- TypeScript: strict mode throughout; professional-grade error handling and metrics

## Architecture & Canonical Patterns

- Time: `createUnifiedTimestamp()`
- IDs: `createUnifiedId('operation','context')`
- Cache: `OneAgentUnifiedBackbone.getInstance().cache`
- Memory: `OneAgentMemory.getInstance()` (pluggable, MCP/JSON-RPC-compliant; see `IMemoryClient` and [docs/memory-system-architecture.md](./docs/memory-system-architecture.md))
  - **Audit Status**: ✅ CERTIFIED PRODUCTION READY (Oct 2, 2025) - see [docs/reports/MEMORY_SYSTEM_AUDIT_2025-10-02.md](./docs/reports/MEMORY_SYSTEM_AUDIT_2025-10-02.md)
- Communication: `UnifiedAgentCommunicationService` only (A2A + NLACS + memory audit)
- Error handling: `UnifiedBackboneService.errorHandler` with taxonomy codes
- Monitoring: PerformanceMonitor histograms, gauges, JSON + Prometheus exposition

Forbidden (parallel systems): direct `Date.now()`, custom ID/caches/memory, ad-hoc comms, shadow metrics stores. All memory operations must use the canonical `OneAgentMemory` singleton and strict `IMemoryClient` interface.

**Memory System Compliance**: All 40+ integration points verified. No violations found. Architecture follows proper singleton patterns, dependency injection, and Constitutional AI principles. See audit report for detailed verification.

Unified cache policy and env notes

- Cross-cutting caching must use `OneAgentUnifiedBackbone.getInstance().cache`; avoid module-level `Map`-based caches.
- Agent discovery uses unified cache with TTL: tune via `ONEAGENT_DISCOVERY_TTL_MS` and `ONEAGENT_DISCOVERY_TTL_EMPTY_MS` (CI can raise empty TTL to reduce churn).
- Web findings (search/fetch) write-through to unified cache with per-item TTL; disable local map indices with `ONEAGENT_WEBFINDINGS_DISABLE_LOCAL_CACHE=1`. Negative caching for no-result queries can be tuned via `ONEAGENT_WEBFINDINGS_NEG_TTL_MS`.

## Build, Test, Verify

- Install: `npm ci`
- Verify (type + lint): `npm run verify`
- Lint only: `npm run lint`
- Runtime quick check: `npm run verify:runtime`
- Start unified MCP server: `npm run server:unified`
- Start memory backend (Python): `npm run memory:server`
- Production startup (Windows PowerShell): `./scripts/start-oneagent-system.ps1`

Tests (examples):

- A2A events smoke: `node -r ts-node/register tests/canonical/a2a-events.smoke.test.ts`
- Perf harness lives in `scripts/perf/*.ts`

CI quality gates (must pass): typecheck, lint, smoke, perf baseline (<10% regression), security lint.

## VS Code & Copilot Coding Agent

- This `AGENTS.md` is intentionally at repo root to be auto-discovered by Copilot coding agent.
- See [docs/IDE_SETUP.md](./docs/IDE_SETUP.md) for Copilot Chat wiring, recommended extensions, and DX tips.
- Copilot Chat expects command-based MCP (see `.vscode/mcp.json`). The HTTP endpoint is for tooling/debug only.
- Create a BMAD story from VS Code: Run the "Create Story (BMAD template)" task and enter a title.
- Or via npm: `npm run story:new -- "Your Story Title"`
- Keep issues well-scoped with explicit acceptance criteria and targeted file paths.
- Use repository-wide instructions here; add optional path-scoped rules in `.github/instructions/**/*.instructions.md` (e.g., tests, Playwright, React) that reference this file.
- MCP: Use the unified server (`npm run server:unified`); only approved tools per OneAgent docs. Avoid inventing tools.
- Optional acceleration: Add `copilot-setup-steps.yml` to preinstall dependencies in Copilot’s ephemeral env when needed.

## Safety & Constitutional AI

- Principles: Accuracy, Transparency, Helpfulness, Safety — strictly enforced.
- Privacy & Domains: Default-deny cross-domain bridges; consent required and audited. DLP enforced; denials are monitored with taxonomy codes.
- Harmful content: Do not generate harmful/hateful/sexual/violent content. Follow policy redaction and safe output handling.

## Coding Conventions

- TypeScript strict; comprehensive error handling; self-documenting code
- Prefer existing interfaces and types in `coreagent/types` and base classes in `coreagent/agents/base`
- For new agents: extend `BaseAgent` and implement `ISpecializedAgent`
- Implement required methods: `initialize()`, `processMessage()`, `getAvailableActions()`, `executeAction()`
- Always route through canonical services; never fork or create parallel logic

## Monitoring & Metrics

- Use canonical histograms for latency (p50/p90/p95/p99); gauges for SLO targets and error budget burn
- Expose metrics via JSON + Prometheus only; no shadow accumulators
- Log `monitoring.anomaly` events for anomaly detection prototypes

## Governance & Change Control

- Roadmap: single canonical file at `docs/ROADMAP.md` (no duplicates)
- RFC required for public API, storage schema, plugin contract, or metric label additions
- Definition of Done: Code + tests + docs + changelog + roadmap delta recorded

### Canonical governance guard (automated)

- Guard script: `npm run check:canonical-files` runs in `npm run verify` and in CI.
- It enforces:
  - Exactly one roadmap at `docs/ROADMAP.md` (no other `*roadmap*.md`).
  - A single root `AGENTS.md` as authoritative.
  - Warns when path-scoped instructions don’t reference this `AGENTS.md`.
- Windows note (case-only rename): if you see a warning about `docs/roadmap.md` casing, do a two-step rename in git:
  1.  `git mv docs/roadmap.md docs/ROADMAP_tmp.md`
  2.  `git mv docs/ROADMAP_tmp.md docs/ROADMAP.md`
      Commit both steps to normalize the filename case.

## Path-Specific Guidance (Link-outs)

- TypeScript development standards: `.github/instructions/typescript-development.instructions.md`
- Testing standards: `.github/instructions/testing-standards.instructions.md`
- If path-scoped instruction files are added, they must reference this `AGENTS.md` and avoid duplicating rules.

## Model Routing & Extensibility

- Model routing via `UnifiedModelPicker` with cost/quality/latency policies; enable hot-swap + fallback
- Plugins/connectors: follow signed manifests, sandbox execution, and permissioned capabilities
- No parallel client libraries for connectors; integrate under Plugin SDK

## Pull Requests & Workflow

- Before commit: `npm run verify` (type + lint) must pass
- Ensure tests exist for public behavior changes
- For agent communication changes: confirm route through `UnifiedAgentCommunicationService` and memory audit entries
- For observability: ensure metrics/taxonomy compliance and JSON + Prometheus exposure

## Do / Don’t Quick Reference

Do:

- Use UnifiedBackboneService, OneAgentMemory, UnifiedAgentCommunicationService
- Add tests and metrics when touching public behavior or hot paths
- Document domain/privacy implications and audit trails

Don’t:

- Create ad-hoc time/ID/memory/cache/communication subsystems
- Add roadmap variants or shadow instruction files
- Emit non-taxonomy error strings in monitored paths

## Contact & Ownership

- Maintainer: Lead Developer (OneAgent)
- Architecture: See `docs/ONEAGENT_ARCHITECTURE.md` and `docs/AGENT_COMMUNICATION_CONSOLIDATION_PLAN.md`
- Monitoring: See `OPERATION_METRICS.md` and `docs/monitoring/ALERTS.md`

---

This file is canonical for agent behavior. Tools that support nested `AGENTS.md` MUST defer to this file unless a path-scoped instructions file explicitly overrides behavior for its scope (and still references this file).
