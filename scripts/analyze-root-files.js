#!/usr/bin/env node
/**
 * OneAgent Root Files Analysis & Cleanup
 * Analyzes root-level Python files and determines their status
 */

const fs = require('fs');
const path = require('path');

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

function analyzeRootFiles() {
  log('🔍 OneAgent Root Files Analysis', 'cyan');
  log('=' .repeat(50), 'cyan');
  
  const rootFiles = fs.readdirSync('.').filter(file => 
    file.endsWith('.py') && !file.startsWith('.')
  );
  
  log(`\n📋 Found ${rootFiles.length} Python files in root:`, 'blue');
  
  const analysis = {
    production: [],
    development: [],
    duplicates: [],
    obsolete: []
  };
  
  rootFiles.forEach(file => {
    const stats = fs.statSync(file);
    const size = stats.size;
    const modified = stats.mtime.toISOString().split('T')[0];
    
    log(`\n📄 ${file}`, 'yellow');
    log(`   Size: ${size} bytes, Modified: ${modified}`, 'reset');
    
    // Check if equivalent exists in servers/ or temp/
    const tempPath = path.join('temp', file);
    const serversPath = path.join('servers', file);
    
    let status = 'unknown';
    let recommendation = '';
    
    // Specific analysis for each file type
    if (file === 'gemini_mem0_server_v2.py') {
      // Check if this is the same as servers/gemini_mem0_server_v2.py
      if (fs.existsSync(serversPath)) {
        analysis.duplicates.push(file);
        status = 'duplicate';
        recommendation = 'DELETE - duplicate of servers/gemini_mem0_server_v2.py';
      } else {
        analysis.production.push(file);
        status = 'production';
        recommendation = 'MOVE to servers/';
      }
    } else if (file.includes('gemini_mem0_server')) {
      analysis.development.push(file);
      status = 'development';
      recommendation = 'MOVE to temp/ (development iteration)';
    } else if (file.includes('mem0') || file.includes('gemini') || file.includes('integration')) {
      analysis.development.push(file);
      status = 'development';
      recommendation = 'MOVE to temp/ (development file)';
    } else if (file.includes('test')) {
      analysis.development.push(file);
      status = 'test';
      recommendation = 'MOVE to temp/ (development test)';
    } else {
      analysis.obsolete.push(file);
      status = 'obsolete';
      recommendation = 'REVIEW - may be obsolete';
    }
    
    log(`   Status: ${status}`, status === 'production' ? 'green' : status === 'duplicate' ? 'red' : 'yellow');
    log(`   Action: ${recommendation}`, status === 'production' ? 'green' : status === 'duplicate' ? 'red' : 'yellow');
    
    // Check for duplicates in temp/
    if (fs.existsSync(tempPath)) {
      log(`   ⚠️  Duplicate exists in temp/`, 'yellow');
    }
  });
  
  // Summary
  log(`\n📊 Analysis Summary:`, 'cyan');
  log(`✅ Production files: ${analysis.production.length}`, 'green');
  log(`🔧 Development files: ${analysis.development.length}`, 'yellow');
  log(`🔄 Duplicates: ${analysis.duplicates.length}`, 'red');
  log(`❓ Obsolete files: ${analysis.obsolete.length}`, 'red');
  
  // Detailed recommendations
  if (analysis.production.length > 0) {
    log(`\n✅ Production Files (keep/move to servers/):`, 'green');
    analysis.production.forEach(file => log(`   ${file}`, 'green'));
  }
  
  if (analysis.development.length > 0) {
    log(`\n🔧 Development Files (move to temp/):`, 'yellow');
    analysis.development.forEach(file => log(`   ${file}`, 'yellow'));
  }
  
  if (analysis.duplicates.length > 0) {
    log(`\n🔄 Duplicate Files (safe to delete):`, 'red');
    analysis.duplicates.forEach(file => log(`   ${file}`, 'red'));
  }
  
  if (analysis.obsolete.length > 0) {
    log(`\n❓ Files requiring review:`, 'red');
    analysis.obsolete.forEach(file => log(`   ${file}`, 'red'));
  }
  
  return analysis;
}

function proposeCleanupPlan(analysis) {
  log(`\n🧹 Proposed Cleanup Plan:`, 'cyan');
  log('=' .repeat(30), 'cyan');
  
  let moveCount = 0;
  let deleteCount = 0;
  
  // Show moves to temp/
  if (analysis.development.length > 0) {
    log(`\n📁 Move to temp/ (${analysis.development.length} files):`, 'yellow');
    analysis.development.forEach(file => {
      log(`   ${file} → temp/${file}`, 'yellow');
      moveCount++;
    });
  }
  
  // Show deletions
  if (analysis.duplicates.length > 0) {
    log(`\n🗑️  Safe to delete (${analysis.duplicates.length} duplicates):`, 'red');
    analysis.duplicates.forEach(file => {
      log(`   ${file} (duplicate of servers/${file})`, 'red');
      deleteCount++;
    });
  }
  
  log(`\n📊 Cleanup Summary:`, 'cyan');
  log(`   Files to move: ${moveCount}`, 'yellow');
  log(`   Files to delete: ${deleteCount}`, 'red');
  log(`   Total actions: ${moveCount + deleteCount}`, 'blue');
  
  if (moveCount + deleteCount > 0) {
    log(`\n💡 Run with --execute to perform cleanup`, 'blue');
  } else {
    log(`\n🎉 No cleanup needed!`, 'green');
  }
}

function executeCleanup(analysis) {
  log(`\n🧹 Executing Cleanup...`, 'cyan');
  
  let moved = 0;
  let deleted = 0;
  let errors = 0;
  
  // Move development files to temp/
  analysis.development.forEach(file => {
    try {
      const targetPath = path.join('temp', file);
      if (!fs.existsSync(targetPath)) {
        fs.renameSync(file, targetPath);
        log(`✅ Moved: ${file} → temp/${file}`, 'green');
        moved++;
      } else {
        log(`⚠️  Skipped: ${file} (already exists in temp/)`, 'yellow');
      }
    } catch (error) {
      log(`❌ Error moving ${file}: ${error.message}`, 'red');
      errors++;
    }
  });
  
  // Delete duplicate files
  analysis.duplicates.forEach(file => {
    try {
      fs.unlinkSync(file);
      log(`✅ Deleted: ${file} (duplicate)`, 'green');
      deleted++;
    } catch (error) {
      log(`❌ Error deleting ${file}: ${error.message}`, 'red');
      errors++;
    }
  });
  
  log(`\n📊 Cleanup Results:`, 'cyan');
  log(`✅ Files moved: ${moved}`, 'green');
  log(`🗑️  Files deleted: ${deleted}`, 'green');
  if (errors > 0) {
    log(`❌ Errors: ${errors}`, 'red');
  }
  
  return { moved, deleted, errors };
}

// Main execution
const command = process.argv[2];

if (command === '--execute') {
  const analysis = analyzeRootFiles();
  const results = executeCleanup(analysis);
  
  if (results.errors === 0) {
    log(`\n🎉 Cleanup completed successfully!`, 'green');
    log(`💡 Run 'npm run check-structure' to verify`, 'blue');
  }
} else if (command === '--help') {
  log('OneAgent Root Files Cleanup', 'cyan');
  log('Usage:', 'blue');
  log('  node scripts/analyze-root-files.js          # Analyze only', 'yellow');
  log('  node scripts/analyze-root-files.js --execute # Execute cleanup', 'green');
  log('  node scripts/analyze-root-files.js --help    # Show help', 'blue');
} else {
  const analysis = analyzeRootFiles();
  proposeCleanupPlan(analysis);
}
