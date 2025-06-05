# OneAgent 🤖

**A Modular AI Agent Platform with Real-time Monitoring & Analytics**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](https://expressjs.com/)

## 🚀 Overview

OneAgent is a comprehensive AI agent platform that provides intelligent automation, memory management, and real-time performance monitoring. Built with TypeScript, React, and Node.js, it offers a modular architecture for building sophisticated AI-powered workflows.

## ✨ Features

### 🧠 **Memory Intelligence**
- Semantic memory search and storage
- Intelligent categorization and importance scoring
- Real-time memory analytics and insights
- Integration with Mem0 for advanced memory operations

### 📊 **Performance Monitoring**
- Real-time system status monitoring
- Performance metrics tracking (latency, error rates, throughput)
- Service health indicators
- WebSocket-based live updates

### ⚙️ **Configuration Management**
- Secure API key management with masking
- Real-time configuration updates
- Environment-specific settings
- Live configuration monitoring

### 🔌 **Extensible Architecture**
- Model Context Protocol (MCP) integration
- Modular tool system (Gemini, Brave Search, Web Search)
- RESTful API with comprehensive endpoints
- WebSocket support for real-time communication

## 🏗️ Architecture

```
OneAgent Platform
├── 🖥️  Frontend (React + TypeScript)
│   ├── Real-time monitoring dashboard
│   ├── Memory intelligence interface
│   ├── Configuration management panel
│   └── Performance analytics visualization
│
├── 🔧 Backend API (Express.js + TypeScript)
│   ├── RESTful API endpoints
│   ├── WebSocket server for real-time updates
│   ├── Memory intelligence operations
│   └── Performance monitoring system
│
├── 🤖 AI Tools & Integrations
│   ├── Gemini AI (embeddings & chat)
│   ├── Mem0 (memory operations)
│   ├── Brave Search API
│   └── Web search capabilities
│
└── 🔌 MCP Framework
    ├── Local adapter
    ├── HTTP adapter
    └── Extensible protocol support
```

## 🚦 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- TypeScript

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/OneAgent.git
   cd OneAgent
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

### Development Mode

1. **Start the backend server**
   ```bash
   npm run server:dev
   ```

2. **Start the frontend (in a new terminal)**
   ```bash
   npm run ui:dev
   ```

3. **Open your browser**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8081/api`

## 📡 API Endpoints

### System Status
- `GET /api/system/status` - Get system performance metrics
- `GET /api/system/health` - Get server health information

### Performance Monitoring
- `GET /api/performance/metrics` - Get performance analytics
- `DELETE /api/performance/metrics` - Clear performance metrics

### Memory Intelligence
- `GET /api/memory/search?query=term` - Search memories semantically
- `POST /api/memory/create` - Create new memory entries
- `GET /api/memory/analytics` - Get memory analytics

### Configuration
- `GET /api/config` - Get system configuration (keys masked)
- `POST /api/config` - Update system configuration

## 🧪 Testing

```bash
# Run all tests
npm test

# Test specific components
npm run test:api
npm run test:embeddings
npm run test:mcp
```

## 📊 Performance Features

- **Real-time Metrics**: Live performance tracking with WebSocket updates
- **Error Monitoring**: Comprehensive error rate tracking and alerting
- **Latency Analysis**: P95/P99 latency measurements
- **Service Health**: Multi-service availability monitoring
- **Memory Analytics**: Intelligent memory usage and categorization

## 🛡️ Security

- **API Key Masking**: Sensitive information is never exposed in logs or responses
- **CORS Configuration**: Secure cross-origin request handling
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Secure error responses without data leakage

## 🏅 Milestones

### ✅ Milestone 1.4 - Integration Complete
- [x] Performance profiling integration
- [x] Memory intelligence system
- [x] UI scaffolding with real-time updates
- [x] WebSocket communication
- [x] End-to-end data flow verification
- [x] Configuration management

### 🎯 Upcoming Milestones
- [ ] Production database integration
- [ ] Authentication & authorization
- [ ] Advanced analytics dashboard
- [ ] Performance optimization
- [ ] Deployment automation

## 🛠️ Development Scripts

```bash
# Development
npm run dev              # Build with watch mode
npm run server:dev       # Start backend with auto-reload
npm run ui:dev          # Start frontend development server

# Building
npm run build           # Build for production
npm run ui:build        # Build frontend only

# Utilities
npm run clean           # Clean build artifacts
npm run setup           # Project setup
npm run structure-guide # View project structure
```

## 📁 Project Structure

```
OneAgent/
├── 📄 package.json              # Project configuration
├── 🔧 tsconfig.json            # TypeScript configuration  
├── ⚡ vite.config.ts           # Vite configuration
├── 🎨 tailwind.config.js       # Tailwind CSS configuration
├── 
├── 🧠 coreagent/               # Core agent implementation
│   ├── 🚀 main.ts              # Main application entry
│   ├── 📡 api/                 # API layer
│   ├── 🧠 intelligence/        # Memory intelligence
│   ├── 🔌 mcp/                 # MCP adapters
│   ├── 📊 performance/         # Performance monitoring
│   ├── 🖥️  server/             # Express.js server
│   └── 🛠️  tools/              # AI tools & integrations
│
├── 🎨 ui/                      # React frontend
│   ├── 📄 index.html           # HTML template
│   └── 📁 src/                 # React source code
│       ├── 🧩 components/      # UI components
│       ├── 🪝 hooks/           # React hooks
│       └── 📱 App.tsx          # Main app component
│
├── 📊 data/                    # Data storage
├── 📚 docs/                    # Documentation
├── 🧪 tests/                   # Test suites
└── 📜 scripts/                 # Utility scripts
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Mem0](https://mem0.ai/) for memory intelligence capabilities
- [Google Gemini](https://ai.google.dev/) for AI embeddings and chat
- [Brave Search API](https://brave.com/search/api/) for web search functionality
- [Model Context Protocol](https://spec.modelcontextprotocol.io/) for extensible AI tool integration

## 📞 Support

- 📧 Email: [your-email@example.com]
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/OneAgent/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/OneAgent/discussions)

---

**Built with ❤️ for the AI agent community**
