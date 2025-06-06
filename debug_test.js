// Debug test to see exact response structure
const axios = require('axios');

async function debugTest() {
  try {
    const response = await axios.get('http://127.0.0.1:8000/v1/memories/?userId=test-user-integration');
    console.log('Response structure:');
    console.log('typeof response:', typeof response);
    console.log('typeof response.data:', typeof response.data);
    console.log('Array.isArray(response.data):', Array.isArray(response.data));
    console.log('response.data.length:', response.data.length);
    console.log('First few characters:', JSON.stringify(response.data).substring(0, 100));
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Response:', error.response?.data);
  }
}

debugTest();
