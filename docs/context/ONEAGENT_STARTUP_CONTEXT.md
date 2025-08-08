# OneAgent Startup Context - New Chat Instance Briefing

## System Status Overview (July 15, 2025)

### 🎯 OneAgent System - FULLY OPERATIONAL
- **OneAgent Engine v4.0**: ✅ Running on localhost:8083 (MCP HTTP server)
- **Memory Server v4.0**: ✅ Running on localhost:8010 (195+ memories loaded)
- **VS Code Copilot Chat**: ✅ Ready for integration
- **Constitutional AI**: ✅ Active (80%+ Grade A quality enforcement)
- **BMAD Framework**: ✅ Active (9-point systematic analysis)

### 🤖 Agent Fleet - 7 Agents Operational
- **CoreAgent** (12 capabilities): System coordination, Constitutional AI, BMAD analysis
- **DevAgent** (8 capabilities): Development, Context7, learning engine
- **OfficeAgent** (4 capabilities): Productivity workflows, document processing
- **FitnessAgent** (4 capabilities): Health tracking, workout planning
- **TriageAgent** (5 capabilities): System diagnostics, health monitoring
- **PlannerAgent** (5 capabilities): Strategic planning, synthesis
- **ValidationAgent** (6 capabilities): Constitutional AI compliance, quality validation

### 🛠️ Core Systems Active
- **12 Unified Tools** across 5 categories (core_system, memory_context, web_research, agent_communication, development)
- **Memory Integration**: OneAgentMemory with mem0 backend, batch operations, caching
- **Protocol Stack**: A2A v0.2.5 (with natural language extensions) + MCP v4.0 (HTTP JSON-RPC 2.0)
- **Health Monitoring**: Enterprise-grade system monitoring with predictive analytics

## 🏗️ Architecture Overview

### Core Technologies
- **TypeScript 5.7+ (strict mode)**: Never-initialized variable optimization
- **Node.js v22+**: Latest V8 optimizations and caching
- **Google Gemini 2.5**: Tiered AI models (Flash/Pro) with intelligent fallback
- **mem0**: Canonical memory backend with RESTful API
- **UnifiedBackboneService**: Canonical time and metadata across all systems

### System Architecture
```
OneAgent Engine v4.0
├── Constitutional AI (accuracy, transparency, helpfulness, safety)
├── BMAD Framework (9-point systematic analysis)
├── Multi-Agent System (7 specialized agents)
├── Memory System (OneAgentMemory + mem0 backend)
├── Protocol Stack (A2A + MCP with natural language extensions)
└── Tool Registry (12 tools across 5 categories)
```

### Key Components
- **BaseAgent**: Advanced prompt engineering (R-T-F, T-A-G, R-I-S-E, R-G-C, C-A-R-E), Constitutional AI, personality modeling
- **AgentFactory**: Professional agent creation with dependency injection
- **AgentCard**: Canonical interface for agent discovery (A2A compliant)
- **SmartGeminiClient**: Adaptive AI with wrapper-first architecture
- **HealthMonitoringService**: Enterprise-grade monitoring with compliance tracking

## 📡 Communication Protocols

### A2A Protocol v0.2.5 (Enhanced)
- **Google A2A Specification**: Fully compliant peer-to-peer communication
- **OneAgent Extensions**: Natural language agent collaboration
- **Features**: Agent Cards, task lifecycle, rich messaging, enterprise security
- **Endpoints**: `/a2a/v0.2.5/message/send`, `/a2a/v0.2.5/task/create`, `/a2a/v0.2.5/agent/info`

### MCP Protocol v4.0
- **VS Code Integration**: HTTP JSON-RPC 2.0 for Copilot Chat
- **Features**: Registry, discovery, memory operations, tool management
- **Endpoints**: `/mcp/v4/agents`, `/mcp/v4/memory`, `/mcp/v4/tools`

## 🧠 Memory & Intelligence

### OneAgentMemory System
- **mem0 Backend**: Python server on localhost:8010
- **195+ Memories**: Loaded and operational
- **Features**: Batch operations, caching (EmbeddingCache), audit logging
- **Intelligence**: Semantic search, 768-dimensional embeddings, contextual retrieval

### Context7 Integration
- **Documentation Management**: Web development sources
- **Knowledge Accumulation**: Technical documentation and patterns
- **Auto-Memory Storage**: Every lookup creates permanent memory entries

## 🔧 Development Environment

### Startup Commands
```bash
# Start OneAgent system
npm run server:unified  # OneAgent Engine on localhost:8083

# Start memory server
npm run memory:server   # mem0 backend on localhost:8010

# Development
npm run build          # TypeScript compilation
npm run dev           # Watch mode development
npm run verify        # Type checking and linting
```

