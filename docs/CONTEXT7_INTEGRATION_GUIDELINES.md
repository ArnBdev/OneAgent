# Context7 Integration Guidelines
*OneAgent Professional Development Platform*

## Overview
Context7 is fully integrated into OneAgent and should be actively leveraged for real-time documentation retrieval to maximize coding success across all programming languages, frameworks, and systems.

## Active Context7 Usage Patterns

### 1. Language Documentation Retrieval
```typescript
// Before working with any programming language, retrieve latest docs
await fetchWebpage({
  urls: [`https://docs.python.org/3/`, `https://docs.python.org/3/whatsnew/`],
  query: "latest Python features, best practices, migration guide"
});

await fetchWebpage({
  urls: [`https://www.typescriptlang.org/docs/`, `https://devblogs.microsoft.com/typescript/`],
  query: "TypeScript latest features, performance optimizations, compiler options"
});
```

### 2. Framework Best Practices
```typescript
// Real-time framework documentation
await fetchWebpage({
  urls: [`https://nodejs.org/en/docs/`, `https://nodejs.org/en/blog/`],
  query: "Node.js latest version features, security updates, performance improvements"
});

await fetchWebpage({
  urls: [`https://reactjs.org/docs/`, `https://react.dev/blog`],
  query: "React latest patterns, hooks best practices, performance optimization"
});
```

### 3. Library Integration Guidance
```typescript
// Before using any library, get latest documentation
await fetchWebpage({
  urls: [`https://docs.npmjs.com/`, `https://github.com/npm/cli/releases`],
  query: "npm latest features, security best practices, package management"
});
```

## Implementation Strategy

### For Every Development Task:
1. **Research Phase**: Use Context7 to retrieve latest documentation
2. **Implementation Phase**: Apply retrieved best practices
3. **Validation Phase**: Cross-reference with current standards
4. **Memory Storage**: Store valuable patterns and insights

### Context7 Integration Points:
- **Pre-Implementation**: Retrieve latest docs for target technology
- **During Development**: Reference current best practices
- **Post-Implementation**: Validate against latest standards
- **Continuous Learning**: Store successful patterns for reuse

## Key Documentation Sources

### Core Languages
- **TypeScript**: https://www.typescriptlang.org/docs/
- **JavaScript**: https://developer.mozilla.org/en-US/docs/Web/JavaScript
- **Python**: https://docs.python.org/3/
- **Node.js**: https://nodejs.org/en/docs/

### Frameworks & Libraries
- **React**: https://react.dev/
- **Express**: https://expressjs.com/
- **Vite**: https://vitejs.dev/
- **Jest**: https://jestjs.io/

### Development Tools
- **npm**: https://docs.npmjs.com/
- **Git**: https://git-scm.com/doc
- **VS Code**: https://code.visualstudio.com/docs
- **Chrome DevTools**: https://developer.chrome.com/docs/devtools/

### AI & ML
- **OpenAI**: https://platform.openai.com/docs
- **Google Gemini**: https://ai.google.dev/docs
- **Anthropic Claude**: https://docs.anthropic.com/

## Context7 Workflow Examples

### Example 1: TypeScript Upgrade
```typescript
// Step 1: Research latest TypeScript features
const tsLatest = await fetchWebpage({
  urls: ['https://www.typescriptlang.org/docs/handbook/release-notes/overview.html'],
  query: 'TypeScript latest features, breaking changes, migration guide'
});

// Step 2: Apply retrieved knowledge to upgrade
// Implementation with latest best practices...

// Step 3: Store successful patterns
await oneagent_memory_create({
  content: `TypeScript upgrade pattern: ${successfulUpgradePattern}`,
  memoryType: 'long_term',
  userId: 'system'
});
```

### Example 2: React Component Development
```typescript
// Step 1: Get latest React patterns
const reactBest = await fetchWebpage({
  urls: ['https://react.dev/learn', 'https://react.dev/reference/react'],
  query: 'React functional components, hooks best practices, performance optimization'
});

// Step 2: Implement with current standards
// Component implementation...

// Step 3: Document successful pattern
await oneagent_memory_create({
  content: `React component pattern: ${componentPattern}`,
  memoryType: 'workflow',
  userId: 'system'
});
```

## Constitutional AI Integration

### Documentation Validation
```typescript
// Validate retrieved documentation against Constitutional AI principles
const validation = await oneagent_constitutional_validate({
  content: retrievedDocumentation,
  userMessage: 'Latest framework best practices',
});

// Only use Constitutional AI-validated information
if (validation.constitutionalCompliant) {
  // Apply retrieved best practices
}
```

### Quality Assurance
```typescript
// Score documentation quality before application
const quality = await oneagent_quality_score({
  content: implementationPlan,
  criteria: ['accuracy', 'relevance', 'completeness', 'currency']
});

// Ensure minimum 80% quality threshold
if (quality.score >= 80) {
  // Proceed with implementation
}
```

## BMAD Analysis for Documentation Strategy

### Context7 Usage Decision Framework
1. **Belief Assessment**: Trust authoritative sources (official docs, MDN, etc.)
2. **Motivation Mapping**: Maximize coding success through current knowledge
3. **Authority Identification**: Prioritize official documentation sources
4. **Dependency Mapping**: Identify documentation interdependencies
5. **Constraint Analysis**: Balance thoroughness with development velocity
6. **Risk Assessment**: Mitigate outdated information risk
7. **Success Metrics**: Code quality, development speed, error reduction
8. **Timeline Considerations**: Real-time retrieval vs cached knowledge
9. **Resource Requirements**: Network access, API rate limits

## Best Practices

### 1. Proactive Documentation Retrieval
- Always fetch latest docs before major implementations
- Update knowledge base with current best practices
- Validate against multiple authoritative sources

### 2. Pattern Recognition and Storage
- Identify successful implementation patterns
- Store reusable solutions in memory system
- Build institutional knowledge through Context7 insights

### 3. Continuous Learning Integration
- Monitor for documentation updates
- Adapt to evolving best practices
- Share successful patterns across development contexts

### 4. Quality-First Approach
- Apply Constitutional AI validation to all retrieved information
- Maintain 80%+ quality threshold for implementation guidance
- Ensure accuracy, transparency, helpfulness, and safety

## Evolution Strategy

Context7 integration should continuously evolve based on:
- Development success patterns
- Quality improvement metrics
- User feedback and requirements
- Technology landscape changes

This ensures OneAgent remains at the forefront of development best practices through active, intelligent documentation retrieval and application.
