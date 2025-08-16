# OneAgent Canonical Architecture Design

## 🚨 **DOCUMENT MOVED AND CONSOLIDATED**

This document has been **consolidated** into a comprehensive plan:

📋 **[ONEAGENT_UNIFIED_ARCHITECTURE_PLAN.md](./ONEAGENT_UNIFIED_ARCHITECTURE_PLAN.md)**

The unified document includes:

- Complete parallel systems inventory (9 systems)
- Canonical architecture design
- Agent communication failure analysis
- Context7 legacy adapter issues
- Comprehensive consolidation roadmap
- All information from previous documents preserved

**Please use the unified document for all future architectural planning.**

---

## 🎯 **LEGACY CONTENT BELOW** (For Reference Only)

## 🏗️ **UNIFIED BACKBONE SERVICE: The Single Source of Truth**

### **Current Architecture Analysis**

- **UnifiedBackboneService**: Exists but has its own Date.now() violations
- **Time System**: `createUnifiedTimestamp()` is the canonical method
- **Metadata System**: `createUnifiedMetadata()` is the canonical method
- **ID Generation**: Private method exists but uses Date.now() - needs fixing

### **Canonical System Design**

```typescript
/**
 * UnifiedBackboneService - The ONLY source of truth for ALL OneAgent systems
 *
 * ARCHITECTURAL PRINCIPLE: Every operation that needs time, IDs, memory, caching,
 * error handling, or MCP integration MUST use this service
 */
export class UnifiedBackboneService {
  // =====================================
  // TIME SYSTEM (90% Complete)
  // =====================================
  static createUnifiedTimestamp(): UnifiedTimestamp;

  // =====================================
  // ID GENERATION SYSTEM (Needs Fix)
  // =====================================
  static generateUnifiedId(type: IdType, context?: string): string;

  // =====================================
  // MEMORY SYSTEM (To Be Designed)
  // =====================================
  static readonly memory: UnifiedMemoryInterface;

  // =====================================
  // CACHING SYSTEM (To Be Designed)
  // =====================================
  static readonly cache: UnifiedCacheInterface;

  // =====================================
  // ERROR HANDLING SYSTEM (To Be Designed)
  // =====================================
  static readonly errorHandler: UnifiedErrorInterface;

  // =====================================
  // MCP INTEGRATION SYSTEM (To Be Designed)
  // =====================================
  static readonly mcp: UnifiedMCPInterface;
}
```

## 🎯 **SYSTEM-BY-SYSTEM CANONICAL DESIGN**

### **1. TIME SYSTEM** ✅ **CANONICAL METHOD EXISTS**

```typescript
// CANONICAL: Use this everywhere
const timestamp = createUnifiedTimestamp();
const unixTime = timestamp.unix;

// VIOLATION: Never use these
const time = Date.now(); // ❌ PARALLEL SYSTEM
const time = new Date().getTime(); // ❌ PARALLEL SYSTEM
```

### **2. ID GENERATION SYSTEM** ✅ **CANONICAL SYSTEM OPERATIONAL**

```typescript
// CANONICAL: Use this everywhere (WORKING)
const id = createUnifiedId('operation', 'gemini_embedding');
const id = createUnifiedId('analysis', 'code_review');
const id = createUnifiedId('document', 'context7');

// VIOLATION: Current parallel patterns (TO BE MIGRATED)
const id = `gemini_embedding_${Date.now()}_${Math.random()}`; // ❌
const id = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`; // ❌
const id = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`; // ❌
```

**✅ Implemented ID System:**

```typescript
// Available functions from UnifiedBackboneService:
createUnifiedId(type: IdType, context?: string, config?: Partial<UnifiedIdConfig>): string
createUnifiedIdWithResult(type: IdType, context?: string, config?: Partial<UnifiedIdConfig>): UnifiedIdResult

// Example usage:
const id = createUnifiedId('test', 'system_verification');
// Result: "test_system_verification_1752599654344_032ep2rox"

const result = createUnifiedIdWithResult('test', 'system_verification', { format: 'medium' });
// Result: Full metadata object with timestamp, source, format info
```

