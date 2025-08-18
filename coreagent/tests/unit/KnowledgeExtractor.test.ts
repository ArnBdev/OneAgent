import { KnowledgeExtractor, type GraphData } from '../../tools/KnowledgeExtractor';

describe('KnowledgeExtractor', () => {
  test('parses valid JSON from LLM response (success)', async () => {
    const mockInvoker = async () =>
      JSON.stringify({
        nodes: [
          { id: 'Alice', label: 'Person', properties: {} },
          { id: 'Acme Corp', label: 'Organization', properties: {} },
        ],
        edges: [{ source: 'Alice', target: 'Acme Corp', label: 'WORKS_AT' }],
      } satisfies GraphData);

    const extractor = new KnowledgeExtractor(async () => mockInvoker());
    const result = await extractor.extractKnowledge('Alice works at Acme Corp.');
    expect(result.nodes.length).toBe(2);
    expect(result.edges.length).toBe(1);
    expect(result.nodes[0].label).toBe('Person');
  });

  test('handles invalid JSON by returning empty graph (robust)', async () => {
    const badInvoker = async () => 'not a json';
    const extractor = new KnowledgeExtractor(async () => badInvoker());
    const result = await extractor.extractKnowledge('Some text');
    expect(result).toEqual({ nodes: [], edges: [] });
  });
});
