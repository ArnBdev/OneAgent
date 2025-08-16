# OneAgent VS Code Copilot Chat Integration Setup

This script configures VS Code settings for optimal OneAgent chatmode experience with Copilot Chat, following the official BMAD Method integration patterns.

## Installation Instructions

### 1. Install OneAgent Chatmodes

```powershell
# Navigate to your OneAgent project directory
cd "c:\Users\arne\.cline\mcps\OneAgent"

# Copy chatmode files to VS Code workspace
mkdir -Force .vscode
Copy-Item -Path ".github\chatmodes\*.md" -Destination ".vscode\" -Force

# Verify installation
Get-ChildItem ".vscode\*.chatmode.md" | Format-Table Name, Length, LastWriteTime
```

### 2. Configure VS Code Settings

Create or update `.vscode/settings.json`:

```json
{
  "github.copilot.chat.enable": true,
  "github.copilot.chat.welcomeMessage": "OneAgent Constitutional AI Development Platform Ready! Use chatmode selector for specialized agents.",
  "github.copilot.enable": {
    "*": true,
    "yaml": true,
    "plaintext": true,
    "markdown": true,
    "typescript": true,
    "javascript": true,
    "json": true
  },
  "github.copilot.advanced": {
    "conversationAdditionalContexts": {
      "oneagent": {
        "enabled": true,
        "priority": "high"
      }
    }
  },
  "files.associations": {
    "*.chatmode.md": "markdown"
  },
  "markdown.preview.enhancedSyntaxHighlighting": true,
  "workbench.editor.highlightModifiedTabs": true,
  "editor.semanticHighlighting.enabled": true
}
```

### 3. Verify Chatmode Integration

After installation, verify OneAgent chatmodes are available:

1. Open VS Code Copilot Chat panel (Ctrl+Alt+I)
2. Look for chatmode selector in chat interface
3. Available OneAgent modes should include:
   - `@oneagent-dev` - James DevAgent (Constitutional AI Development)
   - `@oneagent-validation` - Quinn ValidationAgent (Quality & BMAD Analysis)
   - `@oneagent-planner` - Alex PlannerAgent (Strategic Planning)
   - `@oneagent-triage` - Morgan TriageAgent (Task Routing & System Health)

### 4. Quick Test Commands

Test each OneAgent chatmode:

```
# DevAgent
@oneagent-dev *help

# ValidationAgent
@oneagent-validation *help

# PlannerAgent
@oneagent-planner *help

# TriageAgent
@oneagent-triage *help
```

## OneAgent Chatmode Workflow

### Constitutional AI Development Pattern

```mermaid
graph LR
    A[Task Request] --> B[@oneagent-triage]
    B --> C{Route Task}
    C -->|Development| D[@oneagent-dev]
    C -->|Validation| E[@oneagent-validation]
    C -->|Planning| F[@oneagent-planner]
    D --> G[Constitutional AI Output]
    E --> G
    F --> G
    G --> H[Grade A Quality]
```

### Example Workflow Scenarios

#### Scenario 1: New Feature Development

```
1. @oneagent-triage *route-task "Implement user authentication system"
2. @oneagent-dev *constitutional-develop "User authentication with TypeScript"
3. @oneagent-validation *quality-check "Review authentication implementation"
```

#### Scenario 2: Code Quality Assessment

```
1. @oneagent-triage *analyze-requirements "Audit existing codebase for quality"
2. @oneagent-validation *bmad-analysis "Systematic code quality assessment"
3. @oneagent-planner *improvement-plan "Create quality improvement roadmap"
```

#### Scenario 3: Project Planning

```
1. @oneagent-planner *bmad-planning "Plan Phase 4 implementation strategy"
2. @oneagent-triage *capacity-planning "Assess agent workload distribution"
3. @oneagent-dev *architecture-design "Design technical implementation"
```

## Best Practices

### Constitutional AI Integration

- Always start with `@oneagent-triage` for task routing
- Use BMAD framework for complex decisions (\*bmad-X commands)
- Validate output quality with Constitutional AI principles
- Target 80%+ Grade A quality standards

### Chatmode Command Structure

- Use `*help` to see available commands for each agent
- Commands follow pattern: `*action-verb {parameters}`
- All agents support Constitutional AI validation
- BMAD framework available for systematic analysis

### Quality Standards

- Accuracy: Prefer "I don't know" to speculation
- Transparency: Explain reasoning and limitations
- Helpfulness: Provide actionable, relevant guidance
- Safety: Avoid harmful or misleading recommendations

## Troubleshooting

### Chatmode Not Available

1. Verify `.vscode/*.chatmode.md` files exist
2. Restart VS Code to refresh chatmode registry
3. Check VS Code Copilot Chat extension is enabled
4. Ensure files have `.chatmode.md` extension

### Commands Not Working

1. Verify correct `*command` syntax with asterisk prefix
2. Check agent-specific help with `*help` command
3. Ensure Constitutional AI context is maintained
4. Try `*exit` and reactivate chatmode if needed

### Performance Issues

1. Use `@oneagent-triage *system-health` to check agent status
2. Monitor workload distribution with `*load-balance`
3. Apply BMAD analysis for complex routing decisions
4. Escalate to backup agents if primary agent overloaded

## Integration Benefits

### VS Code Copilot Chat Enhancement

- Specialized OneAgent personas for different development tasks
- Constitutional AI principles integrated into all interactions
- BMAD framework for systematic analysis and decision-making
- Professional Grade A quality standards (80%+ target)

### Development Workflow Optimization

- Intelligent task routing with `@oneagent-triage`
- Specialized expertise through dedicated agent personas
- Quality validation and continuous improvement
- Systematic planning and architectural guidance

### Constitutional AI Compliance

- Accuracy: Evidence-based recommendations
- Transparency: Clear reasoning and limitations
- Helpfulness: Actionable, relevant guidance
- Safety: Secure and reliable development practices

Ready to transform your development workflow with OneAgent Constitutional AI integration! 🚀

## Next Steps

1. Run installation script above
2. Test each OneAgent chatmode
3. Start with `@oneagent-triage *help` for task routing
4. Apply Constitutional AI principles to all development tasks
5. Target 80%+ Grade A quality in all outputs

Welcome to the future of Constitutional AI-powered development! 🎯
