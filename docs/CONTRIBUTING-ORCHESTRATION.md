# Contributing: Orchestration Patterns

This guide outlines how to extend orchestration safely using canonical systems.

## Canonical Services

- Time/ID/Metadata: `UnifiedBackboneService`
- Memory: `OneAgentMemory`
- Communication: `UnifiedAgentCommunicationService`
- Monitoring: `UnifiedMonitoringService`

Never create parallel systems (no custom caches, clocks, IDs, or metrics stores).

## Extending HybridAgentOrchestrator

- Agent Selection: add BMAD analysis inside `selectOptimalAgent` (keep deterministic output + reason strings). Store selection rationale via `logOperation`.
- Task Assignment: include minimal context in metadata; avoid sensitive content. Use `addMemoryCanonical` only.
- Workflow Steps: validate dependencies and provide clear audit logs for retry/rollback.

## Proactive Orchestration

- Use `ProactiveTriageOrchestrator` for periodic triage + deep analysis. Do not create new schedulers. Configure via env flags.

## Policy/Governance Hooks

- Add pre/post checks around send/assign operations. Denials must be audited with taxonomy code.

## Testing & CI

- No `process.exit` in tests/scripts. Throw errors; rely on the test runner.
- Use `npm run verify` before PR. Lint/type must be clean.

## Documentation

- Update `docs/ORCHESTRATION_OVERVIEW.md` and `docs/roadmap.md` for any public behavior changes.
