// Use global fetch (Node 18+) or fallback
const fetch = globalThis.fetch || require('node-fetch');

async function testChatAPI() {
  try {
    console.log('🧪 Testing OneAgent Chat API...');
    
    const response = await fetch('http://localhost:8080/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: "Hello, can you help me test the OneAgent chat system?",
        userId: "test-user",
        sessionId: "test-session"
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Chat API Response:', JSON.stringify(result, null, 2));
    
    // Test chat history
    console.log('\n📚 Testing chat history...');
    const historyResponse = await fetch('http://localhost:8080/api/chat/history/test-user');
    const history = await historyResponse.json();
    console.log('✅ Chat History:', JSON.stringify(history, null, 2));
    
  } catch (error) {
    console.error('❌ Chat API Test Error:', error.message);
  }
}

testChatAPI();
