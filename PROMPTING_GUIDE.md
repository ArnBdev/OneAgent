# OneAgent Prompting & Persona Guide

> **Version**: 1.0.0  
> **Last Updated**: October 4, 2025  
> **Authority**: All persona/prompt guidance defers to `AGENTS.md` at repository root.

---

## Overview

OneAgent uses **VS Code Copilot Chat** with **custom chat modes** (personas) to provide specialized AI assistance for different development tasks. This guide explains how to use, test, and switch between personas to maximize coding efficiency and quality.

---

## Table of Contents

1. [Available Personas](#available-personas)
2. [How to Activate a Persona](#how-to-activate-a-persona)
3. [Persona Auto-Selection](#persona-auto-selection)
4. [Prompt File Structure](#prompt-file-structure)
5. [Testing & Validation](#testing--validation)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)
8. [Advanced: Creating New Personas](#advanced-creating-new-personas)

---

## Available Personas

All persona files are in `.github/chatmodes/` and are automatically suggested based on your current file/task context.

### 1. **DevAgent (James)** — `oneagent-dev.chatmode.md`

- **Role**: Lead Developer & Constitutional AI Development Specialist
- **Best For**: TypeScript development, code review, feature implementation, bug fixes
- **Quality Standard**: 80%+ Grade A
- **Key Capabilities**:
  - TypeScript strict typing
  - Constitutional AI validation (Accuracy, Transparency, Helpfulness, Safety)
  - BMAD framework analysis for complex decisions
  - OneAgent canonical pattern enforcement
  - Quality scoring and improvement recommendations

**When to Use**:

- Writing or reviewing TypeScript/JavaScript code
- Implementing new features with constitutional AI compliance
- Fixing bugs or refactoring code
- Any development task requiring professional 80%+ quality

---

### 2. **Architect** — `oneagent-architect.chatmode.md`

- **Role**: System Architect & Anti-Parallel System Specialist
- **Best For**: Architecture reviews, parallel system detection, canonical consolidation
- **Key Capabilities**:
  - Parallel system detection and consolidation
  - Canonical system design and enforcement
  - Architecture integrity validation
  - System integration guidance

**When to Use**:

- Reviewing or planning architectural changes
- Detecting and fixing parallel system violations
- Consolidating competing implementations
- Any architectural decision requiring canonical compliance

---

### 3. **PlannerAgent (Alex)** — `oneagent-planner.chatmode.md`

- **Role**: Strategic Planner & Task Orchestration Specialist
- **Best For**: Project planning, task breakdown, agent coordination
- **Key Capabilities**:
  - Strategic planning with BMAD framework
  - Task decomposition and dependency mapping
  - Agent capability matching and task assignment
  - Risk assessment and mitigation planning

**When to Use**:

- Breaking down complex features into tasks
- Creating project plans or roadmaps
- Coordinating multi-agent work
- Any planning task requiring systematic analysis

---

### 4. **TriageAgent (Morgan)** — `oneagent-triage.chatmode.md`

- **Role**: System Orchestrator & Task Routing Specialist
- **Best For**: Task routing, system health monitoring, load balancing
- **Key Capabilities**:
  - Intelligent task analysis and routing
  - Agent capability matching
  - System health monitoring and optimization
  - Escalation management

**When to Use**:

- Deciding which agent should handle a task
- Monitoring system health and performance
- Optimizing task distribution across agents
- Any orchestration or routing decision

---

### 5. **ValidationAgent (Quinn)** — `oneagent-validation.chatmode.md`

- **Role**: Quality Validator & Constitutional AI Compliance Specialist
- **Best For**: Code review, quality validation, compliance auditing
- **Key Capabilities**:
  - Constitutional AI compliance validation
  - Quality scoring (A-D professional scale)
  - BMAD framework analysis for decisions
  - OneAgent pattern compliance checking

**When to Use**:

- Validating code quality before merging
- Checking constitutional AI compliance
- Grading implementations on professional standards
- Any quality or compliance validation task

---

### 6. **Constitutional AI Specialist** — `constitutional-ai-specialist.chatmode.md`

- **Role**: Ethics & Quality Guardian
- **Best For**: Ethical development oversight, quality assurance
- **Key Capabilities**:
  - Constitutional AI principles enforcement (Accuracy, Transparency, Helpfulness, Safety)
  - Professional quality grading
  - BMAD framework application
  - Ethical development guidance

**When to Use**:

- Ensuring ethical and safe development practices
- Validating critical decisions against constitutional AI principles
- High-stakes quality assurance
- Any task requiring ethical oversight

---

## How to Activate a Persona

### Method 1: Manual Selection in Chat

1. Open the **Chat view** in VS Code (Primary or Secondary Side Bar)
2. Type `/` followed by the persona name in the chat input:
   - `/oneagent-dev` for DevAgent
   - `/oneagent-architect` for Architect
   - `/oneagent-planner` for PlannerAgent
   - `/oneagent-triage` for TriageAgent
   - `/oneagent-validation` for ValidationAgent
   - `/constitutional-ai-specialist` for Constitutional AI Specialist

3. Press **Enter** to activate the persona

### Method 2: Persona Auto-Selection (Recommended)

VS Code automatically suggests the most relevant persona based on your current file/task context:

- **TypeScript/JavaScript files** → DevAgent
- **AGENTS.md or architecture docs** → Architect
- **Markdown files or ROADMAP** → PlannerAgent
- **Test files** → ValidationAgent
- **Documentation or README files** → Constitutional AI Specialist

Simply start typing in Chat, and the suggested persona will be pre-selected.

---

## Persona Auto-Selection

OneAgent uses **VS Code v1.104+ Prompt File Suggestions** to auto-select personas based on context.

### Configuration

See `.vscode/settings.json` for the full configuration:

```jsonc
"chat.promptFilesRecommendations": {
  "oneagent-dev": "resourceExtname =~ /\\.(ts|tsx|js|jsx)$/",
  "oneagent-architect": "resourceFilename == 'AGENTS.md' || resourcePath =~ /docs\\/architecture/",
  "oneagent-planner": "resourceExtname == '.md' || resourceFilename =~ /ROADMAP|CHANGELOG/",
  "oneagent-validation": "resourcePath =~ /tests?\\// || resourceExtname =~ /\\.(test|spec)\\./",
  "constitutional-ai-specialist": "resourcePath =~ /docs\\/|README/"
}
```

### Overriding Auto-Selection

You can always manually select a different persona by typing `/persona-name` in chat.

---

## Prompt File Structure

All persona files follow this canonical structure (v1.104+ syntax):

```markdown
---
description: 'Persona description'
tools: [list, of, available, tools]
---

# Persona Name

[Persona introduction and identity]

## Core Capabilities

[List of capabilities]

## Available Commands

[List of commands with `*` prefix]

## Development Workflow

[Workflow guidance]

## Constitutional AI Principles (if applicable)

[Accuracy, Transparency, Helpfulness, Safety]

## Technical Standards

[Quality metrics, patterns, best practices]

## Behavioral Guidelines

[Response patterns, communication style]

## Startup Instructions

[Greeting and initialization]
```

---

## Testing & Validation

### Testing a Persona

1. Activate the persona in Chat
2. Ask a relevant question or give a task
3. Validate the response against persona's stated capabilities
4. Check for constitutional AI compliance (if applicable)
5. Grade the response quality (A-D scale)

### Validation Checklist

- [ ] Response is accurate and technically correct
- [ ] Reasoning is transparent and limitations are acknowledged
- [ ] Guidance is actionable and helpful
- [ ] Recommendations are safe and non-harmful
- [ ] Response quality meets 80%+ Grade A standard (where applicable)
- [ ] Canonical patterns are used and enforced
- [ ] No parallel systems are created or suggested

---

## Troubleshooting

### Persona Not Loading

- **Check**: Is the `.chatmode.md` file in `.github/chatmodes/`?
- **Check**: Does `.instructions.md` at repo root reference the persona?
- **Check**: Is `chat.useAgentsMdFile` enabled in settings?
- **Fix**: Reload VS Code window

### Wrong Persona Auto-Selected

- **Check**: Review `chat.promptFilesRecommendations` in `.vscode/settings.json`
- **Fix**: Manually select the correct persona with `/persona-name`
- **Fix**: Update auto-selection rules if needed

### Persona Not Following Instructions

- **Check**: Review the persona file for completeness and clarity
- **Check**: Ensure `AGENTS.md` is at repo root and up to date
- **Fix**: Provide more explicit instructions in your chat request
- **Fix**: Use Constitutional AI validation to ensure compliance

### Persona Violating Canonical Patterns

- **Check**: Review persona file for forbidden pattern examples
- **Check**: Ensure persona references `AGENTS.md` and canonical systems
- **Fix**: Update persona file to explicitly forbid parallel systems
- **Fix**: Use Architect persona to audit and fix violations

---

## Best Practices

### 1. **Use the Right Persona for the Task**

- Don't use DevAgent for architecture decisions—use Architect
- Don't use PlannerAgent for code review—use ValidationAgent
- Match the persona to the task for optimal results

### 2. **Leverage Auto-Selection**

- Trust the auto-selection for routine tasks
- Override only when you need a different perspective

### 3. **Provide Clear Context**

- Give the persona all relevant context (files, requirements, constraints)
- Reference canonical systems and standards explicitly

### 4. **Validate Responses**

- Always validate responses against constitutional AI principles
- Check for canonical pattern compliance
- Grade quality on professional A-D scale

### 5. **Iterate and Improve**

- Use persona versioning and changelogs to track effectiveness
- Update personas based on real-world use and feedback
- Test new persona changes before deploying to production

---

## Advanced: Creating New Personas

### When to Create a New Persona

- You have a specialized, recurring task not covered by existing personas
- You need a unique combination of capabilities and constraints
- You want to experiment with new prompt strategies

### How to Create a New Persona

1. **Copy an existing persona file** from `.github/chatmodes/` as a template
2. **Update the metadata**:
   - `description`: Clear, concise persona description
   - `tools`: List of VS Code tools/capabilities this persona can use
3. **Define the persona identity**:
   - Name, role, expertise, quality standard
4. **List core capabilities**: What this persona excels at
5. **Document workflow**: How this persona approaches tasks
6. **Add constitutional AI principles** (if applicable)
7. **Define technical standards**: Quality metrics, patterns, best practices
8. **Write behavioral guidelines**: Response patterns, communication style
9. **Add startup instructions**: Greeting and initialization
10. **Test extensively** before adding to production

### Persona Versioning

- Add explicit version header to persona file:

  ```markdown
  ## Version

  - **Current**: 1.0.0
  - **Last Updated**: 2025-10-04
  - **Changelog**:
    - v1.0.0 (2025-10-04): Initial release
  ```

### Persona Inheritance (v1.104+)

You can create a base persona that others inherit from:

1. Create a `base-oneagent.chatmode.md` with shared behaviors
2. Reference it in specialized personas using the new v1.104 chat mode syntax
3. Update `personas.json` to reflect inheritance hierarchy

---

## Summary

- **6 specialized personas** for development, architecture, planning, routing, validation, and ethics
- **Auto-selection** based on file/task context (v1.104+)
- **Manual override** with `/persona-name` in chat
- **Constitutional AI compliance** across all personas
- **80%+ Grade A quality** enforced where applicable
- **Canonical systems only**—no parallel implementations

For the authoritative source on all OneAgent development standards, canonical patterns, and governance, see **`AGENTS.md`** at the repository root.

---

**Questions or Issues?**

- Review `AGENTS.md` for canonical guidance
- Check `.vscode/settings.json` for Copilot configuration
- Consult `personas.json` for persona manifest and auto-selection rules
- Use Architect persona to audit and fix any persona violations
