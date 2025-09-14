/**
 * OneAgent Unified MCP STDIO Server
 *
 * Implements MCP over stdio with JSON-RPC 2.0 framing (Content-Length headers),
 * suitable for VS Code Copilot Chat when configured as type: "stdio".
 *
 * Notes:
 * - Strictly no stdout logging except framed JSON-RPC responses.
 * - All console logs are redirected to stderr to avoid MCP parse errors.
 * - Reuses canonical OneAgentEngine; no parallel systems are created.
 */

// STDIO-QUIET PATCH: redirect or silence console output BEFORE any engine initialization
import util from 'util';
const __originalConsole = { ...console };
const QUIET_ALL = process.env.ONEAGENT_QUIET_MODE === '1';
const toStderr =
  (method: keyof Console) =>
  (...args: unknown[]) => {
    try {
      // Prefix to make it obvious this is diagnostic noise, not MCP payloads
      if (!QUIET_ALL) {
        __originalConsole.error(`[stdio:${method}] ${util.format(...(args as unknown[]))}`);
      }
    } catch {
      try {
        if (!QUIET_ALL) process.stderr.write(args.map(String).join(' ') + '\n');
      } catch {
        // swallow as last resort
      }
    }
  };
if (QUIET_ALL) {
  // Silence all console output entirely
  console.log = (() => {}) as typeof console.log;
  console.info = (() => {}) as typeof console.info;
  console.warn = (() => {}) as typeof console.warn;
  console.debug = (() => {}) as typeof console.debug;
  console.error = (() => {}) as typeof console.error;
} else {
  // Redirect console to stderr for diagnostics
  console.log = toStderr('log') as typeof console.log;
  console.info = toStderr('info') as typeof console.info;
  console.warn = toStderr('warn') as typeof console.warn;
  console.debug = toStderr('debug') as typeof console.debug;
}

// Set safe defaults for stdio mode (may be overridden via env)
process.env.ONEAGENT_STDIO_MODE = process.env.ONEAGENT_STDIO_MODE ?? '1';
process.env.ONEAGENT_DISABLE_AUTO_MONITORING = process.env.ONEAGENT_DISABLE_AUTO_MONITORING ?? '1';
process.env.ONEAGENT_PROACTIVE_AUTO_DELEGATE =
  process.env.ONEAGENT_PROACTIVE_AUTO_DELEGATE ?? 'false';

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
dotenv.config({ path: path.join(process.cwd(), '.env') });

import type { OneAgentEngine, OneAgentRequest } from '../OneAgentEngine';
import { createUnifiedTimestamp, getAppVersion } from '../utils/UnifiedBackboneService';

// Hard guard: suppress any accidental writes to stdout (only framed MCP allowed)
let __allowStdoutWrite = false;
const __originalStdoutWrite = process.stdout.write.bind(process.stdout) as unknown as (
  chunk: string | Uint8Array,
  encodingOrCb?: BufferEncoding | ((err?: Error) => void),
  cb?: (err?: Error) => void,
) => boolean;

const STDIO_LOG_TO_FILE = process.env.ONEAGENT_STDIO_LOG_TO_FILE === '1';
const STDIO_LOG_FILE =
  process.env.ONEAGENT_STDIO_LOG_FILE ||
  path.join(process.cwd(), 'logs', 'mcp-server', 'stdio.log');
let __stdioLogStream: fs.WriteStream | null = null;
function __diagWrite(message: string) {
  try {
    if (STDIO_LOG_TO_FILE) {
      if (!__stdioLogStream) {
        try {
          fs.mkdirSync(path.dirname(STDIO_LOG_FILE), { recursive: true });
        } catch {
          // noop: if directory creation fails, fallback to stderr below
        }
        __stdioLogStream = fs.createWriteStream(STDIO_LOG_FILE, { flags: 'a' });
      }
      __stdioLogStream.write(message + '\n');
    } else if (!QUIET_ALL) {
      // Only write to stderr when not in master quiet mode
      process.stderr.write(message + '\n');
    }
  } catch {
    // swallow diagnostics failures to avoid loops
  }
}

// Patch stdout to prevent non-MCP payloads from leaking to the IDE
const patchedStdoutWrite: (
  chunk: string | Uint8Array,
  encodingOrCb?: BufferEncoding | ((err?: Error) => void),
  cb?: (err?: Error) => void,
) => boolean = function (
  chunk: string | Uint8Array,
  encodingOrCb?: BufferEncoding | ((err?: Error) => void),
  cb?: (err?: Error) => void,
): boolean {
  if (__allowStdoutWrite) {
    return __originalStdoutWrite(chunk, encodingOrCb, cb);
  }
  try {
    const preview = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk ?? '');
    __diagWrite(`[stdio:suppressed-stdout] ${preview.slice(0, 500)}`);
  } catch {
    // ignore preview/diagnostic failures
  }
  if (typeof cb === 'function') {
    try {
      cb();
    } catch {
      // ignore callback errors for suppressed writes
    }
  }
  return true;
};

