# OneAgent Model Selection (Unified)

Single entrypoint: `coreagent/config/UnifiedModelPicker.ts`

- Roles
  - demanding_llm → gemini-2.5-pro (complex reasoning)
  - fast_llm → gemini-2.5-flash (throughput/price-performance)
  - ultrafast_llm → gemini-2.5-flash-lite (lowest latency/budget)
  - embedding → gemini-embedding-001 (retrieval/memory)

- Provider support
  - Google Gemini (registry-backed)
  - OpenAI (minimal adapter for GPT‑5, GPT‑5‑mini, GPT‑5‑nano)

- Options
  - `pickWithOptions(provider, name, { thinking: true })` to hint provider features.

- Best practices
  - Do not store model names in `.env`. Use picker roles or explicit `pick()`.
  - Keep `.env` for API keys and endpoints only (GEMINI_API_KEY, OPENAI_API_KEY, MEM0_API_URL, …).
  - Multimodality placeholders exist (vision, audio, multimodal) — add concrete models later.

Examples:

```ts
import { pickDefault, pick, pickWithOptions } from '../../coreagent/config/UnifiedModelPicker';

const llm = pickDefault('demanding_llm'); // gemini-2.5-pro
const fast = pickDefault('fast_llm'); // gemini-2.5-flash
const ultra = pickDefault('ultrafast_llm'); // gemini-2.5-flash-lite
const emb = pickDefault('embedding'); // gemini-embedding-001

const gpt5 = pick('openai', 'gpt-5', 'Use GPT‑5 for specific tasks');
const gpt5MiniThinking = pickWithOptions('openai', 'gpt-5-mini', { thinking: true });
const gpt5Nano = pick('openai', 'gpt-5-nano', 'Budget/ultrafast option');
```

Migration notes:

- Any `.env` variables like `GEMINI_LLM_MODEL` or `MEM0_MODEL` are deprecated — not read by runtime.
- Prefer role-based selection to avoid hardcoding provider model names across code.
