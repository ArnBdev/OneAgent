# OneAgent Professional Development Instructions

## Project Overview
OneAgent is a Professional AI Development Platform featuring Constitutional AI, BMAD Framework analysis, and quality-first development principles. This is a complex architectural project requiring systematic consolidation of parallel systems.

## Critical Architecture Mission
**PRIMARY GOAL**: Consolidate 9 parallel systems into canonical implementations to prevent architectural fragmentation and maintain system integrity.

### System Status (Current)
- **Time System**: 95% canonical (UnifiedBackboneService.createUnifiedTimestamp)
- **ID Generation**: 100% canonical (UnifiedBackboneService.createUnifiedId)
- **Memory System**: 100% canonical (OneAgentMemory singleton)
- **Cache System**: 100% canonical (OneAgentUnifiedBackbone.getInstance().cache)
- **Agent Communication**: 0% canonical (8 parallel implementations) - CRITICAL PRIORITY
- **Error Handling**: 20% canonical (UnifiedBackboneService.errorHandler)
- **MCP Integration**: 30% canonical (UnifiedBackboneService.mcp)
- **Monitoring**: 10% canonical (UnifiedBackboneService.monitoring)
- **Context7**: 25% canonical (legacy adapter.ts blocking)

## Mandatory Anti-Parallel System Protocol

### Before ANY Implementation
1. **Search existing implementations** using oneagent_memory_search
2. **Check UnifiedBackboneService** for canonical methods
3. **Verify OneAgentMemory** for memory operations
4. **Confirm OneAgentUnifiedBackbone** for caching needs
5. **NEVER create parallel systems** - always expand existing ones

### Canonical System Requirements
```typescript
// ✅ REQUIRED - Use these patterns exclusively
const timestamp = createUnifiedTimestamp();
const id = createUnifiedId('operation', 'context');
const cache = OneAgentUnifiedBackbone.getInstance().cache;
const memory = OneAgentMemory.getInstance();

// ❌ FORBIDDEN - These create parallel systems
const timestamp = Date.now(); // Creates parallel time system
const id = Math.random().toString(36); // Creates parallel ID system
const cache = new Map(); // Creates parallel cache system
const memory = new CustomMemoryClass(); // Creates parallel memory system
```

## Development Standards

### Code Quality
- **Minimum Quality Score**: 80% (Grade A)
- **Constitutional AI Compliance**: 100%
- **TypeScript**: Strict typing with comprehensive error handling
- **Documentation**: Self-documenting code with clear reasoning

### Architecture Principles
- **Single Source of Truth**: UnifiedBackboneService for all operations
- **Expand Before Create**: Always enhance existing systems
- **Complete Features**: Don't remove incomplete features, complete them
- **Memory-First**: Use oneagent_memory_search before implementing
- **Quality Validation**: Apply Constitutional AI for critical decisions

### File Organization
- **coreagent/**: Core TypeScript implementation
- **coreagent/agents/base/**: Base classes and interfaces
- **coreagent/agents/specialized/**: Concrete agent implementations
- **coreagent/server/**: MCP server implementation
- **coreagent/utils/**: Shared utilities (UnifiedBackboneService)
- **coreagent/types/**: Canonical type definitions

## OneAgent MCP Tools (Available)
- `oneagent_constitutional_validate`: Validate responses (Accuracy, Transparency, Helpfulness, Safety)
- `oneagent_quality_score`: Professional grading (A-D scale)
- `oneagent_bmad_analyze`: 9-point framework analysis
- `oneagent_memory_search`: Search canonical memory
- `oneagent_memory_add`: Add items with metadata
- `oneagent_system_health`: System health metrics
- `oneagent_enhanced_search`: Quality-filtered web search
- `oneagent_context7_query`: Documentation queries

## Constitutional AI Principles
1. **Accuracy**: Prefer "I don't know" to speculation
2. **Transparency**: Explain reasoning and acknowledge limitations
3. **Helpfulness**: Provide actionable, relevant guidance
4. **Safety**: Avoid harmful or misleading recommendations

## Context7 Integration
- **ALWAYS use Context7** for documentation before coding
- **Auto-memory storage**: Store ALL Context7 retrievals in memory
- **Build knowledge webs**: Link technologies, versions, best practices
- **Quality threshold**: 80%+ relevance for long-term storage

## Critical Mission Priority
**Agent Communication System Consolidation**: 8 parallel implementations must be unified into single canonical system. This is the highest architectural priority to prevent further fragmentation.

Remember: You are working as lead developer, architect, and project manager. Handle all technical decisions with due diligence and focus on preventing parallel systems while maintaining architectural integrity.
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
