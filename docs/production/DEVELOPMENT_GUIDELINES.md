# 🛠️ Development Guidelines - OneAgent v4.0.0

**Version:** OneAgent Revolutionary AI v4.0.0  
**Last Updated:** June 11, 2025  
**Status:** Constitutional AI Validated ✅  

---

## 🚀 **DEVELOPMENT PHILOSOPHY**

OneAgent follows Revolutionary AI development principles with Constitutional AI validation, BMAD framework analysis, and quality-first development standards. All development must meet enterprise-grade quality levels with 85%+ quality scores.

### **🎯 Core Principles**

1. **Constitutional AI Compliance** - All code must pass accuracy, transparency, helpfulness, and safety validation
2. **Quality-First Development** - Target minimum 85% quality score (Grade A) for production code
3. **BMAD Framework Integration** - Use systematic analysis for complex architectural decisions
4. **Type Safety** - Full TypeScript implementation with strict typing
5. **Modular Design** - Component-based architecture with clear separation of concerns

---

## 📁 **FILE ORGANIZATION STANDARDS**

### **📚 Documentation → `docs/`**
```bash
# ✅ CORRECT locations for documentation:
docs/ONEAGENT_MASTER_GUIDE.md           # Complete system guide
docs/REVOLUTIONARY_AI_TECHNICAL_REFERENCE.md  # Technical implementation
docs/MCP_SYSTEM_GUIDE.md                # MCP integration guide
docs/DEVELOPMENT_GUIDELINES.md          # Development standards (this file)
docs/GITHUB_SETUP_GUIDE.md             # Setup and deployment
docs/API_DOCUMENTATION.md              # API reference
docs/TROUBLESHOOTING.md                # Common issues and solutions

# ❌ WRONG - do NOT place in root:
./README.md                             # Only for project overview
./SETUP.md                              # Should be in docs/
```

### **🧪 Tests → `tests/`**
```bash
# ✅ CORRECT locations for tests:
tests/constitutional-ai/                # Constitutional AI validation tests
tests/mcp-tools/                       # MCP tool testing
tests/quality-scoring/                 # Quality validation tests
tests/integration/                     # API integration tests
tests/unit/                           # Unit tests
tests/performance/                    # Performance benchmarks

# ❌ WRONG - do NOT place in root:
./test-something.ts                    # Should be in tests/
./validate-api.ts                     # Should be in tests/
```

### **🔧 Scripts → `scripts/`**
```bash
# ✅ CORRECT locations for scripts:
scripts/build-production.js           # Build scripts
scripts/deploy-mcp-server.js         # MCP deployment
scripts/quality-validation.js        # Quality checking
scripts/constitutional-ai-check.js   # Constitutional validation

# ❌ WRONG - do NOT place in root:
./build.js                            # Should be in scripts/
./deploy.js                           # Should be in scripts/
```

### **🏗️ Core Development → `coreagent/`**
```bash
# ✅ Modular architecture structure:
coreagent/
├── agents/                           # Agent implementations
├── mcp/                             # MCP server and tools
├── intelligence/                    # Constitutional AI + BMAD
├── validation/                      # Quality scoring system
├── memory/                          # Memory management
├── types/                           # TypeScript definitions
└── utils/                           # Utility functions
```

---

## 🧠 **REVOLUTIONARY AI DEVELOPMENT WORKFLOW**

### **Phase 1: Planning & Analysis**
1. **BMAD Framework Analysis** - Use `oneagent_bmad_analyze` for complex tasks
2. **Quality Assessment** - Set quality targets (minimum 85%)
3. **Constitutional Validation** - Ensure compliance with AI principles
4. **Memory Context** - Retrieve relevant context with `oneagent_memory_context`

### **Phase 2: Implementation**
1. **TypeScript-First Development** - Strict typing requirements
2. **Modular Component Design** - Single responsibility principle
3. **Constitutional AI Integration** - Apply validation throughout development
4. **Quality Scoring** - Use `oneagent_quality_score` during development

### **Phase 3: Validation & Testing**
1. **Constitutional AI Validation** - Use `oneagent_constitutional_validate`
2. **Quality Score Verification** - Must exceed 85% threshold
3. **MCP Tool Testing** - Verify all tool integrations
4. **Performance Validation** - Monitor system health with `oneagent_system_health`

---

## 🔧 **TECHNICAL STANDARDS**

### **TypeScript Configuration**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitThis": true,
    "noImplicitReturns": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### **Code Quality Requirements**
- **Constitutional AI Compliance**: 100% (all 4 principles)
- **Quality Score**: Minimum 85% (Grade A)
- **Type Coverage**: 100% TypeScript coverage
- **Test Coverage**: Minimum 80% for critical paths
- **Documentation**: JSDoc comments for all public APIs

