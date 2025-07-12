# OneAgent v4.0.0

## Overview
OneAgent is a professional-grade, multiagent AI development platform featuring Constitutional AI, canonical memory integration, and MCP server capabilities for VS Code Copilot. It is designed for modular, scalable, and type-safe enterprise applications.

## Key Features
- Canonical memory system (`OneAgentMemory`, `MemoryDrivenAgentCommunication`)
- Strict TypeScript architecture with canonical backbone types
- Constitutional AI validation and BMAD framework analysis
- MCP server for VS Code Copilot and standalone operation
- Modular agent design (`BaseAgent`, `ISpecializedAgent`)
- Production-ready, zero TypeScript errors

## Getting Started
- **Standalone:** `npm run build && npm start`
- **MCP Server:** `npm run server:unified`
- **Development:** `npm run dev`

## Canonical Architecture
- All agents extend `BaseAgent` and implement `ISpecializedAgent`
- Memory system uses canonical `MemoryRecord` and `MemoryMetadata`
- All agent actions and endpoints are unified and type-safe

## Documentation
- See `docs/ROADMAP.md` for project roadmap
- See `docs/API_REFERENCE.md` for API details
- See `docs/ONEAGENT_ARCHITECTURE.md` for architecture overview

## License
MIT

---
This is the canonical README for OneAgent. All other documentation is archived or referenced here.
