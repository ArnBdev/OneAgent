# OneAgent Canonical Architecture (v4.2.0)

## Core Principles

- Modular, type-safe TypeScript agents
- Canonical memory system (`OneAgentMemory`)
- Unified agent communication (`UnifiedAgentCommunicationService` + A2A adapter) – no parallel paths
- Mission Control WebSocket (schema-driven, codegen backed) with mission registry aggregation
- Constitutional AI validation and BMAD analysis
- MCP server for VS Code Copilot and standalone operation

## Agent Design

- All agents extend `BaseAgent` and implement `ISpecializedAgent`
- Canonical backbone types: `MemoryRecord`, `MemoryMetadata`, `AgentResponse`, `AgentHealthStatus`
- Unified agent actions and endpoints via consolidated communication service

## Memory System

- Persistent, high-performance memory via RESTful API
- Canonical memory tools: add, search, edit, delete
- Memory-driven agent communication for context and learning (no legacy helpers)
- Proactive delegation + audit entries for queue operations

## Mission Control (NEW v4.2.0)

- WebSocket endpoint with modular channel registry (`metrics_tick`, `health_delta`, `mission_update`, `mission_stats`).
- JSON Schemas (inbound/outbound) generate discriminated TypeScript unions (codegen script).
- Mission registry provides O(1) lifecycle tracking & aggregate snapshots without ad-hoc caches.
- Cancellation messages (`mission_cancel`) terminate execution engines gracefully.

## MCP Server

- Unified entry point for VS Code Copilot integration
- Production-ready, zero TypeScript errors

## Quality & Validation

- Constitutional AI: accuracy, transparency, helpfulness, safety
- BMAD framework for systematic analysis
- Continuous quality scoring and validation (80%+ Grade A target)
- Schema-codegen drift guard for Mission Control messages

---

This is the canonical architecture document for OneAgent. All other architecture docs are archived or referenced here.
