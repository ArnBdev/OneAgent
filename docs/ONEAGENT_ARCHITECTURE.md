# OneAgent Canonical Architecture

## Core Principles

- Modular, type-safe TypeScript agents
- Canonical memory system (`OneAgentMemory`, `MemoryDrivenAgentCommunication`)
- Constitutional AI validation and BMAD analysis
- MCP server for VS Code Copilot and standalone operation

## Agent Design

- All agents extend `BaseAgent` and implement `ISpecializedAgent`
- Canonical backbone types: `MemoryRecord`, `MemoryMetadata`, `AgentResponse`, `AgentHealthStatus`
- Unified agent actions and endpoints

## Memory System

- Persistent, high-performance memory via RESTful API
- Canonical memory tools: add, search, edit, delete
- Memory-driven agent communication for context and learning

## MCP Server

- Unified entry point for VS Code Copilot integration
- Production-ready, zero TypeScript errors

## Quality & Validation

- Constitutional AI: accuracy, transparency, helpfulness, safety
- BMAD framework for systematic analysis
- Continuous quality scoring and validation

---

This is the canonical architecture document for OneAgent. All other architecture docs are archived or referenced here.
