/**
 * Quick fix script for property name mismatches in OneAgent
 */

import * as fs from 'fs';
import * as path from 'path';

const filesToFix = [
  'coreagent/agents/base/BaseAgent.ts',
  'coreagent/agents/base/BaseAgent_new.ts',
  'coreagent/api/chatAPI.ts',
  'coreagent/integration/memoryBridge.ts',
  'coreagent/intelligence/memoryIntelligence.ts',
  'coreagent/main.ts',
  'coreagent/orchestrator/memoryContextBridge.ts',
  'coreagent/server/oneagent-mcp-copilot.ts',
  'coreagent/tools/geminiEmbeddings.ts'
];

const propertyMappings = [
  // Mem0SearchFilter properties
  { from: /userId:/g, to: 'user_id:' },
  { from: /agentId:/g, to: 'agent_id:' },
  { from: /workflowId:/g, to: 'workflow_id:' },
  { from: /memoryType:/g, to: 'memory_type:' },
  
  // Mem0Memory properties (when accessing)
  { from: /\.userId/g, to: '.user_id' },
  { from: /\.agentId/g, to: '.agent_id' },
  { from: /\.workflowId/g, to: '.workflow_id' },
  { from: /\.memoryType/g, to: '.memory_type' },
  { from: /\.createdAt/g, to: '.created_at' },
  { from: /\.updatedAt/g, to: '.updated_at' },
  
  // Specific cases
  { from: /userId,/g, to: 'user_id,' },
  { from: /userId$/g, to: 'user_id' }
];

function fixFile(filePath: string): void {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;

  propertyMappings.forEach(mapping => {
    if (mapping.from.test(content)) {
      content = content.replace(mapping.from, mapping.to);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Fixed: ${filePath}`);
  } else {
    console.log(`ℹ️  No changes needed: ${filePath}`);
  }
}

function main() {
  console.log('🔧 Starting property name fixes...');
  
  filesToFix.forEach(fixFile);
  
  console.log('✨ Property fix complete!');
  console.log('Now run: npm run build');
}

main();
