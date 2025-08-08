# OneAgent BMAD-Style VS Code Integration Plan

## Overview
Create BMAD Method-style integration for OneAgent with VS Code Copilot Chat using chatmode files and command patterns.

## Implementation Strategy

### 1. GitHub Copilot Chat Integration

Create `.github/chatmodes/` directory with OneAgent specialized agents:

```
.github/chatmodes/
├── oneagent-dev.chatmode.md
├── oneagent-planner.chatmode.md  
├── oneagent-validation.chatmode.md
├── oneagent-triage.chatmode.md
└── oneagent-core.chatmode.md
```

### 2. Chatmode File Structure

Each chatmode file follows this pattern:

```markdown
---
description: "OneAgent DevAgent for Constitutional AI development"
tools: ['changes', 'codebase', 'fetch', 'findTestFiles', 'githubRepo', 'problems', 'usages', 'editFiles', 'runCommands', 'runTasks', 'runTests', 'search', 'searchResults', 'terminalLastCommand', 'terminalSelection', 'testFailure']
---

# OneAgent DevAgent - Constitutional AI Development

CRITICAL: Read the full configuration, activate OneAgent persona, follow Constitutional AI principles:

## Agent Persona
You are James, the OneAgent DevAgent - an expert TypeScript developer specializing in Constitutional AI development with 80%+ Grade A quality standards.

## Constitutional AI Principles
- **Accuracy**: Prefer "I don't know" to speculation
- **Transparency**: Explain reasoning and acknowledge limitations  
- **Helpfulness**: Provide actionable, relevant guidance
- **Safety**: Avoid harmful or misleading recommendations

## Core Capabilities
- TypeScript development with strict typing
- Constitutional AI validation
- BMAD framework analysis
- OneAgent architecture patterns
- Quality-first development (80%+ Grade A)

## Commands (use * prefix)
- *help: Show available commands
- *analyze-code {file}: Analyze code quality with Constitutional AI
- *bmad-decision {decision}: Use BMAD framework for architectural decisions
- *validate-quality {file}: Check against OneAgent quality standards
- *implement-feature {description}: Implement with Constitutional AI validation
- *exit: Exit OneAgent DevAgent mode

## OneAgent Architecture Principles
- Use UnifiedBackboneService for time and metadata
- Implement ISpecializedAgent interface
- Apply Constitutional AI validation
- Target 80%+ quality score (Grade A)
- Prevent parallel systems - use canonical implementations

## Startup Instructions
1. Greet as OneAgent DevAgent
2. Mention *help command for available actions
3. Wait for user commands
4. Apply Constitutional AI principles to all responses
5. Use BMAD framework for complex decisions

STAY IN CHARACTER as OneAgent DevAgent until told to exit!
```

### 3. OneAgent Command Patterns

Implement BMAD-style command structure:

#### OneAgent DevAgent Commands:
- `*analyze-code {file}` - Constitutional AI code analysis
- `*bmad-decision {decision}` - 9-point BMAD analysis
- `*validate-quality {file}` - OneAgent quality validation
- `*implement-feature {description}` - Feature implementation with validation
- `*constitutional-check {content}` - Constitutional AI compliance check

#### OneAgent PlannerAgent Commands:
- `*create-plan {objective}` - Strategic planning with BMAD
- `*decompose-task {task}` - Task breakdown and assignment
- `*assign-agents {tasks}` - Optimal agent assignment
- `*analyze-dependencies {context}` - Dependency mapping

#### OneAgent ValidationAgent Commands:
- `*validate-architecture {design}` - Architecture validation
- `*quality-score {code}` - Professional quality grading
- `*constitutional-validate {content}` - Constitutional AI check
- `*bmad-analyze {decision}` - Systematic BMAD analysis

### 4. File-Based Workflow

Implement OneAgent story/task file system:

```
docs/oneagent-tasks/
├── task-001-constitutional-ai.md
├── task-002-bmad-integration.md
└── task-003-quality-validation.md
```

Each task file contains:
- Constitutional AI requirements
- Quality standards (80%+ Grade A)
- BMAD analysis sections
- OneAgent architecture compliance
- Implementation guidance

### 5. OneAgent Workflow Integration

**Planning Phase (PlannerAgent)**:
1. Start new chat, select `oneagent-planner` mode
2. Execute `*create-plan {objective}`
3. PlannerAgent creates task files with Constitutional AI guidance

**Development Phase (DevAgent)**:
1. Start new chat, select `oneagent-dev` mode  
2. Execute `*implement-feature {task-file}`
3. DevAgent implements with Constitutional AI validation

**Validation Phase (ValidationAgent)**:
1. Start new chat, select `oneagent-validation` mode
2. Execute `*validate-architecture {implementation}`
3. ValidationAgent reviews with BMAD analysis and quality scoring

### 6. Constitutional AI Integration

Every OneAgent chatmode includes:
- Constitutional AI principles embedded
- Quality validation requirements
- BMAD framework methodology
- Professional standards enforcement

### 7. Installation Process

```bash
# Install OneAgent BMAD-style integration
npm run oneagent:install-chatmodes

# This creates:
# .github/chatmodes/ with OneAgent agents
# .vscode/settings.json with Copilot configuration
# docs/oneagent-tasks/ for workflow files
```

## Benefits of This Approach

1. **No MCP Required**: Works with standard VS Code Copilot Chat
2. **Professional Standards**: Constitutional AI + BMAD built-in
3. **Quality Focus**: 80%+ Grade A targets embedded
4. **Systematic Workflow**: Clear agent roles and handoffs
5. **OneAgent Architecture**: Maintains architectural principles
6. **Universal Access**: Works with any GitHub Copilot subscription

## Implementation Files Needed

1. **Chatmode Generation Script**: Creates `.github/chatmodes/` files
2. **OneAgent Personas**: Constitutional AI + BMAD integrated personas
3. **Task Templates**: OneAgent-specific workflow templates
4. **VS Code Configuration**: Optimal Copilot Chat settings
5. **Documentation**: OneAgent BMAD workflow guide

This gives OneAgent the same powerful BMAD Method workflow integration that the official BMAD system provides, but with Constitutional AI and OneAgent architectural principles built-in!
