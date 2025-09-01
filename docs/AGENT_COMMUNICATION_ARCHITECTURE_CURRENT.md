# Agent Communication Architecture (Current Canonical State)

## Purpose

Establish a single, memory-driven, auditable channel for all agent-to-agent (A2A) and NLACS (Natural Language Agent Coordination System) interactions.

## Components

- **UnifiedAgentCommunicationService**: Internal backbone implementing registration, discovery, sessions, messaging, facilitation, consensus, insight synthesis. All operations instrumented via unified monitoring.
- **A2AProtocol** (`protocols/a2a/A2AProtocol.ts`): Spec-compliant façade + NLACS extensions (discussions, insights, knowledge synthesis). Delegates persistence to the adapter; no direct ad-hoc metadata construction.
- **CommunicationPersistenceAdapter** (`communication/CommunicationPersistenceAdapter.ts`): Canonical persistence layer for messages, discussions, contributions, insights, synthesized knowledge, status, tasks, and discussion aggregate updates.
- **OneAgentEngine**: Exposes `oneagent_a2a_*` tool methods routing to the unified service.
- **OneAgentMemory**: Persistent canonical store of all communication artifacts (agent registrations, sessions, messages, discussions, insights, synthesized knowledge).

## Memory-Driven Principle

Every meaningful communication event results in a `addMemoryCanonical` call with normalized metadata. This enables:

1. Auditing (who said what, when, context)
2. Retrospective learning (pattern detection, synthesis)
3. Operational metrics (latency, volume, error rate)

## Non-Goals / Explicitly Avoided

- No secondary message bus (queues, ad-hoc EventEmitter chains) for cross-agent communication.
- No parallel persistence formats outside canonical unified metadata service.

## Fast Test Mode

`ONEAGENT_FAST_TEST_MODE=1` activates ephemeral in-memory maps inside `UnifiedAgentCommunicationService` to reduce latency in CI. This is an optimization branch, not a parallel architecture.

## Consolidation Status

- Legacy multiple communication pathways: REMOVED / INTEGRATED
- Legacy helpers (`storeA2AMemory`, `storeTaskInMemory`): REMOVED
- Single canonical persistence path: CommunicationPersistenceAdapter
- Instrumentation coverage: 100% of `COMM_OPERATION` entries (latency avg/p95/p99)

## Canonical Operations (Initial Set)

Defined in `coreagent/types/communication-constants.ts` under `COMM_OPERATION`.

## Upcoming Enhancements (Post-Consolidation)

1. Error taxonomy surfaced as per-operation error counters
2. Parallelize metrics exposition (performance optimization)
3. Adaptive routing (agent subset selection)
4. Replay & simulation endpoint
5. Advanced semantic threading & summarization

## Metadata Normalization (Target Schema Keys)

- `fromAgent`, `toAgent`, `messageType`, `priority`, `discussionId`, `contributionType`, `context`, `insightId`, `knowledgeId`.

## Instrumentation Strategy

All high-level methods wrap core logic with `unifiedMonitoringService.trackOperation(component, operation, status, meta)`.

## Migration Guardrails

- Any new agent communication feature MUST register a `COMM_OPERATION` identifier.
- Any direct `addMemoryCanonical` call in communication layers should add standardized keys from `COMM_METADATA_KEYS`.

## Future Work

- Adaptive routing (agent subset selection)
- Replay & simulation endpoint
- Advanced semantic threading & incremental summarization
- Error code dimensions in metrics

---

Maintained as canonical reference. Update this document whenever communication capabilities evolve.
