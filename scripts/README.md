# Scripts Directory

This directory contains utility scripts for OneAgent development and maintenance.

## 🔧 Available Scripts

### `dev-utils.js`
Comprehensive development utility script with multiple commands:

```bash
# Setup development environment
node scripts/dev-utils.js setup

# Clean build artifacts
node scripts/dev-utils.js clean
node scripts/dev-utils.js clean --full  # Includes node_modules

# Run all tests
node scripts/dev-utils.js test

# Start development mode
node scripts/dev-utils.js dev

# List documentation
node scripts/dev-utils.js docs

# Show help
node scripts/dev-utils.js help
```

## 🚀 Quick Commands

The most common development tasks:

```bash
# First time setup
node scripts/dev-utils.js setup

# Daily development
node scripts/dev-utils.js clean
npm run build
npm run test:api

# Before committing
node scripts/dev-utils.js test
npm run build
```

## ➕ Adding New Scripts

When adding new utility scripts:

1. **Place them in this `scripts/` directory**
2. **Use descriptive names**: `build-prod.js`, `deploy.js`, etc.
3. **Add documentation** to this README
4. **Consider adding npm script aliases** in package.json
5. **Use consistent logging** with colors/emojis for user experience

### Script Template
```javascript
#!/usr/bin/env node
/**
 * Script Description
 */

const { execSync } = require('child_process');

function runCommand(cmd, description) {
  console.log(`🔧 ${description}...`);
  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log(`✅ ${description} completed`);
  } catch (error) {
    console.error(`❌ ${description} failed`);
    process.exit(1);
  }
}

// Your script logic here
```

## 🔒 Security Note

Scripts in this directory should:
- ✅ Never contain hardcoded API keys or secrets
- ✅ Use environment variables for sensitive data
- ✅ Be safe to commit to version control
- ✅ Handle errors gracefully
- ✅ Provide clear feedback to users
