// Test script to verify OneAgent's mem0Client works with the local Gemini Memory Server
const { execSync } = require('child_process');
const http = require('http');

console.log('🧪 Testing OneAgent mem0 Integration');
console.log('=====================================');

// First, test if the server is responding
function testServerHealth() {
    return new Promise((resolve, reject) => {
        const req = http.get('http://localhost:8000/health', (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✅ Server health check passed');
                    resolve(JSON.parse(data));
                } else {
                    reject(`Server returned status ${res.statusCode}`);
                }
            });
        });
        req.on('error', reject);
        req.setTimeout(5000, () => reject('Health check timeout'));
    });
}

// Test adding a memory via HTTP
function testAddMemory() {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            messages: [
                { role: 'user', content: 'I love hiking in the mountains' },
                { role: 'assistant', content: 'That sounds wonderful! Mountain hiking is great exercise.' }
            ],
            user_id: 'test-user'
        });

        const options = {
            hostname: 'localhost',
            port: 8000,
            path: '/memories',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData.length
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✅ Memory added successfully');
                    resolve(JSON.parse(data));
                } else {
                    reject(`Add memory failed with status ${res.statusCode}: ${data}`);
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// Test searching memories
function testSearchMemories() {
    return new Promise((resolve, reject) => {
        const req = http.get('http://localhost:8000/memories?query=hiking', (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const result = JSON.parse(data);
                    console.log(`✅ Search found ${result.length} memories`);
                    resolve(result);
                } else {
                    reject(`Search failed with status ${res.statusCode}`);
                }
            });
        });
        req.on('error', reject);
    });
}

// Run all tests
async function runTests() {
    try {
        await testServerHealth();
        await testAddMemory();
        await testSearchMemories();
        console.log('\n🎉 All integration tests passed!');
        console.log('✅ OneAgent mem0Client should work with the local server');
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

runTests();
