# OURA v3.0 Architecture Proposal
## OneAgent Unified Registry Architecture - State-of-the-Art Agent Management System

**Document Type:** PROPOSAL (NOT IMPLEMENTATION)  
**Status:** Draft for Review and Approval  
**Version:** 3.0  
**Date:** June 17, 2025  
**Author:** OneAgent System Architecture Team  

---

## 📋 EXECUTIVE SUMMARY

This proposal outlines a revolutionary unified agent registry architecture (OURA v3.0) to replace the current fragmented system that creates 16 duplicate agents instead of the intended 5 core agents. The new architecture will be state-of-the-art, scalable, and designed to support both persistent (daily-use) and temporary (task-specific) agents.

**Current Problem:** Multiple registration paths create agent duplication and system bloat  
**Proposed Solution:** Single unified registry with lifecycle management and Constitutional AI validation  
**Expected Outcome:** Clean, scalable, professional-grade multi-agent system  

---

## 🔍 PROBLEM ANALYSIS (BMAD Framework Applied)

### Current System Issues
1. **Agent Duplication:** 16 agents discovered instead of 5 core agents
   - Core agents (5): CoreAgent, DevAgent, OfficeAgent, FitnessAgent, TriageAgent
   - Versioned duplicates (5): CoreAgent-v4.0, DevAgent-v4.0, etc.
   - Test/dev agents (6+): AutoTestAgent-v1.0, CodeAnalysisAgent-v1.0, etc.

2. **Multiple Registration Paths:**
   - AgentBootstrapService creates main agents
   - BaseAgent auto-registration creates duplicates
   - Test agents persist without cleanup
   - No unified registration authority

3. **Lack of Lifecycle Management:**
   - No distinction between persistent and temporary agents
   - No cleanup mechanisms for development artifacts
   - No quality-based promotion/demotion

### BMAD Analysis Questions Addressed

**What assumptions need validation?**
- Assumption: Current multi-path registration is necessary → CHALLENGED
- Assumption: All agents should be permanent → CHALLENGED  
- Assumption: Manual cleanup is sufficient → CHALLENGED

**Alternative approaches considered:**
1. Microservice-based registry (too complex for current needs)
2. Database-backed registry (unnecessary overhead)
3. Event-driven registry (complexity without clear benefit)
4. **Recommended: Unified in-memory registry with persistence**

**Goal alignment:**
- Supports scalable multi-agent conversations
- Enables clean daily-use experience
- Facilitates temporary agent scaling
- Maintains Constitutional AI compliance

---

## 🏗️ PROPOSED ARCHITECTURE: OURA v3.0

### Core Principles
1. **Single Source of Truth:** One unified registry for all agent management
2. **Lifecycle Awareness:** Distinguish persistent vs temporary agents
3. **Constitutional AI First:** All registrations validated for safety and quality
4. **Scalable by Design:** Support for dynamic agent pools
5. **Developer Experience:** Clean APIs and clear registration patterns

### System Components

#### 1. Central Agent Registry (CAR)
**Purpose:** Single authoritative source for all agent information

**Features:**
- Unified agent metadata storage
- Real-time health monitoring
- Capability indexing and search
- Quality score tracking
- Constitutional AI compliance validation

**API Surface:**
```typescript
interface CentralAgentRegistry {
  // Core Operations
  registerAgent(config: AgentConfig): Promise<RegistrationResult>
  deregisterAgent(agentId: string): Promise<boolean>
  getAgent(agentId: string): Promise<AgentInfo | null>
  listAgents(filter?: AgentFilter): Promise<AgentInfo[]>
  
  // Lifecycle Management
  promoteTopersistent(agentId: string): Promise<boolean>
  scheduleCleanup(agentId: string, ttl: Duration): Promise<boolean>
  
  // Quality Management
  updateQualityScore(agentId: string, score: number): Promise<boolean>
  validateConstitutionalCompliance(agentId: string): Promise<boolean>
}
```

#### 2. Agent Lifecycle Manager (ALM)
**Purpose:** Manage agent lifecycles from creation to cleanup

**Features:**
- Persistent vs Temporary classification
- Time-to-Live (TTL) management
- Auto-cleanup scheduling
- Quality-based promotion
- Resource usage monitoring

