#!/usr/bin/env node

/**
 * OneAgent Build Verification Script
 * 
 * Quick verification that the unified system builds correctly
 */

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function verifyBuild() {
  console.log('🔧 Verifying OneAgent build...\n');
  
  try {
    // Check TypeScript compilation
    console.log('📋 Checking TypeScript compilation...');
    const { stdout: tscOutput, stderr: tscError } = await execAsync('npx tsc --noEmit');
    
    if (tscError) {
      console.log('❌ TypeScript compilation failed:', tscError);
      return false;
    }
    
    console.log('✅ TypeScript compilation successful');
    
    // Check specific agent files
    const agentFiles = [
      'coreagent/agents/specialized/TriageAgent.ts',
      'coreagent/agents/specialized/ValidationAgent.ts', 
      'coreagent/agents/templates/TemplateAgent.ts'
    ];
    
    for (const file of agentFiles) {
      console.log(`📋 Checking ${file}...`);
      const { stderr: fileError } = await execAsync(`npx tsc --noEmit ${file}`);
      
      if (fileError) {
        console.log(`❌ Error in ${file}:`, fileError);
        return false;
      }
      
      console.log(`✅ ${file} verified`);
    }
    
    console.log('\n🎉 All verifications passed! OneAgent is ready for deployment.');
    return true;
    
  } catch (error) {
    console.error('❌ Build verification failed:', error.message);
    return false;
  }
}

verifyBuild().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
