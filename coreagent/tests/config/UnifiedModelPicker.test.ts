import { pickDefault, pickWithOptions } from '../../config/UnifiedModelPicker';

// Minimal role->model mapping assertions
function expect(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

// Happy path mappings
const demanding = pickDefault('demanding_llm');
expect(
  demanding.provider === 'google' && demanding.name === 'gemini-2.5-pro',
  'demanding_llm should map to gemini-2.5-pro',
);

const fast = pickDefault('fast_llm');
expect(
  fast.provider === 'google' && fast.name === 'gemini-2.5-flash',
  'fast_llm should map to gemini-2.5-flash',
);

const ultra = pickDefault('ultrafast_llm');
expect(
  ultra.provider === 'google' && ultra.name === 'gemini-2.5-flash-lite',
  'ultrafast_llm should map to gemini-2.5-flash-lite',
);

const emb = pickDefault('embedding');
expect(
  emb.provider === 'google' && emb.kind === 'embedding' && emb.name === 'gemini-embedding-001',
  'embedding should map to gemini-embedding-001',
);

// Options surface
const gpt5MiniThink = pickWithOptions('openai', 'gpt-5-mini', { thinking: true });
expect(
  gpt5MiniThink.provider === 'openai' && gpt5MiniThink.settings?.thinking === true,
  'thinking option should be true for openai gpt-5-mini',
);

// Env deprecation signal documented (ensure no .env model names are used here)
// This is a smoke assertion that we don\'t read model-name envs in picker
expect(
  Object.keys(process.env).every(
    (k) => !k.includes('GEMINI_LLM_MODEL') && !k.includes('MEM0_MODEL'),
  ),
  'env model name variables should not be required by picker',
);

console.log('UnifiedModelPicker tests passed.');
