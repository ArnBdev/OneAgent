# OneAgent v4.0.0 Professional - API Reference

## Constitutional AI Tools

### `oneagent_constitutional_validate`
Validate responses against Constitutional AI principles.

```typescript
interface ConstitutionalValidateRequest {
  response: string;
  userMessage: string;
  context?: object;
}

interface ConstitutionalValidateResponse {
  isValid: boolean;
  score: number; // 0-100
  violations: Violation[];
  suggestions: string[];
  refinedResponse: string;
  qualityMetrics: {
    accuracy: boolean;
    transparency: boolean;
    helpfulness: boolean;
    safety: boolean;
  };
}
```

### `oneagent_bmad_analyze`
Apply BMAD 9-point elicitation framework for complex reasoning.

```typescript
interface BMADAnalyzeRequest {
  task: string;
}

interface BMADAnalyzeResponse {
  task: string;
  analysis: {
    selectedPoints: BMADPoint[];
    enhancedMessage: string;
    qualityFramework: string;
    complexity: 'simple' | 'complex';
    confidence: number;
  };
  framework: 'BMAD 9-Point Elicitation';
  complexity: 'simple' | 'complex';
  confidence: number;
}
```

### `oneagent_quality_score`
Generate quality scoring with professional grading.

```typescript
interface QualityScoreRequest {
  content: string;
  criteria?: string[];
}

interface QualityScoreResponse {
  content: string;
  qualityScore: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  criteria: string[];
  professionalGrade: 'A' | 'B' | 'C' | 'D';
}
```

## Memory Management Tools

### `oneagent_memory_context`
Retrieve relevant memory context for enhanced responses.

```typescript
interface MemoryContextRequest {
  query: string;
  userId: string;
  limit?: number;
}

interface MemoryContextResponse {
  query: string;
  userId: string;
  memories: Memory[];
  totalFound: number;
  contextEnhancement: {
    semantic: boolean;
    temporal: boolean;
    relevanceScoring: boolean;
  };
}
```

### `oneagent_memory_create`
Create new memory with real-time learning capability.

```typescript
interface MemoryCreateRequest {
  content: string;
  userId: string;
  memoryType?: 'short_term' | 'long_term' | 'workflow' | 'session';
  metadata?: object;
}
```

## Enhanced Development Tools

### `oneagent_ai_assistant`
AI assistance with Constitutional AI validation.

```typescript
interface AIAssistantRequest {
  message: string;
  applyConstitutional?: boolean;
  qualityThreshold?: number; // 0-100
}
```

### `oneagent_enhanced_search`
Enhanced web search with quality filtering.

```typescript
interface EnhancedSearchRequest {
  query: string;
  filterCriteria?: string[];
  includeQualityScore?: boolean;
}
```

### `oneagent_semantic_analysis`
Advanced semantic analysis with 768-dimensional embeddings.

```typescript
interface SemanticAnalysisRequest {
  text: string;
  analysisType: 'similarity' | 'classification' | 'clustering';
}
```

### `oneagent_system_health`
Comprehensive system health and performance metrics.

```typescript
interface SystemHealthResponse {
  status: 'healthy' | 'degraded' | 'error';
  version: string;
  components: {
    constitutionalAI: ComponentStatus;
    bmadFramework: ComponentStatus;
    memorySystem: ComponentStatus;
    aiAssistant: ComponentStatus;
    webSearch: ComponentStatus;
    semanticSearch: ComponentStatus;
  };
  metrics: {
    totalOperations: number;
    averageLatency: number;
    errorRate: number;
    qualityScore: number;
  };
  capabilities: string[];
}
```

## Life Companion Frameworks

### Work Productivity (P-R-O-D-U-C-E)
- **P**lan: Strategic task prioritization and goal alignment
- **R**ecognize: Pattern recognition for productivity optimization
- **O**rganize: Systematic workflow and resource management
- **D**eliver: Quality execution with milestone tracking
- **U**nderstand: Context awareness and stakeholder needs
- **C**onnect: Cross-project knowledge transfer and collaboration
- **E**volve: Continuous improvement and skill development

### Family Relationships (F-A-M-I-L-Y)
- **F**eel: Emotional intelligence and empathy development
- **A**ttend: Active listening and presence cultivation
- **M**emory: Shared experience and milestone tracking
- **I**ntegrate: Harmony between family and other life domains
- **L**ove: Unconditional support and appreciation expression
- **Y**ield: Growth through compromise and understanding

### Personal Growth (G-R-O-W-T-H)
- **G**oals: Clear vision setting and milestone definition
- **R**eflect: Self-awareness and pattern recognition
- **O**ptimize: Continuous improvement and skill development
- **W**isdom: Learning integration and insight application
- **T**ransform: Sustainable change and habit formation
- **H**armony: Balanced integration across all life domains

### Cross-Domain Learning (L-I-N-K)
- **L**earn: Pattern recognition across all life domains
- **I**ntegrate: Knowledge transfer between contexts
- **N**etwork: Connection mapping between insights
- **K**nowledge: Wisdom accumulation and application

## Usage Examples

### Constitutional AI Validation
```javascript
const validation = await oneagent_constitutional_validate({
  response: "Your implementation approach",
  userMessage: "User's original request",
  context: { projectType: "life-companion" }
});

if (validation.score >= 85) {
  console.log("High-quality response validated");
}
```

### BMAD Analysis for Complex Tasks
```javascript
const analysis = await oneagent_bmad_analyze({
  task: "Implement cross-domain learning for work-family integration"
});

console.log(`Complexity: ${analysis.complexity}`);
console.log(`Confidence: ${analysis.confidence}`);
```

### Quality Assessment
```javascript
const quality = await oneagent_quality_score({
  content: "Your response content",
  criteria: ["accuracy", "helpfulness", "clarity"]
});

console.log(`Grade: ${quality.professionalGrade}`);
console.log(`Score: ${quality.qualityScore}/100`);
```
