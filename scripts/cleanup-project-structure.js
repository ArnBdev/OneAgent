#!/usr/bin/env node
/**
 * OneAgent Project Structure Cleanup
 * Automatically moves misplaced files to their correct locations
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

function moveFile(sourcePath, targetDir, fileName = null) {
  const actualFileName = fileName || path.basename(sourcePath);
  const targetPath = path.join(targetDir, actualFileName);
  
  try {
    // Ensure target directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Check if source file exists
    if (!fs.existsSync(sourcePath)) {
      log(`⚠️  Source file not found: ${sourcePath}`, 'yellow');
      return false;
    }
    
    // Check if target already exists
    if (fs.existsSync(targetPath)) {
      log(`⚠️  Target exists, skipping: ${targetPath}`, 'yellow');
      return false;
    }
    
    // Move the file
    fs.renameSync(sourcePath, targetPath);
    log(`✅ Moved: ${sourcePath} → ${targetPath}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Failed to move ${sourcePath}: ${error.message}`, 'red');
    return false;
  }
}

function cleanupProjectStructure() {
  log('🧹 Starting OneAgent project structure cleanup...', 'cyan');
  
  let moved = 0;
  let skipped = 0;
  let failed = 0;
  
  // Test files to move to tests/
  log('\n📋 Moving test files to tests/ directory...', 'blue');
  const testFiles = [
    // Root level test files
    'quick-integration-test.ts',
    'test-ai.ts',
    'test-gemini.ts', 
    'test-import.ts',
    'test-oneagent-mem0.ts',
    'test-real-api.ts',
    'typescript-validation-test.ts',
    
    // Python test files in root
    'test-mem0-debug.py',
    'test-mem0-local-config.py',
    'test-mem0-local-oss.py',
    'test-mem0-local.py',
    'test-mem0-sdk-direct.py',
    'test-mem0-working.py',
    
    // Test files in temp/
    'temp/test-mem0-debug.py',
    'temp/test-mem0-local-config.py',
    'temp/test-mem0-local-oss.py',
    'temp/test-mem0-local.py',
    'temp/test-mem0-sdk-direct.py',
    'temp/test-mem0-working.py',
    'temp/test-output.log'
  ];
  
  testFiles.forEach(filePath => {
    if (moveFile(filePath, 'tests')) {
      moved++;
    } else {
      skipped++;
    }
  });
  
  // Documentation files to move to docs/
  log('\n📚 Moving documentation files to docs/ directory...', 'blue');
  const docFiles = [
    'COPILOT_STARTER.md',
    'GITHUB_SETUP.md',
    'LEVEL_2_INTEGRATION_STATUS.md', 
    'PUSH_TO_GITHUB.md',
    'README_GITHUB.md',
    'STATUS_COMPLETE.md'
  ];
  
  docFiles.forEach(filePath => {
    if (moveFile(filePath, 'docs')) {
      moved++;
    } else {
      skipped++;
    }
  });
  
  // Script files to move to scripts/
  log('\n🔧 Moving script files to scripts/ directory...', 'blue');
  const scriptFiles = [
    'complete_integration_test.js',
    'debug_test.js',
    'final_integration_test.js',
    'postcss.config.js',
    'quick-integration-test.js',
    'simple_integration_test.js',
    'tailwind.config.js',
    'test_mem0_integration.js',
    'test_oneagent_integration.js',
    
    // Scripts currently in tests/ (integration scripts)
    'tests/complete_integration_test.js',
    'tests/final_integration_test.js', 
    'tests/simple_integration_test.js',
    'tests/test_mem0_integration.js',
    'tests/test_oneagent_integration.js',
    
    // Scripts in temp/
    'temp/debug_test.js'
  ];
  
  scriptFiles.forEach(filePath => {
    if (moveFile(filePath, 'scripts')) {
      moved++;
    } else {
      skipped++;
    }
  });
  
  // Special cleanup for duplicate files
  log('\n🔍 Checking for potential duplicates and organizing...', 'blue');
  
  // Update package.json scripts to reflect new structure
  log('\n📦 Updating package.json script references...', 'blue');
  try {
    const packageJsonPath = 'package.json';
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Update script paths if they reference moved files
      if (packageJson.scripts) {
        let updated = false;
        Object.keys(packageJson.scripts).forEach(key => {
          const script = packageJson.scripts[key];
          
          // Update test script references
          if (script.includes('test-') && !script.includes('tests/')) {
            packageJson.scripts[key] = script.replace(/test-([^.\s]+)/, 'tests/test-$1');
            updated = true;
          }
          
          // Update other references as needed
          if (script.includes('quick-integration-test')) {
            packageJson.scripts[key] = script.replace('quick-integration-test', 'scripts/quick-integration-test');
            updated = true;
          }
        });
        
        if (updated) {
          fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
          log('✅ Updated package.json script references', 'green');
        }
      }
    }
  } catch (error) {
    log(`⚠️  Could not update package.json: ${error.message}`, 'yellow');
  }
  
  // Summary
  log('\n📊 Cleanup Summary', 'cyan');
  log('=' .repeat(30), 'cyan');
  log(`✅ Files moved: ${moved}`, 'green');
  log(`⚠️  Files skipped: ${skipped}`, 'yellow');
  if (failed > 0) {
    log(`❌ Failed moves: ${failed}`, 'red');
  }
  
  if (moved > 0) {
    log('\n🎉 Project structure cleanup completed!', 'green');
    log('💡 Run "npm run validate-structure" to verify the changes', 'blue');
  } else {
    log('\n✨ Project structure was already clean!', 'green');
  }
  
  return { moved, skipped, failed };
}

// Create cleanup verification function
function verifyCleanup() {
  log('\n🔍 Verifying cleanup results...', 'cyan');
  
  const testFilesInRoot = fs.readdirSync('.').filter(file => 
    file.startsWith('test-') || file.includes('test')
  );
  
  if (testFilesInRoot.length === 0) {
    log('✅ No test files remaining in root directory', 'green');
  } else {
    log('⚠️  Test files still in root:', 'yellow');
    testFilesInRoot.forEach(file => log(`  • ${file}`, 'yellow'));
  }
  
  // Check that moved files exist in target locations
  const expectedInTests = [
    'tests/test-ai.ts',
    'tests/test-gemini.ts',
    'tests/test-import.ts'
  ];
  
  expectedInTests.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      log(`✅ Found: ${filePath}`, 'green');
    } else {
      log(`❌ Missing: ${filePath}`, 'red');
    }
  });
}

// Main execution
function main() {
  const result = cleanupProjectStructure();
  
  if (process.argv.includes('--verify')) {
    verifyCleanup();
  }
  
  if (process.argv.includes('--validate')) {
    log('\n🔍 Running structure validation...', 'cyan');
    const { spawn } = require('child_process');
    spawn('node', ['scripts/validate-structure.js'], { stdio: 'inherit' });
  }
  
  return result;
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = { cleanupProjectStructure, verifyCleanup };
