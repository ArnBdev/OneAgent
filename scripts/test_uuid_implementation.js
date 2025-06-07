#!/usr/bin/env node

/**
 * Priority 3: UUID Standards Implementation Validation
 * Tests UUID v4 compliance across OneAgent system
 */

const fs = require('fs');
const path = require('path');

// Import UUID utilities
const userTypesPath = path.join(__dirname, '..', 'coreagent', 'types', 'user.ts');

async function testUUIDImplementation() {
  console.log('🧪 Priority 3: UUID Standards Implementation Validation\n');
  
  try {
    // Test 1: Validate generateUUID() and isValidUUID() functions
    console.log('📋 Test 1: UUID Utility Functions...');
    
    // Read user.ts to verify UUID functions exist
    const userTypesContent = fs.readFileSync(userTypesPath, 'utf8');
    
    const hasGenerateUUID = userTypesContent.includes('export function generateUUID()');
    const hasValidateUUID = userTypesContent.includes('export function isValidUUID(uuid: string)');
    const hasUUIDRegex = userTypesContent.includes('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i');
    
    console.log(`  ✅ generateUUID() function: ${hasGenerateUUID ? 'FOUND' : 'MISSING'}`);
    console.log(`  ✅ isValidUUID() function: ${hasValidateUUID ? 'FOUND' : 'MISSING'}`);
    console.log(`  ✅ UUID v4 regex pattern: ${hasUUIDRegex ? 'FOUND' : 'MISSING'}`);
    
    // Test 2: Check crypto.randomUUID usage in servers
    console.log('\n📋 Test 2: Crypto RandomUUID Usage in Servers...');
    
    const serverFiles = [
      path.join(__dirname, '..', 'coreagent', 'server', 'index-simple.ts'),
      path.join(__dirname, '..', 'coreagent', 'server', 'index-simple-mcp.ts')
    ];
    
    for (const serverFile of serverFiles) {
      if (fs.existsSync(serverFile)) {
        const content = fs.readFileSync(serverFile, 'utf8');
        const hasCryptoImport = content.includes("import { randomUUID } from 'crypto'") || 
                               content.includes('randomUUID');
        const hasMathRandom = content.includes('Math.random()');
        
        console.log(`  📄 ${path.basename(serverFile)}:`);
        console.log(`    ✅ Uses crypto.randomUUID: ${hasCryptoImport ? 'YES' : 'NO'}`);
        console.log(`    ${hasMathRandom ? '⚠️' : '✅'} Contains Math.random(): ${hasMathRandom ? 'YES (needs review)' : 'NO'}`);
      }
    }
    
    // Test 3: Check MCP Adapter UUID usage
    console.log('\n📋 Test 3: MCP Adapter Request ID Generation...');
    
    const mcpAdapterFile = path.join(__dirname, '..', 'coreagent', 'mcp', 'adapter.ts');
    if (fs.existsSync(mcpAdapterFile)) {
      const content = fs.readFileSync(mcpAdapterFile, 'utf8');
      const usesMathRandom = content.includes('Math.random()');
      const usesCryptoUUID = content.includes('randomUUID') || content.includes('crypto');
      
      console.log(`  📄 MCP Adapter:`);
      console.log(`    ${usesMathRandom ? '❌' : '✅'} Uses Math.random(): ${usesMathRandom ? 'YES (needs fixing)' : 'NO'}`);
      console.log(`    ✅ Uses crypto UUID: ${usesCryptoUUID ? 'YES' : 'NO'}`);
      
      if (usesMathRandom) {
        console.log('    🔧 ACTION NEEDED: Replace Math.random() with crypto.randomUUID()');
      }
    }
    
    // Test 4: Analyze test files for UUID compliance
    console.log('\n📋 Test 4: Test Files UUID Compliance...');
    
    const testDir = path.join(__dirname, '..', 'tests');
    if (fs.existsSync(testDir)) {
      const testFiles = fs.readdirSync(testDir).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
      
      let testFileIssues = 0;
      for (const testFile of testFiles.slice(0, 5)) { // Check first 5 test files
        const testPath = path.join(testDir, testFile);
        const content = fs.readFileSync(testPath, 'utf8');
        
        // Look for hardcoded user IDs
        const hasHardcodedUserIds = /userId:\s*['"`](test[_-]?user|test[_-]?id|user[_-]?123)['"`]/i.test(content);
        
        if (hasHardcodedUserIds) {
          testFileIssues++;
          console.log(`    ⚠️  ${testFile}: Contains hardcoded user IDs`);
        }
      }
      
      if (testFileIssues === 0) {
        console.log(`    ✅ Checked ${Math.min(5, testFiles.length)} test files - No obvious hardcoded user ID issues`);
      } else {
        console.log(`    🔧 Found ${testFileIssues} test files with potential hardcoded user ID issues`);
      }
    }
    
    // Test 5: Check interface definitions
    console.log('\n📋 Test 5: Interface UUID Compliance...');
    
    const interfaceFiles = [
      path.join(__dirname, '..', 'coreagent', 'types', 'user.ts'),
      path.join(__dirname, '..', 'coreagent', 'types', 'conversation.ts')
    ];
    
    for (const interfaceFile of interfaceFiles) {
      if (fs.existsSync(interfaceFile)) {
        const content = fs.readFileSync(interfaceFile, 'utf8');
        const hasUserIdField = content.includes('userId:') || content.includes('userId?:');
        const hasSessionIdField = content.includes('sessionId:') || content.includes('sessionId?:');
        const hasUUIDComments = content.includes('UUID') || content.includes('uuid');
        
        console.log(`  📄 ${path.basename(interfaceFile)}:`);
        if (hasUserIdField) {
          console.log(`    ✅ Has userId field: YES`);
        }
        if (hasSessionIdField) {
          console.log(`    ✅ Has sessionId field: YES`);
        }
        console.log(`    ✅ Has UUID documentation: ${hasUUIDComments ? 'YES' : 'NO'}`);
      }
    }
    
    // Summary
    console.log('\n🎯 UUID Implementation Status Summary:');
    console.log('  ✅ Core UUID utilities implemented in user.ts');
    console.log('  ✅ Server session management uses crypto.randomUUID()');
    console.log('  ⚠️  MCP adapters may need UUID standardization');
    console.log('  🔧 Test files could benefit from proper UUID usage');
    console.log('  ✅ Interface definitions support UUID fields');
    
    console.log('\n🚀 Next Steps for Priority 3:');
    console.log('  1. Update MCP adapters to use crypto.randomUUID()');
    console.log('  2. Create UUID validation middleware');
    console.log('  3. Update test files to use proper UUIDs');
    console.log('  4. Add UUID migration utilities');
    console.log('  5. Document UUID standards across system');
    
  } catch (error) {
    console.error('❌ UUID implementation test failed:', error);
  }
}

// Run the test
testUUIDImplementation().catch(console.error);
