/**
 * OneAgent Unified MCP STDIO Server
 *
 * Implements MCP over stdio with JSON-RPC 2.0 framing (Content-Length headers),
 * suitable for VS Code Copilot Chat when configured as type: "stdio".
 *
 * Notes:
 * - Strictly no stdout logging except framed JSON-RPC responses.
 * - Errors may be logged to stderr for diagnostics.
 * - Reuses canonical OneAgentEngine; no parallel systems are created.
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env') });

import { OneAgentEngine, OneAgentRequest } from '../OneAgentEngine';
import { createUnifiedTimestamp, getAppVersion } from '../utils/UnifiedBackboneService';

type JsonRpcId = string | number | null;

interface MCPRequest {
  jsonrpc: '2.0';
  id: JsonRpcId;
  method: string;
  params?: Record<string, unknown>;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: JsonRpcId;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

const MCP_PROTOCOL_VERSION = '2025-06-18';

// Initialize engine once
const oneAgent = OneAgentEngine.getInstance({
  constitutional: {
    enabled: true,
    qualityThreshold: 80,
    principles: [
      {
        id: 'accuracy',
        name: 'Accuracy',
        description: 'Provide accurate information or acknowledge uncertainty',
        category: 'accuracy',
        weight: 1.0,
        isViolated: false,
        confidence: 0.95,
        validationRule: 'prefer_uncertainty_over_speculation',
        severityLevel: 'high',
      },
      {
        id: 'transparency',
        name: 'Transparency',
        description: 'Explain reasoning and acknowledge limitations',
        category: 'transparency',
        weight: 0.8,
        isViolated: false,
        confidence: 0.9,
        validationRule: 'explain_reasoning_and_limitations',
        severityLevel: 'medium',
      },
      {
        id: 'helpfulness',
        name: 'Helpfulness',
        description: 'Provide actionable, relevant guidance',
        category: 'helpfulness',
        weight: 0.9,
        isViolated: false,
        confidence: 0.85,
        validationRule: 'actionable_relevant_guidance',
        severityLevel: 'medium',
      },
      {
        id: 'safety',
        name: 'Safety',
        description: 'Avoid harmful or misleading recommendations',
        category: 'safety',
        weight: 1.0,
        isViolated: false,
        confidence: 0.95,
        validationRule: 'avoid_harmful_misleading_content',
        severityLevel: 'critical',
      },
    ],
  },
  memory: { enabled: true, provider: 'mem0', config: { retentionDays: 30 } },
});

let initialized = false;

async function initOnce() {
  if (!initialized) {
    await oneAgent.initialize('mcp-stdio');
    initialized = true;
  }
}

function writeMessage(msg: MCPResponse) {
  const json = JSON.stringify(msg);
  const byteLen = Buffer.byteLength(json, 'utf8');
  // LSP/MCP stdio framing
  process.stdout.write(`Content-Length: ${byteLen}\r\n\r\n`);
  process.stdout.write(json);
}

function makeError(id: JsonRpcId, code: number, message: string, data?: unknown): MCPResponse {
  return { jsonrpc: '2.0', id, error: { code, message, data } };
}

function ok(id: JsonRpcId, result: unknown): MCPResponse {
  return { jsonrpc: '2.0', id, result };
}

async function handleRequest(req: MCPRequest): Promise<MCPResponse> {
  // Basic validation
  if (req.jsonrpc !== '2.0' || !req.method) {
    return makeError(req.id, -32600, 'Invalid Request');
  }

  // Initialize handshake
  if (req.method === 'initialize') {
    const now = createUnifiedTimestamp().iso;
    return ok(req.id, {
      protocolVersion: MCP_PROTOCOL_VERSION,
      serverInfo: {
        name: 'OneAgent Unified MCP (stdio)',
        version: getAppVersion(),
        description: 'Professional AI Development Platform (stdio transport)',
      },
      capabilities: {
        tools: { listChanged: true, toolSets: true },
        resources: { listChanged: true, subscribe: true, templates: true },
        prompts: { listChanged: true },
        logging: {},
        sampling: { enabled: true },
      },
      timestamp: now,
    });
  }

  if (req.method === 'notifications/initialized') {
    return ok(req.id, {});
  }

  // Tools
  if (req.method === 'tools/list') {
    const tools = oneAgent.getAvailableTools();
    return ok(req.id, {
      tools: tools.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      })),
    });
  }

  if (req.method === 'tools/call') {
    const { name, arguments: args } = (req.params || {}) as {
      name?: string;
      arguments?: Record<string, unknown>;
    };
    if (!name) return makeError(req.id, -32602, 'Invalid tool name');
    const oneAgentRequest: OneAgentRequest = {
      id: String(req.id ?? ''),
      type: 'tool_call',
      method: name,
      params: args || {},
      timestamp: createUnifiedTimestamp().iso,
    };
    const resp = await oneAgent.processRequest(oneAgentRequest);
    if (!resp.success)
      return makeError(req.id, -32603, resp.error?.message || 'Tool execution failed');
    return ok(req.id, {
      toolResult: { type: typeof resp.data, data: resp.data, success: true },
      isError: false,
    });
  }

  // Resources
  if (req.method === 'resources/list') {
    const resources = oneAgent.getAvailableResources();
    return ok(req.id, {
      resources: resources.map((r) => ({
        uri: r.uri,
        name: r.name,
        description: r.description,
        mimeType: r.mimeType,
      })),
    });
  }

  if (req.method === 'resources/read') {
    const { uri } = (req.params || {}) as { uri?: string };
    if (!uri) return makeError(req.id, -32602, 'Missing uri');
    const oneAgentRequest: OneAgentRequest = {
      id: String(req.id ?? ''),
      type: 'resource_get',
      method: uri,
      params: req.params || {},
      timestamp: createUnifiedTimestamp().iso,
    };
    const resp = await oneAgent.processRequest(oneAgentRequest);
    if (!resp.success)
      return makeError(req.id, -32603, resp.error?.message || 'Resource read failed');
    return ok(req.id, {
      contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(resp.data, null, 2) }],
    });
  }

  // Prompts
  if (req.method === 'prompts/list') {
    const prompts = oneAgent.getAvailablePrompts();
    return ok(req.id, {
      prompts: prompts.map((p) => ({
        name: p.name,
        description: p.description,
        arguments: p.arguments,
      })),
    });
  }

  if (req.method === 'prompts/get') {
    const { name, arguments: args } = (req.params || {}) as {
      name?: string;
      arguments?: Record<string, unknown>;
    };
    if (!name) return makeError(req.id, -32602, 'Missing prompt name');
    const oneAgentRequest: OneAgentRequest = {
      id: String(req.id ?? ''),
      type: 'prompt_invoke',
      method: name,
      params: args || {},
      timestamp: createUnifiedTimestamp().iso,
    };
    const resp = await oneAgent.processRequest(oneAgentRequest);
    if (!resp.success)
      return makeError(req.id, -32603, resp.error?.message || 'Prompt execution failed');
    return ok(req.id, {
      description: `OneAgent prompt: ${name}`,
      messages: [
        { role: 'user', content: { type: 'text', text: JSON.stringify(resp.data, null, 2) } },
      ],
    });
  }

  // Fallback: forward unknown method as tool_call
  const oneAgentRequest: OneAgentRequest = {
    id: String(req.id ?? ''),
    type: 'tool_call',
    method: req.method,
    params: req.params || {},
    timestamp: createUnifiedTimestamp().iso,
  };
  const resp = await oneAgent.processRequest(oneAgentRequest);
  if (!resp.success) return makeError(req.id, -32601, resp.error?.message || 'Method not found');
  return ok(req.id, resp.data ?? null);
}

// STDIO framing reader
let buffer: Buffer = Buffer.alloc(0);
let expectedLength: number | null = null;

process.stdin.on('data', async (chunk: Buffer) => {
  const list = [buffer, chunk] as unknown as readonly Uint8Array<ArrayBufferLike>[];
  buffer = Buffer.concat(list);

  while (true) {
    if (expectedLength === null) {
      const headerEnd = buffer.indexOf('\r\n\r\n');
      if (headerEnd === -1) return; // wait for more
      const header = buffer.subarray(0, headerEnd).toString('utf8');
      const match = /Content-Length:\s*(\d+)/i.exec(header);
      if (!match) {
        // Invalid framing; drop header and continue
        buffer = buffer.subarray(headerEnd + 4);
        continue;
      }
      expectedLength = parseInt(match[1], 10);
      buffer = buffer.subarray(headerEnd + 4);
    }

    if (buffer.length < (expectedLength ?? 0)) return; // wait for more

    const messageBytes = buffer.subarray(0, expectedLength!);
    buffer = buffer.subarray(expectedLength!);
    expectedLength = null;

    try {
      const req = JSON.parse(messageBytes.toString('utf8')) as MCPRequest;
      await initOnce();
      const res = await handleRequest(req);
      writeMessage(res);
    } catch (err) {
      // Emit a generic error back if we can parse an id; otherwise ignore
      console.error('[MCP STDIO] Failed to process request:', err);
      // No id to respond to safely here
    }
  }
});

process.stdin.on('error', (e) => console.error('[MCP STDIO] stdin error', e));
process.stdout.on('error', (e) => console.error('[MCP STDIO] stdout error', e));
