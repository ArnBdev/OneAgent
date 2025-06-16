# 🚀 CoreAgent Quick Start Context - June 13, 2025

## 📋 Situation Summary

**What is CoreAgent?**
CoreAgent is the missing **central orchestration hub** for OneAgent's multi-agent system. It coordinates all specialized agents (DevAgent, OfficeAgent, FitnessAgent), monitors system health, and manages inter-agent communication using advanced prompt engineering.

**Why is it Critical?**
- **Current Problem**: Agents operate in isolation with no central coordinator
- **Solution**: CoreAgent acts as the system backbone for agent discovery, communication, and resource management
- **Benefits**: System-wide health monitoring, secure agent messaging, and R-I-S-E+ framework implementation

## ⚡ Current System Status

**✅ WORKING RIGHT NOW**:
- OneAgent MCP Server: 88.9% health, fully operational on port 8083
- 18 professional tools functional (Constitutional AI, BMAD, Multi-Agent Communication)
- Git status: Clean working tree at commit 2b20b49
- All previous CoreAgent attempts safely reverted

**❌ BLOCKING ISSUES**:
- 56 TypeScript compilation errors across 14 files
- Missing mem0Client imports (need UnifiedMemoryClient migration)
- TypeScript config missing flags: esModuleInterop, downlevelIteration, target: es2015

## 🎯 Immediate Actions Needed

### 1. Fix Prerequisites FIRST (30 minutes)
```bash
# Update tsconfig.json - Add these flags:
"esModuleInterop": true,
"downlevelIteration": true, 
"target": "es2015"

# Fix 5 critical files with mem0Client errors:
- coreagent/api/chatAPI.ts
- coreagent/api/performanceAPI.ts  
- coreagent/integration/memoryPerformanceOptimizer.ts
- coreagent/intelligence/memoryIntelligence.ts
```

### 2. Implement CoreAgent Incrementally
```typescript
// Step 1: Create CoreAgent.ts extending BaseAgent
export class CoreAgent extends BaseAgent implements ISpecializedAgent {
  // Inherits advanced prompt engineering automatically
}

// Step 2: Add to AgentFactory
case 'core': agent = new CoreAgent(agentConfig); break;

// Step 3: Test compilation after each step
npm run build
```

### 3. Integration Points
- AgentAutoRegistrationFactory.createCoreAgent()
- AgentBootstrapService.agents.set('CoreAgent-v4.0', coreAgent)

## ⚠️ Critical Risks & Mitigations

**HIGH RISK**: Compilation cascade failures
- **Mitigation**: Change one file at a time, test compilation after each change

**MEDIUM RISK**: Memory system integration conflicts  
- **Mitigation**: CoreAgent inherits BaseAgent's UnifiedMemoryClient, no direct mem0 usage

**LOW RISK**: Existing agent communication disruption
- **Mitigation**: CoreAgent adds coordination layer without modifying existing agents

## 🔧 Files Needing Immediate Attention

**Must Fix Before CoreAgent**:
1. `tsconfig.json` - Add compilation flags
2. `coreagent/api/chatAPI.ts` - Replace mem0Client import
3. `coreagent/api/performanceAPI.ts` - Fix API signatures
4. `coreagent/intelligence/memoryIntelligence.ts` - Major cleanup needed

**CoreAgent Implementation Files**:
1. `coreagent/agents/specialized/CoreAgent.ts` - Create new
2. `coreagent/agents/base/AgentFactory.ts` - Add 'core' type
3. `coreagent/agents/communication/AgentAutoRegistration.ts` - Add createCoreAgent
4. `coreagent/agents/communication/AgentBootstrapService.ts` - Add to bootstrap

## 🎖️ Success Metrics

- CoreAgent compiles without errors ✅
- System health maintains 85%+ ✅  
- CoreAgent discoverable via AgentFactory ✅
- Multi-agent coordination functional ✅
- All 18 MCP tools remain operational ✅

## 🚨 Emergency Procedures

**If compilation breaks**:
```bash
git restore .  # Revert to working state
git clean -fd  # Remove untracked files
```

**If MCP server fails**:
```bash
npx ts-node coreagent/server/oneagent-mcp-copilot.ts
curl http://localhost:8083/health  # Verify recovery
```

---

**🎯 Next Action**: Start with fixing tsconfig.json compilation flags, then tackle mem0Client imports before creating CoreAgent.ts

**📚 Full Technical Details**: See `COREAGENT_IMPLEMENTATION_CONTEXT.md` for complete analysis
