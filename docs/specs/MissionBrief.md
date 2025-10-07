# MissionBrief Specification Template

> **GMA (Generative Markdown Artifacts) Specification Format v1.0**  
> This template defines the canonical format for AI agent mission specifications.  
> Specs are the source of truth for multi-agent workflows, compiled by GMACompiler into executable tasks.

## Metadata

```yaml
specId: MISSION-{YYYY-MM-DD}-{UUID-SHORT}
version: 1.0.0
created: { ISO_TIMESTAMP }
author: { AGENT_ID }
domain: { work|personal|health|finance|creative }
priority: { critical|high|medium|low }
status: { draft|active|completed|archived }
lineage: [] # Parent spec IDs for forking/branching
tags: [] # Keywords for discovery
```

## 1. Goal

**What**: Clear, concise statement of the mission objective (1-2 sentences)

**Why**: Business value, user benefit, or strategic rationale (2-3 sentences)

**Success Criteria**: Measurable outcomes that define mission completion

- [ ] Criterion 1: Specific, measurable result
- [ ] Criterion 2: Quality threshold or performance target
- [ ] Criterion 3: User acceptance or validation requirement

## 2. Context

**Background**: Relevant information, constraints, dependencies

- Current state description
- Known limitations or challenges
- Related systems or components

**Assumptions**: Explicit assumptions this mission relies on

- Technical assumptions (e.g., API availability)
- Business assumptions (e.g., user behavior)
- Resource assumptions (e.g., computational limits)

**Constraints**: Hard boundaries that cannot be violated

- Time constraints (deadlines, SLAs)
- Resource constraints (budget, compute, memory)
- Policy constraints (privacy, compliance, security)

## 3. Tasks

> **Compilation Target**: GMACompiler parses this section into TaskQueue entries

### Task 1: {Task Name}

**Description**: What needs to be done (2-3 sentences)

**Agent Assignment**:

- **Preferred Agent**: {AgentId or capability match criteria}
- **Fallback Strategy**: {Alternative agents or escalation path}

**Inputs**:

- Input 1: {description, source, format}
- Input 2: {description, source, format}

**Outputs**:

- Output 1: {description, destination, format}
- Output 2: {description, destination, format}

**Dependencies**:

- Depends on: [Task IDs that must complete first]
- Blocks: [Task IDs that wait for this task]

**Acceptance Criteria**:

- [ ] Criterion 1: Specific validation check
- [ ] Criterion 2: Quality or performance requirement
- [ ] Criterion 3: Integration or compatibility check

**Estimated Effort**: {hours or story points}

**Status**: `not-started` | `in-progress` | `completed` | `blocked` | `failed`

---

### Task 2: {Task Name}

_[Repeat structure for each task]_

---

## 4. Quality Standards

**Code Quality**: Minimum Grade A (80%+ Constitutional AI score)

**Testing Requirements**:

- Unit tests: {coverage percentage}
- Integration tests: {key scenarios}
- Performance tests: {latency/throughput targets}

**Documentation Requirements**:

- Inline documentation: Self-documenting code with clear reasoning
- API documentation: Public interfaces documented
- User documentation: End-user facing features explained

**Constitutional AI Compliance**:

- ✅ Accuracy: Prefer "I don't know" to speculation
- ✅ Transparency: Explain reasoning and limitations
- ✅ Helpfulness: Provide actionable, relevant guidance
- ✅ Safety: Avoid harmful or misleading recommendations

## 5. Resources

**Required APIs/Services**:

- Service 1: {name, purpose, endpoint}
- Service 2: {name, purpose, endpoint}

**Required Data Sources**:

- Data 1: {name, location, access method}
- Data 2: {name, location, access method}

**Required Capabilities**:

- Capability 1: {agent capability requirement}
- Capability 2: {agent capability requirement}

**External Dependencies**:

- Dependency 1: {library, version, purpose}
- Dependency 2: {library, version, purpose}

## 6. Risk Assessment

| Risk               | Impact          | Probability     | Mitigation          |
| ------------------ | --------------- | --------------- | ------------------- |
| Risk 1 description | High/Medium/Low | High/Medium/Low | Mitigation strategy |
| Risk 2 description | High/Medium/Low | High/Medium/Low | Mitigation strategy |

## 7. Timeline

**Milestones**:

- Milestone 1: {date} - {description}
- Milestone 2: {date} - {description}
- Milestone 3: {date} - {description}

**Critical Path**: [Task IDs that determine minimum completion time]

**Buffer**: {percentage or time allocated for unknowns}

## 8. Review & Approval

**Specification Review**:

- SpecLintingAgent Score: {percentage} (target: 80%+)
- BMAD Compliance: {pass/fail}
- Constitutional AI Validation: {pass/fail}

**Approval Chain**:

- [ ] Technical Lead: {AgentId}
- [ ] Domain Expert: {AgentId}
- [ ] User Acceptance: {UserId}

**Change Control**:

- Minor changes (scope < 10%): Update spec inline, increment patch version
- Major changes (scope > 10%): Create new spec with lineage reference

---

## 9. Execution Log

> **Auto-populated by GMACompiler during execution**

### Execution #1 - {ISO_TIMESTAMP}

**Compilation Results**:

- Tasks created: {count}
- Agents assigned: {list}
- Estimated duration: {hours}

**Progress**:

- Task 1: {status} - {completion_timestamp}
- Task 2: {status} - {completion_timestamp}
- ...

**Issues Encountered**:

- Issue 1: {description, resolution, impact}
- Issue 2: {description, resolution, impact}

**Deviations from Plan**:

- Deviation 1: {what changed, why, approval}
- Deviation 2: {what changed, why, approval}

**Final Status**: {completed | failed | partial}

**Retrospective Notes**: {lessons learned, improvements for future specs}

---

## 10. Memory Audit Trail

> **Auto-populated by UnifiedAgentCommunicationService memory audit**

**Specification Lifecycle**:

- Created: {timestamp} by {agentId}
- Modified: {timestamp} by {agentId} - {change summary}
- Reviewed: {timestamp} by {agentId} - {score}
- Compiled: {timestamp} by GMACompiler - {taskCount} tasks
- Completed: {timestamp} - {finalStatus}

**Cross-References**:

- Related Specs: [specId references]
- Parent Specs: [lineage chain]
- Child Specs: [forked/branched specs]

**Domain Isolation**:

- Primary Domain: {domain}
- Cross-Domain Bridges: {list of approved bridges with consent records}

---

## Schema Validation

**JSON Schema**: `docs/specs/missionbrief.schema.json`

**Validation Rules**:

1. All tasks must have at least one acceptance criterion
2. Dependencies must form a DAG (no cycles)
3. Success criteria must be measurable
4. Agent assignments must specify fallback strategy
5. Status transitions must follow state machine: not-started → in-progress → (completed | failed | blocked)

**Linting Checks** (SpecLintingAgent):

1. Clarity Score: Are descriptions clear and actionable?
2. Completeness Score: Are all required sections filled?
3. BMAD Compliance: Does spec follow BMAD framework patterns?
4. Constitutional AI: Does spec adhere to accuracy, transparency, helpfulness, safety?
5. Dependency Validation: Is the task graph valid and optimized?

---

**MissionBrief Specification Format Version**: 1.0.0  
**Last Updated**: 2025-10-02  
**Maintained by**: OneAgent GMA System
