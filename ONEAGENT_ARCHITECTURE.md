# OneAgent Canonical Architecture & Vision Document

## 1. Vision & Purpose

OneAgent is a **professional-grade, modular, and extensible multiagent platform** designed to deliver advanced AI-powered development, orchestration, and **memory-driven intelligence**. It operates as both a **standalone multiagent system** and a **Model Context Protocol (MCP) server** for VS Code and other clients. OneAgent represents the next generation of AI agent coordination, featuring **Natural Language Agent Coordination System (NLACS)** for emergent intelligence and **Phase 4 Memory-Driven Intelligence** for learning-driven optimization.

OneAgent is built to be:
- **The canonical reference** for hybrid A2A (Agent-to-Agent) and MCP (RESTful, distributed) architectures
- **A platform for Constitutional AI**, BMAD-driven analysis, and quality-first development
- **A foundation for emergent intelligence** through natural language agent coordination
- **The world's first memory-driven intelligence platform** with cross-conversation learning capabilities
- **The industry standard** for both local and distributed agent collaboration, memory, and orchestration

## 2. Core Technologies & Dependencies

### 2.1 Runtime & Language
- **TypeScript (strict mode)**: All core logic, interfaces, and orchestration
- **Node.js v22+**: Runtime environment with latest features
- **ES2022 Modules**: Modern JavaScript with CommonJS compatibility

### 2.2 Communication Protocols
- **MCP Protocol v4.0+**: RESTful, JSON-RPC 2.0, canonical for distributed agent registry, discovery, and memory
- **A2A Protocol v0.2.5+**: In-memory, event-driven, for high-performance local agent-to-agent messaging
- **NLACS Protocol v5.0+**: Natural Language Agent Coordination System for emergent intelligence
- **@a2a-js/sdk**: Official SDK for A2A protocol implementation

### 2.3 Memory & Intelligence
- **mem0**: Canonical memory backend, RESTful and MCP-compliant
- **Google Gemini/LLM**: For advanced AI, embeddings, and intelligence
- **Constitutional AI**: Built-in safety and ethical validation
- **BMAD Framework**: 9-point systematic analysis methodology
- **Phase 4 Memory-Driven Intelligence**: Cross-conversation learning, pattern recognition, and emergent intelligence synthesis

### 2.4 Integration & Tooling
- **VS Code Extension API**: For integration as a VS Code MCP server
- **Jest**: Comprehensive testing framework
- **Vite**: (Planned) for future standalone GUI frontend
- **ESLint**: Code quality and consistency enforcement

## 3. System Overview & Architecture

### 3.1 Multiagent Core
- **Agents**: Modular, specialized, and composable. All inherit from `BaseAgent` and are created via `AgentFactory`
- **Canonical Interfaces**: `IAgentRegistry`, `IAgentDiscovery`, `IAgentCommunication` enforce all registry, discovery, and messaging
- **Hybrid Registry/Discovery**: Combines in-memory (A2A) and RESTful (MCP) sources, with MCP as the source of truth for distributed scenarios
- **Orchestration**: `HybridAgentOrchestrator` coordinates agent selection, task assignment, and advanced features (QuerySkill, dynamic UX, in-task authentication)

### 3.2 Memory System
- **OneAgentMemory**: Canonical, RESTful, and MCP-compliant memory client
- **mem0 Backend**: Persistent, auditable, and versioned memory store
- **Memory Intelligence**: Semantic search, embeddings, and context retrieval for agent workflows
- **Cross-Conversation Learning**: **[PHASE 4 IMPLEMENTED]** Pattern recognition and knowledge transfer across sessions
- **Audit Logging**: All critical actions, errors, and decisions are logged for traceability and compliance

### 3.3 **Phase 4 Memory-Driven Intelligence System**
- **CrossConversationLearningEngine**: **[IMPLEMENTED]** Analyzes conversation patterns, extracts successful workflows, and applies learning to new conversations
- **EmergentIntelligenceEngine**: **[IMPLEMENTED]** Detects breakthrough insights, synthesizes intelligence across domains, and evolves institutional memory
- **MemoryDrivenOptimizer**: **[IMPLEMENTED]** Suggests workflow optimizations, generates memory-driven insights, and optimizes resource allocation
- **Phase4Integration**: **[IMPLEMENTED]** Unified interface for all memory-driven intelligence capabilities

