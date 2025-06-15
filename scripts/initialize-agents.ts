/**
 * OneAgent Agent Initialization Script
 * 
 * This script manually initializes the multi-agent network for OneAgent
 * by calling the appropriate initialization methods on the MultiAgentOrchestrator
 * and ensuring proper memory system synchronization.
 * 
 * Usage:
 *   npx ts-node scripts/initialize-agents.ts
 */

import { MultiAgentOrchestrator } from '../coreagent/agents/communication/MultiAgentOrchestrator';
import { AgentConfig } from '../coreagent/agents/base/BaseAgent';
import { randomUUID } from 'crypto';
// Import the memory system fix
import { createRealMemoryClient, MemoryRegistrationSynchronizer } from '../coreagent/integration/memorySystemFix';
// Import config to get proper URLs from environment
import { oneAgentConfig } from '../coreagent/config';

async function initializeAgentNetwork() {
  console.log('🚀 OneAgent Network Initialization');
  console.log('===================================');
  
  try {
    // Create and initialize the orchestrator
    const orchestrator = new MultiAgentOrchestrator();
    
    // Call the initialize method that was missing in the server startup
    await orchestrator.initialize();
    
    // Manually register additional agents if needed
    const agents = [
      {
        agentId: `enhanced-dev-${randomUUID().slice(0, 8)}`,
        agentType: 'enhanced-development',
        capabilities: [
          { 
            name: 'typescript_development', 
            description: 'Expert TypeScript development with best practices', 
            version: '2.0', 
            parameters: {} 
          },
          { 
            name: 'react_development', 
            description: 'React application development and optimization', 
            version: '1.0', 
            parameters: {} 
          },
          { 
            name: 'vscode_extension', 
            description: 'VS Code extension development', 
            version: '1.0', 
            parameters: {} 
          }        ],
        endpoint: `${oneAgentConfig.mcpUrl}/agents/enhanced-dev`,
        qualityScore: 95
      },
      {
        agentId: `research-${randomUUID().slice(0, 8)}`,
        agentType: 'research-flow',
        capabilities: [
          { 
            name: 'code_research', 
            description: 'Research code patterns and best practices', 
            version: '1.0', 
            parameters: {} 
          },
          { 
            name: 'documentation_analysis', 
            description: 'Analyze technical documentation', 
            version: '1.0', 
            parameters: {} 
          }
        ],
        endpoint: `${oneAgentConfig.mcpUrl}/agents/research`,
        qualityScore: 92
      },
      {
        agentId: `fitness-${randomUUID().slice(0, 8)}`,
        agentType: 'fitness-flow',
        capabilities: [
          { 
            name: 'health_optimization', 
            description: 'Developer health and productivity optimization', 
            version: '1.0', 
            parameters: {} 
          }
        ],
        endpoint: `${oneAgentConfig.mcpUrl}/agents/fitness`,
        qualityScore: 90
      }
    ];
    
    // Register each agent
    for (const agent of agents) {
      console.log(`🔄 Registering agent ${agent.agentId} (${agent.agentType})...`);
      
      // Use the register_agent tool in the orchestrator
      const result = await orchestrator.processMultiAgentMCPTool('register_agent', agent, {
        user: { 
          id: 'system', 
          name: 'System',
          createdAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString()
        },
        sessionId: `system_${Date.now()}`,
        conversationHistory: []
      });
      
      console.log(result.success ? 
        `✅ Agent ${agent.agentId} registered successfully` : 
        `❌ Failed to register agent ${agent.agentId}: ${result.error}`);
    }
    
    // Verify the agent network health
    const healthResult = await orchestrator.processMultiAgentMCPTool('get_agent_network_health', {
      includeDetailed: true,
      timeframe: '1m'
    }, {
      user: { 
        id: 'system', 
        name: 'System',
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString()
      },
      sessionId: `system_${Date.now()}`,
      conversationHistory: []
    });
    
    console.log('\n📊 Agent Network Health:');
    console.log(`Total Agents: ${healthResult.networkHealth.totalAgents}`);
    console.log(`Online Agents: ${healthResult.networkHealth.onlineAgents}`);
    console.log(`Average Quality: ${healthResult.networkHealth.averageQuality}`);
    
    console.log('\n✅ OneAgent network initialization complete!');
    
  } catch (error) {
    console.error('❌ Error initializing agent network:', error);
  }
}

// Run the initialization
initializeAgentNetwork().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
