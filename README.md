# OneAgent - AI Agent Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![Google AI](https://img.shields.io/badge/Google_AI-Gemini-orange)](https://ai.google.dev/)
[![MCP](https://img.shields.io/badge/MCP-HTTP_Adapter-success)](docs/MCP_ADAPTERS_EXPLAINED.md)
[![Status](https://img.shields.io/badge/Status-Production_Ready-brightgreen)](docs/DEVELOPMENT_REPORT.md)

OneAgent is a modular AI agent platform that integrates Google Gemini AI with semantic embeddings, memory management (Mem0), and intelligent web search capabilities. Built with TypeScript for production-ready AI automation and external service integration via HTTP MCP adapters.

## ✅ **Latest Update: Step 2.4 Complete**
**HTTP MCP Adapter** has been fully implemented and tested! OneAgent now supports external service communication and distributed architectures. See the [complete development report](docs/DEVELOPMENT_REPORT.md) for details.

## 🚀 Quick Start

```bash
# Clone and setup
git clone <repository-url>
cd OneAgent
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Run tests
npm run test:api

# Start development
npm run dev
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
│   ├── tools/                     # AI tools and clients
│   ├── types/                     # TypeScript definitions
│   └── mcp/                       # Model Context Protocol
└── data/                          # 💾 Application data (gitignored)
```

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development with watch mode
npm run build        # Build TypeScript to dist/
npm start           # Run built application

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

## 🚀 Production Ready

✅ **Google AI Studio Integration** - Verified working with 39-character API key  
✅ **768-Dimensional Embeddings** - Production-ready semantic search  
✅ **Batch Processing** - Efficient bulk operations  
✅ **Error Handling** - Graceful fallbacks and recovery  
✅ **TypeScript** - Full type safety and IntelliSense support