### **Error Handling Standards**
```typescript
// ✅ Constitutional AI compliant error handling
try {
  const result = await riskyOperation();
  return { success: true, data: result };
} catch (error) {
  // Transparent error reporting
  logger.error('Operation failed', { error, context });
  
  // Helpful error messages
  return { 
    success: false, 
    error: 'Operation failed due to validation error',
    details: error instanceof Error ? error.message : 'Unknown error'
  };
}
```

---

## 🏗️ **MCP TOOLS INTEGRATION**

### **Available Tools for Development**
```typescript
// Constitutional AI Tools
await oneagent_constitutional_validate(response, userMessage, context);
await oneagent_bmad_analyze(task);
await oneagent_quality_score(content, criteria);

// Development Tools
await oneagent_memory_context(query, userId, limit);
await oneagent_enhanced_search(query, filterCriteria);
await oneagent_ai_assistant(message, applyConstitutional, qualityThreshold);
await oneagent_semantic_analysis(text, analysisType);
await oneagent_system_health();

// Memory Management
await oneagent_memory_create(content, userId, memoryType, metadata);
await oneagent_memory_edit(memoryId, userId, content, metadata);
await oneagent_memory_delete(memoryId, userId, confirm);

// Web Content
await oneagent_web_fetch(url, extractContent, extractMetadata);
```

### **Tool Usage Guidelines**
1. **Always validate with Constitutional AI** for user-facing features
2. **Use quality scoring** to ensure code meets standards
3. **Apply BMAD analysis** for complex architectural decisions
4. **Store learnings in memory** for continuous improvement

---

## 🧪 **TESTING STANDARDS**

### **Test Structure**
```typescript
// ✅ Constitutional AI validated test structure
describe('FeatureName', () => {
  beforeEach(async () => {
    // Setup with quality validation
    await testSetup.initialize();
  });

  it('should meet constitutional AI principles', async () => {
    const result = await feature.execute(input);
    
    // Validate against Constitutional AI
    const validation = await oneagent_constitutional_validate(
      result.toString(),
      'Test execution',
      { feature: 'test' }
    );
    
    expect(validation.accuracy).toBeGreaterThan(0.85);
    expect(validation.transparency).toBeGreaterThan(0.85);
    expect(validation.helpfulness).toBeGreaterThan(0.85);
    expect(validation.safety).toBeGreaterThan(0.85);
  });

  it('should meet quality score threshold', async () => {
    const result = await feature.execute(input);
    
    const qualityScore = await oneagent_quality_score(
      result.toString(),
      ['accuracy', 'maintainability', 'performance']
    );
    
    expect(qualityScore.overallScore).toBeGreaterThan(85);
  });
});
```

### **Test Categories**
- **Unit Tests**: Individual component validation
- **Integration Tests**: MCP tool integration
- **Constitutional AI Tests**: Principle compliance validation
- **Quality Tests**: Score threshold verification
- **Performance Tests**: System health monitoring

---

## 📊 **QUALITY ASSURANCE**

### **Quality Gates**
1. **Constitutional AI Validation** - All 4 principles must pass
2. **Quality Score Threshold** - Minimum 85% overall score
3. **Type Safety** - Zero TypeScript errors
4. **Test Coverage** - Minimum 80% for critical paths
5. **Performance** - System health metrics within acceptable ranges

### **Quality Validation Process**
```typescript
// Automated quality validation pipeline
async function validateCodeQuality(code: string): Promise<QualityReport> {
  // Constitutional AI validation
  const constitutional = await oneagent_constitutional_validate(code, 'Code review');
  
  // Quality scoring
  const quality = await oneagent_quality_score(code, [
    'accuracy', 'maintainability', 'performance', 'security'
  ]);
  
  // BMAD analysis for complex components
  const complexity = await oneagent_bmad_analyze('Code complexity assessment');
  
  return {
    constitutional,
    quality,
    complexity,
    approved: quality.overallScore >= 85 && constitutional.overallCompliance > 0.85
  };
}
```

---

## 🚀 **DEPLOYMENT STANDARDS**

### **Pre-Deployment Checklist**
- [ ] Constitutional AI validation passes
- [ ] Quality score exceeds 85%
- [ ] All tests pass
- [ ] TypeScript compilation successful
- [ ] MCP tools functional
- [ ] System health metrics acceptable
- [ ] Documentation updated

### **Deployment Process**
1. **Quality Validation** - Run full quality assessment
2. **Constitutional AI Check** - Verify principle compliance
3. **System Health** - Check OneAgent system status
4. **MCP Server** - Ensure all 12 tools operational
5. **Performance Monitoring** - Baseline metrics established

---

## 📚 **AGENT CREATION TEMPLATE**

