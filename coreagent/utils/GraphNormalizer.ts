import type { GraphData, Node, Edge } from '../tools/KnowledgeExtractor';

function normId(value: string): string {
  return value.trim();
}

function mergeProps(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): Record<string, unknown> {
  // Shallow merge, prefer existing (a) values when conflict
  const out: Record<string, unknown> = { ...a };
  for (const [k, v] of Object.entries(b)) {
    if (!(k in out)) out[k] = v;
  }
  return out;
}

export function normalize(graph: GraphData | null | undefined): GraphData {
  if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
    return { nodes: [], edges: [] };
  }

  // Deduplicate nodes by id (normalized)
  const nodeMap = new Map<string, Node>();
  for (const n of graph.nodes) {
    if (!n || typeof n.id !== 'string' || typeof n.label !== 'string') continue;
    const id = normId(n.id);
    const existing = nodeMap.get(id);
    if (!existing) {
      nodeMap.set(id, { id, label: n.label.trim(), properties: n.properties ?? {} });
    } else {
      // Merge label by preferring the more specific (longer) label
      const label =
        existing.label.length >= n.label.trim().length ? existing.label : n.label.trim();
      nodeMap.set(id, {
        id,
        label,
        properties: mergeProps(existing.properties || {}, n.properties || {}),
      });
    }
  }

  // Deduplicate edges by key: source|label|target (normalized)
  const edgeKey = (e: Edge) => `${normId(e.source)}|${e.label.trim()}|${normId(e.target)}`;
  const edgeMap = new Map<string, Edge>();
  for (const e of graph.edges) {
    if (
      !e ||
      typeof e.source !== 'string' ||
      typeof e.target !== 'string' ||
      typeof e.label !== 'string'
    )
      continue;
    const key = edgeKey(e);
    const existing = edgeMap.get(key);
    if (!existing) {
      edgeMap.set(key, {
        source: normId(e.source),
        target: normId(e.target),
        label: e.label.trim(),
        properties: e.properties && typeof e.properties === 'object' ? e.properties : undefined,
      });
    } else if (e.properties && typeof e.properties === 'object') {
      edgeMap.set(key, {
        ...existing,
        properties: mergeProps(existing.properties || {}, e.properties),
      });
    }
  }

  return { nodes: Array.from(nodeMap.values()), edges: Array.from(edgeMap.values()) };
}