### **3. MEMORY SYSTEM** 🔧 **CANONICAL ARCHITECTURE DESIGN**

**🎯 USER'S VISION**: "All agents work and save their conversations and thoughts in memory, and learnings from one agent is a learning for all agents. Life domains get separated with rich metadata, like WORKPLACE or PRIVATE so to prevent leakage. And prevent leaking between users in case we add support for multiuser later."

**🏗️ ARCHITECTURAL REQUIREMENTS**:

- ✅ **Domain Separation**: WORKPLACE/PRIVATE with zero leakage
- ✅ **Cross-Agent Learning**: Shared intelligence across all agents
- ✅ **Multi-User Support**: Complete user isolation
- ✅ **Memgraph Integration**: Graph-based relationships for future
- ✅ **Structured Metadata**: No JSON serialization loss

```typescript
// CANONICAL: The future unified memory system
await UnifiedBackboneService.memory.store({
  content: "Learning pattern discovered",
  domain: 'WORKPLACE',
  userId: 'user123',
  agentId: 'coding-agent',
  crossAgentShare: true,
  metadata: {
    contextCategory: 'TECHNICAL',
    projectScope: 'TEAM',
    privacyLevel: 'internal'
  }
});

// VIOLATION: Current parallel patterns
await new OneAgentMemory().addMemory(data); // ❌ No domain separation
await this.memorySystem.searchMemory(query); // ❌ No user isolation
await fetch('/memory/learnings', {...}); // ❌ Direct MCP calls
```

**🔧 UNIFIED MEMORY INTERFACE DESIGN**:

```typescript
interface UnifiedMemoryInterface {
  // =====================================
  // CORE OPERATIONS (Domain + User Aware)
  // =====================================
  store(entry: UnifiedMemoryEntry): Promise<string>;
  search(query: UnifiedMemoryQuery): Promise<UnifiedMemoryResult[]>;
  update(id: string, data: Partial<UnifiedMemoryEntry>): Promise<boolean>;
  delete(id: string): Promise<boolean>;

  // =====================================
  // DOMAIN SEPARATION (CRITICAL)
  // =====================================
  searchDomain(
    domain: ContextCategory,
    query: string,
    userId: string,
  ): Promise<UnifiedMemoryResult[]>;
  crossDomainSearch(
    query: string,
    userId: string,
    allowedDomains: ContextCategory[],
  ): Promise<UnifiedMemoryResult[]>;
  preventDomainLeakage(entry: UnifiedMemoryEntry): boolean;

  // =====================================
  // USER ISOLATION (MULTI-USER READY)
  // =====================================
  getUserMemories(userId: string, domain?: ContextCategory): Promise<UnifiedMemoryResult[]>;
  shareMemoryBetweenUsers(memoryId: string, fromUserId: string, toUserId: string): Promise<boolean>;
  enforceUserBoundaries(query: UnifiedMemoryQuery): Promise<UnifiedMemoryQuery>;

  // =====================================
  // CROSS-AGENT LEARNING (INTELLIGENCE)
  // =====================================
  shareAgentLearning(learning: AgentLearning): Promise<string>;
  getAgentLearnings(agentType: AgentType, domain?: ContextCategory): Promise<AgentLearning[]>;
  crossAgentInsights(context: string, userId: string): Promise<CrossAgentInsight[]>;

  // =====================================
  // MEMGRAPH INTEGRATION (FUTURE)
  // =====================================
  createRelationship(fromId: string, toId: string, type: RelationshipType): Promise<boolean>;
  getRelatedMemories(memoryId: string, depth?: number): Promise<UnifiedMemoryResult[]>;
  findPatterns(domain: ContextCategory, userId: string): Promise<MemoryPattern[]>;

  // =====================================
  // STRUCTURED METADATA (NO SERIALIZATION)
  // =====================================
  addStructuredMetadata(memoryId: string, metadata: StructuredMetadata): Promise<boolean>;
  queryByMetadata(
    metadata: Partial<StructuredMetadata>,
    userId: string,
  ): Promise<UnifiedMemoryResult[]>;
  preserveMetadataStructure(metadata: any): StructuredMetadata;

  // =====================================
  // BATCH OPERATIONS (PERFORMANCE)
  // =====================================
  storeBatch(entries: UnifiedMemoryEntry[]): Promise<string[]>;
  searchBatch(queries: UnifiedMemoryQuery[]): Promise<UnifiedMemoryResult[][]>;

  // =====================================
  // INTELLIGENCE OPERATIONS
  // =====================================
  analyze(query: string, userId: string, domain?: ContextCategory): Promise<UnifiedMemoryAnalysis>;
  suggest(
    context: string,
    userId: string,
    domain?: ContextCategory,
  ): Promise<UnifiedMemorySuggestion[]>;

  // =====================================
  // HEALTH AND METRICS
  // =====================================
  getHealth(): Promise<UnifiedMemoryHealth>;
  getMetrics(): Promise<UnifiedMemoryMetrics>;
  getDomainMetrics(domain: ContextCategory): Promise<DomainMetrics>;
  getUserMetrics(userId: string): Promise<UserMetrics>;
}
```