### **New Agent Implementation**
```typescript
import { BaseAgent } from '../base/BaseAgent';
import { ConstitutionalAI, QualityScoring, BMADFramework } from '../intelligence';

export class NewAgent extends BaseAgent {
  async execute(input: AgentInput): Promise<AgentResult> {
    // 1. BMAD analysis for complex tasks
    const analysis = await this.bmadFramework.analyze(input.task);
    
    // 2. Constitutional AI validation
    const validation = await this.constitutionalAI.validate(input);
    
    // 3. Implementation with quality tracking
    const result = await this.processWithQuality(input);
    
    // 4. Quality scoring
    const quality = await this.qualityScoring.score(result);
    
    if (quality.overallScore < 85) {
      // Iterative refinement
      return this.refineResult(result, quality.suggestions);
    }
    
    return result;
  }
}
```

### **Agent Registration**
```typescript
// Register new agent with Constitutional AI
export const agentRegistry = {
  'new-agent': {
    class: NewAgent,
    capabilities: ['constitutional-ai', 'quality-scoring', 'bmad-analysis'],
    qualityThreshold: 85,
    constitutionalCompliance: true
  }
};
```

---

## 🔄 **DEVELOPMENT CYCLE WORKFLOW**

### **1. Implementation Summary (with Quality Metrics)**
- Document what was implemented
- Include quality scores and validation results
- Note Constitutional AI compliance levels

### **2. Revolutionary Prompt Engineering Application**
- Document BMAD elicitation points used
- Note Constitutional AI validation results
- Record quality refinement iterations

### **3. Roadmap & Documentation Update**
- Update master documentation
- Record quality metrics and improvements
- Update system health status

### **4. Suggest Next Step (Enhanced Analysis)**
- Apply BMAD framework for next task analysis
- Include Constitutional AI validation recommendations
- Provide quality assurance expectations

### **5. Pause & Wait (with Confidence Indicators)**
- Include confidence levels and quality metrics
- Wait for explicit approval before proceeding

---

## 🛡️ **SECURITY & SAFETY STANDARDS**

### **Constitutional AI Safety**
- **Accuracy**: Prefer "I don't know" over speculation
- **Transparency**: Explain reasoning and limitations clearly
- **Helpfulness**: Provide actionable, relevant guidance
- **Safety**: Avoid harmful or misleading recommendations

### **Code Security**
- Input validation on all external inputs
- Output sanitization for user-facing content
- Error handling with appropriate disclosure levels
- Access control and authentication where needed

### **Data Privacy**
- Memory system respects user privacy
- No sensitive data in logs
- Secure handling of user context
- GDPR compliance considerations

---

## 📈 **PERFORMANCE OPTIMIZATION**

### **System Health Monitoring**
```typescript
// Regular system health checks
const health = await oneagent_system_health();
console.log(`Quality Score: ${health.metrics.qualityScore}%`);
console.log(`Latency: ${health.metrics.averageLatency}ms`);
console.log(`Error Rate: ${health.metrics.errorRate}%`);
```

### **Optimization Guidelines**
- Memory caching for 768-dimensional embeddings
- Efficient HTTP connection management
- Quality scoring optimization for minimal overhead
- Automatic session cleanup to prevent memory leaks

---

## 🧠 **MEMORY SYSTEM BEST PRACTICES**

### **Memory Operations**
```typescript
// Store development learnings
await oneagent_memory_create(
  'TypeScript strict mode compilation best practices',
  'developer-id',
  'long_term',
  { project: 'OneAgent', category: 'development' }
);

// Retrieve relevant context
const context = await oneagent_memory_context(
  'TypeScript compilation issues',
  'developer-id',
  5
);
```

### **Memory Guidelines**
- Use descriptive content for better semantic matching
- Tag memories with relevant metadata
- Regular cleanup of outdated memories
- Respect user privacy and data retention policies

---

## ✅ **DEVELOPMENT STANDARDS CHECKLIST**

### **Before Starting Development**
- [ ] BMAD analysis completed for complex tasks
- [ ] Quality targets set (minimum 85%)
- [ ] Constitutional AI principles understood
- [ ] Memory context retrieved for relevant patterns

### **During Development**
- [ ] TypeScript strict mode enabled
- [ ] Constitutional AI validation applied
- [ ] Quality scoring used for validation
- [ ] Modular component design followed

### **Before Deployment**
- [ ] Quality score exceeds 85%
- [ ] Constitutional AI validation passes
- [ ] All tests successful
- [ ] System health verified
- [ ] Documentation updated

---

## 🎯 **DEVELOPMENT GUIDELINES STATUS: COMPLETE**

**Implementation Status**: ✅ COMPLETE - Comprehensive development standards  
**Constitutional AI**: ✅ All guidelines validated against 4 principles  
**Quality Standards**: ✅ 85%+ threshold requirements established  
**BMAD Integration**: ✅ Framework analysis integrated throughout workflow  
**MCP Tools**: ✅ All 12 tools integrated into development process  

**🚀 OneAgent Revolutionary AI Development Guidelines - Quality-First Development!**
