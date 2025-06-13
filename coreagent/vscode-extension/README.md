# OneAgent Professional VS Code Extension

This is the official VS Code extension for OneAgent Professional - a sophisticated AI development platform featuring Constitutional AI, BMAD Framework analysis, and quality-first development principles.

## Features

### 🤖 Chat Integration
- Intelligent chat participant with Constitutional AI validation
- Context-aware responses with quality scoring
- Memory-enhanced conversations

### ⚖️ Constitutional AI Validation
- Validate code and text against Constitutional AI principles
- Ensure accuracy, transparency, helpfulness, and safety
- Right-click validation in editor

### 📊 Quality Scoring
- Professional-grade code quality analysis
- Detailed suggestions for improvement
- A-F grading system with actionable feedback

### 🎯 BMAD Framework Analysis
- Systematic 9-point framework analysis
- Belief assessment and motivation mapping
- Risk assessment and success metrics

### 🧠 Memory Context Search
- Search through project context and conversations
- Semantic search with vector embeddings
- Persistent memory across sessions

### 📈 System Dashboard
- Real-time OneAgent health monitoring
- Performance metrics and quality scores
- Component status and capabilities overview

## Requirements

- OneAgent Professional server running on port 8083
- VS Code 1.74.0 or higher

## Extension Settings

This extension contributes the following settings:

* `oneagent.serverUrl`: OneAgent MCP Server URL (default: http://localhost:8083)
* `oneagent.enableConstitutionalAI`: Enable Constitutional AI validation (default: true)
* `oneagent.qualityThreshold`: Minimum quality score threshold (default: 80)

## Commands

- `OneAgent: Open Dashboard` - Open the OneAgent dashboard
- `OneAgent: Constitutional Validate Selection` - Validate selected text
- `OneAgent: Quality Score Selection` - Analyze code quality
- `OneAgent: BMAD Framework Analysis` - Perform BMAD analysis
- `OneAgent: Search Memory Context` - Search memory context

## Usage

### Chat Integration
1. Open VS Code chat panel (Ctrl+Alt+I)
2. Type `@oneagent` to engage with OneAgent
3. Ask questions or request analysis

### Quality Analysis
1. Select code or open a file
2. Right-click and choose "OneAgent: Quality Score Selection"
3. View detailed quality report with suggestions

### Constitutional Validation
1. Select text or code
2. Right-click and choose "OneAgent: Constitutional Validate Selection"
3. Review compliance feedback

## Architecture

OneAgent Professional maintains a **standalone architecture** where:
- OneAgent core operates independently on port 8083
- VS Code extension acts as a thin client interface
- All functionality remains available without VS Code
- MCP protocol ensures loose coupling

## Troubleshooting

### Extension Not Working
1. Ensure OneAgent server is running on port 8083
2. Check the OneAgent status in the status bar
3. Verify settings in VS Code preferences
4. Use `OneAgent: System Health` command to diagnose

### Connection Issues
1. Check firewall settings for port 8083
2. Verify OneAgent server is accessible
3. Try restarting both OneAgent and VS Code

## Support

For issues and support:
- Check OneAgent dashboard for system health
- Review extension logs in VS Code Developer Console
- Ensure OneAgent Professional is properly configured

## Release Notes

### 1.0.0

Initial release with full OneAgent Professional integration:
- Chat participant with Constitutional AI
- Quality scoring and BMAD analysis
- Memory context search
- System health dashboard
- Comprehensive command palette integration

---

**OneAgent Professional**: Quality-first AI development with Constitutional AI principles.
