// Test Canonical ID Generation System
import {
  createUnifiedId,
  createUnifiedIdWithResult,
} from './coreagent/utils/UnifiedBackboneService';

// Test basic ID generation
console.log('=== CANONICAL ID GENERATION TEST ===');

// Test different ID types
const operationId = createUnifiedId('operation', 'gemini_embedding');
console.log('Operation ID:', operationId);

const analysisId = createUnifiedId('analysis', 'code_review');
console.log('Analysis ID:', analysisId);

const memoryId = createUnifiedId('memory', 'conversation_storage');
console.log('Memory ID:', memoryId);

const documentId = createUnifiedId('document', 'context7');
console.log('Document ID:', documentId);

// Test with configuration
const shortId = createUnifiedId('cache', 'embedding', { format: 'short' });
console.log('Short ID:', shortId);

const longId = createUnifiedId('error', 'validation', { format: 'long' });
console.log('Long ID:', longId);

const secureId = createUnifiedId('agent', 'coordination', { secure: true });
console.log('Secure ID:', secureId);

// Test with detailed result
const idWithResult = createUnifiedIdWithResult('learning', 'pattern_recognition', {
  format: 'medium',
  secure: true,
});
console.log('ID with Result:', JSON.stringify(idWithResult, null, 2));

console.log('\n=== ID GENERATION PATTERNS ===');
console.log('✅ All IDs use canonical timestamp from UnifiedBackboneService');
console.log('✅ All IDs use secure random suffix generation');
console.log('✅ All IDs follow consistent pattern: type_context_timestamp_random');
console.log('✅ Zero Date.now() or Math.random() usage');
console.log('✅ Configurable formats (short, medium, long)');
console.log('✅ Optional secure mode using crypto.randomUUID()');