**🔧 CORE MEMORY TYPES**:

```typescript
interface UnifiedMemoryEntry {
  // Core identification
  id: string;
  content: string;
  userId: string;
  agentId: string;

  // Domain separation (CRITICAL)
  domain: ContextCategory; // WORKPLACE | PRIVATE | PROJECT | etc.
  contextCategory: ContextCategory;
  privacyLevel: PrivacyLevel;

  // Cross-agent learning
  crossAgentShare: boolean;
  agentType: AgentType;
  learningType: 'pattern' | 'solution' | 'insight' | 'error' | 'optimization';

  // Structured metadata (NO JSON serialization)
  metadata: StructuredMetadata;

  // Temporal context
  timestamp: UnifiedTimestamp;

  // Memory classification
  memoryType: 'short_term' | 'long_term' | 'session' | 'workflow' | 'learning';

  // Relationships (Memgraph ready)
  relationships: MemoryRelationship[];

  // Quality assurance
  qualityScore: number;
  constitutionalCompliant: boolean;
  validationLevel: 'basic' | 'enhanced' | 'strict' | 'constitutional';
}

interface StructuredMetadata {
  // Project context
  projectContext?: ProjectContext;

  // Conversation analysis
  conversationMetadata?: ConversationMetadata;

  // Learning patterns
  learningPatterns?: LearningPattern[];

  // Technical context
  technicalContext?: {
    technology: string;
    version: string;
    framework: string;
    language: string;
  };

  // Business context
  businessContext?: {
    priority: 'low' | 'medium' | 'high' | 'critical';
    stakeholders: string[];
    deadline?: Date;
    budget?: number;
  };

  // Personal context (for PRIVATE domain)
  personalContext?: {
    mood: MoodIndicator;
    energyLevel: string;
    context: string;
  };
}

interface UnifiedMemoryQuery {
  // Core query
  query: string;
  userId: string;

  // Domain filtering (CRITICAL)
  domain?: ContextCategory;
  allowedDomains?: ContextCategory[];
  respectDomainBoundaries: boolean;

  // Agent context
  agentType?: AgentType;
  crossAgentSearch?: boolean;

  // Search parameters
  maxResults?: number;
  qualityThreshold?: number;
  timeRange?: { start: Date; end: Date };

  // Metadata filtering
  metadataFilters?: Partial<StructuredMetadata>;

  // Learning context
  learningTypes?: ('pattern' | 'solution' | 'insight' | 'error' | 'optimization')[];
}
```

**🔧 DOMAIN SEPARATION LOGIC**:

