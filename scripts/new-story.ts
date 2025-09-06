import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Minimal DX helper to create a BMAD-style story with canonical ID/time
async function main(): Promise<void> {
  let id: string;
  let ts: { iso: string };

  try {
    type BackboneModule = typeof import('../coreagent/utils/UnifiedBackboneService');
    const m: BackboneModule = await import('../coreagent/utils/UnifiedBackboneService');
    id = m.createUnifiedId('document', 'story');
    ts = m.createUnifiedTimestamp();
  } catch {
    id = `story-${Date.now()}`;
    ts = { iso: new Date().toISOString() };
  }

  const title = process.argv.slice(2).join(' ').trim() || 'Untitled';
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const filename = `${id}-${slug || 'story'}.story.md`;
  const dir = join(process.cwd(), 'docs', 'stories');
  mkdirSync(dir, { recursive: true });
  const filepath = join(dir, filename);

  const content =
    `# Story: ${title}\n\n` +
    `storyId: ${id}\n` +
    `timestamp: ${ts.iso}\n` +
    `prdRef: <path-or-URL>\n` +
    `architectureRef: <path-or-URL>\n` +
    `actors: [SM, Dev, QA]\n\n` +
    `## Context\nBriefly summarize goal, scope, and dependencies.\n\n` +
    `## Acceptance Criteria\n- [ ] Criterion 1\n- [ ] Criterion 2\n\n` +
    `## Implementation Notes\n- Canonical systems only (time/id/memory/cache/comms)\n- Monitoring: add/adjust operation metrics if public behavior changes\n\n` +
    `## Risks & Constraints\n- Risk 1\n- Constraint 1\n\n` +
    `## Validation\n- Tests to add/update\n- Smoke/metrics checks\n`;

  writeFileSync(filepath, content, { encoding: 'utf8' });

  // Optional memory audit record
  try {
    type MemoryModule = typeof import('../coreagent/memory/OneAgentMemory');
    const mm: MemoryModule = await import('../coreagent/memory/OneAgentMemory');
    const memory = mm.OneAgentMemory.getInstance();
    await memory.addMemory(
      `Story created: ${title}`,
      {
        content: { category: 'story', tags: ['story', 'dx'] },
        system: { source: 'new-story', component: 'developer-experience' },
        temporal: { created: { iso: ts.iso } as unknown as { iso: string } },
        // Partial<UnifiedMetadata> is allowed; canonicalization fills the rest
      } as unknown as Partial<Record<string, unknown>>,
      'default-user',
    );
  } catch {
    // Non-fatal; keep script simple for DX
  }

  console.log(`Created story at: ${filepath}`);
}

main().catch((err) => {
  console.error('Failed to create story:', err);
  process.exit(1);
});