Object.defineProperty(process.stdout, 'write', {
  value: patchedStdoutWrite,
  configurable: true,
  writable: true,
});

// Configurable startup delay to avoid race between VS Code initialize and internal service init
const STARTUP_DELAY_MS = Math.max(
  0,
  Number.isFinite(Number(process.env.ONEAGENT_STARTUP_DELAY_MS))
    ? Number(process.env.ONEAGENT_STARTUP_DELAY_MS)
    : 0,
);
const __startupDelayPromise: Promise<void> =
  STARTUP_DELAY_MS > 0
    ? new Promise((resolve) => setTimeout(resolve, STARTUP_DELAY_MS))
    : Promise.resolve();
function waitForStartup(): Promise<void> {
  return __startupDelayPromise;
}

// Optional: redirect stderr to file to keep VS Code output clean
const STDERR_TO_FILE = process.env.ONEAGENT_STDERR_TO_FILE === '1';
const STDERR_TEE = process.env.ONEAGENT_STDERR_TEE === '1';
const STDERR_FILE =
  process.env.ONEAGENT_STDERR_FILE ||
  path.join(process.cwd(), 'logs', 'mcp-server', 'stdio.err.log');
const __originalStderrWrite = process.stderr.write.bind(process.stderr) as unknown as (
  chunk: string | Uint8Array,
  encodingOrCb?: BufferEncoding | ((err?: Error) => void),
  cb?: (err?: Error) => void,
) => boolean;
let __stderrLogStream: fs.WriteStream | null = null;
if (STDERR_TO_FILE) {
  try {
    fs.mkdirSync(path.dirname(STDERR_FILE), { recursive: true });
    __stderrLogStream = fs.createWriteStream(STDERR_FILE, { flags: 'a' });
    const patchedStderrWrite: (
      chunk: string | Uint8Array,
      encodingOrCb?: BufferEncoding | ((err?: Error) => void),
      cb?: (err?: Error) => void,
    ) => boolean = function (
      chunk: string | Uint8Array,
      encodingOrCb?: BufferEncoding | ((err?: Error) => void),
      cb?: (err?: Error) => void,
    ): boolean {
      try {
        const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk ?? ''), 'utf8');
        __stderrLogStream!.write(data);
        // Tee to terminal only if explicit tee AND not in master quiet mode
        if (STDERR_TEE && !QUIET_ALL) {
          if (typeof encodingOrCb === 'function') {
            __originalStderrWrite(chunk, undefined, encodingOrCb);
          } else {
            __originalStderrWrite(chunk, encodingOrCb, cb);
          }
        }
      } catch {
        // fallback to original stderr on failure
        if (!QUIET_ALL) {
          if (typeof encodingOrCb === 'function') {
            return __originalStderrWrite(chunk, undefined, encodingOrCb);
          }
          return __originalStderrWrite(chunk, encodingOrCb, cb);
        }
        // In quiet mode, suppress fallback output entirely
        if (typeof cb === 'function') {
          try {
            cb();
          } catch {
            /* noop */
          }
        }
        return true;
      }
      if (typeof cb === 'function') {
        try {
          cb();
        } catch {
          /* noop */
        }
      }
      return true;
    };
    Object.defineProperty(process.stderr, 'write', {
      value: patchedStderrWrite,
      configurable: true,
      writable: true,
    });
  } catch {
    // If file redirection fails, keep stderr default
  }
} else if (QUIET_ALL) {
  // Master quiet: suppress stderr output entirely (no file, no terminal)
  const noopWrite: (
    chunk: string | Uint8Array,
    encodingOrCb?: BufferEncoding | ((err?: Error) => void),
    cb?: (err?: Error) => void,
  ) => boolean = function (
    _chunk: string | Uint8Array,
    _encodingOrCb?: BufferEncoding | ((err?: Error) => void),
    cb?: (err?: Error) => void,
  ): boolean {
    if (typeof cb === 'function') {
      try {
        cb();
      } catch {
        /* noop */
      }
    }
    return true;
  };
  Object.defineProperty(process.stderr, 'write', {
    value: noopWrite,
    configurable: true,
    writable: true,
  });
}

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

