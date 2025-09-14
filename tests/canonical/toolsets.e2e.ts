/**
 * Tool Sets E2E Test
 * - Verifies tools/sets listing and activation via MCP
 * - Ensures tools/list is filtered by active sets
 * - Confirms always-allowed tools (e.g., oneagent_system_health) remain available
 */
import http from 'http';
import axios from 'axios';
import type { AddressInfo } from 'net';

// Import express app and engine without auto-starting the server
import { app, oneAgent } from '../../coreagent/server/unified-mcp-server';

type MCPRequest = {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
};

async function post(base: string, path: string, body: MCPRequest) {
  const url = `${base}${path}`;
  return axios.post(url, body, { validateStatus: () => true });
}

async function main() {
  // Initialize engine explicitly for deterministic state
  await oneAgent.initialize('mcp-http');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const addr = server.address() as AddressInfo;
  const base = `http://127.0.0.1:${addr.port}`;

  try {
    // initialize
    const initRes = await post(base, '/mcp', {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { clientInfo: { name: 'toolsets-e2e', version: '1.0' } },
    });
    if (initRes.status !== 200 || initRes.data?.result?.protocolVersion == null) {
      throw new Error('initialize failed');
    }

    // list tool sets
    const setsRes = await post(base, '/mcp', { jsonrpc: '2.0', id: 2, method: 'tools/sets' });
    const toolSets = setsRes.data?.result?.toolSets as Array<{ id: string; tools: string[] }>;
    const active = new Set<string>(setsRes.data?.result?.active || []);
    if (!Array.isArray(toolSets) || toolSets.length === 0) throw new Error('no tool sets');

    // Activate minimal set to shrink tools list
    const minimalSet = toolSets.find((s) => s.id === 'system-management')?.id || toolSets[0].id;
    const activateRes = await post(base, '/mcp', {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/sets/activate',
      params: { setIds: [minimalSet] },
    });
    const nowActive = new Set<string>(activateRes.data?.result?.active || []);
    if (!nowActive.has(minimalSet)) throw new Error('activation did not apply');

    // tools/list should reflect restricted set
    const listRes = await post(base, '/mcp', { jsonrpc: '2.0', id: 4, method: 'tools/list' });
    const tools = (listRes.data?.result?.tools || []) as Array<{ name: string }>; // MCP 2025 shape adapted
    if (!Array.isArray(tools) || tools.length === 0) throw new Error('no tools listed');

    const names = tools.map((t) => t.name);
    // Always-allowed tool must be present
    if (!names.includes('oneagent_system_health')) {
      throw new Error('oneagent_system_health should be available');
    }

    // A research tool should be restricted when only system-management is active
    const researchTool = 'oneagent_enhanced_search';
    const callRestricted = await post(base, '/mcp', {
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: { name: researchTool, arguments: { query: 'hello' } },
    });
    const restricted = callRestricted.data?.error?.message?.includes('not currently enabled');
    if (!restricted) throw new Error('expected research tool to be restricted');

    // oneagent_system_health should execute fine
    const callHealth = await post(base, '/mcp', {
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/call',
      params: { name: 'oneagent_system_health', arguments: {} },
    });
    if (callHealth.data?.error) throw new Error('system health tool should not error');

    // Activate research & memory via engine-native toggle tool
    const toggleViaTool = await post(base, '/mcp', {
      jsonrpc: '2.0',
      id: 7,
      method: 'tools/call',
      params: {
        name: 'oneagent_toolsets_toggle',
        arguments: { setIds: ['research-analysis', 'memory-context'] },
      },
    });
    // MCP 2025 tools/call wraps tool outputs under result.toolResult
    const toggleResult = toggleViaTool.data?.result?.toolResult?.data ?? toggleViaTool.data?.result;
    if (!toggleResult || !Array.isArray(toggleResult.active)) {
      throw new Error('toggle tool did not return status');
    }

    // Now research tool should be allowed to execute (may still return tool result-specific data)
    const callResearch = await post(base, '/mcp', {
      jsonrpc: '2.0',
      id: 8,
      method: 'tools/call',
      params: { name: researchTool, arguments: { query: 'mcp tool sets' } },
    });
    if (callResearch.data?.error) {
      throw new Error(
        `research tool call should succeed, got error: ${callResearch.data?.error?.message}`,
      );
    }

    console.log('✅ Tool Sets E2E passed');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

// Execute when run directly
if (require.main === module) {
  main().catch((err) => {
    // Surface error to parent without forcing process exit for lint rule compliance
    throw err instanceof Error ? err : new Error(String(err));
  });
}

export default main;