### 3.3 Protocols & Communication
- **A2A Protocol (v0.2.5+)**: **[IMPLEMENTED]** Full Google A2A specification compliance for true peer-to-peer agent communication. Features JSON-RPC 2.0 transport, Agent Card discovery, structured task management, rich message system, and enterprise security
- **MCP Protocol (v4.0+)**: RESTful, distributed, and persistent registry, discovery, and memory. JSON-RPC 2.0 endpoints for all agent and memory operations
- **NLACS Protocol (v5.0+)**: **[NEW]** Natural Language Agent Coordination System enabling emergent intelligence through conversational agent coordination
- **Hybrid Communication**: Combines A2A (local, high-performance) and MCP (distributed, persistent) protocols for optimal performance and reliability
- **Agent Discovery**: Agent Cards provide structured capability advertisement with skills, security schemes, and metadata for automatic agent discovery
- **Task Lifecycle**: Complete task state management (submitted→working→completed/failed/canceled) with message history and artifact support
- **Message System**: Multi-part messages supporting text, files, and structured data with metadata and cross-references
- **Canonical Endpoints**: `/mcp/v4/agents`, `/mcp/v4/memory`, `/a2a/v0.2.5/message`, `/a2a/v0.2.5/task`, `/nlacs/v5/discussions` etc.
- **Conflict Resolution**: MCP is authoritative; A2A provides high-performance local optimization. All discrepancies are logged and resolved per canonical rules

### 3.4 Integration & Extensibility
- **VS Code MCP Server**: OneAgent exposes MCP endpoints for VS Code and other clients, enabling agent registry, discovery, and memory as a service
- **Standalone GUI (Planned)**: Future Vite-based frontend for direct multiagent interaction, monitoring, and orchestration
- **Plugin/Extension Model**: Agents, tools, and memory modules are pluggable and discoverable

## 4. **NEW: NLACS (Natural Language Agent Coordination System) v5.0**

### 4.1 NLACS Overview
NLACS represents a **paradigm shift** from traditional programmatic agent coordination to **natural language-based coordination**, enabling:

- **Emergent Intelligence**: Insights that emerge from multi-agent conversations
- **Knowledge Synthesis**: Combining agent expertise across domains
- **Constitutional AI Integration**: Ensuring safe and ethical coordination
- **Memory-Enhanced Discussions**: Persistent conversation context and learning

### 4.2 NLACS Architecture
- **NLACSCoordinator**: Central service managing natural language discussions
- **BaseAgent NLACS Extensions**: Agent-level natural language capabilities
- **Discussion Management**: Initialize, coordinate, and conclude multi-agent discussions
- **Emergent Insight Generation**: Automated synthesis of collective intelligence
- **Conversation Memory**: Persistent learning from agent interactions

### 4.3 NLACS Types & Interfaces
```typescript
interface NLACSDiscussion {
  id: string;
  topic: string;
  messages: NLACSMessage[];
  participants: Set<string>;
  emergentInsights: EmergentInsight[];
  status: 'active' | 'concluded' | 'paused';
  createdAt: Date;
  lastActivity: Date;
}

interface NLACSMessage {
  id: string;
  discussionId: string;
  agentId: string;
  content: string;
  messageType: 'question' | 'contribution' | 'synthesis' | 'insight' | 'consensus';
  timestamp: Date;
  processedAt?: Date;
  metadata?: Record<string, unknown>;
}

interface EmergentInsight {
  id: string;
  type: 'pattern' | 'synthesis' | 'breakthrough' | 'connection' | 'optimization';
  content: string;
  confidence: number;
  sources: string[];
  discoveredAt: Date;
  contributingAgents: string[];
}
```

### 4.4 NLACS Hybrid Integration
- **100% Backwards Compatibility**: All existing A2A and MCP functionality preserved
- **Additive Architecture**: NLACS capabilities are opt-in enhancements
- **Unified Agent Interface**: Single BaseAgent class supports all three protocols
- **Memory Integration**: Shared memory context across all protocols

## 5. Quality, Compliance, and Best Practices

- **Constitutional AI**: All user-facing and critical logic validated for accuracy, transparency, helpfulness, and safety
- **BMAD Framework**: Systematic 9-point analysis for all major architectural and process decisions
- **Quality Scoring**: Minimum 80% (Grade A) enforced for all production code
- **SOLID Principles**: Modular, testable, and maintainable codebase
- **Auditability**: All actions, errors, and decisions are logged and traceable

## 6. System Cohesion & How It Works Together

