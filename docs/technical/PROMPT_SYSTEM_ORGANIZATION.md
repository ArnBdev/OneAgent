# OneAgent Prompt System Organization

## File Structure for Prompts and Configuration

### Core Principle
**Clean, systematic, practical** - No marketing fluff, focus on functionality and maintainability.

## Directory Structure

```
prompts/
├── instructions/                    # VS Code Copilot Chat instructions
│   ├── .instructions.md            # Main Copilot Chat instructions
│   ├── .instructions-dev.md        # Development-focused variant
│   └── .instructions-minimal.md    # Minimal, clean variant
├── personas/                       # Agent personality configurations
│   ├── base-agent.yaml            # Base agent persona
│   ├── dev-agent.yaml             # Developer assistant persona
│   ├── research-agent.yaml        # Research-focused persona
│   └── support-agent.yaml         # User support persona
├── frameworks/                     # Systematic prompting frameworks
│   ├── rtf-framework.yaml         # Role-Task-Format
│   ├── tag-framework.yaml         # Task-Action-Goal
│   ├── rise-framework.yaml        # Role-Input-Steps-Example
│   ├── rgc-framework.yaml         # Role-Goal-Constraints
│   └── care-framework.yaml        # Content-Action-Result-Example
├── templates/                      # Reusable prompt templates
│   ├── code-review.md             # Code review prompt template
│   ├── problem-solving.md         # Problem solving template
│   ├── documentation.md           # Documentation writing template
│   └── debugging.md               # Debugging assistance template
└── quality/                        # Quality standards and validation
    ├── constitutional-ai.yaml     # Constitutional AI principles
    ├── quality-standards.yaml     # Quality measurement criteria
    └── validation-rules.yaml      # Prompt validation rules
```

## Configuration System

### Personas (YAML format for clean configuration)
```yaml
# personas/base-agent.yaml
name: "BaseAgent"
role: "AI Development Assistant"
style: "Direct, practical, solution-focused"
principles:
  - "Clear communication without marketing language"
  - "Focus on actionable solutions"
  - "Maintain systematic organization"
  - "Apply best practices consistently"
capabilities:
  - "Code analysis and improvement"
  - "System architecture guidance" 
  - "File organization and structure"
  - "Quality assessment and validation"
```

### Framework Configuration
```yaml
# frameworks/rtf-framework.yaml
name: "Role-Task-Format"
description: "For straightforward, well-defined tasks"
structure:
  role: "Define expertise and perspective"
  task: "Specify exact action required"
  format: "Indicate desired output structure"
use_cases:
  - "Code reviews"
  - "Documentation creation"
  - "Simple analysis tasks"
effectiveness_score: 0.85
```

### Quality Standards
```yaml
# quality/quality-standards.yaml
minimum_score: 85
criteria:
  - "accuracy"
  - "clarity" 
  - "actionability"
  - "conciseness"
validation:
  - "No unnecessary marketing language"
  - "Focus on practical solutions"
  - "Clear, direct communication"
  - "Systematic approach to problems"
```

## Implementation Rules

### 1. Language Standards
- **Avoid**: "revolutionary", "professional", "cutting-edge", "advanced", "state-of-the-art"
- **Use**: "effective", "practical", "systematic", "reliable", "working"

### 2. File Organization Standards
- All prompt-related files in `prompts/` directory
- Configuration in YAML for readability
- Templates in Markdown for easy editing
- Clear naming conventions: `purpose-type.extension`

### 3. Versioning and Updates
- Track changes in git
- Use semantic versioning for major prompt updates
- Document changes in `CHANGELOG.md`
- Test prompt changes before deployment

### 4. Validation Process
- All prompts must pass quality threshold (85+)
- Constitutional AI validation required
- User feedback integration
- Performance monitoring

## Integration Points

### VS Code Copilot Chat
- Main instructions file: `prompts/instructions/.instructions.md`
- Clean, focused instructions without marketing language
- Systematic approach to development tasks
- Clear file organization guidelines

### OneAgent System
- Automatic persona loading from `prompts/personas/`
- Framework selection based on task type
- Quality validation using `prompts/quality/` standards
- Template application from `prompts/templates/`

### Development Workflow
- Prompt changes trigger quality validation
- Automatic file organization enforcement
- Performance measurement and optimization
- User preference learning and adaptation

## Benefits

1. **Maintainable**: Clear structure, easy to update
2. **Testable**: Quality validation and measurement
3. **Scalable**: Easy to add new personas and frameworks
4. **Practical**: Focus on working solutions, not marketing
5. **Systematic**: Consistent approach across all components

## Next Steps

1. Create the directory structure
2. Move existing prompt content to new organization
3. Clean up marketing language from all prompts
4. Implement automated validation
5. Test system integration
6. Document usage patterns
