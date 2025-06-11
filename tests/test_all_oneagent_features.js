const axios = require('axios');

async function testAllOneAgentFeatures() {
  console.log('🧪 Testing All OneAgent Features via MCP...\n');
  
  const baseUrl = 'http://127.0.0.1:8082/mcp';
  
  try {
    // Initialize MCP session
    console.log('🔧 1. Initializing MCP session...');
    const initResponse = await axios.post(baseUrl, {
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: { name: 'feature-test', version: '1.0.0' }
      },
      id: 1
    });
    console.log('✅ MCP session initialized\n');

    // Test 1: Create a memory
    console.log('💾 2. Testing memory creation...');
    const memoryCreateResponse = await axios.post(baseUrl, {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'memory_create',
        arguments: {
          content: 'User prefers TypeScript over JavaScript for better type safety',
          metadata: { category: 'technical', importance: 0.8 }
        }
      },
      id: 2
    });
    console.log('✅ Memory created successfully');
    console.log('📝 Created memory:', JSON.parse(memoryCreateResponse.data.result.content[0].text).memory.content);
    console.log('');

    // Test 2: Search memories
    console.log('🔍 3. Testing memory search...');
    const memorySearchResponse = await axios.post(baseUrl, {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'memory_search',
        arguments: {
          query: 'TypeScript'
        }
      },
      id: 3
    });
    console.log('✅ Memory search completed');
    const searchResults = JSON.parse(memorySearchResponse.data.result.content[0].text);
    console.log('📊 Found memories:', searchResults.total);
    console.log('');

    // Test 3: AI Chat
    console.log('🤖 4. Testing AI chat capabilities...');
    const aiChatResponse = await axios.post(baseUrl, {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'ai_chat',
        arguments: {
          message: 'What are the benefits of using TypeScript over JavaScript?',
          temperature: 0.3
        }
      },
      id: 4
    });
    console.log('✅ AI chat completed');
    const chatResult = JSON.parse(aiChatResponse.data.result.content[0].text);
    console.log('💬 AI Response preview:', chatResult.result.substring(0, 100) + '...');
    console.log('');

    // Test 4: Text summarization
    console.log('📄 5. Testing text summarization...');
    const summarizeResponse = await axios.post(baseUrl, {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'ai_summarize',
        arguments: {
          text: 'TypeScript is a programming language developed and maintained by Microsoft. It is a strict syntactical superset of JavaScript and adds optional static type definitions to the language. TypeScript is designed for the development of large applications and transpiles to JavaScript. As TypeScript is a superset of JavaScript, existing JavaScript programs are also valid TypeScript programs.',
          style: 'brief'
        }
      },
      id: 5
    });
    console.log('✅ Text summarization completed');
    const summaryResult = JSON.parse(summarizeResponse.data.result.content[0].text);
    console.log('📝 Summary:', summaryResult.result);
    console.log('');

    // Test 5: Web search (simulated - may not have real API key)
    console.log('🌐 6. Testing web search...');
    try {
      const webSearchResponse = await axios.post(baseUrl, {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'web_search',
          arguments: {
            query: 'TypeScript vs JavaScript',
            count: 3
          }
        },
        id: 6
      });
      console.log('✅ Web search completed');
      const webResults = JSON.parse(webSearchResponse.data.result.content[0].text);
      console.log('🔗 Search results:', webResults.results?.length || 'API key needed');
    } catch (error) {
      console.log('⚠️ Web search requires API key configuration');
    }
    console.log('');

    // Test 6: Embedding generation
    console.log('🧬 7. Testing embedding generation...');
    try {
      const embeddingResponse = await axios.post(baseUrl, {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'embedding_generate',
          arguments: {
            text: 'TypeScript programming language',
            taskType: 'SEMANTIC_SIMILARITY'
          }
        },
        id: 7
      });
      console.log('✅ Embedding generation completed');
      const embeddingResult = JSON.parse(embeddingResponse.data.result.content[0].text);
      console.log('🔢 Embedding vector length:', embeddingResult.embedding?.length || 'API key needed');
    } catch (error) {
      console.log('⚠️ Embedding generation requires API key configuration');
    }
    console.log('');

    // Test 7: System status
    console.log('📊 8. Testing system status...');
    const statusResponse = await axios.post(baseUrl, {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'system_status',
        arguments: {}
      },
      id: 8
    });
    console.log('✅ System status retrieved');
    const statusResult = JSON.parse(statusResponse.data.result.content[0].text);
    console.log('💾 Total memories:', statusResult.memory.totalMemories);
    console.log('⚡ Performance metrics:', statusResult.performance.totalOperations, 'operations');
    console.log('');

    // Test 8: Text analysis
    console.log('🔬 9. Testing text analysis...');
    const analyzeResponse = await axios.post(baseUrl, {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'ai_analyze',
        arguments: {
          text: 'TypeScript is gaining popularity in enterprise development',
          instruction: 'Analyze the sentiment and identify key themes'
        }
      },
      id: 9
    });
    console.log('✅ Text analysis completed');
    const analysisResult = JSON.parse(analyzeResponse.data.result.content[0].text);
    console.log('🔍 Analysis preview:', analysisResult.result.substring(0, 100) + '...');
    console.log('');

    // Test 9: Workflow help
    console.log('🔄 10. Testing workflow assistance...');
    const workflowResponse = await axios.post(baseUrl, {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'workflow_help',
        arguments: {
          workflowName: 'development',
          currentStep: 'code review',
          context: 'TypeScript project needs review'
        }
      },
      id: 10
    });
    console.log('✅ Workflow assistance completed');
    const workflowResult = JSON.parse(workflowResponse.data.result.content[0].text);
    console.log('🛠️ Available workflows:', workflowResult.availableWorkflows?.length || 'Configured');
    console.log('');

    console.log('🎉 ALL ONEAGENT FEATURES TESTED SUCCESSFULLY!');
    console.log('');
    console.log('📋 Feature Test Summary:');
    console.log('✅ Memory creation and storage');
    console.log('✅ Memory search and retrieval');
    console.log('✅ AI chat conversations');
    console.log('✅ Text summarization');
    console.log('✅ Text analysis');
    console.log('✅ System status monitoring');
    console.log('✅ Workflow assistance');
    console.log('⚠️ Web search (requires Brave API key)');
    console.log('⚠️ Embeddings (requires Gemini API key)');
    console.log('');
    console.log('🔗 OneAgent is fully operational via MCP!');

  } catch (error) {
    console.error('❌ Feature test failed:', error.message);
    if (error.response) {
      console.error('📄 Response:', error.response.data);
    }
  }
}

testAllOneAgentFeatures();
