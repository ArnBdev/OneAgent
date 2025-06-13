# OneAgent Architecture - Agent Overview

## 📁 **Agent Directory Structure**

```
coreagent/agents/
├── base/
│   ├── BaseAgent.ts              # Core agent implementation class
│   ├── ISpecializedAgent.ts      # Interface for specialized agents
│   ├── EnhancedPromptEngine.ts   # Advanced prompt engineering
│   ├── ConstitutionalAI.ts       # Constitutional AI validation
│   └── BMADElicitationEngine.ts  # BMAD 9-point framework
├── specialized/
│   ├── DevAgent.ts               # Development & coding assistance
│   ├── EnhancedDevAgent.ts       # Enhanced dev agent (97% quality)
│   ├── FitnessAgent.ts           # Health & fitness optimization
│   ├── OfficeAgent.ts            # Office productivity assistance
│   └── TriageAgent.ts            # System health monitoring
└── communication/
    ├── AgentAutoRegistration.ts  # Multi-agent network registration
    ├── AgentBootstrapService.ts  # Agent initialization service
    └── AgentDiscoveryService.ts  # Agent discovery protocol
```

## 🤖 **Agent Types & Roles**

### **Production Agents**
- **DevAgent** - Standard development assistance (88-92% quality)
- **EnhancedDevAgent** - Advanced prompt engineering (97%+ quality)
- **FitnessAgent** - Health optimization with systematic frameworks
- **OfficeAgent** - Office productivity with workflow automation
- **TriageAgent** - System health monitoring and validation

### **Agent Personas** (Prompt Configurations)
```
prompts/personas/
├── base-agent.yaml       # General development assistance
├── core-agent.yaml       # System integration coordination
├── dev-agent.yaml        # Development-specific prompting
├── fitness-agent.yaml    # Health optimization prompting
└── office-agent.yaml     # Office productivity prompting
```

## 🏗️ **Agent Implementation Patterns**

### **BaseAgent Architecture**
All agents inherit from `BaseAgent` which provides:
- Constitutional AI validation (accuracy, transparency, helpfulness, safety)
- BMAD 9-point elicitation framework
- Systematic prompting frameworks (R-T-F, T-A-G, R-I-S-E, R-G-C, C-A-R-E)
- Chain-of-Verification patterns
- Quality threshold management (default: 85%)

### **Specialized Agent Pattern**
```typescript
export class DevAgent extends BaseAgent implements ISpecializedAgent {
  // Agent-specific capabilities and methods
  // Inherits Constitutional AI and BMAD framework
  // Custom domain expertise and workflows
}
```

### **Multi-Agent Communication**
- **Registration**: Auto-registration with quality validation
- **Discovery**: Natural language capability queries
- **Messaging**: Secure inter-agent communication
- **Coordination**: BMAD analysis for task distribution

## 📊 **Quality Standards**

- **DevAgent**: 88-92% quality threshold
- **EnhancedDevAgent**: 97%+ quality threshold (Advanced AI)
- **Constitutional AI**: 100% compliance for all agents
- **Multi-Agent Network**: 93.5% system health

## 📝 **Documentation Moved**

The following documentation has been moved to proper locations:
- `TriageAgentTimeAwareness.md` → `docs/agents/`
- `TriageAgentTimeAwareness_COMPLETE.md` → `docs/agents/`

## 🔄 **Agent Types vs Classes vs Personas**

**Clarification of Naming:**
- **Agent Classes** (`.ts` files): Actual TypeScript implementations
- **Agent Types** (`enhanced-development`, `specialized`, etc.): UI/configuration categories
- **Agent Personas** (`.yaml` files): Prompt configuration templates

**Examples:**
- `DevAgent.ts` = Agent class implementation
- `enhanced-development` = Agent type for UI selection
- `dev-agent.yaml` = Persona prompt configuration

This structure supports OneAgent's mission of quality-first development with systematic prompt engineering and Constitutional AI validation.
