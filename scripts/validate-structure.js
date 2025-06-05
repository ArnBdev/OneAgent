#!/usr/bin/env node
/**
 * Project Structure Validator
 * Ensures files are in their correct locations according to OneAgent conventions
 */

const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// File placement rules
const rules = {
  // Files that should be in specific directories
  expectedLocations: {
    'test-*.ts': 'tests/',
    '*.test.ts': 'tests/',
    'spec-*.ts': 'tests/',
    '*.spec.ts': 'tests/',
    '*DOCUMENTATION*.md': 'docs/',
    '*GUIDE*.md': 'docs/',
    '*REFERENCE*.md': 'docs/',
    '*IMPLEMENTATION*.md': 'docs/',
    'API*.md': 'docs/',
    'build-*.js': 'scripts/',
    'deploy-*.js': 'scripts/',
    'dev-*.js': 'scripts/',
    'utils-*.js': 'scripts/',
    '*-utils.js': 'scripts/'
  },
  
  // Files that should NOT be in root
  rootRestrictions: [
    'test-*.ts',
    '*.test.ts',
    'build.js',
    'deploy.js',
    'debug.log',
    'temp-*.json',
    'api-response.json'
  ],
  
  // Required directories
  requiredDirectories: [
    'docs',
    'tests', 
    'scripts',
    'temp',
    'coreagent'
  ]
};

function validateProjectStructure() {
  log('🔍 Validating OneAgent project structure...', 'cyan');
  
  let issues = [];
  let warnings = [];
  
  // Check required directories exist
  log('\n📁 Checking required directories...', 'blue');
  rules.requiredDirectories.forEach(dir => {
    if (fs.existsSync(dir)) {
      log(`✅ ${dir}/`, 'green');
    } else {
      issues.push(`Missing required directory: ${dir}/`);
      log(`❌ ${dir}/ - MISSING`, 'red');
    }
  });
  
  // Check for misplaced files in root
  log('\n🔎 Checking root directory for misplaced files...', 'blue');
  const rootFiles = fs.readdirSync('.').filter(f => fs.statSync(f).isFile());
  
  rootFiles.forEach(file => {
    rules.rootRestrictions.forEach(pattern => {
      const regex = new RegExp(pattern.replace('*', '.*'));
      if (regex.test(file)) {
        issues.push(`File in wrong location: ${file} should be moved to appropriate directory`);
        log(`❌ ${file} - should not be in root directory`, 'red');
      }
    });
  });
  
  // Check for proper placement of specific file types
  log('\n📋 Checking file organization...', 'blue');
  
  function checkDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isFile()) {
        
        // Check if test files are in tests/
        if ((file.startsWith('test-') || file.includes('.test.')) && dir !== 'tests') {
          issues.push(`Test file in wrong location: ${filePath} should be in tests/`);
          log(`❌ ${filePath} - test file should be in tests/`, 'red');
        }
        
        // Check if documentation is in docs/
        if (file.endsWith('.md') && file !== 'README.md' && dir !== 'docs') {
          warnings.push(`Documentation file might belong in docs/: ${filePath}`);
          log(`⚠️  ${filePath} - consider moving to docs/`, 'yellow');
        }
        
        // Check if scripts are in scripts/
        if ((file.endsWith('.js') || file.endsWith('.sh')) && 
            !file.includes('node_modules') && 
            dir !== 'scripts' && 
            dir !== 'coreagent') {
          warnings.push(`Script file might belong in scripts/: ${filePath}`);
          log(`⚠️  ${filePath} - consider moving to scripts/`, 'yellow');
        }
      }
    });
  }
  
  // Check all directories
  const allDirs = ['.', 'coreagent', 'docs', 'tests', 'scripts', 'temp', 'data'];
  allDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      checkDirectory(dir);
    }
  });
  
  // Check for README files in directories
  log('\n📖 Checking for README files...', 'blue');
  ['docs', 'tests', 'scripts', 'temp'].forEach(dir => {
    const readmePath = path.join(dir, 'README.md');
    if (fs.existsSync(dir)) {
      if (fs.existsSync(readmePath)) {
        log(`✅ ${readmePath}`, 'green');
      } else {
        warnings.push(`Missing README.md in ${dir}/`);
        log(`⚠️  ${dir}/README.md - missing documentation`, 'yellow');
      }
    }
  });
  
  // Summary
  log('\n📊 Validation Summary', 'cyan');
  log('=' .repeat(30), 'cyan');
  
  if (issues.length === 0 && warnings.length === 0) {
    log('🎉 Perfect! Project structure follows all conventions.', 'green');
  } else {
    if (issues.length > 0) {
      log(`\n❌ ${issues.length} Issues Found:`, 'red');
      issues.forEach(issue => log(`  • ${issue}`, 'red'));
    }
    
    if (warnings.length > 0) {
      log(`\n⚠️  ${warnings.length} Suggestions:`, 'yellow');
      warnings.forEach(warning => log(`  • ${warning}`, 'yellow'));
    }
    
    log('\n💡 See docs/DEVELOPMENT_GUIDELINES.md for file placement rules', 'blue');
  }
  
  return { issues: issues.length, warnings: warnings.length };
}

function generateFileCreationReminder() {
  log('\n🎯 Quick File Creation Commands:', 'cyan');
  log('=' .repeat(35), 'cyan');
  
  const examples = `
# Create new test file
npm run create test my-feature
# → creates tests/test-my-feature.ts

# Create new documentation  
npm run create doc deployment-guide
# → creates docs/deployment-guide.md

# Create new script
npm run create script backup-data
# → creates scripts/backup-data.js

# Or use the direct command:
node scripts/dev-utils.js create test api-validation
node scripts/dev-utils.js create doc troubleshooting
node scripts/dev-utils.js create script database-migration
`;
  
  console.log(examples);
}

// Main execution
function main() {
  const result = validateProjectStructure();
  
  if (process.argv.includes('--help') || process.argv.includes('--examples')) {
    generateFileCreationReminder();
  }
  
  // Exit with error code if there are issues
  if (result.issues > 0) {
    process.exit(1);
  }
}

main();
