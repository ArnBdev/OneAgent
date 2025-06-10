// Debug test for WebFetchTool
process.stdout.write('Starting debug test...\n');

async function debugTest() {
    try {
        process.stdout.write('Step 1: Importing WebFetchTool...\n');
        const { WebFetchTool } = require('./dist/coreagent/tools/webFetch');
        process.stdout.write('Step 2: WebFetchTool imported successfully\n');
        
        process.stdout.write('Step 3: Creating instance...\n');
        const tool = new WebFetchTool({
            mockMode: true,
            defaultUserAgent: 'OneAgent-Debug-Test/1.0'
        });
        process.stdout.write('Step 4: Instance created successfully\n');
        
        process.stdout.write('Step 5: Getting config...\n');
        const config = tool.getConfig();
        process.stdout.write(`Step 6: Config retrieved: ${JSON.stringify(config, null, 2)}\n`);
        
        process.stdout.write('Step 7: Testing quickFetch...\n');
        const result = await tool.quickFetch('https://example.com');
        process.stdout.write('Step 8: quickFetch completed\n');
        
        process.stdout.write(`Step 9: Result success: ${result.success}\n`);
        process.stdout.write(`Step 10: Result status: ${result.statusCode}\n`);
        process.stdout.write(`Step 11: Content size: ${result.content.size}\n`);
        
        process.stdout.write('✅ All tests passed!\n');
        
    } catch (error) {
        process.stdout.write(`❌ Error at step: ${error.message}\n`);
        process.stdout.write(`Stack trace: ${error.stack}\n`);
        process.exit(1);
    }
}

debugTest().then(() => {
    process.stdout.write('Test completed successfully\n');
    process.exit(0);
}).catch(error => {
    process.stdout.write(`Unhandled error: ${error.message}\n`);
    process.exit(1);
});
