# OneAgent Canonical Architecture & Vision Document

## 1. Vision & Purpose

OneAgent is a professional-grade, modular, and extensible multiagent platform designed to deliver advanced AI-powered development, orchestration, and memory intelligence. It is both a standalone multiagent system (with future plans for a dedicated GUI) and a Model Context Protocol (MCP) server for VS Code and other clients. OneAgent is built to be:
- The canonical reference for hybrid A2A (Agent-to-Agent) and MCP (RESTful, distributed) architectures.
- A platform for Constitutional AI, BMAD-driven analysis, and quality-first development.
- A foundation for both local and distributed agent collaboration, memory, and orchestration.

## 2. Core Technologies & Dependencies

- **TypeScript (strict mode):** All core logic, interfaces, and orchestration.
- **Node.js v22+**: Runtime environment.
- **MCP Protocol v4.0+**: RESTful, JSON-RPC 2.0, canonical for distributed agent registry, discovery, and memory.
- **A2A Protocol v0.2.5+**: In-memory, event-driven, for high-performance local agent-to-agent messaging.
- **@a2a-js/sdk**: Official SDK for A2A protocol.
- **mem0**: Canonical memory backend, RESTful and MCP-compliant.
- **Google Gemini/LLM**: For advanced AI, embeddings, and intelligence.
- **VS Code Extension API**: For integration as a VS Code MCP server.
- **Jest**: Testing framework.
- **Vite**: (Planned) for future standalone GUI frontend.

## 3. System Overview & Architecture

### 3.1. Multiagent Core
- **Agents**: Modular, specialized, and composable. All inherit from `BaseAgent` and are created via `AgentFactory`.
- **Canonical Interfaces**: `IAgentRegistry`, `IAgentDiscovery`, `IAgentCommunication` enforce all registry, discovery, and messaging.
- **Hybrid Registry/Discovery**: Combines in-memory (A2A) and RESTful (MCP) sources, with MCP as the source of truth for distributed scenarios.
- **Orchestration**: `HybridAgentOrchestrator` coordinates agent selection, task assignment, and advanced features (QuerySkill, dynamic UX, in-task authentication).

### 3.2. Memory System
- **OneAgentMemory**: Canonical, RESTful, and MCP-compliant memory client.
- **mem0 Backend**: Persistent, auditable, and versioned memory store.
- **Memory Intelligence**: Semantic search, embeddings, and context retrieval for agent workflows.
- **Audit Logging**: All critical actions, errors, and decisions are logged for traceability and compliance.

### 3.3. Protocols & Communication
- **A2A Protocol (v0.2.5+)**: **[IMPLEMENTED]** Full Google A2A specification compliance for true peer-to-peer agent communication. Features JSON-RPC 2.0 transport, Agent Card discovery, structured task management, rich message system, and enterprise security.
- **MCP Protocol (v4.0+)**: RESTful, distributed, and persistent registry, discovery, and memory. JSON-RPC 2.0 endpoints for all agent and memory operations.
- **Hybrid Communication**: Combines A2A (local, high-performance) and MCP (distributed, persistent) protocols for optimal performance and reliability.
- **Agent Discovery**: Agent Cards provide structured capability advertisement with skills, security schemes, and metadata for automatic agent discovery.
- **Task Lifecycle**: Complete task state management (submitted→working→completed/failed/canceled) with message history and artifact support.
- **Message System**: Multi-part messages supporting text, files, and structured data with metadata and cross-references.
- **Canonical Endpoints**: `/mcp/v4/agents`, `/mcp/v4/memory`, `/a2a/v0.2.5/message`, `/a2a/v0.2.5/task` etc.
- **Conflict Resolution**: MCP is authoritative; A2A provides high-performance local optimization. All discrepancies are logged and resolved per canonical rules.

### 3.4. Integration & Extensibility
- **VS Code MCP Server**: OneAgent exposes MCP endpoints for VS Code and other clients, enabling agent registry, discovery, and memory as a service.
- **Standalone GUI (Planned)**: Future Vite-based frontend for direct multiagent interaction, monitoring, and orchestration.
- **Plugin/Extension Model**: Agents, tools, and memory modules are pluggable and discoverable.

## 4. Quality, Compliance, and Best Practices

- **Constitutional AI**: All user-facing and critical logic validated for accuracy, transparency, helpfulness, and safety.
- **BMAD Framework**: Systematic 9-point analysis for all major architectural and process decisions.
- **Quality Scoring**: Minimum 80% (Grade A) enforced for all production code.
- **SOLID Principles**: Modular, testable, and maintainable codebase.
- **Auditability**: All actions, errors, and decisions are logged and traceable.

