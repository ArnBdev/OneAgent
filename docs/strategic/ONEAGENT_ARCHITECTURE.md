# OneAgent Canonical Architecture & Vision Document

## 1. Vision & Purpose

OneAgent is a **professional-grade, modular, and extensible multiagent platform** designed to deliver advanced AI-powered development, orchestration, and **memory-driven intelligence**. It operates as both a **standalone multiagent system** and a **Model Context Protocol (MCP) server** for VS Code and other clients. OneAgent represents the next generation of AI agent coordination, featuring **Constitutional AI validation**, **BMAD Framework analysis**, and **quality-first development principles**.

OneAgent is built to be:

- **The canonical reference** for hybrid A2A (Agent-to-Agent) and MCP (RESTful, distributed) architectures
- **A platform for Constitutional AI**, BMAD-driven analysis, and quality-first development
- **A foundation for professional multi-agent systems** with advanced prompt engineering and personality modeling
- **The world's first memory-driven intelligence platform** with cross-conversation learning capabilities
- **The industry standard** for both local and distributed agent collaboration, memory, and orchestration
- **A VS Code Copilot Chat ready system** with seamless integration for professional development workflows

## 2. Core Technologies & Dependencies

### 2.1 Runtime & Language

- **TypeScript 5.7+ (strict mode)**: All core logic, interfaces, and orchestration with never-initialized variable optimization
- **Node.js v22+**: Runtime environment with latest V8 optimizations and caching
- **ES2022 Modules**: Modern JavaScript with CommonJS compatibility for maximum compatibility

### 2.2 Communication Protocols

- **MCP Protocol v4.0+**: HTTP-based JSON-RPC 2.0 for VS Code Copilot Chat integration and distributed systems
- **A2A Protocol v0.2.5+**: Google A2A specification compliant peer-to-peer agent communication with OneAgent natural language extensions for agent collaboration
- **UnifiedBackboneService**: Canonical time and metadata system across all protocols
- **@a2a-js/sdk**: Official SDK for A2A protocol implementation

### 2.3 AI & Intelligence Systems

- **Google Gemini 2.5 (Flash/Pro)**: Tiered AI model selection with intelligent fallback
- **SmartGeminiClient**: Adaptive AI client with wrapper-first architecture and fallback strategies
- **Constitutional AI**: Built-in safety, ethical validation, and quality scoring (80%+ Grade A minimum)
- **BMAD Framework**: 9-point systematic analysis methodology for complex decisions
- **Advanced Prompt Engineering**: R-T-F, T-A-G, R-I-S-E, R-G-C, C-A-R-E frameworks with Chain-of-Verification (CoVe)
- **Personality Engine**: Dynamic personality modeling with context-aware expression

### 2.4 Memory & Intelligence

- **mem0**: Canonical memory backend with RESTful API and MCP compliance
- **OneAgentMemory**: Professional-grade memory client with batch operations, caching, and audit logging
- **Memory Intelligence**: Semantic search, embeddings, and contextual retrieval
- **Context7**: Documentation and context management system for technical knowledge
- **EmbeddingCache**: Performance-optimized caching for semantic operations

### 2.5 Integration & Tooling

- **VS Code Copilot Chat**: Primary integration target with MCP HTTP server
- **Health Monitoring**: Enterprise-grade system health, performance metrics, and compliance monitoring
- **Audit Logging**: Complete traceability and compliance tracking
- **Jest**: Comprehensive testing framework
- **ESLint**: Code quality and consistency enforcement
- **Vite**: (Planned) for future standalone GUI frontend

## 3. System Overview & Architecture

### 3.1 OneAgent Engine v4.0 - Unified System Core

