# OneAgent Test Suite

This directory contains all test files and verification scripts for OneAgent.

## Current Testing Architecture

**Status**: Transitioning from ad-hoc testing to formal testing framework

### Current Testing Types

- **Production Verification**: Critical system validation (`oneagent-demo.ts`)
- **Integration Tests**: A2A Protocol and system integration validation
- **MCP Tests**: MCP server and tool testing
- **Performance Tests**: Performance benchmarking
- **Health Checks**: System verification and monitoring

### Migration to Formal Testing Framework

- **Target**: Jest/Vitest for structured testing
- **Benefits**: Automated discovery, rich assertions, mocking, coverage reporting
- **Timeline**: Next month implementation
- **Status**: Evaluation phase - current tests serve as production verification

## Test Files

### 🚨 Critical Production Verification Systems

- **`oneagent-demo.ts`** - Core OneAgent functionality demonstration and production verification
- **`a2a-server-integration.test.ts`** - A2A Protocol integration verification for multi-agent communication
- **`tests/integration/SystemIntegrationVerifier.ts`** - Production readiness verification and system health monitoring

### Legacy Web and API Tests

- `test_all_oneagent_features.js` - Comprehensive feature testing
- `test_mcp_connection.js` - MCP server connection tests
- `test_new_mcp_tools.js` - New MCP tools validation
- `test-mcp-copilot-server.ts` - MCP Copilot server testing
- `test_webfetch_tool.js` - Web fetch tool testing
- `test_webfetch_compiled.js` - Compiled web fetch validation
- `test-chat-api.js` - Chat API integration tests
- `webfetch_verification.js` - Web fetch verification
- **`test-real-api.ts`** - Comprehensive API integration test with real Google AI Studio API key
- **`test-api-key.ts`** - Validates Google API key format and basic functionality

### Development and Debug Tests

- `debug_test.js` - Debug utilities and testing
- `simple_test.js` - Simple system validation
- **`test-import.ts`** - Tests module imports and basic instantiation
- **`test-gemini.ts`** - Specific Gemini client testing

### 🔧 Technical Debt Status

- **Date.now() Violations**: ✅ FIXED - All test files now use UnifiedBackboneService
- **Standards Compliance**: ✅ COMPLETED - All tests use unified ID and timestamp generation
- **Architectural Protection**: ✅ ADDED - Critical test files marked with protective comments

## 🚀 Running Tests

### Production Verification (Current)

```bash
# Run Hello A2A demo (MCP startup + SSE)
npm run demo:hello

# Run A2A tests (runner ensures memory up, fast mode)
npm run test:a2a

# Build verification
npm run verify
```

### Legacy API Tests

```bash
# Run all API tests
npm run test:api

# Validate API key setup
npm run test:key

# Test module imports
npm run test:imports

# Test embeddings specifically
npm run test:embeddings
```

### 🔮 Future Testing Framework (Next Month)

```bash
# Formal testing framework (Jest/Vitest)
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage reporting
npm run test:ci             # CI/CD integration
```

## 📊 Expected Test Results

### API Integration Test (`test-real-api.ts`)

```
✅ API Key found: AIzaSyA5dbH21z2vSFVL... (39 characters)
✅ Connection test: PASSED
✅ Text generation: PASSED
✅ Single embedding: PASSED (768 dimensions)
✅ Batch embeddings: PASSED (3 embeddings)
✅ Similarity calculation: PASSED (0.9328 score)
🎉 ALL TESTS PASSED! System is production-ready.
```

### API Key Test (`test-api-key.ts`)

```
✅ API Key found: Valid format detected
✅ Basic generation: Working
✅ Embedding generation: 768-dimensional vectors
✅ Batch processing: Multiple embeddings successful
✅ Similarity calculation: Mathematical operations verified
```

## 🔧 Test Configuration

Tests use the following environment variables:

- `GOOGLE_API_KEY` - Required for all API tests
- `GOOGLE_MODEL` - Optional (defaults to gemini-2.5-pro-preview-05-06)

Make sure your `.env` file is properly configured before running tests.

## 📝 Adding New Tests

When adding new test files:

1. Place them in this `tests/` directory
2. Follow the naming convention: `test-*.ts`
3. Update package.json scripts if needed
4. Import modules using relative paths: `../coreagent/tools/...`
5. Add documentation to this README

## 🐛 Debugging Tests

If tests fail:

1. Verify API key is set in `.env`
2. Check internet connectivity
3. Verify Google AI Studio quota
4. Enable debug logging in test files
5. Check the full error output for specific issues
