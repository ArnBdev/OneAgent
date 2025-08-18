import { normalize } from '../../utils/GraphNormalizer';
import type { GraphData } from '../../tools/KnowledgeExtractor';

describe('GraphNormalizer', () => {
  test('deduplicates nodes by id and merges properties', () => {
    const input: GraphData = {
      nodes: [
        { id: 'Alice', label: 'Person', properties: { a: 1 } },
        { id: 'Alice', label: 'Person', properties: { b: 2 } },
        { id: '  Alice  ', label: 'Person', properties: { c: 3 } },
        { id: 'Acme', label: 'Organization', properties: {} },
      ],
      edges: [],
    };

    const out = normalize(input);
    expect(out.nodes.length).toBe(2);
    const alice = out.nodes.find((n) => n.id === 'Alice')!;
    expect(alice.properties).toEqual({ a: 1, b: 2, c: 3 });
  });

  test('deduplicates edges by source|label|target and merges properties', () => {
    const input: GraphData = {
      nodes: [],
      edges: [
        { source: 'Alice', target: 'Acme', label: 'WORKS_AT', properties: { since: 2020 } },
        { source: ' Alice ', target: 'Acme', label: 'WORKS_AT', properties: { role: 'Engineer' } },
        { source: 'Alice', target: 'Acme ', label: 'WORKS_AT' },
      ],
    };

    const out = normalize(input);
    expect(out.edges.length).toBe(1);
    const e = out.edges[0];
    expect(e.source).toBe('Alice');
    expect(e.target).toBe('Acme');
    expect(e.properties).toEqual({ since: 2020, role: 'Engineer' });
  });

  test('returns empty graph for invalid input', () => {
    const out = normalize(null as unknown as GraphData);
    expect(out).toEqual({ nodes: [], edges: [] });
  });
});