- **OneAgentEngine**: Central orchestration engine supporting multiple deployment modes (mcp-http, mcp-stdio, standalone, cli, vscode-embedded)
- **Constitutional AI Integration**: All responses validated for accuracy, transparency, helpfulness, and safety
- **BMAD Framework**: 9-point systematic analysis for complex decisions
- **Quality-First Development**: Minimum 80% quality score (Grade A) enforced
- **Unified Tool Registry**: 12 tools across 5 categories (core_system, memory_context, web_research, agent_communication, development)
- **Professional Error Handling**: Comprehensive error management with audit logging and graceful degradation

### 3.2 Multi-Agent Architecture

- **BaseAgent**: Core agent class with advanced prompt engineering, Constitutional AI, and personality modeling
- **AgentFactory**: Professional agent creation with tiered model selection and dependency injection
- **AgentCard System**: Canonical interface for agent discovery and capability advertisement
- **7 Specialized Agents**: CoreAgent, DevAgent, OfficeAgent, FitnessAgent, TriageAgent, PlannerAgent, ValidationAgent
- **HybridAgentRegistry**: Unified registry supporting both A2A and MCP protocols
- **HybridAgentOrchestrator**: Intelligent task coordination with dynamic capability negotiation

### 3.3 Memory & Intelligence System

- **OneAgentMemory**: Professional-grade memory client with batch operations and caching
- **mem0 Backend**: Persistent memory server on port 8010 with 195+ memories loaded
- **Memory Intelligence**: Semantic search, embeddings, and contextual retrieval for agent workflows
- **Context7**: Documentation management with web development sources integration
- **EmbeddingCache**: Performance-optimized caching for semantic operations
- **Audit Logging**: Complete memory operation traceability for compliance

### 3.4 Protocols & Communication

- **A2A Protocol (v0.2.5)**: Complete Google A2A specification implementation with OneAgent natural language extensions for peer-to-peer communication
- **MCP Protocol (v4.0)**: HTTP-based JSON-RPC 2.0 for VS Code Copilot Chat integration
- **UnifiedBackboneService**: Canonical time and metadata system across all protocols
- **Protocol Bridging**: Seamless integration between A2A and MCP with automatic protocol detection
- **Message System**: Rich messaging with support for text, files, structured data, and natural language conversations
- **Task Lifecycle**: Complete state management (submitted→working→completed/failed/canceled)

### 3.5 VS Code Integration & Deployment

- **Unified MCP Server**: HTTP server on localhost:8083 ready for VS Code Copilot Chat
- **Memory Server**: Python-based mem0 backend on localhost:8010
- **Health Monitoring**: Enterprise-grade system health and performance monitoring
- **Professional Startup**: Automated system initialization with 7 agents and memory integration
- **Quality Assurance**: Constitutional AI validation and BMAD framework analysis active

## 4. Advanced AI & Intelligence Systems

### 4.1 Constitutional AI Integration

- **Constitutional Validation**: All user-facing and critical logic validated for accuracy, transparency, helpfulness, and safety
- **Quality Scoring**: Professional grading system with A-D scale (80%+ Grade A minimum for production)
- **Principle Enforcement**: Automated adherence to ethical AI principles throughout system operation
- **Validation Integration**: Built into BaseAgent, OneAgentEngine, and all major system components

### 4.2 BMAD Framework (9-Point Analysis)

- **Systematic Decision Making**: 9-point analysis for complex architectural and process decisions
- **Analysis Components**: Belief Assessment, Motivation Mapping, Authority Identification, Dependency Mapping, Constraint Analysis, Risk Assessment, Success Metrics, Timeline Considerations, Resource Requirements
- **Integration Points**: Major architectural decisions, agent coordination, and system evolution
- **Quality Assurance**: Ensures systematic approach to complex problem-solving

### 4.3 Advanced Prompt Engineering System

- **Multiple Frameworks**: R-T-F (Role-Task-Format), T-A-G (Task-Action-Goal), R-I-S-E (Role-Instruction-Steps-End-goal), R-G-C (Role-Goal-Context), C-A-R-E (Context-Action-Result-Example)
- **Chain-of-Verification (CoVe)**: Systematic verification patterns for accuracy improvement
- **RAG Integration**: Source grounding and contextual retrieval for enhanced accuracy
- **Performance Improvements**: 20-95% improvements in accuracy, task adherence, and quality
- **PromptEngine**: Centralized prompt management with persona and constitutional principle integration