## 5. System Cohesion & How It Works Together

- **Agents** register and discover each other via canonical interfaces, using both in-memory (A2A) and RESTful (MCP) pathways.
- **Orchestrator** selects and coordinates agents for tasks, leveraging QuerySkill, dynamic UX, and in-task authentication.
- **Memory** is used for persistent context, audit logs, and semantic search, accessible to all agents and orchestration flows.
- **MCP endpoints** expose all registry, discovery, and memory operations for external clients (e.g., VS Code, future GUI).
- **Fallback and Resilience**: If MCP is unavailable, system falls back to in-memory operation, with all events logged.
- **Continuous Improvement**: BMAD and Constitutional AI validation are institutionalized for all future changes.

## 6. Implementation Status & System Capabilities (as of December 2024)

### Core Protocol Implementation
- **A2A Protocol**: ✅ **v0.2.5+ FULLY IMPLEMENTED** 
  - Complete Google A2A specification compliance
  - JSON-RPC 2.0 transport with all standard methods
  - Agent Card system for capability discovery
  - Task lifecycle management with full state tracking
  - Rich message system (text, files, data parts)
  - Enterprise security with authentication schemes
  - Memory integration for persistent conversations
  - Type-safe TypeScript implementation
- **MCP Protocol**: ✅ **v4.0+ FULLY IMPLEMENTED**
  - All endpoints canonical, RESTful, and JSON-RPC 2.0
  - Complete registry, discovery, and memory operations
  - VS Code integration and external client support

### Agent System Implementation
- **OneAgentMemory**: ✅ Canonical, MCP-compliant, and in production use
- **HybridAgentRegistry/Discovery/Orchestrator**: ✅ Fully implemented, tested, and documented
- **Agent Factory**: ✅ Dependency injection and capability management
- **Constitutional AI Integration**: ✅ Quality validation for critical decisions
- **BMAD Framework**: ✅ Systematic analysis for architectural decisions

### Integration & Extensibility
- **VS Code MCP Server**: ✅ Fully functional; exposes all agent and memory operations
- **Audit Logging, Error Handling, Fallback**: ✅ Robust and complete
- **Type Safety**: ✅ 100% TypeScript strict mode compliance
- **Quality Assurance**: ✅ 80%+ Grade A quality scoring implemented

### Future Development
- **Standalone GUI**: 🔄 Planned for future release (Vite-based frontend)
- **Advanced A2A Features**: 🔄 Streaming responses, agent mesh, workflow orchestration
- **Mobile SDK**: 🔄 Cross-platform agent interaction
- **Cloud Deployment**: 🔄 Scalable agent networks

## 7. Roadmap & Evolution

- **Short-term**: Continuous improvement, feedback-driven evolution, and rollout of new agent types and orchestration features.
- **Mid-term**: Launch of standalone GUI, expanded plugin ecosystem, and advanced memory intelligence features.
- **Long-term**: Position OneAgent as the canonical reference for professional multiagent systems, with seamless integration across IDEs, cloud, and local environments.

## 8. References & Further Reading

