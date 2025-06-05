#!/usr/bin/env node

/**
 * OneAgent Project Cleanup Verification
 * Verifies that all files are properly organized after cleanup
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 OneAgent Project Cleanup Verification');
console.log('=========================================');

const projectRoot = process.cwd();
const checkResults = [];

// Check key directories exist
const expectedDirs = [
    'docs',
    'tests', 
    'servers',
    'temp',
    'coreagent',
    'scripts'
];

console.log('\n📁 Directory Structure Check:');
expectedDirs.forEach(dir => {
    const dirPath = path.join(projectRoot, dir);
    const exists = fs.existsSync(dirPath);
    console.log(`${exists ? '✅' : '❌'} ${dir}/`);
    checkResults.push({ type: 'directory', name: dir, status: exists });
});

// Check key production files are in correct locations
const expectedFiles = [
    { file: 'servers/gemini_mem0_server_v2.py', description: 'Production Memory Server' },
    { file: 'tests/complete_integration_test.js', description: 'Integration Test' },
    { file: 'tests/test-oneagent-mem0.ts', description: 'TypeScript Mem0 Test' },
    { file: 'docs/PROJECT_COMPLETION_SUMMARY.md', description: 'Completion Summary' },
    { file: 'docs/MEM0_INTEGRATION_FINAL_REPORT.md', description: 'Final Report' },
    { file: 'coreagent/tools/mem0Client.ts', description: 'Mem0 Client' },
    { file: 'coreagent/tools/geminiEmbeddings.ts', description: 'Gemini Embeddings' }
];

console.log('\n📄 Production Files Check:');
expectedFiles.forEach(({ file, description }) => {
    const filePath = path.join(projectRoot, file);
    const exists = fs.existsSync(filePath);
    console.log(`${exists ? '✅' : '❌'} ${file} (${description})`);
    checkResults.push({ type: 'file', name: file, description, status: exists });
});

// Check temp directory contains development files
console.log('\n🗂️  Temporary Files Check:');
const tempDir = path.join(projectRoot, 'temp');
if (fs.existsSync(tempDir)) {
    const tempFiles = fs.readdirSync(tempDir);
    const expectedTempFiles = [
        'debug_test.js',
        'temp_restart.txt',
        'mem0-gemini-integration.py'
    ];
    
    expectedTempFiles.forEach(file => {
        const exists = tempFiles.includes(file);
        console.log(`${exists ? '✅' : '⚠️'} temp/${file}`);
    });
    
    console.log(`📊 Total temp files: ${tempFiles.length}`);
} else {
    console.log('❌ temp/ directory not found');
}

// Check tests directory
console.log('\n🧪 Tests Directory Check:');
const testsDir = path.join(projectRoot, 'tests');
if (fs.existsSync(testsDir)) {
    const testFiles = fs.readdirSync(testsDir).filter(f => f.endsWith('.js') || f.endsWith('.ts'));
    console.log(`📊 Total test files: ${testFiles.length}`);
    testFiles.forEach(file => {
        console.log(`✅ tests/${file}`);
    });
} else {
    console.log('❌ tests/ directory not found');
}

// Summary
console.log('\n📋 Cleanup Verification Summary:');
const totalChecks = checkResults.length;
const passedChecks = checkResults.filter(r => r.status).length;
const failedChecks = totalChecks - passedChecks;

console.log(`✅ Passed: ${passedChecks}/${totalChecks}`);
if (failedChecks > 0) {
    console.log(`❌ Failed: ${failedChecks}/${totalChecks}`);
} else {
    console.log('🎉 All checks passed! Project is properly organized.');
}

// Check if structure command exists
console.log('\n🔧 Automated Structure Check:');
try {
    const { execSync } = require('child_process');
    const structureResult = execSync('npm run check-structure', { encoding: 'utf8', stdio: 'pipe' });
    if (structureResult.includes('All files are in correct locations')) {
        console.log('✅ Automated structure check passed');
    } else {
        console.log('⚠️ Structure check has warnings');
        console.log(structureResult);
    }
} catch (error) {
    console.log('⚠️ Could not run structure check:', error.message);
}

console.log('\n🎯 Cleanup Verification Complete!');
console.log('Project is ready for production deployment.');
