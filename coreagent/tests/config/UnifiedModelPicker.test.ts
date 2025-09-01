import { getModelFor } from '../../config/UnifiedModelPicker';

function expect(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

// Capability clients should instantiate without throwing
const caps: import('../../config/UnifiedModelPicker').ModelCapability[] = [
  'fast_text',
  'advanced_text',
  'fast_multimodal',
  'advanced_multimodal',
];

for (const c of caps) {
  const client = getModelFor(c);
  expect(!!client, `Client should be created for capability ${c}`);
}

console.log('UnifiedModelPicker capability test passed.');