**Lifecycle States:**
- `REGISTERING`: Initial registration in progress
- `ACTIVE_PERSISTENT`: Core daily-use agent
- `ACTIVE_TEMPORARY`: Task-specific agent with TTL
- `DEGRADED`: Quality below threshold
- `CLEANUP_SCHEDULED`: Marked for removal
- `DEREGISTERED`: Removed from system

#### 3. Constitutional AI Validator (CAV)
**Purpose:** Ensure all agents meet safety and quality standards

**Features:**
- Registration validation
- Capability assessment
- Quality threshold enforcement
- Safety compliance checking
- Continuous monitoring

**Validation Criteria:**
- Minimum quality score (85%+)
- Constitutional AI principles compliance
- Capability authenticity verification
- Resource usage limits
- Security policy adherence

#### 4. Agent Discovery Service (ADS)
**Purpose:** Enable intelligent agent discovery and coordination

**Features:**
- Capability-based search
- Load balancing recommendations
- Health status reporting
- Network topology mapping
- Performance analytics

### Architecture Diagram (Conceptual)

```
┌─────────────────────────────────────────────────────────────┐
│                    OURA v3.0 Architecture                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │   Agent     │    │   Agent     │    │   Agent     │    │
│  │ (Persistent)│    │(Temporary)  │    │(Temporary)  │    │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    │
│         │                  │                  │           │
│         └──────────────────┼──────────────────┘           │
│                            │                              │
│  ┌─────────────────────────┴─────────────────────────┐    │
│  │         Central Agent Registry (CAR)              │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │    │
│  │  │   ALM   │ │   CAV   │ │   ADS   │ │ Storage │ │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ │    │
│  └─────────────────────────────────────────────────┘    │
│                            │                              │
│  ┌─────────────────────────┴─────────────────────────┐    │
│  │            MCP Server Integration                 │    │
│  │    (Existing OneAgent Infrastructure)             │    │
│  └─────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 AGENT CLASSIFICATION SYSTEM

### Persistent Agents (Daily Life)
**Purpose:** Always-available core functionality

**Characteristics:**
- No TTL (time-to-live)
- High quality score requirements (90%+)
- Memory continuity preserved
- Protected from auto-cleanup
- Limited to 5-10 core agents

**Examples:**
- CoreAgent: Constitutional AI + orchestration
- DevAgent: Code review, debugging, architecture
- OfficeAgent: Documents, email, productivity
- FitnessAgent: Workouts, nutrition, wellness
- TriageAgent: Task routing, system health

### Temporary Agents (Task-Specific)
**Purpose:** Surge capacity for complex or specialized tasks

**Characteristics:**
- TTL-based lifecycle (hours to days)
- Quality score threshold (85%+)
- Task-specific capabilities
- Auto-cleanup on completion
- Scalable pools (10-100+ agents)

**Examples:**
- Research agents for literature reviews
- Analysis agents for data processing
- Specialized dev agents for large refactoring
- QA agents for testing campaigns
- Documentation agents for knowledge base updates

### Promotion/Demotion System
**Promotion Criteria (Temporary → Persistent):**
- Sustained quality score >95%
- High user satisfaction ratings
- Frequent usage patterns
- Strategic capability gap filling
- Manual administrative approval

**Demotion Criteria (Persistent → Temporary):**
- Quality score <85% for extended period
- Low usage patterns
- Redundant capabilities
- Resource constraints
- Administrative decision

---

## 🔧 IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Weeks 1-2)
**Goal:** Establish core registry infrastructure

**Deliverables:**
1. Central Agent Registry core implementation
2. Basic agent lifecycle states
3. Constitutional AI validator integration
4. Migration plan for existing agents

**Success Criteria:**
- Single registry operational
- 5 core agents cleanly registered
- No duplicate agents
- Quality validation working

### Phase 2: Lifecycle Management (Weeks 3-4)
**Goal:** Implement persistent vs temporary classification

**Deliverables:**
1. Agent Lifecycle Manager
2. TTL-based cleanup system
3. Quality-based promotion/demotion
4. Enhanced discovery service

**Success Criteria:**
- Temporary agents auto-cleanup
- Quality thresholds enforced
- Promotion system functional
- Discovery service accurate

### Phase 3: Advanced Features (Weeks 5-6)
**Goal:** Add sophisticated management capabilities

**Deliverables:**
1. Advanced agent pools
2. Load balancing recommendations
3. Performance analytics
4. Security enhancements

**Success Criteria:**
- Dynamic agent scaling
- Performance optimization
- Security compliance
- Production readiness

### Phase 4: Testing & Deployment (Weeks 7-8)
**Goal:** Comprehensive testing and production deployment

**Deliverables:**
1. Comprehensive test suite
2. Load testing validation
3. Security audit completion
4. Production deployment

**Success Criteria:**
- All tests passing
- Performance benchmarks met
- Security audit approved
- System production-ready

---

## 📊 EXPECTED BENEFITS

### Immediate Benefits
- **Agent Count Reduction:** 16 → 5 core agents for daily use
- **System Clarity:** Single source of truth for agent management
- **Quality Assurance:** Constitutional AI validation for all agents
- **Performance Improvement:** Eliminated duplicate processing

### Long-term Benefits
- **Scalability:** Dynamic agent pools for complex tasks
- **Resource Efficiency:** Intelligent cleanup and lifecycle management
- **Developer Experience:** Clean APIs and clear patterns
- **Maintainability:** Centralized agent management

### Quantifiable Metrics
- **Agent Efficiency:** 90%+ quality score for all active agents
- **Resource Usage:** 60% reduction in duplicate processing
- **System Clarity:** 100% visibility into agent status and capabilities
- **Cleanup Automation:** 95% of temporary agents auto-cleaned

---

## ⚠️ RISKS & MITIGATION

### Technical Risks
**Risk:** Single point of failure in registry  
**Mitigation:** Built-in redundancy and graceful degradation

**Risk:** Migration complexity from current system  
**Mitigation:** Phased migration with rollback capabilities

**Risk:** Performance bottlenecks in central registry  
**Mitigation:** Efficient caching and async operations

### Operational Risks
**Risk:** Agent cleanup removes needed functionality  
**Mitigation:** Conservative TTL defaults and manual overrides

**Risk:** Quality thresholds too restrictive  
**Mitigation:** Configurable thresholds with monitoring

**Risk:** Constitutional AI validation false positives  
**Mitigation:** Human review process for edge cases

---

## 🔄 ALTERNATIVE APPROACHES CONSIDERED

### Option A: Microservice Registry
**Pros:** Ultimate scalability, technology diversity  
**Cons:** Over-engineering for current needs, complexity overhead  
**Decision:** Rejected for v3.0, consider for future versions

### Option B: Database-Backed Registry
**Pros:** Persistence, querying capabilities  
**Cons:** Unnecessary complexity, performance overhead  
**Decision:** Rejected, in-memory with file persistence preferred

### Option C: Event-Driven Architecture
**Pros:** Loose coupling, scalability  
**Cons:** Complexity without clear benefit, debugging challenges  
**Decision:** Rejected, direct API calls preferred for clarity

### Option D: Hybrid Approach (Recommended)
**Pros:** Simplicity, performance, maintainability  
**Cons:** May need evolution for extreme scale  
**Decision:** Selected for optimal balance of features and complexity

---

## 💡 INNOVATION HIGHLIGHTS

### Constitutional AI Integration
- First multi-agent system with built-in Constitutional AI validation
- Continuous quality monitoring and enforcement
- Safety-first agent registration and operation

### Intelligent Lifecycle Management
- Dynamic persistent/temporary classification
- Quality-based promotion system
- Automated cleanup with safety overrides

### Developer-First Design
- Clean, intuitive APIs
- Comprehensive documentation
- Easy migration path

---

## 🎉 CONCLUSION

OURA v3.0 represents a revolutionary approach to multi-agent system management, combining state-of-the-art architecture with practical usability. By addressing the current fragmentation and duplication issues while building for future scalability, this system will provide a solid foundation for OneAgent's continued evolution.

The proposed architecture balances simplicity with sophistication, ensuring both immediate problem resolution and long-term strategic value. With Constitutional AI validation, intelligent lifecycle management, and developer-friendly APIs, OURA v3.0 will set a new standard for multi-agent system architecture.

---

## 📝 APPROVAL PROCESS

This proposal requires review and approval before implementation begins:

1. **Technical Review:** Architecture and implementation feasibility
2. **Security Review:** Constitutional AI compliance and safety measures
3. **Performance Review:** Scalability and resource usage analysis
4. **Stakeholder Approval:** Final sign-off for implementation

**Next Steps Upon Approval:**
- Detailed technical specification creation
- Implementation timeline finalization
- Resource allocation and team assignment
- Development phase initiation

---

**Document Status:** ✅ PROPOSAL COMPLETE - AWAITING REVIEW AND APPROVAL
