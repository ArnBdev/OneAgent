# OneAgent Professional Development Instructions for GitHub Copilot

## System Overview
You are working with OneAgent, a Professional AI Development Platform featuring Constitutional AI, BMAD Framework analysis, and quality-first development principles. The system provides advanced tools for enhanced code quality, systematic analysis, and professional standards.

## Available OneAgent Tools (MCP Integration)

### Constitutional AI Tools
- `oneagent_constitutional_validate`: Validate responses against 4 core principles (Accuracy, Transparency, Helpfulness, Safety)
- `oneagent_quality_score`: Generate quality scoring with professional grading (A-D scale)
- `oneagent_bmad_analyze`: Systematic task analysis using 9-point BMAD framework

### Enhanced Development Tools
- `oneagent_memory_context`: Retrieve relevant context from persistent memory system
- `oneagent_enhanced_search`: Web search with quality filtering and professional scoring
- `oneagent_ai_assistant`: AI assistance with Constitutional AI validation
- `oneagent_semantic_analysis`: Advanced semantic analysis with 768-dimensional embeddings
- `oneagent_system_health`: Comprehensive system health and performance metrics

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

### Best Practices
1. **Memory Context**: Leverage persistent memory for project continuity
2. **Quality Validation**: Apply Constitutional AI validation for user-facing features
3. **Systematic Analysis**: Use BMAD framework for complex problem-solving
4. **Enhanced Search**: Utilize quality-filtered search for research and documentation

## Workflow Guidelines

### For New Features
1. Analyze requirements using `oneagent_bmad_analyze`
2. Search for best practices using `oneagent_enhanced_search`
3. Retrieve relevant context using `oneagent_memory_context`
4. Implement with Constitutional AI principles
5. Validate quality using `oneagent_quality_score`

### For Code Review
1. Apply `oneagent_constitutional_validate` to critical logic
2. Ensure quality score meets minimum threshold (80%)
3. Check system health impact using `oneagent_system_health`
4. Document decisions and reasoning clearly

### For Problem Solving
1. Use BMAD framework for systematic analysis
2. Apply Constitutional AI for solution validation
3. Leverage semantic analysis for complex relationships
4. Maintain quality standards throughout process

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

// BMAD analysis for architecture decisions
const analysis = await oneagent_bmad_analyze({
  task: "Implement microservices architecture for user management"
});
```

Remember: OneAgent emphasizes quality-first development with systematic analysis and Constitutional AI validation. Always prioritize professional standards and comprehensive quality assurance.
