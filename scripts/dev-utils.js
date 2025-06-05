#!/usr/bin/env node
/**
 * Development Utility Scripts for OneAgent
 * 
 * Quick development helpers and build scripts
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n🔧 ${description}...`, 'cyan');
  try {
    const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
    log(`✅ ${description} completed`, 'green');
    return output;
  } catch (error) {
    log(`❌ ${description} failed: ${error.message}`, 'red');
    return null;
  }
}

// Available commands
const commands = {
  clean: () => {
    log('🧹 Cleaning build artifacts and temporary files...', 'yellow');
    
    // Clean TypeScript build
    if (fs.existsSync('dist')) {
      fs.rmSync('dist', { recursive: true, force: true });
      log('✅ Removed dist/ directory', 'green');
    }
    
    // Clean temp directory contents but keep the directory
    if (fs.existsSync('temp')) {
      const tempFiles = fs.readdirSync('temp');
      tempFiles.forEach(file => {
        const filePath = path.join('temp', file);
        fs.rmSync(filePath, { recursive: true, force: true });
      });
      log(`✅ Cleaned temp/ directory (${tempFiles.length} items removed)`, 'green');
    }
    
    // Clean node modules if requested
    if (process.argv.includes('--full')) {
      if (fs.existsSync('node_modules')) {
        fs.rmSync('node_modules', { recursive: true, force: true });
        log('✅ Removed node_modules/ directory', 'green');
      }
    }
    
    log('🎉 Cleanup completed!', 'green');
  },

  setup: () => {
    log('🚀 Setting up OneAgent development environment...', 'yellow');
    
    // Install dependencies
    runCommand('npm install', 'Installing dependencies');
    
    // Build TypeScript
    runCommand('npm run build', 'Building TypeScript');
    
    // Check environment
    if (!fs.existsSync('.env')) {
      if (fs.existsSync('.env.example')) {
        fs.copyFileSync('.env.example', '.env');
        log('✅ Created .env from .env.example', 'green');
        log('⚠️  Please edit .env with your actual API keys', 'yellow');
      } else {
        log('⚠️  No .env.example found, please create .env manually', 'yellow');
      }
    }
    
    log('🎉 Setup completed! Run npm run test:api to verify everything works.', 'green');
  },

  test: () => {
    log('🧪 Running all tests...', 'yellow');
    
    // Check if .env exists and has required keys
    if (!fs.existsSync('.env')) {
      log('❌ .env file not found. Run npm run setup first.', 'red');
      return;
    }
    
    const envContent = fs.readFileSync('.env', 'utf-8');
    if (!envContent.includes('GOOGLE_API_KEY=')) {
      log('⚠️  GOOGLE_API_KEY not found in .env. Tests may use mock mode.', 'yellow');
    }
    
    // Run tests in sequence
    runCommand('npm run test:imports', 'Testing imports');
    runCommand('npm run test:key', 'Testing API key');
    runCommand('npm run test:api', 'Testing full API integration');
    
    log('🎉 All tests completed!', 'green');
  },

  dev: () => {
    log('👨‍💻 Starting development environment...', 'yellow');
    
    // Build first
    runCommand('npm run build', 'Initial build');
    
    // Start in watch mode
    log('🔄 Starting development watch mode...', 'cyan');
    log('Press Ctrl+C to stop', 'yellow');
    
    try {
      execSync('npm run dev', { stdio: 'inherit' });
    } catch (error) {
      log('Development mode stopped', 'yellow');
    }
  },

  docs: () => {
    log('📚 Opening documentation...', 'yellow');
    
    const docsFiles = [
      'docs/README.md',
      'docs/QUICK_REFERENCE.md', 
      'docs/EMBEDDINGS_IMPLEMENTATION.md'
    ];
    
    docsFiles.forEach(file => {
      if (fs.existsSync(file)) {
        log(`📄 ${file}`, 'cyan');
      } else {
        log(`❌ ${file} not found`, 'red');
      }
    });
    
    log('💡 Open these files in your editor for full documentation', 'blue');
  },

  create: () => {
    const fileType = process.argv[3];
    const fileName = process.argv[4];
    
    if (!fileType || !fileName) {
      log('❌ Usage: node scripts/dev-utils.js create <type> <name>', 'red');
      log('Types: test, doc, script', 'yellow');
      log('Example: node scripts/dev-utils.js create test my-feature', 'cyan');
      return;
    }
    
    const templates = {
      test: {
        dir: 'tests',
        ext: '.ts',
        template: `// Test for ${fileName}
import { GeminiClient } from '../coreagent/tools/geminiClient';
import * as dotenv from 'dotenv';

dotenv.config();

async function test${fileName.replace(/-/g, '')}() {
  console.log('🧪 Testing ${fileName}...');
  
  // TODO: Implement your tests here
  
  console.log('✅ ${fileName} tests passed');
}

test${fileName.replace(/-/g, '')}().catch(console.error);
`
      },
      doc: {
        dir: 'docs',
        ext: '.md',
        template: `# ${fileName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}

## Overview
Brief description of this feature/component.

## Usage
How to use this feature.

## API Reference
Methods and interfaces.

## Examples
\`\`\`typescript
// Code examples here
\`\`\`

## See Also
- [Main Documentation](README.md)
- [Quick Reference](QUICK_REFERENCE.md)
`
      },
      script: {
        dir: 'scripts',
        ext: '.js',
        template: `#!/usr/bin/env node
/**
 * ${fileName} - Description
 */

const { execSync } = require('child_process');

function main() {
  console.log('🔧 Starting ${fileName}...');
  
  // TODO: Implement your script logic here
  
  console.log('✅ ${fileName} completed');
}

main();
`
      }
    };
    
    const config = templates[fileType];
    if (!config) {
      log(`❌ Unknown type: ${fileType}`, 'red');
      log('Available types: test, doc, script', 'yellow');
      return;
    }
    
    const filePath = path.join(config.dir, `${fileType === 'test' ? 'test-' : ''}${fileName}${config.ext}`);
    
    if (fs.existsSync(filePath)) {
      log(`❌ File already exists: ${filePath}`, 'red');
      return;
    }
    
    fs.writeFileSync(filePath, config.template);
    log(`✅ Created ${fileType} file: ${filePath}`, 'green');
    log(`💡 Open with: code ${filePath}`, 'cyan');
  },

  help: () => {
    log('\n🔧 OneAgent Development Scripts', 'cyan');
    log('=' .repeat(40), 'cyan');
    
    const helpText = `
Available commands:

  clean           Clean build artifacts and temp files
  clean --full    Clean everything including node_modules
  setup           Set up development environment  
  test            Run all tests in sequence
  dev             Start development with watch mode
  docs            List available documentation
  create          Create new files in correct locations
  help            Show this help message

File creation:
  create test <name>      Create new test file in tests/
  create doc <name>       Create new documentation in docs/
  create script <name>    Create new script in scripts/

Usage:
  node scripts/dev-utils.js <command>
  npm run <command>  (if configured in package.json)

Examples:
  node scripts/dev-utils.js setup
  node scripts/dev-utils.js create test api-validation
  node scripts/dev-utils.js create doc deployment-guide
  node scripts/dev-utils.js clean
`;
    
    console.log(helpText);
  }
};

// Parse command line arguments
const command = process.argv[2];

if (!command || !commands[command]) {
  log('❌ Invalid or missing command', 'red');
  commands.help();
  process.exit(1);
}

// Execute the command
commands[command]();