```typescript
class DomainSeparationEngine {
  // Prevent cross-domain leakage
  static preventDomainLeakage(
    entry: UnifiedMemoryEntry,
    requestingDomain: ContextCategory,
  ): boolean {
    // WORKPLACE memories never leak to PRIVATE
    if (entry.domain === 'WORKPLACE' && requestingDomain === 'PRIVATE') return false;

    // PRIVATE memories never leak to WORKPLACE
    if (entry.domain === 'PRIVATE' && requestingDomain === 'WORKPLACE') return false;

    // PROJECT memories only accessible within project context
    if (entry.domain === 'PROJECT' && requestingDomain !== 'PROJECT') return false;

    // CONFIDENTIAL privacy level has additional restrictions
    if (entry.privacyLevel === 'confidential' && requestingDomain !== entry.domain) return false;

    return true;
  }

  // Enforce user boundaries
  static enforceUserBoundaries(
    query: UnifiedMemoryQuery,
    requestingUserId: string,
  ): UnifiedMemoryQuery {
    // Users can only access their own memories
    if (query.userId !== requestingUserId) {
      throw new Error('Cross-user memory access denied');
    }

    return query;
  }
}
```

**🔧 CROSS-AGENT LEARNING SYSTEM**:

```typescript
interface AgentLearning {
  id: string;
  agentType: AgentType;
  learningType: 'pattern' | 'solution' | 'insight' | 'error' | 'optimization';
  content: string;
  context: string;
  domain: ContextCategory;
  userId: string;
  sharedAcrossAgents: boolean;
  applicableAgentTypes: AgentType[];
  qualityScore: number;
  timestamp: UnifiedTimestamp;
}

interface CrossAgentInsight {
  sourceAgentType: AgentType;
  targetAgentType: AgentType;
  insightType:
    | 'pattern_transfer'
    | 'solution_reuse'
    | 'error_prevention'
    | 'optimization_opportunity';
  content: string;
  confidence: number;
  applicabilityScore: number;
  domain: ContextCategory;
}
```

**🔧 MEMGRAPH INTEGRATION (FUTURE-READY)**:

```typescript
interface MemoryRelationship {
  id: string;
  type: RelationshipType;
  targetMemoryId: string;
  strength: number;
  context: string;
  timestamp: UnifiedTimestamp;
}

type RelationshipType =
  | 'follows_from'
  | 'builds_on'
  | 'contradicts'
  | 'supports'
  | 'similar_to'
  | 'caused_by'
  | 'leads_to'
  | 'depends_on';

interface MemoryPattern {
  id: string;
  pattern: string;
  frequency: number;
  memoryIds: string[];
  domain: ContextCategory;
  userId: string;
  confidence: number;
  actionable: boolean;
}
```

## 🚨 **CRITICAL IMPLEMENTATION PRINCIPLES**

### **1. Single Source of Truth**

- **NEVER create parallel implementations**
- **ALWAYS use UnifiedBackboneService**
- **NEVER use direct Date.now(), Math.random(), or manual ID generation**

### **2. Backward Compatibility**

- **Gradual migration**: Don't break existing systems
- **Wrapper functions**: Allow old code to work during transition
- **Deprecation warnings**: Guide developers to canonical methods

### **3. Performance Requirements**

- **Canonical systems must be FASTER than parallel systems**
- **Caching at canonical level prevents duplicate work**
- **Batch operations for efficiency**

### **4. Error Handling**

- **Canonical error handling prevents silent failures**
- **Consistent error reporting across all systems**
- **Automatic recovery where possible**

### **5. Testing Strategy**

- **Test canonical implementations thoroughly**
- **Test parallel system elimination**
- **Performance benchmarks**
- **Integration testing**

## 📋 **UPDATED IMPLEMENTATION ROADMAP**

### **Phase 1: Fix Time System Violations** ✅ **COMPLETED**

1. ✅ Fix UnifiedBackboneService Date.now() violations
2. ✅ Complete VS Code extension fixes
3. ✅ Fix remaining EnhancedContext7MCPIntegration.ts
4. ✅ Verify NO Date.now() calls exist anywhere

### **Phase 2: Foundation Systems (Unrelated to Memory)** 🔧 **CURRENT**

