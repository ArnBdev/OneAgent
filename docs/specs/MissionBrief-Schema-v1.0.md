# MissionBrief.md Schema v1.0 - GMA Specification

**Epic 18 Phase 1**: Generalized Mission Architecture (GMA) Spec-Driven Development  
**Status**: 🚧 **DRAFT** - Initial Schema Design  
**Date**: October 4, 2025

---

## Overview

MissionBrief.md is a structured Markdown specification format that enables declarative, auditable agent workflows. The GMA (Generalized Mission Architecture) system interprets these specifications to orchestrate multi-agent tasks with Constitutional AI validation and memory-driven optimization.

## Schema Structure

```yaml
---
# YAML Frontmatter - Mission Metadata
missionId: string              # Unique identifier (auto-generated if not provided)
version: string                # Spec version (e.g., "1.0.0")
priority: "low"|"normal"|"high"|"critical"
estimatedDuration: string      # ISO 8601 duration (e.g., "PT2H30M")
requiredAgents: string[]       # Agent types needed
constraints:
  maxConcurrency: number       # Max parallel tasks
  timeout: string              # ISO 8601 timeout
  memory: boolean              # Requires memory access
  constitutional: boolean      # Apply Constitutional AI validation
tags: string[]                 # Classification tags
author: string                 # Mission creator
created: string                # ISO 8601 timestamp
updated: string                # ISO 8601 timestamp
---

# Mission Title

Brief description of the mission objective and expected outcome.

## Objectives

### Primary Objective
Clear, measurable statement of the main goal.

### Secondary Objectives (Optional)
- Additional goals that enhance the mission
- Should be clearly prioritized

## Context & Background

Detailed context that agents need to understand the mission scope, constraints, and environment.

## Task Breakdown

### Task 1: [Task Name]
- **Agent**: `agent-type` or `auto-select`
- **Priority**: `low|normal|high|critical`
- **Dependencies**: `[task-2, task-3]` or `none`
- **Estimated Duration**: `PT30M`
- **Description**: Detailed task description
- **Acceptance Criteria**:
  - [ ] Criterion 1
  - [ ] Criterion 2
- **Inputs**: Expected input format/data
- **Outputs**: Expected output format/data

### Task 2: [Task Name]
...

## Success Criteria

### Definition of Done
- [ ] Primary objective achieved
- [ ] All critical tasks completed
- [ ] Quality threshold met (≥80% Grade A)
- [ ] Constitutional AI validation passed

### Quality Metrics
- **Accuracy**: Minimum acceptable accuracy level
- **Performance**: Maximum acceptable latency
- **Safety**: Constitutional AI compliance required

## Constraints & Limitations

### Technical Constraints
- Resource limitations
- API rate limits
- Memory requirements

### Business Constraints
- Time boundaries
- Budget limitations
- Compliance requirements

### Constitutional Constraints
- Safety requirements
- Ethical guidelines
- Transparency obligations

## Fallback Strategies

### If Primary Path Fails
1. Alternative approach A
2. Alternative approach B
3. Graceful degradation plan

### Error Handling
- Expected error scenarios
- Recovery procedures
- Escalation paths

## Monitoring & Observability

### Key Metrics
- Progress indicators
- Performance benchmarks
- Quality scores

### Alerts
- Critical failure conditions
- Performance degradation thresholds
- Quality score drops

## Memory Integration

### Required Context
- User preferences
- Historical patterns
- Domain-specific knowledge

### Memory Updates
- Facts to extract and store
- Learning objectives
- Pattern recognition targets

## Post-Mission Actions

### Documentation
- Results summary
- Lessons learned
- Performance analysis

### Memory Persistence
- Key insights to retain
- Patterns to remember
- Optimization opportunities

---

## Schema Validation Rules

1. **Required Fields**: `missionId`, `version`, `priority`, Primary Objective, at least one Task
2. **Task Dependencies**: Must reference existing tasks, no circular dependencies
3. **Agent Types**: Must be valid registered agent types or `auto-select`
4. **Duration Format**: ISO 8601 duration strings only
5. **Priority Inheritance**: Tasks inherit mission priority unless explicitly overridden
6. **Constitutional Compliance**: If `constitutional: true`, all tasks must support CA validation
7. **Memory Requirements**: If `memory: true`, agents must have memory access configured

## Reserved Keywords

- `missionId`, `version`, `priority`, `estimatedDuration`
- `requiredAgents`, `constraints`, `tags`
- `auto-select`, `none` (for dependencies)
- `constitutional`, `memory`, `timeout`

## Example Template

See `examples/mission-brief-template.md` for a complete example specification.

---

**Next Steps**:
1. Implement GMACompiler to parse and validate this schema
2. Create PlannerAgent to interpret and execute missions
3. Build SpecLintingAgent for quality validation
4. Integrate with existing orchestration systems
```
