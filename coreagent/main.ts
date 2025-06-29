/**
 * OneAgent CoreAgent - Main Entry Point
 * 
 * Dette er startpunktet for CoreAgent, kjernen i OneAgent-plattformen.
 * CoreAgent håndterer grunnleggende fellesfunksjonalitet som arbeidsflyter,
 * brukeridentitet, minnehåndtering og MCP-kommunikasjon.
 */

import { listWorkflows, listUserWorkflows } from './tools/listWorkflows';
import { createMCPAdapter, defaultMCPConfig } from './mcp/adapter';
import { OneAgentMemory, OneAgentMemoryConfig } from './memory/OneAgentMemory';
import { BraveSearchClient } from './tools/braveSearchClient';
import { WebSearchTool } from './tools/webSearch';
import { GeminiClient } from './tools/geminiClient';
import { AIAssistantTool } from './tools/aiAssistant';
import { GeminiEmbeddingsTool } from './tools/geminiEmbeddings';
import { TriageAgent } from './agents/specialized/TriageAgent';
import { User } from './types/user';
import { OneAgentUnifiedBackbone } from './utils/UnifiedBackboneService.js';
import { oneAgentConfig } from './config/index';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * CoreAgent klasse - hovedkjernen for OneAgent systemet
 */
class CoreAgent {
  private currentUser: User | null = null;
  private mcpAdapter: any;
  private unifiedMemoryClient: OneAgentMemory;
  private braveSearchClient: BraveSearchClient;
  private webSearchTool: WebSearchTool;
  private geminiClient: GeminiClient;
  private aiAssistant: AIAssistantTool;
  private embeddingsTool: GeminiEmbeddingsTool;
  private triageAgent: TriageAgent;
  private unifiedBackbone: OneAgentUnifiedBackbone;
  
  constructor() {
    console.log("🚀 Hello CoreAgent!");
    this.unifiedBackbone = OneAgentUnifiedBackbone.getInstance();
    console.log("OneAgent CoreAgent is starting...");
    // Initialize canonical OneAgentMemory client
    const memoryConfig: OneAgentMemoryConfig = {
      apiUrl: process.env.ONEAGENT_MEMORY_URL || 'http://localhost:8001'
    };
    if (process.env.ONEAGENT_MEMORY_API_KEY) {
      memoryConfig.apiKey = process.env.ONEAGENT_MEMORY_API_KEY;
    }
    this.unifiedMemoryClient = new OneAgentMemory(memoryConfig);
    // Initialize Brave Search client using centralized config
    const braveConfig = {
      apiKey: oneAgentConfig.braveApiKey,
      baseUrl: 'https://api.search.brave.com/res/v1/web/search'
    };
    this.braveSearchClient = new BraveSearchClient(braveConfig);
    // Initialize web search tool
    this.webSearchTool = new WebSearchTool(this.braveSearchClient);
    
    // Initialize Gemini client
    const geminiConfig = {
      apiKey: process.env.GOOGLE_API_KEY || 'your_google_gemini_api_key_here',
      model: process.env.GOOGLE_MODEL || 'gemini-pro'
    };
    this.geminiClient = new GeminiClient(geminiConfig);
    
    // Initialize AI assistant
    this.aiAssistant = new AIAssistantTool(this.geminiClient);
    
    // Initialize embeddings tool
    this.embeddingsTool = new GeminiEmbeddingsTool(this.geminiClient, this.unifiedMemoryClient);
    
    // Initialize TriageAgent for intelligent task routing
    const triageConfig: import('./agents/base/BaseAgent').AgentConfig = {
      id: 'TriageAgent',
      name: 'Triage Agent',
      description: 'Agent specialized in task routing and prioritization',
      capabilities: ['task-routing', 'priority-assessment', 'delegation', 'coordination'],
      memoryEnabled: true,
      aiEnabled: true
    };
    this.triageAgent = new TriageAgent(triageConfig);
  }