- **Agents** register and discover each other via canonical interfaces, using both in-memory (A2A) and RESTful (MCP) pathways
- **NLACS** enables natural language coordination between agents for emergent intelligence
- **Orchestrator** selects and coordinates agents for tasks, leveraging QuerySkill, dynamic UX, and in-task authentication
- **Memory** is used for persistent context, audit logs, and semantic search, accessible to all agents and orchestration flows
- **MCP endpoints** expose all registry, discovery, and memory operations for external clients (e.g., VS Code, future GUI)
- **Fallback and Resilience**: If MCP is unavailable, system falls back to in-memory operation, with all events logged
- **Continuous Improvement**: BMAD and Constitutional AI validation are institutionalized for all future changes

## 7. Implementation Status & System Capabilities

### 7.1 Core Protocol Implementation
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
- **NLACS Protocol**: 🔄 **v5.0+ PHASE 1 IN PROGRESS**
  - Natural language coordination system (NLACSCoordinator implemented)
  - Emergent intelligence generation (basic implementation)
  - Constitutional AI integration (implemented)
  - Memory-enhanced conversations (implemented)
  - BaseAgent NLACS extensions (need restoration after git revert)

### 7.2 Agent System Implementation
- **OneAgentMemory**: ✅ Canonical, MCP-compliant, and in production use
- **HybridAgentRegistry/Discovery/Orchestrator**: ✅ Fully implemented, tested, and documented
- **Agent Factory**: ✅ Dependency injection and capability management
- **Constitutional AI Integration**: ✅ Quality validation for critical decisions
- **BMAD Framework**: ✅ Systematic analysis for architectural decisions
- **BaseAgent NLACS Extensions**: 🔄 Natural language coordination capabilities (need restoration)

### 7.3 Integration & Extensibility
- **VS Code MCP Server**: ✅ Fully functional; exposes all agent and memory operations
- **Audit Logging, Error Handling, Fallback**: ✅ Robust and complete
- **Type Safety**: ✅ 100% TypeScript strict mode compliance
- **Quality Assurance**: ✅ 80%+ Grade A quality scoring implemented

### 7.4 Implementation Status Summary
- **Phase 1 NLACS**: ✅ **COMPLETE** - NLACSCoordinator implemented, BaseAgent extensions restored
- **Phase 2 Planning Agent**: ✅ **COMPLETE** - Dynamic planner with Constitutional AI validation
- **Phase 3 Multi-Agent Coordination**: ✅ **COMPLETE** - 9 A2A tools integrated into OneAgentEngine with full Constitutional AI validation
- **Foundation Systems**: ✅ **FULLY OPERATIONAL** - A2A, MCP, Memory, Agent Factory, Constitutional AI all working

## 8. Roadmap & Evolution

### 8.1 Short-term (Current)
- **Phase 4 Memory-Driven Intelligence**: Cross-conversation learning, pattern recognition, and emergent intelligence synthesis
- **Enhanced Multi-Agent Coordination**: Optimization and performance improvements for A2A coordination
- **Memory Intelligence**: Advanced pattern recognition and institutional memory evolution
- **Quality Improvements**: Continuous feedback-driven evolution

### 8.2 Mid-term
- **Phase 4 Memory-Driven Intelligence**: 
  - Cross-conversation learning patterns
  - Pattern recognition algorithms for successful workflows
  - Emergent intelligence synthesis from multi-agent interactions
  - Institutional memory evolution and optimization
  - Breakthrough insight detection and application
- **Standalone GUI**: Launch of Vite-based frontend
- **Plugin Ecosystem**: Expanded agent and tool marketplace
- **Advanced Memory Features**: Semantic search enhancements
- **Cloud Integration**: Distributed agent networks

### 8.3 Long-term
- **Industry Standard**: Position OneAgent as the canonical reference for professional multiagent systems
- **Cross-Platform**: Seamless integration across IDEs, cloud, and local environments
- **Enterprise Features**: Advanced security, compliance, and governance
- **AI Research**: Cutting-edge agent coordination research and development

## 9. System Components & Technical Interactions