### 4.4 Personality Engine & Modeling

- **Dynamic Personality**: Context-aware personality expression for agent interactions
- **Personality Context**: Situational adaptation based on user context and task requirements
- **Expression Modeling**: Consistent personality traits across agent interactions
- **Integration**: Built into BaseAgent for natural and consistent agent behavior

### 4.5 Smart AI Client Architecture

- **SmartGeminiClient**: Adaptive AI client with intelligent model selection
- **Tiered Models**: Economy/Standard/Premium model selection based on task complexity
- **Fallback Strategies**: Automatic fallback between gemini-2.5-pro, gemini-2.5-flash, gemini-2.5-lite
- **Wrapper-First Architecture**: Optimized for performance and reliability
- **Cost Optimization**: Intelligent model selection balancing performance and cost

## 5. Agent System Architecture

### 5.1 BaseAgent - Core Agent Implementation

- **Advanced Prompt Engineering**: Integrated R-T-F, T-A-G, R-I-S-E, R-G-C, C-A-R-E frameworks with Chain-of-Verification
- **Constitutional AI Integration**: Built-in validation for accuracy, transparency, helpfulness, and safety
- **BMAD Framework**: 9-point systematic analysis for complex decisions
- **Personality Engine**: Dynamic personality modeling with context-aware expression
- **Memory Integration**: OneAgentMemory client with contextual retrieval and storage
- **AI Client Integration**: SmartGeminiClient with tiered model selection and fallback strategies
- **UnifiedBackboneService**: Canonical time and metadata system integration

### 5.2 AgentFactory - Professional Agent Creation

- **Dependency Injection**: Automated configuration of memory, AI, and protocol clients
- **Tiered Model Selection**: Intelligent AI model selection based on agent type and task complexity
- **Capability Management**: Dynamic capability registration and discovery
- **Memory Integration**: Persistent agent context and learning enabled by default
- **Quality Assurance**: Constitutional AI validation and quality scoring built-in
- **Professional Configuration**: Enterprise-grade agent initialization and management

### 5.3 AgentCard System - Canonical Interface

- **Single Source of Truth**: Unified AgentCard interface for all agent communication
- **A2A Protocol Compliance**: Full Google A2A specification compatibility
- **MCP Integration**: Registry and discovery support for distributed systems
- **Skill Management**: Structured capability advertisement with examples and metadata
- **Security Integration**: Authentication schemes and security configuration
- **Unified Metadata**: Temporal and metadata system integration

### 5.4 Specialized Agent Types

- **CoreAgent** (12 capabilities): System coordination, agent integration, Constitutional AI, BMAD analysis
- **DevAgent** (8 capabilities): Development, coding, Context7 integration, learning engine
- **OfficeAgent** (4 capabilities): Document processing, calendar management, productivity workflows
- **FitnessAgent** (4 capabilities): Health tracking, workout planning, nutrition optimization
- **TriageAgent** (5 capabilities): Health monitoring, system diagnostics, performance analysis
- **PlannerAgent** (5 capabilities): Strategic planning, NLACS capabilities, synthesis
- **ValidationAgent** (6 capabilities): Constitutional AI compliance, quality validation

### 5.5 Agent Communication & Coordination

- **HybridAgentRegistry**: Unified registry supporting both A2A and MCP protocols
- **HybridAgentOrchestrator**: Intelligent task coordination with dynamic capability negotiation
- **Protocol Bridging**: Seamless integration between A2A and MCP communication
- **Message System**: Rich messaging with support for text, files, and structured data
- **Task Lifecycle Management**: Complete state tracking and coordination

## 6. Memory & Intelligence Architecture

### 6.1 OneAgentMemory - Professional Memory Client