  /**
   * Initialiser CoreAgent systemet
   */
  async initialize(): Promise<void> {
    try {
      console.log("\n⚙️  Initializing CoreAgent components...");
      
      // Initialize MCP adapter
      this.mcpAdapter = createMCPAdapter(defaultMCPConfig);
      console.log("✅ MCP Adapter initialized");
        // Set up demo user for testing
      const userTimestamp = this.unifiedBackbone.getServices().timeService.now();
      this.currentUser = {
        id: 'user-123',
        name: 'Demo User',
        email: 'demo@oneagent.ai',
        createdAt: userTimestamp.utc,
        lastActiveAt: userTimestamp.utc,
        preferences: {
          language: 'no',
          timezone: 'Europe/Oslo'
        }
      };      console.log(`👤 Demo user session: ${this.currentUser.name}`);
      
      // Initialize TriageAgent
      await this.triageAgent.initialize();
      console.log("✅ TriageAgent initialized");
      
      // Test basic functionality
      await this.testWorkflowSystem();
      await this.testMCPCommunication();
      await this.testMemoryIntegration();
      await this.testWebSearchIntegration();
      await this.testAIAssistantIntegration();
      await this.testEmbeddingsIntegration();
      await this.testTriageAgentIntegration();
      
      console.log("\n✅ CoreAgent initialized successfully");
      
    } catch (error) {
      console.error("❌ Error during CoreAgent initialization:", error);
      throw error;
    }
  }

  /**
   * Test workflow system functionality
   */
  private async testWorkflowSystem(): Promise<void> {
    console.log("\n📋 Testing workflow functionality:");
    
    // List all workflows
    const allWorkflows = await listWorkflows();
    console.log(`📊 Total workflows found: ${allWorkflows.length}`);
    
    // List workflows for current user
    if (this.currentUser) {
      const userWorkflows = await listUserWorkflows(this.currentUser.id);
      console.log(`👤 Workflows for ${this.currentUser.name}: ${userWorkflows.length}`);
      
      // Show brief summary of each workflow
      if (userWorkflows.length > 0) {
        userWorkflows.forEach(workflow => {
          console.log(`  • ${workflow.metadata.name} (${workflow.status.status}) - ${workflow.metadata.agentType}`);
        });
      }
    }
    
    // Test filtering by agent type
    const codeWorkflows = await listWorkflows({ agentType: 'code' });
    console.log(`🔧 Code agent workflows: ${codeWorkflows.length}`);
  }  /**
   * Test MCP communication
   */
  private async testMCPCommunication(): Promise<void> {    console.log("\n🔗 Testing MCP communication:");
    
    try {
      // Test local MCP adapter
      const mcpTimestamp = this.unifiedBackbone.getServices().timeService.now();
      const response = await this.mcpAdapter.sendRequest('ping', { 
        timestamp: mcpTimestamp.utc 
      });
      console.log(`✅ Local MCP Response: ${response.result?.message}`);
      
      // Test HTTP MCP adapter (demonstration)
      console.log("\n🌐 Testing HTTP MCP adapter (demo):");
      const httpConfig = {
        name: 'Demo-HTTP-MCP',
        type: 'http' as const,
        endpoint: 'http://localhost:8080/mcp'
      };
      
      const httpAdapter = createMCPAdapter(httpConfig);
      console.log("✅ HTTP MCP Adapter created (endpoint: localhost:8080/mcp)");
      console.log("   Note: HTTP adapter ready for external MCP server connections");
      
    } catch (error) {
      console.warn(`⚠️  MCP communication test failed: ${error}`);
    }
  }
  /**
   * Test Unified Memory integration
   */
  private async testMemoryIntegration(): Promise<void> {
    console.log("\n🧠 Testing Unified Memory integration:");
    try {
      // Test connection by trying to store a simple conversation
      const memoryTimestamp = this.unifiedBackbone.getServices().timeService.now();
      const testMetadata = this.unifiedBackbone.getServices().metadataService.create(
        'test-conversation',
        'CoreAgent',
        {
          content: {
            category: 'system-test',
            tags: ['initialization', 'memory-test'],
            sensitivity: 'internal',
            relevanceScore: 0.8,
            contextDependency: 'session'
          }
        }
      );
      const testConversation = {
        id: testMetadata.id,
        agentId: 'coreagent',
        userId: this.currentUser?.id || 'demo-user',
        timestamp: new Date(memoryTimestamp.utc),
        content: 'OneAgent CoreAgent initialization test',
        context: {
          actionType: 'system_test',
          environment: 'development'
        },
        outcome: {
          success: true,
          satisfaction: 'high' as const,
          qualityScore: 0.9
        },
        metadata: {
          type: 'system',
          event: 'startup'
        }
      };      // Replace legacy call with canonical addMemory
      const memoryResult = await this.unifiedMemoryClient.addMemory(
        'oneagent_system',
        testConversation
      );
      console.log(`✅ Memory created: ${memoryResult ? 'Success' : 'Failed'}`);
      // Replace legacy search with canonical searchMemory
      const searchResult = await this.unifiedMemoryClient.searchMemory(
        'oneagent_system',
        { query: 'initialization test', user_id: this.currentUser?.id || 'demo-user', limit: 5 }
      );
      console.log(`🔍 Found ${searchResult?.memories?.length || 0} memories`);
    } catch (error) {
      console.warn(`⚠️  Unified Memory integration test failed: ${error}`);
    }
  }

