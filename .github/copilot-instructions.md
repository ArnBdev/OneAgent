# OneAgent Professional Development Instructions for GitHub Copilot

## System Overview
You are working with OneAgent, a Professional AI Development Platform featuring Constitutional AI, BMAD Framework analysis, and quality-first development principles. OneAgent operates as an MCP (Model Context Protocol) server to extend your capabilities.

## Architecture Overview

### Core Components
- **BaseAgent**: Abstract base class for all agents (`coreagent/agents/base/BaseAgent.ts`)
- **ISpecializedAgent**: Interface defining agent contracts (`coreagent/agents/base/ISpecializedAgent.ts`)
- **AgentFactory**: Factory pattern for creating agents with tier-based model selection (`coreagent/agents/base/AgentFactory.ts`)
- **UnifiedBackboneService**: Single source of truth for time and metadata across all systems (`coreagent/utils/UnifiedBackboneService.ts`)
- **OneAgentEngine**: Central engine managing all agent operations (`coreagent/OneAgentEngine.ts`)

### Agent Creation Pattern
```typescript
// Always use AgentFactory for agent creation
const agent = await AgentFactory.createAgent({
  type: 'development', // canonical AgentType
  id: 'unique-agent-id',
  name: 'Agent Name',
  memoryEnabled: true,
  aiEnabled: true,
  modelTier: 'standard', // economy/standard/premium
  nlacsEnabled: true
});
```

### Memory System (Canonical mem0)
- **OneAgentMemory**: Primary memory interface using mem0 backend
- **Memory Server**: Python-based memory backend on port 8010
- **Context7**: Documentation and context management system
- Always use structured memory operations with metadata

## Available OneAgent Tools (Verified MCP Integration)

### Constitutional AI Tools
- `oneagent_constitutional_validate`: Validate responses against 4 core principles (Accuracy, Transparency, Helpfulness, Safety)
- `oneagent_quality_score`: Generate quality scoring with professional grading (A-D scale)
- `oneagent_bmad_analyze`: Systematic task analysis using 9-point BMAD framework

### Memory & Context Tools (Canonical)
- `oneagent_memory_search`: Search canonical OneAgent memory using natural language queries
- `oneagent_memory_add`: Add items to canonical OneAgent memory with metadata
- `oneagent_memory_edit`: Edit existing memory items by ID
- `oneagent_memory_delete`: Delete memory items by ID
- `oneagent_system_health`: Comprehensive system health and performance metrics

### Research Tools
- `oneagent_enhanced_search`: Web search with quality filtering and Constitutional AI validation
- `oneagent_web_search`: Web search with configurable parameters
- `oneagent_web_fetch`: Fetch and extract content from web pages
- `oneagent_context7_query`: Query documentation and context sources

### Development Tools
- `oneagent_code_analyze`: Analyze code quality, patterns, security, and performance

## Development Workflow

### System Startup (Production)
Use the canonical startup script:
```powershell
# Start memory backend + unified MCP server
.\scripts\start-oneagent-system.ps1
```

### Build & Development Commands
```bash
# Build TypeScript
npm run build

# Development with watch mode
npm run dev

# Start MCP server (unified entry point)
npm run server:unified

# Memory server (Python backend)
npm run memory:server

# Type checking and linting
npm run verify
```