- [A2A Specification](https://a2aproject.github.io/A2A/specification/)
- [@a2a-js/sdk](https://github.com/a2aproject/a2a-js)
- [MCP Protocol](https://github.com/a2aproject/A2A)
- [OneAgent Documentation](docs/HYBRID_A2A_MCP_IMPLEMENTATION_PLAN.md)
- [BMAD Framework](https://github.com/a2aproject/A2A/discussions/741)
- [Constitutional AI Principles](docs/CONSTITUTIONAL_AI.md)

## 9. System Components & Technical Interactions

### 9.1. Core Systems
- **Agent System**: All agents inherit from `BaseAgent` and are instantiated via `AgentFactory`, which injects dependencies and ensures compliance with canonical interfaces. Agents expose capabilities, skills, and metadata via the `AgentCard` schema.
- **A2A Protocol System**: **[NEW]** Complete Google A2A v0.2.5 implementation providing true peer-to-peer agent communication. Features Agent Card discovery, task lifecycle management, rich message system, and enterprise security integration.
- **HybridAgentRegistry**: Maintains both in-memory (A2A) and MCP-backed registries. Handles registration, update, removal, and conflict resolution. MCP is authoritative; A2A provides high-performance local optimization.
- **HybridAgentDiscovery**: Provides search, filtering, and QuerySkill-based selection across both registries. Supports advanced filtering (health, version, credentials, authorization).
- **HybridAgentOrchestrator**: Coordinates agent selection, task assignment, and dynamic capability negotiation. Integrates with registry/discovery and enforces credential checks, error handling, and audit logging.
- **OneAgentMemory**: Canonical memory client for all agents and orchestration flows. Supports CRUD, semantic search, and context retrieval. All memory operations are MCP-compliant and auditable.
- **Memory Intelligence**: Provides semantic embeddings, context7 queries, and advanced memory analytics. Used for agent context, workflow continuity, and learning.
- **Audit Logging System**: All critical actions, errors, and decisions are logged with backbone metadata for traceability, compliance, and debugging.
- **Temporal System**: Tracks all time-based events, agent heartbeats, memory updates, and orchestrator actions. Enables time-based queries, scheduling, and historical analysis.
- **Backbone Metadata System**: Every entity (agent, memory entry, log, event) is tagged with structured metadata: timestamps, agent IDs, version, protocol, context, and lineage. This enables:
  - Full traceability and auditability
  - Temporal and causal queries
  - Cross-system correlation (e.g., linking memory events to agent actions)

### 9.2. Protocol & API Layer
- **A2A Protocol (v0.2.5+)**: **[FULLY IMPLEMENTED]** Complete Google A2A specification compliance for true peer-to-peer agent communication. Provides JSON-RPC 2.0 transport, Agent Card discovery system, task lifecycle management, rich message system, and enterprise security. Used for high-performance, low-latency agent-to-agent communication.
- **MCP Protocol (v4.0+)**: RESTful, JSON-RPC 2.0 endpoints for all registry, discovery, memory, and orchestration operations. Used for distributed, persistent, and cross-process scenarios.
- **Canonical Endpoints**:
  - **A2A Protocol**: `/a2a/v0.2.5/message/send`, `/a2a/v0.2.5/task/create`, `/a2a/v0.2.5/task/get`, `/a2a/v0.2.5/agent/info`
  - **MCP Protocol**: `/mcp/v4/agents` (register, update, remove, list, search), `/mcp/v4/memory` (CRUD, search, audit), `/mcp/v4/orchestration` (task assignment, coordination)
- **Protocol Integration**: Seamless bridging between A2A and MCP protocols with automatic protocol detection and routing based on communication context and performance requirements.
- **Version Negotiation**: All endpoints support versioning and backward compatibility.

### 9.3. Memory System Details
- **mem0 Backend**: Persistent, versioned, and auditable memory store. All memory entries are tagged with backbone metadata and temporal information.
- **Semantic Search & Embeddings**: Memory intelligence layer provides context7 queries, 768-dimensional embeddings, and similarity search for agent workflows.
- **Contextual Memory**: Agents and orchestrators retrieve relevant context for tasks, learning, and decision-making. Memory is used for both short-term (session) and long-term (institutional) knowledge.
- **Audit Trail**: Every memory operation (create, update, delete, query) is logged with full metadata for compliance and debugging.

### 9.4. Orchestration & Coordination
- **Task Assignment**: Orchestrator selects agents based on QuerySkill, capability, and context. Supports dynamic UX negotiation and in-task authentication.
- **Dynamic Capability Negotiation**: Agents can add/remove capabilities mid-task; orchestrator adapts coordination accordingly.
- **Error Handling & Fallback**: All orchestration flows include retry, backoff, and fallback to in-memory if MCP is unavailable. All errors are logged.
- **Audit Logging**: Every orchestration action is logged with backbone metadata and temporal context.

### 9.5. Integration & Extensibility
- **VS Code MCP Server**: Exposes all MCP endpoints for agent registry, discovery, memory, and orchestration. Enables VS Code and other clients to interact with OneAgent as a service.
- **Standalone GUI (Planned)**: Will provide direct multiagent interaction, monitoring, and orchestration via a Vite-based frontend.
- **Plugin/Extension Model**: Agents, tools, and memory modules are pluggable. Discovery and registration are handled via canonical interfaces.

### 9.6. System Cohesion & Data Flow
- **Agents** register and discover each other via registry/discovery APIs. All actions are logged with backbone metadata.
- **Orchestrator** coordinates tasks, leveraging memory intelligence and temporal data for optimal agent selection.
- **Memory** is the central context store, with all entries tagged for traceability and learning.
- **Audit Logging** and **Temporal System** ensure every action, event, and decision is traceable, queryable, and reproducible.
- **Backbone Metadata** links all systems, enabling cross-domain analytics, compliance, and debugging.

---

**This document is the single source of truth for OneAgent architecture, vision, and implementation. Update as the system evolves.**