let initialized = false;
let oneAgent: OneAgentEngine | null = null;

async function initOnce() {
  if (!initialized) {
    // Lazy-create engine to ensure console redirection and env flags are active first
    const mod = await import('../OneAgentEngine');
    const Engine = mod.OneAgentEngine;
    oneAgent = Engine.getInstance({
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
    await oneAgent.initialize('mcp-stdio');
    initialized = true;
  }
}

async function writeMessage(msg: MCPResponse, skipDelay = false): Promise<void> {
  // Ensure startup delay elapsed before emitting any framed JSON-RPC (unless skipped)
  if (!skipDelay && STARTUP_DELAY_MS > 0) {
    await waitForStartup();
  }
  const json = JSON.stringify(msg);
  const byteLen = Buffer.byteLength(json, 'utf8');
  // LSP/MCP stdio framing
  __allowStdoutWrite = true;
  try {
    __originalStdoutWrite(`Content-Length: ${byteLen}\r\n\r\n`);
    __originalStdoutWrite(json);
  } finally {
    __allowStdoutWrite = false;
  }
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
        roots: { listChanged: true },
        elicitation: {},
      },
      timestamp: now,
    });
  }

  if (req.method === 'notifications/initialized') {
    return ok(req.id, {});
  }

  // Tools
  if (req.method === 'tools/list') {
    await initOnce();
    const tools = oneAgent!.getAvailableTools();
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
    await initOnce();
    const oneAgentRequest: OneAgentRequest = {
      id: String(req.id ?? ''),
      type: 'tool_call',
      method: name,
      params: args || {},
      timestamp: createUnifiedTimestamp().iso,
    };
    const resp = await oneAgent!.processRequest(oneAgentRequest);
    if (!resp.success)
      return makeError(req.id, -32603, resp.error?.message || 'Tool execution failed');
    return ok(req.id, {
      toolResult: { type: typeof resp.data, data: resp.data, success: true },
      isError: false,
    });
  }

  // Resources
  if (req.method === 'resources/list') {
    await initOnce();
    const resources = oneAgent!.getAvailableResources();
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
    await initOnce();
    const oneAgentRequest: OneAgentRequest = {
      id: String(req.id ?? ''),
      type: 'resource_get',
      method: uri,
      params: req.params || {},
      timestamp: createUnifiedTimestamp().iso,
    };
    const resp = await oneAgent!.processRequest(oneAgentRequest);
    if (!resp.success)
      return makeError(req.id, -32603, resp.error?.message || 'Resource read failed');
    return ok(req.id, {
      contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(resp.data, null, 2) }],
    });
  }

  // Prompts
  if (req.method === 'prompts/list') {
    await initOnce();
    const prompts = oneAgent!.getAvailablePrompts();
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
    await initOnce();
    const oneAgentRequest: OneAgentRequest = {
      id: String(req.id ?? ''),
      type: 'prompt_invoke',
      method: name,
      params: args || {},
      timestamp: createUnifiedTimestamp().iso,
    };
    const resp = await oneAgent!.processRequest(oneAgentRequest);
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
  await initOnce();
  const oneAgentRequest: OneAgentRequest = {
    id: String(req.id ?? ''),
    type: 'tool_call',
    method: req.method,
    params: req.params || {},
    timestamp: createUnifiedTimestamp().iso,
  };
  const resp = await oneAgent!.processRequest(oneAgentRequest);
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
      // For initialize, respond immediately without delay to satisfy IDE handshake
      if (req.method === 'initialize') {
        const res = await handleRequest(req);
        await writeMessage(res, /*skipDelay*/ true);
        continue;
      }
      // Apply startup delay only for non-initialize messages
      if (STARTUP_DELAY_MS > 0) {
        await waitForStartup();
      }
      const res = await handleRequest(req);
      await writeMessage(res);
    } catch (err) {
      // Emit a generic error back if we can parse an id; otherwise ignore
      __diagWrite(`[MCP STDIO] Failed to process request: ${stringifyError(err)}`);
      // No id to respond to safely here
    }
  }
});

process.stdin.on('error', (e) => __diagWrite(`[MCP STDIO] stdin error ${stringifyError(e)}`));
process.stdout.on('error', (e) => __diagWrite(`[MCP STDIO] stdout error ${stringifyError(e)}`));
process.on('uncaughtException', (e) => __diagWrite(`[uncaughtException] ${stringifyError(e)}`));
process.on('unhandledRejection', (e) => __diagWrite(`[unhandledRejection] ${stringifyError(e)}`));

function stringifyError(e: unknown): string {
  if (e instanceof Error) return e.stack || e.message;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}