### Project Structure Patterns
- **coreagent/**: Core TypeScript implementation
- **coreagent/agents/base/**: Base classes and interfaces
- **coreagent/agents/specialized/**: Concrete agent implementations
- **coreagent/server/**: MCP server implementation
- **coreagent/utils/**: Shared utilities (UnifiedBackboneService)
- **coreagent/types/**: Canonical type definitions
- **prompts/**: YAML-based persona and quality configurations
- **servers/**: Python memory backend

### TypeScript Configuration
- **Target**: ES2022 with CommonJS modules
- **Strict Mode**: Enabled with comprehensive type checking
- **Output**: `dist/coreagent/` directory
- **Source Maps**: Enabled for debugging

## Critical Instructions for Preventing Hallucination

### Tool Usage Rules
1. **ONLY use tools listed above** - these are verified and registered in the MCP server
2. **Never reference non-existent tools** - if unsure, use `oneagent_system_health` to verify
3. **Always verify tool availability** before suggesting usage patterns
4. **Use exact tool names** - no variations or aliases

### Memory Operations (Canonical Only)
- Use `oneagent_memory_search` for retrieving context (NOT "oneagent_memory_context")
- Use `oneagent_memory_add` for storing information
- Use `oneagent_memory_edit` for updates
- Use `oneagent_memory_delete` for removal

### Agent Implementation Rules
- **Always extend BaseAgent** and implement ISpecializedAgent
- **Use AgentFactory** for agent creation with proper configuration
- **Implement required methods**: `initialize()`, `processMessage()`, `getAvailableActions()`, `executeAction()`
- **Use UnifiedBackboneService** for time and metadata operations
- **Enable NLACS** (Natural Language Agent Coordination System) by default

## Development Standards

### Code Quality Requirements
1. **Professional Standards**: All code must meet enterprise-grade quality levels
2. **Constitutional Compliance**: Apply Constitutional AI validation for critical decisions
3. **Quality Scoring**: Target minimum 80% quality score (Grade A) for production code
4. **BMAD Analysis**: Use systematic analysis for complex architectural decisions

### Architectural Principles
1. **Modular Design**: Component-based architecture with clear separation of concerns
2. **Type Safety**: Full TypeScript implementation with strict typing
3. **Error Handling**: Comprehensive error handling with graceful fallbacks
4. **Performance**: Optimize for scalability and maintainability
5. **Documentation**: Self-documenting code with clear reasoning

### Agent Architecture Patterns
```typescript
// Example specialized agent implementation
export class CustomAgent extends BaseAgent implements ISpecializedAgent {
  constructor(config: AgentConfig) {
    super(config);
  }

  async initialize(): Promise<void> {
    // Initialize agent-specific resources
  }

  async processMessage(context: AgentContext, message: string): Promise<AgentResponse> {
    // Process with Constitutional AI validation
    return {
      content: response,
      metadata: { agentId: this.id, timestamp: this.backbone.time.now() }
    };
  }

  getAvailableActions(): AgentAction[] {
    // Return agent-specific actions
  }

  async executeAction(action: string | AgentAction, params: Record<string, unknown>): Promise<unknown> {
    // Execute with quality validation
  }
}
```

### Memory Integration Patterns
```typescript
// Canonical memory operations
const memories = await this.memory.searchMemories({
  query: "user preferences",
  userId: context.user.id,
  limit: 5
});

await this.memory.addMemory({
  content: "User preference: dark mode enabled",
  metadata: {
    userId: context.user.id,
    category: "preferences",
    timestamp: this.backbone.time.now()
  }
});
```

### Best Practices
1. **Memory Context**: Leverage persistent memory for project continuity
2. **Quality Validation**: Apply Constitutional AI validation for user-facing features
3. **Systematic Analysis**: Use BMAD framework for complex problem-solving
4. **Enhanced Search**: Utilize quality-filtered search for research and documentation
5. **Unified Services**: Always use UnifiedBackboneService for time/metadata operations

## Workflow Guidelines

### For New Features (Verified Workflow)
1. **`oneagent_memory_search`**: Search for existing patterns and solutions
2. Analyze requirements using `oneagent_bmad_analyze`
3. Search for best practices using `oneagent_enhanced_search`
4. Implement with Constitutional AI principles
5. Validate quality using `oneagent_quality_score`
6. **`oneagent_memory_add`**: Store successful patterns for future use

### For Code Review (Memory-Integrated)
1. **`oneagent_memory_search`**: Check for relevant quality patterns and standards
2. Apply `oneagent_constitutional_validate` to critical logic
3. Ensure quality score meets minimum threshold (80%)
4. Check system health impact using `oneagent_system_health`
5. Document decisions and reasoning clearly
6. **`oneagent_memory_add`**: Store quality insights and improvements

### For Problem Solving (Memory-First)
1. **`oneagent_memory_search`**: Search for similar problems and solutions
2. Use BMAD framework for systematic analysis
3. Apply Constitutional AI for solution validation
4. Maintain quality standards throughout process
5. **`oneagent_memory_add`**: Store solution patterns for future reference

### For Agent Development
1. **Extend BaseAgent**: All agents must inherit from BaseAgent
2. **Implement ISpecializedAgent**: Complete interface implementation required
3. **Use AgentFactory**: Create agents via factory pattern with proper configuration
4. **Configure Memory**: Enable memory and AI capabilities appropriately
5. **Test Actions**: Implement and test getAvailableActions() and executeAction()

### For MCP Integration
1. **Unified Server**: Use `npm run server:unified` for MCP operations
2. **Port Configuration**: Professional grade runs on port 8083, legacy on 8080
3. **Memory Backend**: Ensure Python memory server is running on port 8010
4. **System Health**: Monitor via `oneagent_system_health` tool

## Quality Standards

### Minimum Requirements
- Quality Score: 80% (Grade A)
- Constitutional Compliance: 100%
- Type Safety: Strict TypeScript
- Error Handling: Comprehensive coverage
- Documentation: Clear and complete

### Professional Enhancement
- Apply Constitutional AI for user-facing content
- Use BMAD analysis for architectural decisions
- Leverage memory context for project continuity
- Implement quality scoring for continuous improvement

## Integration Notes

### OneAgent MCP Server
- Port: 8083 (Professional), 8080 (Legacy)
- Protocol: HTTP MCP with JSON-RPC 2.0
- Version: 4.0.0 Professional Grade
- Status: GitHub Copilot Agent Mode Ready

### Constitutional AI Principles
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

## Tool Usage Examples

```typescript
// Memory-first development approach
const existingPatterns = await oneagent_memory_search({
  query: "authentication middleware typescript express",
  userId: "default-user",
  limit: 5
});

// Constitutional validation for critical logic
const validation = await oneagent_constitutional_validate({
  response: codeImplementation,
  userMessage: requirement,
  context: projectContext
});

// Quality scoring for code review
const quality = await oneagent_quality_score({
  content: sourceCode,
  criteria: ['accuracy', 'maintainability', 'performance']
});

// Store successful patterns
await oneagent_memory_add({
  content: "Authentication Middleware Pattern: Express.js with TypeScript and JWT validation",
  metadata: {
    type: "implementation_pattern",
    technology: "express-typescript",
    category: "authentication",
    quality_score: quality.score
  }
});
```

Remember: OneAgent emphasizes quality-first development with systematic analysis and Constitutional AI validation. Always prioritize professional standards and comprehensive quality assurance.