1. ✅ **ID Generation System** - COMPLETED (migration successful, all parallel patterns eliminated)
2. 🔧 **Caching System** - NEXT PRIORITY (independent of memory)
3. 🔧 **Error Handling System** - Fix third (foundational)
4. 🔧 **MCP Integration System** - Fix fourth (protocol layer)

### **Phase 3: Memory Architecture (Domain Separation)** 🔧 **AFTER FOUNDATION**

1. 🔧 **Expand OneAgentMemory.ts** - Add domain separation methods
2. 🔧 **Expand MemoryIntelligence.ts** - Add cross-agent learning
3. 🔧 **Expand MCP Tools** - Add domain parameters
4. 🔧 **Expand Type System** - Add domain types

### **Phase 4: Intelligence Systems (Memory-Dependent)** 🔧 **FINAL**

1. 🔧 Agent communication unification
2. 🔧 Intelligence system consolidation
3. 🔧 Final integration testing

**🎯 STRATEGIC CHANGE**: Fix foundation systems first, then expand memory architecture

## 🚀 **PARALLEL SYSTEMS CONSOLIDATION STRATEGY**

### **🎯 PARALLEL SYSTEMS PRIORITY MATRIX**

**⚡ HIGH PRIORITY (Fix First - Most Unrelated to Memory)**

1. **ID Generation System** - Simple, isolated, no memory dependencies
2. **Caching System** - Independent of memory architecture
3. **Error Handling System** - Foundational, affects all systems
4. **MCP Integration System** - Protocol layer, isolated

**🔄 MEDIUM PRIORITY (Fix After Architecture)**

1. **Memory System** - Core architecture redesign needed
2. **Agent Communication** - Depends on memory architecture
3. **Intelligence Systems** - Depends on memory and caching

**⭐ STRATEGIC APPROACH: Fix Unrelated Systems First**

- **WHY**: Build foundation without touching complex memory architecture
- **BENEFIT**: Eliminates 60% of parallel systems before memory redesign
- **RESULT**: Clean foundation for memory system implementation

### **🔧 SYSTEM-BY-SYSTEM CONSOLIDATION PLAN**

#### **1. ID GENERATION SYSTEM** ✅ **COMPLETED - MIGRATION SUCCESSFUL**

```typescript
// ✅ CANONICAL: Now used everywhere
const id = createUnifiedId('operation', 'gemini_embedding');
const id = createUnifiedId('analysis', 'code_review');
const id = createUnifiedId('document', 'context7');
const id = createUnifiedId('message', 'a2a_communication');
const id = createUnifiedId('learning', 'pattern_recognition');
const id = createUnifiedId('session', 'a2a_group');
const id = createUnifiedId('error', 'system_validation');

// ✅ ELIMINATED: All parallel patterns successfully migrated
// ❌ `gemini_embedding_${Date.now()}_${Math.random()}` → ✅ createUnifiedId('operation', 'gemini_embedding')
// ❌ `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` → ✅ createUnifiedId('analysis', 'code_review')
// ❌ `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` → ✅ createUnifiedId('document', 'context7')
// ❌ `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` → ✅ createUnifiedId('message', 'a2a_communication')
```

**✅ Migration Results:**

- **Files Migrated**: 8 files with 11 ID generation patterns
- **Zero Parallel Systems**: All manual ID generation eliminated
- **New ID Types**: Added 'message' to IdType union
- **Compilation**: Clean TypeScript build with no errors
- **Testing**: All ID types verified working correctly

#### **2. CACHING SYSTEM** ✅ **COMPLETED - INTEGRATION SUCCESSFUL**

