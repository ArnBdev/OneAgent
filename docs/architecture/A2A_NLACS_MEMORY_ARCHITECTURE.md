# OneAgent A2A + NLACS + Memory-Driven Collaboration Architecture

## Overview

This document describes the unified architecture for agent-to-agent (A2A) communication, Natural Language Agent Coordination System (NLACS), and memory-driven collaboration in OneAgent.

---

## 1. Canonical Agent Communication (A2A)

- **Protocol:** Implements Google A2A v0.2.5 (JSON-RPC, agent cards, discovery, secure messaging)
- **Registry:** All agents are registered in the canonical HybridAgentRegistry (A2A + MCP)
- **Message Routing:** All agent messages (direct, broadcast, coordination) are routed through the unified A2A protocol
- **Extensibility:** Supports new message types, negotiation, consensus, and advanced NL workflows

## 2. NLACS (Natural Language Agent Coordination System)

- **Types:** Canonical types for conversation, context, session, and message metadata
- **Collaboration:** Agents can coordinate, negotiate, and reach consensus using natural language
- **Session Management:** Supports collaborative sessions, extended conversations, and context-aware workflows
- **Integration:** NLACS types and flows are embedded in A2A protocol and agent memory

## 3. Memory-Driven Collaboration

- **Audit Trail:** All agent messages, tasks, and context are stored in OneAgentMemory
- **Context Retrieval:** Agents retrieve recent messages, relevant history, and peer info for context-aware reasoning
- **Quality Validation:** Constitutional AI validates and scores all agent communication
- **Evolution:** Conversation patterns and collaboration outcomes are used to trigger agent/system evolution

---

## System Flow

1. **Agent Registration:**
   - Agents register via HybridAgentRegistry (A2A + MCP)
   - Agent cards are stored in memory for discovery
2. **Message Exchange:**
   - Agents send/receive messages using A2A protocol (direct, broadcast, coordination)
   - All messages are stored in memory with full metadata
3. **NLACS Collaboration:**
   - Agents use NLACS types for natural language negotiation, consensus, and context sharing
   - Sessions and threads are tracked in memory
4. **Contextual Reasoning:**
   - Agents retrieve context (recent messages, peer agents, system status) before acting
   - Memory-driven context enables advanced reasoning and collaboration
5. **Monitoring & Evolution:**
   - Unified health system monitors agent/system status
   - Conversation patterns and outcomes trigger evolution and optimization

---

## Extending the System

- **Add new NLACS/A2A tools** for advanced workflows (e.g., `oneagent_a2a_start_conversation`, `oneagent_nlacs_analyze`)
- **Implement advanced reasoning** (negotiation, consensus, learning) using NLACS types and memory context
- **Integrate monitoring** with the unified health system for proactive maintenance and evolution

---

## Status

- ✅ All legacy/parallel systems removed
- ✅ All agent registration, messaging, and communication is canonical
- ✅ A2A, NLACS, and memory-driven collaboration are fully unified and production-ready
- ✅ System is extensible for advanced NL workflows, monitoring, and evolution

---

_This document is maintained as the single source of truth for agent collaboration architecture in OneAgent._