- **Canonical Implementation**: Single source of truth for all memory operations
- **RESTful API**: Full MCP compliance with HTTP-based memory operations
- **Batch Operations**: Performance-optimized batch memory operations for efficiency
- **Caching System**: EmbeddingCache for semantic operation performance optimization
- **Audit Logging**: Complete traceability and compliance tracking for all memory operations
- **Error Handling**: Comprehensive error management with graceful degradation

### 6.2 mem0 Backend Integration

- **Memory Server**: Python-based backend on localhost:8010 with 195+ memories loaded
- **Persistent Storage**: Versioned and auditable memory store with metadata
- **RESTful API**: HTTP-based memory operations with JSON-RPC 2.0 compatibility
- **Configuration**: Environment-based configuration with MEM0_API_KEY integration
- **Performance**: Optimized for high-throughput memory operations with caching

### 6.3 Memory Intelligence System

- **Semantic Search**: 768-dimensional embeddings for contextual memory retrieval
- **Contextual Retrieval**: Intelligent context selection for agent workflows
- **Memory Analytics**: Advanced analytics for memory usage patterns and optimization
- **Cross-Conversation Learning**: Pattern recognition and knowledge transfer across sessions
- **Intelligence Insights**: Automated insight generation from memory patterns

### 6.4 Context7 Integration

- **Documentation Management**: Web development sources integration for technical knowledge
- **Context Retrieval**: Specialized documentation and context queries
- **Knowledge Accumulation**: Systematic storage of technical documentation and patterns
- **Learning Integration**: Automatic context storage for institutional knowledge building
- **Quality Validation**: Constitutional AI validation for all stored context

### 6.5 Embedding & Caching System

- **EmbeddingCache**: Performance-optimized caching for semantic operations
- **Global Caching**: Singleton pattern for efficient memory usage across agents
- **Cache Management**: Intelligent cache eviction and optimization strategies
- **Performance Metrics**: Monitoring and optimization of cache hit rates and performance

## 7. Protocol Implementation & Communication

### 7.1 A2A Protocol (v0.2.5) - Google Specification Compliant with Natural Language Extensions

- **Full Specification Compliance**: Complete implementation of Google A2A specification
- **Natural Language Extensions**: OneAgent-specific extensions enabling natural language agent collaboration and conversation
- **JSON-RPC 2.0 Transport**: Standards-compliant transport layer for agent communication
- **Agent Card Discovery**: Structured capability advertisement and agent discovery
- **Task Lifecycle Management**: Complete state tracking (submitted→working→completed/failed/canceled)
- **Rich Message System**: Multi-part messages with text, files, structured data, and natural language conversation support
- **Enterprise Security**: Authentication schemes and security configuration
- **Memory Integration**: Persistent conversation context and learning
- **Type Safety**: Full TypeScript implementation with strict typing

### 7.2 MCP Protocol (v4.0) - HTTP JSON-RPC 2.0

- **VS Code Integration**: Primary protocol for VS Code Copilot Chat integration
- **RESTful Architecture**: HTTP-based JSON-RPC 2.0 endpoints for distributed systems
- **Registry Operations**: Agent registration, discovery, and management
- **Memory Operations**: Complete CRUD operations with semantic search
- **Tool Management**: Dynamic tool registration and execution
- **Health Monitoring**: System health and performance monitoring endpoints
- **Professional Error Handling**: Comprehensive error management and logging

### 7.3 UnifiedBackboneService - Canonical Time & Metadata

- **Unified Timestamps**: Consistent time handling across all system components
- **Metadata Integration**: Structured metadata for all system entities
- **Temporal Context**: Time-aware operations with timezone and context support
- **Audit Support**: Complete traceability and compliance tracking
- **Performance Optimization**: Efficient timestamp and metadata operations

### 7.4 Protocol Bridging & Integration