### 9.1 Core Systems
- **OneAgentEngine**: Unified engine managing all OneAgent functionality with Constitutional AI, BMAD analysis, and quality scoring
- **OneAgentSystem**: Core system providing unified interface for all AI assistance with seamless handoffs and team meetings
- **Agent System**: All agents inherit from `BaseAgent` and are instantiated via `AgentFactory`, which injects dependencies and ensures compliance with canonical interfaces. Agents expose capabilities, skills, and metadata via the `AgentCard` schema
- **A2A Protocol System**: **[IMPLEMENTED]** Complete Google A2A v0.2.5 implementation providing true peer-to-peer agent communication. Features Agent Card discovery, task lifecycle management, rich message system, and enterprise security integration
- **NLACS System**: **[NEW]** Natural Language Agent Coordination System enabling emergent intelligence through conversational coordination with Constitutional AI validation and memory integration
- **HybridAgentRegistry**: Maintains both in-memory (A2A) and MCP-backed registries. Handles registration, update, removal, and conflict resolution. MCP is authoritative; A2A provides high-performance local optimization
- **HybridAgentDiscovery**: Provides search, filtering, and QuerySkill-based selection across both registries. Supports advanced filtering (health, version, credentials, authorization)
- **HybridAgentOrchestrator**: Coordinates agent selection, task assignment, and dynamic capability negotiation. Integrates with registry/discovery and enforces credential checks, error handling, and audit logging
- **OneAgentMemory**: Canonical memory client for all agents and orchestration flows. Supports CRUD, semantic search, and context retrieval. All memory operations are MCP-compliant and auditable
- **Memory Intelligence**: Provides semantic embeddings, context7 queries, and advanced memory analytics. Used for agent context, workflow continuity, and learning
- **Audit Logging System**: All critical actions, errors, and decisions are logged with backbone metadata for traceability, compliance, and debugging
- **Temporal System**: Tracks all time-based events, agent heartbeats, memory updates, and orchestrator actions. Enables time-based queries, scheduling, and historical analysis
- **Backbone Metadata System**: Every entity (agent, memory entry, log, event) is tagged with structured metadata: timestamps, agent IDs, version, protocol, context, and lineage

### 9.2 Protocol & API Layer
- **A2A Protocol (v0.2.5+)**: **[FULLY IMPLEMENTED]** Complete Google A2A specification compliance for true peer-to-peer agent communication. Provides JSON-RPC 2.0 transport, Agent Card discovery system, task lifecycle management, rich message system, and enterprise security. Used for high-performance, low-latency agent-to-agent communication
- **MCP Protocol (v4.0+)**: RESTful, JSON-RPC 2.0 endpoints for all registry, discovery, memory, and orchestration operations. Used for distributed, persistent, and cross-process scenarios
- **NLACS Protocol (v5.0+)**: **[NEW]** Natural language coordination endpoints for discussion management, emergent insight generation, and conversational agent coordination
- **Canonical Endpoints**:
  - **A2A Protocol**: `/a2a/v0.2.5/message/send`, `/a2a/v0.2.5/task/create`, `/a2a/v0.2.5/task/get`, `/a2a/v0.2.5/agent/info`
  - **MCP Protocol**: `/mcp/v4/agents` (register, update, remove, list, search), `/mcp/v4/memory` (CRUD, search, audit), `/mcp/v4/orchestration` (task assignment, coordination)
  - **NLACS Protocol**: `/nlacs/v5/discussions` (initialize, manage, conclude), `/nlacs/v5/insights` (generate, retrieve), `/nlacs/v5/participants` (add, remove, coordinate)
- **Protocol Integration**: Seamless bridging between A2A, MCP, and NLACS protocols with automatic protocol detection and routing based on communication context and performance requirements
- **Version Negotiation**: All endpoints support versioning and backward compatibility

### 9.3 Memory System Details
- **mem0 Backend**: Persistent, versioned, and auditable memory store. All memory entries are tagged with backbone metadata and temporal information
- **Semantic Search & Embeddings**: Memory intelligence layer provides context7 queries, 768-dimensional embeddings, and similarity search for agent workflows
- **Contextual Memory**: Agents and orchestrators retrieve relevant context for tasks, learning, and decision-making. Memory is used for both short-term (session) and long-term (institutional) knowledge
- **NLACS Memory Integration**: Conversations, discussions, and emergent insights are automatically stored and indexed for future reference and learning
- **Audit Trail**: Every memory operation (create, update, delete, query) is logged with full metadata for compliance and debugging

### 9.4 Orchestration & Coordination
- **Task Assignment**: Orchestrator selects agents based on QuerySkill, capability, and context. Supports dynamic UX negotiation and in-task authentication
- **Dynamic Capability Negotiation**: Agents can add/remove capabilities mid-task; orchestrator adapts coordination accordingly
- **NLACS Coordination**: **[NEW]** Natural language coordination enabling emergent intelligence through multi-agent conversations
- **Error Handling & Fallback**: All orchestration flows include retry, backoff, and fallback to in-memory if MCP is unavailable. All errors are logged
- **Audit Logging**: Every orchestration action is logged with backbone metadata and temporal context