```typescript
// ✅ CANONICAL: OneAgent Unified Cache System operational
const cache = OneAgentUnifiedBackbone.getInstance().cache;
await cache.set(key, value, ttl);
const value = await cache.get(key);
await cache.delete(key);
await cache.clear();

// ✅ ELIMINATED: All parallel patterns successfully migrated
// ❌ `const cache = new UnifiedCacheSystem()` → ✅ OneAgentUnifiedBackbone.getInstance().cache
// ❌ `const cache = new EmbeddingCache()` → ✅ OneAgentUnifiedBackbone.getInstance().cache
// ❌ `globalEmbeddingCache.getCachedEmbedding(content)` → ✅ OneAgentUnifiedBackbone.getInstance().cache.get(key)
// ❌ `const cache = new Map()` → ✅ OneAgentUnifiedBackbone.getInstance().cache
```

**✅ Migration Results:**

- **Files Migrated**: 3 cache systems consolidated into OneAgentUnifiedCacheSystem
- **Zero Parallel Systems**: All cache implementations unified
- **Multi-tier Architecture**: Memory → Disk → Network with intelligent promotion
- **Compilation**: Clean TypeScript build with no errors
- **Testing**: Cache system verified working with full metrics/health monitoring

#### **3. ERROR HANDLING SYSTEM** ⚡ **FIX THIRD**

```typescript
// Current parallel patterns to eliminate:
const cache = new UnifiedCacheSystem(); // ❌ Multiple instances
const cache = new EmbeddingCache(); // ❌ Specialized cache
const cache = new Map(); // ❌ Local caches
globalEmbeddingCache.getCachedEmbedding(content); // ❌ Global singleton

// Target canonical implementation:
await UnifiedBackboneService.cache.set(key, value, ttl);
const value = await UnifiedBackboneService.cache.get(key);
```

**🔍 Caching Audit Results:**

- **Files to fix**: ~8 files with different caching patterns
- **Complexity**: MEDIUM - Need to unify different cache types
- **Dependencies**: None - independent of memory system
- **Impact**: HIGH - significant performance improvement

#### **3. ERROR HANDLING SYSTEM** ⚡ **FIX THIRD**

```typescript
// Current parallel patterns to eliminate:
console.error('Error:', error); // ❌ Scattered throughout codebase
throw new Error(message); // ❌ Unhandled errors
try/catch with different patterns; // ❌ Inconsistent handling

// Target canonical implementation:
UnifiedBackboneService.errorHandler.log(error, context);
const handled = await UnifiedBackboneService.errorHandler.handle(error, recovery);
```

**🔍 Error Handling Audit Results:**

- **Files to fix**: ~50+ files with different error patterns
- **Complexity**: HIGH - Needs consistent error taxonomy
- **Dependencies**: None - foundational system
- **Impact**: CRITICAL - prevents silent failures

#### **4. MCP INTEGRATION SYSTEM** ⚡ **FIX FOURTH**

```typescript
// Current parallel patterns to eliminate:
const response = await fetch('/mcp', {...}); // ❌ Direct fetch calls
Multiple MCP clients; // ❌ Different implementations
Different response handling; // ❌ Inconsistent patterns

// Target canonical implementation:
const result = await UnifiedBackboneService.mcp.call(toolName, params);
```

**🔍 MCP Integration Audit Results:**

- **Files to fix**: ~20 files with MCP operations
- **Complexity**: MEDIUM - Protocol standardization
- **Dependencies**: None - protocol layer
- **Impact**: HIGH - unified tool integration

#### **5. MEMORY SYSTEM** 🔄 **REDESIGN AFTER FOUNDATION**

```typescript
// SKIP FOR NOW - Major architectural redesign needed
// Will be handled as separate architecture implementation
```

### **📋 EXECUTION ROADMAP**

**Phase 1: Foundation Systems (Weeks 1-2)**

1. ✅ Time System (COMPLETED)
2. ✅ ID Generation System (COMPLETED)
3. 🔧 Caching System (NEXT PRIORITY)
4. 🔧 Error Handling System
5. 🔧 MCP Integration System

**Phase 2: Memory Architecture (Weeks 3-4)**

1. 🔧 Design UnifiedMemoryInterface
2. 🔧 Implement domain separation
3. 🔧 Build cross-agent learning
4. 🔧 Migrate existing memory operations