- **Seamless Integration**: Automatic protocol detection and routing
- **Performance Optimization**: A2A for local high-performance, MCP for distributed
- **Conflict Resolution**: MCP authoritative with A2A local optimization
- **Fallback Strategies**: Graceful degradation and error handling
- **Version Negotiation**: Backward compatibility and version management

### 7.5 Canonical Endpoints

- **A2A Endpoints**: `/a2a/v0.2.5/message/send`, `/a2a/v0.2.5/task/create`, `/a2a/v0.2.5/agent/info`
- **MCP Endpoints**: `/mcp/v4/agents`, `/mcp/v4/memory`, `/mcp/v4/orchestration`, `/mcp/v4/tools`
- **Health Endpoints**: `/health`, `/info`, `/metrics`
- **Tool Endpoints**: Dynamic tool registration and execution endpoints

## 8. Tool Registry & Dynamic Capabilities

### 8.1 Unified Tool Registry

- **12 Tools Across 5 Categories**: Comprehensive tool ecosystem with priority-based organization
- **Dynamic Registration**: Runtime tool registration and capability discovery
- **Priority System**: Intelligent tool selection based on priority and capability matching
- **Version Management**: Tool versioning and compatibility checks
- **Quality Validation**: Constitutional AI validation for all tool operations

### 8.2 Tool Categories & Distribution

- **core_system (1 tool)**: System health monitoring and diagnostics
- **memory_context (5 tools)**: Memory operations (search, add, edit, delete), Context7 queries
- **web_research (3 tools)**: Enhanced search, web content fetching, quality filtering
- **agent_communication (2 tools)**: Conversation retrieval and search
- **development (1 tool)**: Code analysis and development support

### 8.3 Core Tool Implementations

- **oneagent_system_health**: Comprehensive system health and performance metrics
- **oneagent_memory_search**: Natural language memory search with semantic matching
- **oneagent_memory_add**: Memory storage with metadata and temporal integration
- **oneagent_enhanced_search**: Quality-filtered web search with Constitutional AI validation
- **oneagent_context7_query**: Documentation and context retrieval system
- **oneagent_code_analyze**: Code quality, security, and performance analysis

### 8.4 Tool Execution & Management

- **SmartGeminiClient Integration**: AI-powered tool execution with fallback strategies
- **Error Handling**: Comprehensive error management with graceful degradation
- **Audit Logging**: Complete traceability for all tool operations
- **Performance Monitoring**: Tool execution metrics and optimization
- **Security Validation**: Constitutional AI validation for tool safety and compliance

## 9. System Integration & Deployment

### 9.1 VS Code Copilot Chat Integration

- **Unified MCP Server**: HTTP server on localhost:8083 ready for VS Code Copilot Chat
- **Professional Setup**: Automated system initialization with 7 agents and memory integration
- **Quality Assurance**: Constitutional AI validation and BMAD framework analysis active
- **Tool Availability**: 12 unified tools across 5 categories ready for use
- **Memory Integration**: 195+ memories loaded and available for contextual assistance
- **Health Monitoring**: Real-time system health and performance monitoring

### 9.2 System Startup & Configuration

- **Automated Startup**: `npm run server:unified` for complete system initialization
- **Memory Server**: `npm run memory:server` for mem0 backend on localhost:8010
- **Agent Bootstrap**: Automatic creation of 7 specialized agents with memory and AI
- **Configuration**: Environment-based configuration with .env file support
- **Health Checks**: Comprehensive system health validation during startup

### 9.3 Development & Build System

- **TypeScript Build**: `npm run build` for complete system compilation
- **Development Mode**: `npm run dev` with watch mode for active development
- **Type Checking**: `npm run verify` for comprehensive type and lint checking
- **Testing**: Jest-based testing framework for quality assurance
- **Quality Validation**: ESLint integration with Constitutional AI principles

### 9.4 Monitoring & Observability

