# OneAgent Tests

This directory contains all test files for the OneAgent project.

## 🧪 Test Files

### API Integration Tests
- **`test-real-api.ts`** - Comprehensive API integration test with real Google AI Studio API key
- **`test-api-key.ts`** - Validates Google API key format and basic functionality

### Component Tests  
- **`test-import.ts`** - Tests module imports and basic instantiation
- **`test-gemini.ts`** - Specific Gemini client testing

## 🚀 Running Tests

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