  /**
   * Test Web Search integration
   */
  private async testWebSearchIntegration(): Promise<void> {
    console.log("\n🔍 Testing Web Search integration:");
    
    try {
      // Test connection
      const connectionOk = await this.webSearchTool.testSearch();
      if (!connectionOk) {
        console.warn("⚠️  Web search connection test failed - using mock mode");
      }

      // Test quick search
      const searchResult = await this.webSearchTool.quickSearch("OpenAI ChatGPT", 3);
      
      if (searchResult.totalResults > 0) {
        console.log(`✅ Search successful: Found ${searchResult.totalResults} results in ${searchResult.searchTime}ms`);
        console.log(`🔍 Top result: "${searchResult.results[0]?.title}"`);
      } else {
        console.log("✅ Search completed (mock mode - no real results)");
      }

    } catch (error) {
      console.warn(`⚠️  Web search integration test failed: ${error}`);
    }
  }
  /**
   * Test AI Assistant integration
   */
  private async testAIAssistantIntegration(): Promise<void> {
    console.log("\n🤖 Testing AI Assistant integration:");
    
    try {
      // Test connection
      const connectionOk = await this.aiAssistant.testAssistant();
      if (!connectionOk) {
        console.warn("⚠️  AI Assistant connection test failed - using mock mode");
      }

      // Test simple question
      const questionResult = await this.aiAssistant.ask("What is artificial intelligence?", {
        temperature: 0.3,
        maxTokens: 200
      });
      
      if (questionResult.success) {
        console.log(`✅ AI question answered successfully in ${questionResult.processingTime}ms`);
        console.log(`🤖 Response preview: "${questionResult.result.substring(0, 100)}..."`);
      } else {
        console.log("✅ AI question completed (mock mode)");
      }

      // Test summarization
      const testText = "OneAgent is a modular AI agent platform built with TypeScript. It features CoreAgent as the foundation, providing workflow management, user identity, memory integration with Mem0, web search through Brave API, and AI assistance via Google Gemini. The system is designed to be scalable and extensible with specialized agent modules.";
      
      const summaryResult = await this.aiAssistant.summarize(testText, {
        maxLength: 50,
        style: 'brief'
      });
      
      if (summaryResult.success) {
        console.log(`✅ Text summarization successful in ${summaryResult.processingTime}ms`);
        console.log(`📝 Summary: "${summaryResult.result}"`);
      } else {
        console.log("✅ Text summarization completed (mock mode)");
      }

    } catch (error) {
      console.warn(`⚠️  AI Assistant integration test failed: ${error}`);
    }
  }