**Phase 3: Intelligence Systems (Weeks 5-6)**

1. 🔧 Agent communication unification
2. 🔧 Intelligence system consolidation
3. 🔧 Final integration testing

## 🚀 **NEXT IMMEDIATE ACTIONS**

1. ✅ **Fix UnifiedBackboneService Date.now() violations** - COMPLETED
2. ✅ **Complete remaining Date.now() fixes** - COMPLETED
3. ✅ **Implement ID Generation System** - COMPLETED (migration successful)
4. 🔧 **Implement Caching System** - NEXT PRIORITY
5. 🔧 **Implement Error Handling System** - Critical foundation
6. 🔧 **Implement MCP Integration System** - Protocol unification
7. 🔧 **Expand Memory Architecture** - Domain separation implementation

**🎯 CURRENT FOCUS**: Caching System - Next foundation system (independent of memory)

**REMEMBER**: This is not about quick fixes - it's about building the right architecture for OneAgent's future!

## 🔍 **EXISTING MEMORY SYSTEM ANALYSIS**

### **🏗️ EXPAND vs REBUILD DECISION**

**Current Memory System Assets:**

- ✅ **OneAgentMemory.ts** - Solid canonical client pattern
- ✅ **MemoryIntelligence.ts** - Good intelligence layer
- ✅ **MCP Tools** - Production-ready tool suite
- ✅ **BatchOperations** - Performance optimization
- ✅ **EmbeddingCache** - Caching integration
- ✅ **Types** - Comprehensive type definitions

**🎯 STRATEGIC RECOMMENDATION: EXPAND EXISTING SYSTEM**

### **🔧 MEMORY SYSTEM EXPANSION PLAN**

#### **1. EXPAND OneAgentMemory.ts** ⭐ **CORE FOUNDATION**

```typescript
// Current capabilities (KEEP):
- singleton pattern ✅
- RESTful API integration ✅
- Batch operations ✅
- Caching support ✅
- Error handling ✅
- Metadata sanitization ✅

// Add new capabilities (EXPAND):
+ Domain separation logic
+ User isolation enforcement
+ Cross-agent learning methods
+ Structured metadata handling
+ Memgraph integration layer
```

**Expansion Strategy:**

- **Keep**: All existing methods and patterns
- **Add**: New domain-aware methods
- **Enhance**: Metadata handling without breaking existing
- **Integrate**: UnifiedBackboneService time/ID systems

#### **2. EXPAND MemoryIntelligence.ts** ⭐ **INTELLIGENCE LAYER**

```typescript
// Current capabilities (KEEP):
- Constitutional AI integration ✅
- Intelligent search ✅
- Conversation storage ✅
- Semantic analysis ✅

// Add new capabilities (EXPAND):
+ Cross-agent insight generation
+ Domain-specific intelligence
+ User context awareness
+ Pattern recognition across agents
+ Learning transfer mechanisms
```

#### **3. EXPAND MCP Tools** ⭐ **TOOL LAYER**

```typescript
// Current tools (ENHANCE):
- OneAgentMemoryAddTool → Add domain parameters
- OneAgentMemorySearchTool → Add domain filtering
- OneAgentMemoryEditTool → Add domain validation
- OneAgentMemoryDeleteTool → Add domain authorization

// Add new tools (CREATE):
+ OneAgentMemoryDomainTool → Domain-specific operations
+ OneAgentMemoryLearningTool → Cross-agent learning
+ OneAgentMemoryPatternTool → Pattern recognition
+ OneAgentMemoryInsightTool → Cross-agent insights
```

#### **4. EXPAND Type System** ⭐ **TYPE FOUNDATION**

```typescript
// Current types (ENHANCE):
- UnifiedMemoryEntry → Add domain fields
- MemoryMetadata → Add structured metadata
- MemorySearchOptions → Add domain filtering
- MemorySearchResult → Add domain context

// Add new types (CREATE):
+ DomainSeparationTypes → Domain-specific types
+ CrossAgentLearningTypes → Agent learning types
+ MemoryRelationshipTypes → Graph relationship types
+ StructuredMetadataTypes → Rich metadata types
```