- **HealthMonitoringService**: Enterprise-grade system health monitoring
- **Performance Metrics**: Real-time agent performance and system load monitoring
- **Compliance Monitoring**: Data privacy, access control, and encryption validation
- **Predictive Analytics**: Performance degradation detection and optimization recommendations
- **Audit Logging**: Complete traceability and compliance tracking

### 9.5 Error Handling & Resilience

- **Graceful Degradation**: Fallback to in-memory mode if MCP unavailable
- **Comprehensive Error Handling**: Error management with audit logging
- **Retry Strategies**: Intelligent retry and backoff mechanisms
- **Health Recovery**: Automatic recovery and reconnection strategies
- **Quality Assurance**: Constitutional AI validation for error recovery

## 10. Implementation Status & System Capabilities

### 10.1 Current System Status (July 2025)

- **OneAgent Engine v4.0**: ✅ **FULLY OPERATIONAL** - Running on localhost:8083
- **Memory System**: ✅ **FULLY OPERATIONAL** - mem0 backend on localhost:8010 with 195+ memories
- **Agent System**: ✅ **7 AGENTS ACTIVE** - All specialized agents initialized and operational
- **Constitutional AI**: ✅ **ACTIVE** - Quality validation and safety enforcement
- **BMAD Framework**: ✅ **ACTIVE** - Systematic analysis for complex decisions
- **VS Code Integration**: ✅ **READY** - MCP server ready for Copilot Chat

### 10.2 Core Protocol Implementation

- **A2A Protocol v0.2.5**: ✅ **FULLY IMPLEMENTED WITH NATURAL LANGUAGE EXTENSIONS**
  - Complete Google A2A specification compliance
  - OneAgent natural language extensions for agent collaboration
  - JSON-RPC 2.0 transport with all standard methods
  - Agent Card system for capability discovery
  - Task lifecycle management with full state tracking
  - Rich message system (text, files, data parts, natural language conversations)
  - Enterprise security with authentication schemes
  - Memory integration for persistent conversations
  - Type-safe TypeScript implementation
- **MCP Protocol v4.0**: ✅ **FULLY IMPLEMENTED**
  - HTTP JSON-RPC 2.0 endpoints for VS Code integration
  - Complete registry, discovery, and memory operations
  - Tool management and execution system
  - Health monitoring and diagnostics

### 10.3 Agent System Implementation

- **BaseAgent**: ✅ **FULLY IMPLEMENTED** - Advanced prompt engineering, Constitutional AI, personality modeling
- **AgentFactory**: ✅ **FULLY IMPLEMENTED** - Professional agent creation with dependency injection
- **AgentCard System**: ✅ **FULLY IMPLEMENTED** - Canonical interface for agent discovery
- **7 Specialized Agents**: ✅ **ALL OPERATIONAL** - CoreAgent, DevAgent, OfficeAgent, FitnessAgent, TriageAgent, PlannerAgent, ValidationAgent
- **HybridAgentRegistry**: ✅ **FULLY IMPLEMENTED** - Unified registry with protocol bridging
- **Memory Integration**: ✅ **FULLY OPERATIONAL** - All agents connected to memory system

### 10.4 Memory & Intelligence System

- **OneAgentMemory**: ✅ **FULLY OPERATIONAL** - Professional memory client with batch operations
- **mem0 Backend**: ✅ **FULLY OPERATIONAL** - 195+ memories loaded and available
- **Memory Intelligence**: ✅ **ACTIVE** - Semantic search and contextual retrieval
- **Context7**: ✅ **OPERATIONAL** - Documentation and context management
- **EmbeddingCache**: ✅ **ACTIVE** - Performance-optimized caching system

### 10.5 Quality & Compliance Systems

- **Constitutional AI**: ✅ **FULLY ACTIVE** - All system components validated
- **BMAD Framework**: ✅ **FULLY ACTIVE** - Systematic analysis for decisions
- **Quality Scoring**: ✅ **ACTIVE** - 80%+ Grade A enforcement
- **Audit Logging**: ✅ **FULLY OPERATIONAL** - Complete traceability
- **Health Monitoring**: ✅ **ACTIVE** - Enterprise-grade system monitoring

