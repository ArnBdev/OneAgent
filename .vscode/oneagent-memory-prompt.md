---
description: OneAgent Memory Operations. All memory actions must use canonical mem0 API, reference persistent memory, and follow Constitutional AI and BMAD standards.
tools: ['codebase', 'editFiles', 'runCommands', 'search']
---
# OneAgent Memory Prompt
- Use only the canonical `OneAgentMemory` (mem0) API for all memory operations: `addMemory`, `searchMemory`, `updateMemory`, `deleteMemory`, `getGraphNeighbors`, and `addMultimodalMemory`.
- Remove all legacy memory bridges, wrappers, and custom scripts. Do not reference or instantiate any legacy memory logic.
- All agents, tools, and services must delegate memory and embedding operations directly to the canonical API.
- Reference persistent memory for project continuity, self-improvement, and institutional knowledge.
- Apply Constitutional AI validation (accuracy, transparency, helpfulness, safety) to all memory operations and user-facing features.
- Apply BMAD 9-point analysis for all critical memory workflows and architectural decisions.
- Score all memory actions using the OneAgent quality scoring system; target minimum 80% (Grade A) for production workflows.
- Document all memory operations, improvements, and architectural decisions in persistent memory context for institutional learning.
- Ensure comprehensive test coverage for all memory-related features and regression scenarios.
- Enforce memory-first operations: auto-log all valuable information, interfaces, patterns, and solutions as discovered.
- Update this prompt as new memory best practices, mem0 features, or architectural improvements are discovered.
- Enforce continuous improvement: review, refactor, and document memory workflows as the system evolves.
- All memory actions must be transparent, type-safe, and follow professional standards for error handling and maintainability.