### **🎯 IMPLEMENTATION STRATEGY: EVOLUTIONARY EXPANSION**

**Phase 1: Foundation Enhancement (Week 1)**

```typescript
// 1. Add domain awareness to OneAgentMemory
class OneAgentMemory {
  // ...existing methods...

  // NEW: Domain-aware methods
  async addMemoryWithDomain(entry: UnifiedMemoryEntry): Promise<string>;
  async searchMemoryByDomain(
    domain: ContextCategory,
    query: string,
    userId: string,
  ): Promise<UnifiedMemoryResult[]>;
  async preventDomainLeakage(
    entry: UnifiedMemoryEntry,
    requestingDomain: ContextCategory,
  ): Promise<boolean>;
}
```

**Phase 2: Intelligence Enhancement (Week 2)**

```typescript
// 2. Add cross-agent learning to MemoryIntelligence
class MemoryIntelligence {
  // ...existing methods...

  // NEW: Cross-agent methods
  async generateCrossAgentInsights(context: string, userId: string): Promise<CrossAgentInsight[]>;
  async shareAgentLearning(learning: AgentLearning): Promise<string>;
  async getAgentLearnings(agentType: AgentType, domain?: ContextCategory): Promise<AgentLearning[]>;
}
```

**Phase 3: Tool Enhancement (Week 3)**

```typescript
// 3. Enhance MCP tools with domain support
class OneAgentMemoryAddTool extends UnifiedMCPTool {
  // ...existing implementation...

  // ENHANCED: Add domain validation
  async executeCore(
    args: MemoryAddArgs & { domain?: ContextCategory },
  ): Promise<ToolExecutionResult>;
}
```

**Phase 4: Type Enhancement (Week 4)**

```typescript
// 4. Expand type system with domain support
interface UnifiedMemoryEntry {
  // ...existing fields...

  // NEW: Domain fields
  domain: ContextCategory;
  contextCategory: ContextCategory;
  privacyLevel: PrivacyLevel;
  crossAgentShare: boolean;
  agentType: AgentType;
  learningType: 'pattern' | 'solution' | 'insight' | 'error' | 'optimization';
}
```

### **🚀 BENEFITS OF EXPANSION APPROACH**

1. **Zero Breaking Changes** - Existing code continues to work
2. **Gradual Migration** - Can migrate piece by piece
3. **Proven Foundation** - Build on tested, working code
4. **Faster Implementation** - Less code to write
5. **Lower Risk** - Incremental improvements vs full rewrite

### **📋 FILES TO MODIFY (EXPANSION)**

**Primary Files (EXPAND):**

- `coreagent/memory/OneAgentMemory.ts` - Add domain methods
- `coreagent/intelligence/memoryIntelligence.ts` - Add cross-agent methods
- `coreagent/tools/OneAgentMemory*Tool.ts` - Add domain parameters
- `coreagent/types/oneagent-backbone-types.ts` - Add domain types

**Secondary Files (ENHANCE):**

- `coreagent/memory/BatchMemoryOperations.ts` - Add domain batching
- `coreagent/memory/EmbeddingCache.ts` - Add domain caching
- `coreagent/validation/MemorySystemValidator.ts` - Add domain validation

**New Files (CREATE):**

- `coreagent/memory/DomainSeparationEngine.ts` - Domain isolation logic
- `coreagent/memory/CrossAgentLearningEngine.ts` - Agent learning system
- `coreagent/memory/MemoryRelationshipManager.ts` - Graph relationships
- `coreagent/types/domain-separation-types.ts` - Domain-specific types

### **🎯 DECISION: EXPAND EXISTING SYSTEM**

**Recommendation**: Expand the existing memory system rather than rebuild because:

- ✅ Solid foundation already exists
- ✅ Production-tested code
- ✅ Zero breaking changes
- ✅ Faster implementation
- ✅ Lower risk approach
