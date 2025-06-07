# OneAgent - AI Agent Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![Google AI](https://img.shields.io/badge/Google_AI-Gemini-orange)](https://ai.google.dev/)
[![MCP](https://img.shields.io/badge/MCP-HTTP_Adapter-success)](docs/MCP_ADAPTERS_EXPLAINED.md)
[![Status](https://img.shields.io/badge/Status-Production_Ready-brightgreen)](docs/DEVELOPMENT_REPORT.md)

OneAgent is a modular AI agent platform that integrates Google Gemini AI with semantic embeddings, memory management (Mem0), and intelligent web search capabilities. Built with TypeScript for production-ready AI automation and external service integration via HTTP MCP adapters.

## ✅ **Latest Update: MCP System Complete - Production Ready**
**MCP (Model Context Protocol) HTTP Transport System** fully implemented and production-ready! OneAgent now features:
- 🚀 **MCP HTTP Server**: Full JSON-RPC 2.0 implementation (755 lines) on port 8081
- 🔐 **Session Management**: UUID-based tracking with lifecycle management
- 🛡️ **Security Layer**: Origin validation, session validation, comprehensive error handling
- 🔧 **Tools System**: memory_search, memory_create, system_status implemented
- 📊 **Resources System**: Analytics and performance metrics accessible
- 📝 **Prompts System**: Memory analysis prompt templates available
- ⚡ **Server-Sent Events**: Real-time streaming support for live updates
- 🧠 **Mem0 Integration**: Full local memory system without external API dependencies
- 📈 **Performance Monitoring**: Real-time metrics and analytics

See the [MCP Integration Final Status](docs/MCP_INTEGRATION_FINAL_STATUS.md) and [Project Status Update](docs/PROJECT_STATUS_UPDATE_JUNE_2025.md) for complete technical details.

## 🚀 Quick Start

```bash
# Clone and setup
git clone <repository-url>
cd OneAgent
npm install

# Configure environment
cp .env.example .env
# Edit .env with your GOOGLE_API_KEY

# Start MCP server (new - production ready!)
npm run server:mcp

# Start mem0 server (required for memory operations)
python servers/gemini_mem0_server_v2.py

# Start backend server (new terminal)
npm run server:dev

# Start frontend UI (new terminal)
npm run ui:dev

# Test memory integration
node tests/complete_integration_test.js
```

## 📁 Project Structure

```
OneAgent/
├── docs/                           # 📚 All project documentation
│   ├── README.md                   # Main project documentation  
│   ├── MEM0_INTEGRATION_FINAL_REPORT.md # Mem0 integration details
│   ├── QUICK_REFERENCE.md          # API quick reference
│   └── EMBEDDINGS_IMPLEMENTATION.md # Technical implementation
├── servers/                        # 🚀 Production server components
│   └── gemini_mem0_server_v2.py    # Mem0 integration server
├── tests/                          # 🧪 All test files
│   ├── complete_integration_test.js # Full integration testing
│   ├── test-oneagent-mem0.ts       # TypeScript mem0 tests
│   ├── test-real-api.ts           # Real API integration tests
│   ├── test-api-key.ts            # API key validation
│   └── test-*.ts                  # Additional tests
├── scripts/                        # 🔧 Build and utility scripts
├── temp/                          # 📁 Temporary files (gitignored)
├── coreagent/                     # 🤖 Core application
│   ├── main.ts                    # Application entry point
│   ├── server/                    # 🚀 Express.js API server
│   ├── tools/                     # AI tools and clients
│   ├── api/                       # 📊 Performance API layer
│   ├── intelligence/              # 🧠 Memory intelligence
│   ├── performance/               # ⚡ Performance profiling
│   ├── types/                     # TypeScript definitions
│   └── mcp/                       # Model Context Protocol
├── ui/                            # 🎨 React frontend
│   ├── src/                       # React components & hooks
│   ├── components/                # UI components
│   └── hooks/                     # API integration hooks
└── data/                          # 💾 Application data (gitignored)
```

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development with watch mode  
npm run build        # Build TypeScript to dist/
npm start           # Run built application
npm run server:dev   # Start backend API server (port 8081)
npm run server:mcp   # Start MCP server (port 8081) - PRODUCTION READY
npm run ui:dev       # Start React UI server (port 3000)

# Testing
npm run test        # Run all tests in sequence
npm run test:api    # Test real API integration
npm run test:key    # Validate API key setup
npm run test:imports # Test module imports

# File Creation (Automated)
npm run new:doc <name>     # Create documentation in docs/
npm run new:test <name>    # Create test file in tests/
npm run new:script <name>  # Create script in scripts/
npm run create-file        # Interactive file creation wizard

# Structure Management
npm run check-structure    # Scan for misplaced files & auto-fix
npm run structure-guide    # Show file placement guide
npm run docs              # List available documentation files

# Utilities
npm run setup       # Set up development environment
npm run clean       # Clean build artifacts and temp files

# Development utilities
node scripts/dev-utils.js <command>  # Direct script access
```

For detailed setup instructions, API documentation, and usage examples, see the full documentation in the `docs/` directory.

## 🚀 Production Features

✅ **MCP HTTP Transport System** - Full JSON-RPC 2.0 implementation with session management  
✅ **Production-Ready MCP Server** - Running on port 8081 with health monitoring  
✅ **Session Management** - UUID-based tracking with proper lifecycle management  
✅ **Security Layer** - Origin validation, session validation, comprehensive error handling  
✅ **Tools, Resources & Prompts** - Complete MCP protocol implementation  
✅ **Server-Sent Events (SSE)** - Real-time streaming support for live updates  
✅ **Mem0 Local Memory System** - Complete local memory without external APIs  
✅ **Semantic Search & Storage** - ChromaDB with 768-dimensional embeddings  
✅ **Real-time Monitoring System** - WebSocket-based live updates  
✅ **Performance Profiling** - Comprehensive metrics and analytics  
✅ **Memory Intelligence** - Advanced semantic search capabilities  
✅ **React UI Integration** - Modern TypeScript frontend  
✅ **REST API Endpoints** - Complete backend functionality  
✅ **Google AI Studio Integration** - Verified working with Gemini  
✅ **CRUD Memory Operations** - Add, search, get, delete memories  
✅ **Batch Processing** - Efficient bulk operations  
✅ **Error Handling** - Graceful fallbacks and recovery  
✅ **TypeScript** - Full type safety and IntelliSense support
