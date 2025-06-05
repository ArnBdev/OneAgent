# OneAgent Development Guidelines

## 📁 File Placement Rules

**ALWAYS follow these rules when creating new files:**

### 📚 Documentation → `docs/`
```bash
# ✅ CORRECT locations for documentation:
docs/README.md                    # Main project documentation
docs/QUICK_REFERENCE.md          # API reference
docs/API_DOCUMENTATION.md        # Detailed API docs
docs/DEPLOYMENT_GUIDE.md         # Deployment instructions
docs/TROUBLESHOOTING.md          # Common issues and solutions
docs/FEATURE_NAME.md             # Feature-specific documentation

# ❌ WRONG - do NOT place in root:
./README.md                      # Only for project overview
./API_DOCS.md                    # Should be in docs/
./SETUP.md                       # Should be in docs/
```

### 🧪 Tests → `tests/`
```bash
# ✅ CORRECT locations for tests:
tests/test-api-integration.ts    # API integration tests
tests/test-gemini-client.ts      # Specific component tests
tests/test-embeddings.ts         # Feature-specific tests
tests/test-memory-system.ts      # Memory functionality tests
tests/test-workflow-engine.ts    # Workflow tests

# ❌ WRONG - do NOT place in root:
./test-something.ts              # Should be in tests/
./validate-api.ts                # Should be in tests/
```

### 🔧 Scripts → `scripts/`
```bash
# ✅ CORRECT locations for scripts:
scripts/build-production.js     # Build scripts
scripts/deploy-to-server.js     # Deployment scripts
scripts/database-migration.js   # Database scripts
scripts/api-validation.js       # Validation utilities

# ❌ WRONG - do NOT place in root:
./build.js                       # Should be in scripts/
./deploy.js                      # Should be in scripts/
```

### 📁 Temporary Files → `temp/`
```bash
# ✅ CORRECT for temporary files:
temp/api-responses.json          # Temporary API data
temp/debug-output.log           # Debug information
temp/test-results.txt           # Temporary test output
temp/downloaded-files/          # Downloaded content

# ❌ WRONG - do NOT place in root:
./debug.log                      # Should be in temp/
./test-output.json               # Should be in temp/
```

## 🎯 Quick Reference Commands

### Creating New Files
```bash
# Documentation
touch docs/NEW_FEATURE.md
code docs/NEW_FEATURE.md

# Tests  
touch tests/test-new-feature.ts
code tests/test-new-feature.ts

# Scripts
touch scripts/new-utility.js
code scripts/new-utility.js

# Temporary files
touch temp/debug-session.log
```

### File Templates

#### New Test File Template
```typescript
// tests/test-YOUR-FEATURE.ts
import { GeminiClient } from '../coreagent/tools/geminiClient';
import * as dotenv from 'dotenv';

dotenv.config();

describe('Your Feature Tests', () => {
  // Your tests here
});
```

#### New Documentation Template
```markdown
# Feature Name

## Overview
Brief description of the feature.

## Usage
How to use this feature.

## API Reference
Methods and interfaces.

## Examples
Code examples.
```

#### New Script Template
```javascript
#!/usr/bin/env node
/**
 * Script Name - Description
 */

const { execSync } = require('child_process');

function main() {
  console.log('🔧 Starting script...');
  // Your script logic here
}

main();
```

## 🚨 Important Rules

### ✅ DO:
- **Always** place tests in `tests/`
- **Always** place documentation in `docs/`
- **Always** place scripts in `scripts/`
- **Always** use descriptive filenames
- **Always** include README.md in new directories
- **Always** update package.json scripts when adding new utilities

### ❌ DON'T:
- **Never** put test files in root directory
- **Never** put documentation in root directory
- **Never** put utility scripts in root directory
- **Never** commit anything in `temp/`
- **Never** hardcode API keys in any files

## 📋 Checklist for New Files

Before creating any new file, ask:

1. **🎯 What is the purpose?**
   - Documentation → `docs/`
   - Testing → `tests/`
   - Build/Deploy → `scripts/`
   - Temporary → `temp/`
   - Core Logic → `coreagent/`

2. **🔒 Is it sensitive?**
   - API keys → `.env` (gitignored)
   - Personal data → `data/` (gitignored)
   - Temporary → `temp/` (gitignored)

3. **📝 Does it need documentation?**
   - Add to appropriate README.md
   - Update package.json if it's a script
   - Document the purpose and usage

## 🔄 Migration Commands

If you accidentally create files in wrong locations:

```bash
# Move documentation
mv ./SOME_DOC.md docs/

# Move tests
mv ./test-something.ts tests/

# Move scripts
mv ./utility-script.js scripts/

# Update imports after moving tests
# Change: import { } from './coreagent/...'
# To:     import { } from '../coreagent/...'
```

## 📞 When in Doubt

**Ask these questions:**
- Is this documentation? → `docs/`
- Is this a test? → `tests/`
- Is this a script/utility? → `scripts/`
- Is this temporary? → `temp/`
- Is this core application code? → `coreagent/`

**Follow the pattern:** Look at existing files in each directory as examples.
