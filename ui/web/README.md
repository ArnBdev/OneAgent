# OneAgent Web UI (Phase A Scaffold)

## Purpose

Early scaffold for Phase A dashboard (metrics, agents, memory search). Intentionally minimal to validate API surfaces before full component investment.

## Planned Incremental Components

1. Metrics Dashboard (Latency & Error Gauges)
2. Agent Registry View (List + capability filters)
3. Memory Search Explorer (Query + metadata facets)
4. Live Event Stream (SSE/WebSocket placeholder)

## Architectural Principles

- Read-only first: No mutation endpoints until auth & policy layer defined.
- Derivational data: All metrics pulled from existing Prometheus or future JSON mirror endpoint.
- Single source: No caching layer inside UI that becomes authoritative.
- Type-safety: Shared TypeScript types imported from core where feasible (avoid duplication).

## Next Steps

- Implement metrics JSON endpoint in server (mirror of Prometheus exposition).
- Create lightweight fetch client and hook utilities.
- Add `pnpm`/`npm` workspace wiring if monorepo segmentation required.

## Commands

Use existing root scripts for now (vite already configured):

```
npm run ui:dev
```

## Timeline Alignment

Maps to roadmap v4.5 (Phase A). Do not overbuild prior to error taxonomy & SLO finalization.

---

Maintainer: UI Lead (OneAgent)
Status: Scaffold