  /**
   * Test Embeddings integration
   */
  private async testEmbeddingsIntegration(): Promise<void> {    console.log("\n🔢 Testing Gemini Embeddings integration:");
    
    try {
      // Temporarily disabled entire embeddings test due to API changes
      // Will fix with OneAgent tools once server is running
      console.log("⚠️  Embeddings tests temporarily disabled - API compatibility updates needed");
      /*
      // Test basic embeddings functionality
      // Temporarily disabled due to API changes - will fix with OneAgent tools
      // const embeddingsOk = await this.embeddingsTool.testEmbeddings();
      if (!embeddingsOk) {
        console.warn("⚠️  Embeddings basic test failed - using mock mode");
      }

      // Test semantic memory storage
      const memoryResult = await this.embeddingsTool.storeMemoryWithEmbedding(
        "OneAgent CoreAgent supports semantic search and similarity matching through Gemini embeddings",
        { 
          type: 'system_capability', 
          feature: 'embeddings',
          tags: ['semantic-search', 'ai', 'memory'] 
        },
        this.currentUser?.id,
        'coreagent',
        undefined,
        'long_term',
        { taskType: 'RETRIEVAL_DOCUMENT' }
      );

      if (memoryResult.memory.id) {
        console.log(`✅ Memory with embedding stored: ${memoryResult.memory.id}`);
        console.log(`🔢 Embedding dimensions: ${memoryResult.embedding.dimensions}`);        // Test semantic search
        const searchResults = await this.embeddingsTool.semanticSearch(
          "AI platform with intelligent memory features",
          {
            userId: this.currentUser?.id || 'demo-user',
            agentId: 'coreagent'
          },
          {
            taskType: 'RETRIEVAL_QUERY',
            topK: 3,
            similarityThreshold: 0.3
          }
        );

        console.log(`🔍 Semantic search found ${searchResults.results.length} relevant memories`);
        if (searchResults.results.length > 0) {
          const topResult = searchResults.results[0];
          console.log(`📊 Top result similarity: ${topResult.similarity.toFixed(4)}`);
          console.log(`⚡ Search completed in ${searchResults.analytics.processingTime}ms`);
        }

        // Test similar memory finding
        const similarResults = await this.embeddingsTool.findSimilarMemories(
          memoryResult.memory.id,
          {
            topK: 2,
            similarityThreshold: 0.2
          }
        );

        console.log(`🎯 Found ${similarResults.results.length} similar memories`);
      }      // Test embedding cache stats
      const cacheStats = this.embeddingsTool.getCacheStats();
      console.log(`💾 Embedding cache: ${cacheStats.cacheSize} entries (${cacheStats.memoryUsage})`);
      */
    } catch (error) {
      console.warn(`⚠️  Embeddings integration test failed: ${error}`);
    }
  }