### 10.6 Integration & Deployment

- **VS Code Copilot Chat**: ✅ **READY** - MCP server on localhost:8083
- **Professional Startup**: ✅ **OPERATIONAL** - Automated system initialization
- **Development Environment**: ✅ **COMPLETE** - Full build and development tools
- **Error Handling**: ✅ **COMPREHENSIVE** - Graceful degradation and recovery
- **Performance Monitoring**: ✅ **ACTIVE** - Real-time system metrics

## 11. System Architecture Deep Dive

### 11.1 Core System Components

- **OneAgentEngine**: Central orchestration engine managing all OneAgent functionality with Constitutional AI, BMAD analysis, and quality scoring
- **OneAgentSystem**: Core system providing unified interface for all AI assistance with seamless handoffs and team meetings
- **UnifiedBackboneService**: Canonical time and metadata system providing consistent temporal and metadata operations across all components
- **SimpleAuditLogger**: Comprehensive audit logging system for traceability and compliance
- **HealthMonitoringService**: Enterprise-grade system health monitoring with performance metrics and predictive analytics

### 11.2 Agent Architecture Details

- **BaseAgent Class**: Core agent implementation with advanced prompt engineering, Constitutional AI, BMAD framework, and personality modeling
- **AgentFactory**: Professional agent creation system with tiered model selection, dependency injection, and capability management
- **AgentCard System**: Canonical interface for agent discovery and capability advertisement with A2A protocol compliance
- **Agent Specializations**: 7 specialized agents (CoreAgent, DevAgent, OfficeAgent, FitnessAgent, TriageAgent, PlannerAgent, ValidationAgent) with distinct capabilities
- **HybridAgentRegistry**: Unified registry supporting both A2A and MCP protocols with conflict resolution and fallback

### 11.3 Memory System Architecture

- **OneAgentMemory**: Professional-grade memory client with batch operations, caching, and comprehensive error handling
- **mem0 Backend**: Python-based memory server providing persistent storage with RESTful API
- **Memory Intelligence**: Semantic search, embeddings, and contextual retrieval system
- **EmbeddingCache**: Performance-optimized caching for semantic operations
- **Context7**: Documentation and context management system with web development sources

### 11.4 Protocol Implementation Details

- **A2A Protocol**: Complete Google A2A v0.2.5 specification implementation with OneAgent natural language extensions, JSON-RPC 2.0, Agent Card discovery, and task lifecycle management
- **MCP Protocol**: HTTP JSON-RPC 2.0 implementation for VS Code Copilot Chat integration
- **Protocol Bridging**: Seamless integration between A2A and MCP with automatic protocol detection
- **Message System**: Rich messaging with support for text, files, structured data, and natural language conversations
- **Security Integration**: Authentication schemes and enterprise security features

### 11.5 AI & Intelligence Integration

- **SmartGeminiClient**: Adaptive AI client with tiered model selection and fallback strategies
- **Constitutional AI**: Integrated validation for accuracy, transparency, helpfulness, and safety
- **BMAD Framework**: 9-point systematic analysis for complex decisions
- **Advanced Prompt Engineering**: Multiple frameworks (R-T-F, T-A-G, R-I-S-E, R-G-C, C-A-R-E) with Chain-of-Verification
- **Personality Engine**: Dynamic personality modeling with context-aware expression

### 11.6 System Cohesion & Data Flow

- **Unified Time System**: UnifiedBackboneService provides consistent temporal operations across all components
- **Metadata Integration**: Structured metadata for all system entities enabling traceability and analytics
- **Memory Integration**: Centralized memory system accessible to all agents and orchestration flows
- **Quality Assurance**: Constitutional AI validation and BMAD framework analysis integrated throughout system
- **Audit Trail**: Complete traceability and compliance tracking for all system operations

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
