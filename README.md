# OneAgent - AI Agent Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![Google AI](https://img.shields.io/badge/Google_AI-Gemini-orange)](https://ai.google.dev/)
[![MCP](https://img.shields.io/badge/MCP-HTTP_Adapter-success)](docs/MCP_ADAPTERS_EXPLAINED.md)
[![Status](https://img.shields.io/badge/Status-Production_Ready-brightgreen)](docs/DEVELOPMENT_REPORT.md)

OneAgent is a modular AI agent platform that integrates Google Gemini AI with semantic embeddings, memory management (Mem0), and intelligent web search capabilities. Built with TypeScript for production-ready AI automation and external service integration via HTTP MCP adapters.

## ✅ **Latest Update: Milestone 1.4 Complete**
**Real-time Monitoring & Analytics System** fully implemented and deployed! OneAgent now features:
- 🚀 Performance profiling with real-time metrics
- 🧠 Memory intelligence with semantic search
- ⚡ WebSocket communication for live updates  
- 🎨 React UI with TypeScript integration
- 📊 REST API endpoints for all functionality

See the [Milestone 1.4 completion report](docs/MILESTONE_1_4_COMPLETION_REPORT.md) for full details.

## 🚀 Quick Start

```bash
# Clone and setup
git clone <repository-url>
cd OneAgent
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Start backend server
npm run server:dev

# Start frontend UI (new terminal)
npm run ui:dev

# Run integration tests
npm run test:api
```

## 📁 Project Structure

```
OneAgent/
├── docs/                           # 📚 All documentation
│   ├── README.md                   # Main project documentation  
│   ├── QUICK_REFERENCE.md          # API quick reference
│   └── EMBEDDINGS_IMPLEMENTATION.md # Technical implementation
├── tests/                          # 🧪 All test files
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

## 🚀 Milestone 1.4 Features

✅ **Real-time Monitoring System** - WebSocket-based live updates  
✅ **Performance Profiling** - Comprehensive metrics and analytics  
✅ **Memory Intelligence** - Semantic search with Mem0 integration  
✅ **React UI Integration** - Modern TypeScript frontend  
✅ **REST API Endpoints** - Complete backend functionality  
✅ **Google AI Studio Integration** - Verified working with Gemini  
✅ **768-Dimensional Embeddings** - Production-ready semantic search  
✅ **Batch Processing** - Efficient bulk operations  
✅ **Error Handling** - Graceful fallbacks and recovery  
✅ **TypeScript** - Full type safety and IntelliSense support