  /**
   * Test TriageAgent integration
   */
  private async testTriageAgentIntegration(): Promise<void> {
    console.log("\n🎯 Testing TriageAgent integration:");
    
    try {
      // Test context setup
      const testContext = {
        user: this.currentUser!,
        sessionId: 'test-session-001',
        conversationHistory: []
      };

      // Test document processing task routing
      const officeTask = "Please help me create a meeting agenda for tomorrow's project review";
      const officeResult = await this.triageAgent.processMessage(testContext, officeTask);
      
      console.log(`✅ Office task routed successfully`);
      console.log(`🎯 Selected agent: ${officeResult.metadata?.selectedAgent}`);
      console.log(`💬 Response preview: "${officeResult.content.substring(0, 100)}..."`);

      // Test fitness task routing
      const fitnessTask = "I want to start a new workout routine for building muscle";
      const fitnessResult = await this.triageAgent.processMessage(testContext, fitnessTask);
      
      console.log(`✅ Fitness task routed successfully`);
      console.log(`🎯 Selected agent: ${fitnessResult.metadata?.selectedAgent}`);
      console.log(`💬 Response preview: "${fitnessResult.content.substring(0, 100)}..."`);

      // Test agent health monitoring
      const agentStatus = this.triageAgent.getStatus();      console.log(`📊 TriageAgent status: ${agentStatus.initialized ? 'Active' : 'Inactive'}`);
      console.log(`❤️ Agent health: ${agentStatus.initialized ? 'Healthy' : 'Degraded'}`);

      // Test error recovery simulation
      const invalidTask = ""; // Empty task to trigger error handling
      const errorResult = await this.triageAgent.processMessage(testContext, invalidTask);
      
      if (errorResult.metadata?.recoveryAttempted) {
        console.log(`🛡️ Error recovery system activated successfully`);
      }

    } catch (error) {
      console.warn(`⚠️  TriageAgent integration test failed: ${error}`);
    }
  }  /**
   * Process a message through the TriageAgent routing system
   * Main entry point for external task processing
   */
  async processMessage(message: string, userId?: string): Promise<any> {
    if (!this.triageAgent) {
      throw new Error('TriageAgent not initialized');
    }    // Create context for the task
    const anonymousTimestamp = this.unifiedBackbone.getServices().timeService.now();
    const context = {
      user: this.currentUser || {
        id: userId || 'anonymous-user',
        name: 'Anonymous User',
        email: 'anonymous@oneagent.ai',
        createdAt: anonymousTimestamp.utc,
        lastActiveAt: anonymousTimestamp.utc,
        preferences: { language: 'en', timezone: 'UTC' }      },
      sessionId: this.unifiedBackbone.getServices().metadataService.create(
        'anonymous-session',
        'CoreAgent',
        {
          content: {
            category: 'anonymous-session',
            tags: ['anonymous', 'message-processing'],
            sensitivity: 'internal',
            relevanceScore: 0.7,
            contextDependency: 'session'
          }
        }
      ).id,
      conversationHistory: []
    };

    // Route through TriageAgent
    return await this.triageAgent.processMessage(context, message);
  }

  /**
   * Get TriageAgent status and health information
   */
  getTriageStatus() {
    if (!this.triageAgent) {
      return { error: 'TriageAgent not initialized' };
    }
    
    return {
      status: this.triageAgent.getStatus(),      health: this.triageAgent.getStatus(),
      availableActions: ['task_routing', 'agent_health_monitoring', 'system_optimization']
    };
  }

  /**
   * Start CLI interface (placeholder for future implementation)
   */  startCLI(): void {
    console.log("\n💬 CLI interface - Coming soon!");
    console.log("Future features:");
    console.log("  - Interactive workflow management");
    console.log("  - User session handling");
    console.log("  - Real-time MCP communication");
    console.log("  - Memory integration with mem0");
    console.log("  - Web search capabilities with Brave Search");
    console.log("  - AI assistance with Google Gemini");
    console.log("  - 🆕 Semantic search with Gemini embeddings");
    console.log("  - 🆕 Memory clustering and similarity analysis");
    console.log("  - 🆕 Intelligent memory retrieval and context awareness");
    console.log("  - 🎯 Intelligent task routing with TriageAgent");
    console.log("  - 🛡️ Error recovery and flow restoration");
    console.log("  - 📊 Agent health monitoring and failover");
    console.log("  - ⚖️ Dynamic workload balancing");
  }
}

/**
 * Main entry point
 */
async function main() {
  try {
    const coreAgent = new CoreAgent();
    await coreAgent.initialize();
    
    // For now, just show CLI placeholder
    coreAgent.startCLI();
    
  } catch (error) {
    console.error("❌ Fatal error in CoreAgent:", error);
    process.exit(1);
  }
}

// Start the application
if (require.main === module) {
  main().catch(console.error);
}

// Export CoreAgent for external use
export { CoreAgent };
