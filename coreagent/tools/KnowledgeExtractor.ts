import { UnifiedBackboneService, OneAgentUnifiedBackbone } from '../utils/UnifiedBackboneService';
import { pickDefault } from '../config/UnifiedModelPicker';
import { GeminiClient } from './geminiClient';

// Graph data contracts
export interface Node {
  id: string;
  label: string;
  properties: Record<string, unknown>;
}

export interface Edge {
  source: string;
  target: string;
  label: string;
  properties?: Record<string, unknown>;
}

export interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

export type LLMInvoker = (args: { system: string; user: string; model: string }) => Promise<string>;

const EMPTY_GRAPH: GraphData = { nodes: [], edges: [] };

export class KnowledgeExtractor {
  private readonly invokeLLM: LLMInvoker;

  constructor(invoker?: LLMInvoker) {
    this.invokeLLM =
      invoker ||
      (async ({ system, user, model }) => {
        const cfg = UnifiedBackboneService.getResolvedConfig();
        const client = new GeminiClient({ apiKey: cfg.geminiApiKey, model });
        const res = await client.chat(user, {
          systemPrompt: system,
          temperature: 0.2,
          maxTokens: 1200,
        });
        return res.response;
      });
  }

  /** Extract knowledge graph from arbitrary text using a premium LLM. */
  async extractKnowledge(text: string): Promise<GraphData> {
    if (!text || !text.trim()) return EMPTY_GRAPH;
    const pick = pickDefault('demanding_llm');

    const { systemPrompt, userPrompt } = this.buildPrompt(text);
    try {
      const raw = await this.invokeLLM({
        system: systemPrompt,
        user: userPrompt,
        model: pick.name,
      });
      const parsed = this.safeParseGraph(raw);
      if (!parsed) return EMPTY_GRAPH;
      return parsed;
    } catch (error) {
      await OneAgentUnifiedBackbone.getInstance().errorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        { component: 'KnowledgeExtractor', operation: 'extractKnowledge', external: true },
      );
      return EMPTY_GRAPH;
    }
  }

  /** Build a robust schema-focused prompt with few-shot examples. */
  private buildPrompt(text: string): { systemPrompt: string; userPrompt: string } {
    const systemPrompt = [
      'You are a Knowledge Graph Engineer. Your task is to extract entities (nodes) and relationships (edges) from text and return ONLY valid JSON conforming to the GraphData schema.',
      'Rules:',
      '- Output strictly JSON, no markdown code fences, no commentary.',
      '- Prefer concise, human-readable ids (e.g., full names or canonical terms).',
      '- Use appropriate labels like Person, Role, Organization, Place, Concept.',
      '- Include only the most important relations; avoid redundancy.',
      '- properties should be an object; omit if empty on edges (allowed).',
      'Schema:',
      '{ "nodes": Node[], "edges": Edge[] }',
      'Node: { id: string, label: string, properties: Record<string, unknown> }',
      'Edge: { source: string, target: string, label: string, properties?: Record<string, unknown> }',
    ].join('\n');

    const shots = [
      {
        in: 'Arne Nilsen Berge jobber som menighetspedagog for ungdom i Flekkerøy menighet.',
        out: {
          nodes: [
            { id: 'Arne Nilsen Berge', label: 'Person', properties: {} },
            { id: 'Menighetspedagog', label: 'Role', properties: {} },
            { id: 'Flekkerøy menighet', label: 'Organization', properties: {} },
            { id: 'Ungdom', label: 'Concept', properties: {} },
          ],
          edges: [
            { source: 'Arne Nilsen Berge', target: 'Menighetspedagog', label: 'HAS_ROLE' },
            { source: 'Menighetspedagog', target: 'Flekkerøy menighet', label: 'EMPLOYED_AT' },
            { source: 'Menighetspedagog', target: 'Ungdom', label: 'FOCUSES_ON' },
          ],
        } as GraphData,
      },
      {
        in: 'OpenAI created ChatGPT and operates in San Francisco.',
        out: {
          nodes: [
            { id: 'OpenAI', label: 'Organization', properties: {} },
            { id: 'ChatGPT', label: 'Product', properties: {} },
            { id: 'San Francisco', label: 'Place', properties: {} },
          ],
          edges: [
            { source: 'OpenAI', target: 'ChatGPT', label: 'CREATED' },
            { source: 'OpenAI', target: 'San Francisco', label: 'LOCATED_IN' },
          ],
        } as GraphData,
      },
      {
        in: 'Marie Curie discovered radium and polonium with Pierre Curie.',
        out: {
          nodes: [
            { id: 'Marie Curie', label: 'Person', properties: {} },
            { id: 'Pierre Curie', label: 'Person', properties: {} },
            { id: 'Radium', label: 'Element', properties: {} },
            { id: 'Polonium', label: 'Element', properties: {} },
          ],
          edges: [
            { source: 'Marie Curie', target: 'Radium', label: 'DISCOVERED' },
            { source: 'Marie Curie', target: 'Polonium', label: 'DISCOVERED' },
            { source: 'Marie Curie', target: 'Pierre Curie', label: 'COLLABORATED_WITH' },
          ],
        } as GraphData,
      },
    ];

    const examples = shots
      .map((s, i) => `Example ${i + 1}\nText: ${s.in}\nJSON: ${JSON.stringify(s.out)}`)
      .join('\n\n');

    const userPrompt = [
      examples,
      '---',
      `Extract entities and relations from the following text and return ONLY JSON.`,
      `Text: ${text}`,
    ].join('\n');

    return { systemPrompt, userPrompt };
  }

  /** Safe parse + structural guard */
  private safeParseGraph(raw: string): GraphData | null {
    try {
      const cleaned = raw.trim().replace(/^```json\n?|\n?```$/g, '');
      const obj = JSON.parse(cleaned);
      if (!obj || typeof obj !== 'object') return null;
      const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object';
      const isNode = (v: unknown): v is Node =>
        isObject(v) &&
        typeof v.id === 'string' &&
        typeof v.label === 'string' &&
        isObject(v.properties);
      const isEdge = (v: unknown): v is Edge =>
        isObject(v) &&
        typeof v.source === 'string' &&
        typeof v.target === 'string' &&
        typeof v.label === 'string' &&
        (v.properties === undefined || isObject(v.properties));

      const nodesUnknown = Array.isArray((obj as Record<string, unknown>).nodes)
        ? ((obj as Record<string, unknown>).nodes as unknown[])
        : [];
      const edgesUnknown = Array.isArray((obj as Record<string, unknown>).edges)
        ? ((obj as Record<string, unknown>).edges as unknown[])
        : [];

      if (!nodesUnknown.every(isNode) || !edgesUnknown.every(isEdge)) return null;
      const nodes = nodesUnknown as Node[];
      const edges = edgesUnknown as Edge[];
      return { nodes, edges } as GraphData;
    } catch (err) {
      OneAgentUnifiedBackbone.getInstance().errorHandler.handleError(
        err instanceof Error ? err : new Error(String(err)),
        { component: 'KnowledgeExtractor', operation: 'parse', external: false },
      );
      return null;
    }
  }
}