### Project Structure
```
OneAgent/
├── coreagent/
│   ├── OneAgentEngine.ts (central orchestration)
│   ├── agents/ (BaseAgent, AgentFactory, specialized agents)
│   ├── memory/ (OneAgentMemory, EmbeddingCache)
│   ├── protocols/a2a/ (A2A Protocol implementation)
│   ├── server/ (unified MCP server)
│   ├── tools/ (12 unified tools)
│   ├── types/ (AgentCard, backbone types)
│   └── utils/ (UnifiedBackboneService)
├── servers/ (mem0 Python backend)
└── scripts/ (startup scripts)
```

## 🎯 Current Implementation Status

### ✅ Completed Systems
- **A2A Protocol**: Complete Google specification + natural language extensions
- **MCP Protocol**: HTTP JSON-RPC 2.0 for VS Code integration
- **Constitutional AI**: Active validation and quality scoring
- **BMAD Framework**: Systematic analysis for complex decisions
- **Memory System**: 195+ memories with intelligence and caching
- **Agent System**: 7 specialized agents with full capabilities
- **Tool Registry**: 12 tools across 5 categories
- **Health Monitoring**: Enterprise-grade system monitoring

### 🔄 Active Development Areas
- **Parallel Time Method Cleanup**: Remaining Date.now() calls in specialized agents
- **Memory Server Optimization**: Connection stability improvements
- **Performance Monitoring**: Real-time metrics and optimization
- **Quality Improvements**: Continuous Constitutional AI validation

## 🎭 Working Principles

### Constitutional AI (Core Principles)
1. **Accuracy**: Prefer "I don't know" to speculation
2. **Transparency**: Explain reasoning and acknowledge limitations
3. **Helpfulness**: Provide actionable, relevant guidance
4. **Safety**: Avoid harmful or misleading recommendations

### BMAD Framework (9-Point Analysis)
1. Belief Assessment
2. Motivation Mapping
3. Authority Identification
4. Dependency Mapping
5. Constraint Analysis
6. Risk Assessment
7. Success Metrics
8. Timeline Considerations
9. Resource Requirements

### Quality Standards
- **Minimum Quality Score**: 80% (Grade A)
- **TypeScript Strict Mode**: 100% compliance
- **Error Handling**: Comprehensive with graceful degradation
- **Architecture**: Canonical backbone integration required

## 🚀 Immediate Context for New Chat

### What You Need to Know
1. **OneAgent is OPERATIONAL**: System is running and ready for development
2. **VS Code Integration**: Ready for Copilot Chat with MCP server on localhost:8083
3. **Memory System**: 195+ memories available for context and learning
4. **Quality First**: All changes must pass Constitutional AI validation
5. **Canonical Architecture**: Use UnifiedBackboneService for time/metadata

### Common Tasks
- **Agent Development**: Extend BaseAgent, use AgentFactory
- **Memory Operations**: Use OneAgentMemory for all storage/retrieval
- **Protocol Extensions**: Enhance A2A or MCP protocols
- **Tool Development**: Add to unified tool registry
- **Quality Validation**: Apply Constitutional AI and BMAD analysis

### Key Files to Reference
- `ONEAGENT_ARCHITECTURE.md`: Complete system architecture
- `coreagent/OneAgentEngine.ts`: Central orchestration
- `coreagent/agents/base/BaseAgent.ts`: Core agent implementation
- `coreagent/types/AgentCard.ts`: Canonical agent interface
- `coreagent/memory/OneAgentMemory.ts`: Memory client
- `coreagent/protocols/a2a/A2AProtocol.ts`: A2A implementation

### Environment Variables
```bash
MEM0_API_KEY=m0-2bCJevcEWKNwimuCQ9ZBkcjLyD5kb08NDQNesH4O
GEMINI_API_KEY=[configured]
ONEAGENT_MEMORY_PORT=8010
```

## 📋 Development Guidelines

### Code Quality Requirements
- Use `createUnifiedTimestamp()` from UnifiedBackboneService (NO Date.now())
- Apply Constitutional AI validation for user-facing features
- Target 80%+ quality score (Grade A minimum)
- Use TypeScript strict mode throughout
- Implement comprehensive error handling

### Memory-First Development
- Always check memory context before starting (`oneagent_memory_search`)
- Store successful patterns and solutions (`oneagent_memory_add`)
- Build on previous findings rather than starting fresh
- Apply Constitutional AI validation before memory storage

### Architecture Principles
- **Enhance existing systems** before creating new ones
- **Maintain system cohesion** across all components
- **Complete incomplete features** rather than removing them
- **Think like project manager + lead developer**

---

**Status**: OneAgent v4.0 is FULLY OPERATIONAL and ready for continued development. All systems are active, memory is loaded, and the platform is ready for VS Code Copilot Chat integration.

**Next Steps**: Continue development with confidence that the foundation is solid and all core systems are operational.
