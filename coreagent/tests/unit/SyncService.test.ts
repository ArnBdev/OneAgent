/**
 * Unit tests for SyncService (Jest + ts-jest)
 */
import SyncService, { splitIntoRules, inferDomainFromFilename } from '../../services/SyncService';
import { OneAgentMemory } from '../../memory/OneAgentMemory';
// Removed unused UnifiedMetadata import
import { promises as fs } from 'fs';

jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  return {
    ...actual,
    promises: {
      readdir: jest.fn(),
      readFile: jest.fn(),
    },
  };
});

// Ensure env fast mode for speed and to avoid network calls
process.env.ONEAGENT_FAST_TEST_MODE = '1';

describe('SyncService.splitIntoRules', () => {
  it('extracts rules from bullets and sentences, ignores headings', () => {
    const md = `
# Title

Some intro paragraph. Should be ignored? Maybe.

- Always sanitize user inputs.
- Never expose API keys in logs.

## Section

Use descriptive commit messages. They help.

Example code:
\`\`\`
if (x) { console.log('noop'); }
\`\`\`

End sentence.
`;

    const rules = splitIntoRules(md);

    expect(rules).toEqual(
      expect.arrayContaining([
        'Always sanitize user inputs.',
        'Never expose API keys in logs.',
        'Use descriptive commit messages.',
        'They help.',
        'End sentence.',
      ]),
    );

    // Should not include headings
    expect(rules.find((r) => r.startsWith('#'))).toBeUndefined();
  });
});

describe('SyncService.inferDomainFromFilename', () => {
  it('maps filenames to domains', () => {
    expect(inferDomainFromFilename('dev.security.spec.md')).toBe('dev');
    expect(inferDomainFromFilename('finance-ethics.spec.md')).toBe('finance');
    expect(inferDomainFromFilename('fitness-health.spec.md')).toBe('fitness');
    expect(inferDomainFromFilename('general.spec.md')).toBe('global');
  });
});

describe('SyncService.syncConstitution', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    // Reset singleton
    (OneAgentMemory as unknown as { instance: unknown | null }).instance = null;
  });

  it('reads spec files, embeds rules, and stores in memory with canonical metadata', async () => {
    // Mock filesystem
    (fs.readdir as unknown as jest.Mock).mockResolvedValue([
      'dev.security.spec.md',
      'general.spec.md',
    ]);
    (fs.readFile as unknown as jest.Mock).mockImplementation(async (p: string | Buffer) => {
      const pathStr = p.toString();
      return pathStr.endsWith('dev.security.spec.md')
        ? '- Never commit secrets.\n- Use code review.'
        : '# General\nAlways be helpful.\n';
    });

    // Mock GeminiClient generateEmbedding
    const mockEmb = {
      embedding: new Array<number>(10).fill(0.1),
      dimensions: 10,
      text: 'rule',
      timestamp: new Date().toISOString(),
    };
    const geminiModule = await import('../../tools/geminiClient');
    jest.spyOn(geminiModule.GeminiClient.prototype, 'generateEmbedding').mockResolvedValue(mockEmb);

    // Spy on memory
    const addSpy = jest.spyOn(OneAgentMemory.prototype, 'addMemory').mockResolvedValue('mem_1');

    const svc = new SyncService('specs');
    await svc.syncConstitution();

    expect(addSpy).toHaveBeenCalled();
    const calls = addSpy.mock.calls;
    expect(calls.length).toBeGreaterThanOrEqual(3);

    // Validate a call's metadata shape
    const [req] = calls[0] as [{ content: string; metadata: Record<string, unknown> }];
    // Validate a call's MemoryAddRequest shape
    expect(typeof req.content).toBe('string');
    expect(req.metadata.userId).toBe('system');
    if (
      req.metadata.content &&
      typeof req.metadata.content === 'object' &&
      'category' in req.metadata.content
    ) {
      expect((req.metadata.content as { category: string }).category).toBe('constitutional_rule');
    } else {
      throw new Error('metadata.content.category missing');
    }
    if (
      req.metadata.content &&
      typeof req.metadata.content === 'object' &&
      'tags' in req.metadata.content
    ) {
      const tags = (req.metadata.content as { tags: unknown }).tags;
      expect(Array.isArray(tags)).toBe(true);
    } else {
      throw new Error('metadata.content.tags missing');
    }
  });
});
