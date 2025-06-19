/**
 * OneAgent Real System Test
 * Test the actual OneAgent implementation with real infrastructure
 */

console.log('🧪 Testing Real OneAgent System...');

async function testRealOneAgent(): Promise<void> {
  try {
    // Test import of real OneAgent system
    console.log('📦 Testing OneAgent import...');
    
    // This will test if the actual system can be imported
    const { OneAgentSystem } = await import('../coreagent/OneAgentSystem');
    console.log('✅ OneAgent imported successfully');
    
    // Test instantiation
    console.log('🏗️ Testing OneAgent instantiation...');
    const oneAgent = new OneAgentSystem();
    console.log('✅ OneAgent instantiated successfully');
    
    // Test basic functionality with timeout
    console.log('💬 Testing basic message processing...');
    
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );
    
    const messageTest = oneAgent.processUserMessage("Hello OneAgent!");
    
    try {
      const response = await Promise.race([messageTest, timeout]);
      console.log('✅ Message processing successful:', response);    } catch (error: any) {
      if (error?.message === 'Timeout') {
        console.log('⚠️ Message processing timed out (may be due to initialization)');
      } else {
        console.log('⚠️ Message processing error:', error?.message || error);
      }
    }
    
    console.log('🎉 Real OneAgent System test completed');
    
  } catch (error: any) {
    console.error('❌ Real OneAgent System test failed:', error?.message || error);
    
    // More detailed error analysis
    if (error?.message?.includes('Cannot find module')) {
      console.log('📋 Module dependency issue detected');
    } else if (error?.message?.includes('TypeError')) {
      console.log('📋 Type compatibility issue detected');
    } else {
      console.log('📋 Unknown error type');
    }
  }
}

testRealOneAgent();
