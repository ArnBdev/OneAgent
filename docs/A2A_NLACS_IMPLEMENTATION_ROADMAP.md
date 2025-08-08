# OneAgent A2A + NLACS Implementation Roadmap

---

## Phase 1: Canonical A2A Protocol Foundation

- [✅ Completed] Define canonical A2A protocol types (`A2AMessage`, `A2AMessagePart`, `A2ATask`) in codebase.
- [✅ Completed] Ensure all agent-to-agent and user-to-agent communication uses these types.
- [✅ Completed] Implement session-based, memory-integrated message flows.
- [✅ Completed] Use JSON-RPC 2.0 transport and canonical backbone for all agent communication.
- [✅ Completed] Store all messages in OneAgentMemory singleton with full metadata.
- [✅ Completed] Remove all legacy/parallel agent communication systems.

---

## Phase 2: NLACS Extension Layer (Foundational)

- [✅ Completed] Add `extensions` array to all A2A messages (e.g., `['https://oneagent.ai/extensions/nlacs']`).
- [✅ Completed] Add `nlacs: true` and NLACS marker in message metadata.
- [✅ Completed] Implement real intent, sentiment, complexity, and context tag analysis in message metadata.
- [✅ Completed] Add privacy/isolation metadata (privacy level, user isolation, context category).
- [✅ Completed] Add placeholders for:
  - Entity extraction (semantic analysis)
  - Constitutional AI validation (score, compliance, violations)
  - Emergent intelligence (insights, cross-session links)

---

## Phase 3: NLACS Feature Parity (Advanced)

- [ ] **Entity Extraction:** Implement real entity extraction (NLP) and populate `entities` in semantic analysis.
- [ ] **Constitutional AI Validation:** Integrate actual constitutional validation service; populate real scores, compliance, and violations.
- [ ] **Emergent Intelligence:** Implement insight synthesis engine; populate `insights` in emergent intelligence.
- [ ] **Cross-Session Learning:** Implement knowledge graph/cross-session linking; populate `crossSessionLinks`.
- [ ] **Privacy-First Architecture:** Integrate advanced privacy controls (GDPR, user isolation enforcement, audit logs).
- [ ] **Multi-Agent Orchestration:** Enhance team meeting and group flows to leverage NLACS features (e.g., emergent synthesis, consensus, role assignment).
- [ ] **Constitutional AI Enforcement:** Add pre-send and post-receive constitutional validation for all agent messages.

---


## Phase 4: System Integration & Orchestration

- [⏳ In Progress] **BaseAgent Integration:** Canonical A2A+NLACS enhancement underway. All agents will inherit A2A + NLACS capabilities (not just API layer).
- [ ] **AgentFactory Integration:** Configure all new agents with A2A/NLACS by default.
- [ ] **MCP Server Integration:** Expose A2A/NLACS endpoints in MCP server for external orchestration.
- [ ] **NLACS Service Implementation:** (If not already present) Create a dedicated NLACS orchestration service for advanced multi-agent workflows.

---

## Phase 5: Quality, Testing, and Documentation

- [ ] **Comprehensive Testing:** Unit, integration, and system tests for all A2A/NLACS flows (including edge cases and failure modes).
- [ ] **Documentation:** Update developer docs, protocol specs, and architecture diagrams to reflect the unified A2A+NLACS system.
- [ ] **Memory-Driven Learning:** Store all new patterns, insights, and architectural decisions in OneAgentMemory for future reference.
- [ ] **Performance & Health Monitoring:** Integrate health/availability status and performance metrics into agent discovery and routing.

---

## Legend
- [✅ Completed]: Already implemented in your codebase.
- [ ]: Still to be implemented (some have placeholders, as noted).

---

## Summary of What’s Done vs. What’s Next

- **Foundational A2A protocol and basic NLACS extension fields are fully implemented.**
- **All advanced NLACS features (entity extraction, constitutional validation, emergent intelligence, cross-session learning, advanced privacy, orchestration, and system-wide integration) are pending or have placeholders.**

---

**Next Steps:**
- Prioritize implementing real entity extraction, constitutional validation, and emergent intelligence.
- Integrate these features into both the API and agent layers.
- Expand orchestration and privacy controls as described above.

---

*This document will be updated as progress is made. Please refer to this file to track the status of A2A + NLACS implementation in OneAgent.*