### 9.5 Integration & Extensibility
- **VS Code MCP Server**: Exposes all MCP endpoints for agent registry, discovery, memory, and orchestration. Enables VS Code and other clients to interact with OneAgent as a service
- **Standalone GUI (Planned)**: Will provide direct multiagent interaction, monitoring, and orchestration via a Vite-based frontend
- **Plugin/Extension Model**: Agents, tools, and memory modules are pluggable. Discovery and registration are handled via canonical interfaces
- **NLACS Extensions**: Natural language coordination capabilities can be extended with custom discussion types, insight generators, and conversation patterns

### 9.6 System Cohesion & Data Flow
- **Agents** register and discover each other via registry/discovery APIs. All actions are logged with backbone metadata
- **NLACS Discussions** enable natural language coordination between agents for emergent intelligence generation
- **Orchestrator** coordinates tasks, leveraging memory intelligence and temporal data for optimal agent selection
- **Memory** is the central context store, with all entries tagged for traceability and learning
- **Audit Logging** and **Temporal System** ensure every action, event, and decision is traceable, queryable, and reproducible
- **Backbone Metadata** links all systems, enabling cross-domain analytics, compliance, and debugging

## 10. Agent Types & Specializations

### 10.1 Core Agent Types
- **CoreAgent**: Central coordination, system management, and cross-domain synthesis
- **DevAgent**: Development, coding, architecture, and technical implementation
- **OfficeAgent**: Document processing, calendar management, and office productivity
- **FitnessAgent**: Health, nutrition, workout planning, and wellness optimization
- **TriageAgent**: Health monitoring, system diagnostics, and performance analysis

### 10.2 Agent Capabilities
- **Core Capabilities**: System coordination, agent integration, service management, health monitoring, resource allocation, security management, Constitutional AI, quality validation, advanced prompting, BMAD analysis
- **Development Capabilities**: Code analysis, test generation, documentation sync, refactoring, performance optimization, security scanning, Git workflow, dependency management
- **Office Capabilities**: Document processing, calendar management, email assistance, task organization
- **Fitness Capabilities**: Workout planning, nutrition tracking, progress monitoring, goal setting
- **NLACS Capabilities**: Natural language coordination, emergent insight generation, conversational memory, discussion management

### 10.3 Agent Factory & Configuration
- **Tiered Model Selection**: Economy/Standard/Premium AI models based on task complexity
- **Dependency Injection**: Automated configuration of memory, AI, and protocol clients
- **Capability Management**: Dynamic capability registration and discovery
- **Memory Integration**: Persistent agent context and learning
- **NLACS Enablement**: Automatic natural language coordination capabilities

## 11. Tool Registry & Dynamic Capabilities

### 11.1 Core Tools
- **Constitutional AI Tools**: Validation, quality scoring, principle enforcement
- **Memory Tools**: Add, search, edit, delete, context retrieval
- **BMAD Tools**: 9-point systematic analysis and decision support
- **Web Tools**: Enhanced search, content fetching, quality filtering
- **A2A Tools**: Agent registration, discovery, messaging, session management
- **NLACS Tools**: Discussion management, insight generation, conversational coordination

### 11.2 Dynamic Tool Registration
- **Runtime Registration**: Tools can be added/removed during operation
- **Capability Discovery**: Automatic tool capability advertisement
- **Version Management**: Tool versioning and compatibility checks
- **Quality Validation**: All tools validated against Constitutional AI principles

## 12. References & Further Reading

- [A2A Specification](https://a2aproject.github.io/A2A/specification/)
- [@a2a-js/sdk](https://github.com/a2aproject/a2a-js)
- [MCP Protocol](https://github.com/a2aproject/A2A)
- [OneAgent Documentation](docs/HYBRID_A2A_MCP_IMPLEMENTATION_PLAN.md)
- [BMAD Framework](https://github.com/a2aproject/A2A/discussions/741)
- [Constitutional AI Principles](docs/CONSTITUTIONAL_AI.md)
- [NLACS Phase 1 Implementation](PHASE_1_NLACS_IMPLEMENTATION_COMPLETE.md)

---

**This document is the single source of truth for OneAgent architecture, vision, and implementation. Updated with OneAgent v5.0.0 NLACS capabilities and complete system architecture. Update as the system evolves.**

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
