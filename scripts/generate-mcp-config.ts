/**
 * generate-mcp-config.ts
 *
 * Generates .vscode/mcp.json using canonical .env values.
 * Source of truth:
 *  - ONEAGENT_MCP_URL (preferred) or composed from ONEAGENT_HOST + ONEAGENT_MCP_PORT
 *  - Appends "/mcp" path for VS Code Copilot HTTP MCP endpoint.
 *
 * Usage:
 *  - npm run mcp:config
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load root .env
dotenv.config({ path: path.join(process.cwd(), '.env') });

function main() {
  const host = process.env.ONEAGENT_HOST || '127.0.0.1';
  const port = parseInt(process.env.ONEAGENT_MCP_PORT || '8083', 10);
  const baseUrl = (process.env.ONEAGENT_MCP_URL || `http://${host}:${port}`).replace(/\/$/, '');
  const fullUrl = `${baseUrl}${baseUrl.endsWith('/mcp') ? '' : '/mcp'}`;

  const vscodeDir = path.join(process.cwd(), '.vscode');
  const target = path.join(vscodeDir, 'mcp.json');

  if (!fs.existsSync(vscodeDir)) {
    fs.mkdirSync(vscodeDir, { recursive: true });
  }

  const config = {
    servers: {
      oneagent: {
        type: 'http',
        url: fullUrl,
      },
    },
  } as const;

  // Write pretty JSON without comments (schema strict)
  const nextJson = JSON.stringify(config, null, 2) + '\n';
  let prevJson = '';
  if (fs.existsSync(target)) {
    prevJson = fs.readFileSync(target, 'utf8');
  }
  if (prevJson !== nextJson) {
    if (prevJson) {
      const backup = `${target}.${Date.now()}.bak`;
      fs.writeFileSync(backup, prevJson, 'utf8');
    }
    fs.writeFileSync(target, nextJson, 'utf8');
  }

  // Also refresh sample alongside, helpful for inspection
  const sample = path.join(vscodeDir, 'mcp.json.sample');
  fs.writeFileSync(sample, nextJson, 'utf8');

  // Minimal console message (safe for CLI)
  if (prevJson === nextJson) {
    console.log(
      `No changes. ${path.relative(process.cwd(), target)} already up to date (url=${fullUrl}).`,
    );
  } else {
    console.log(
      `Wrote VS Code MCP config → ${path.relative(process.cwd(), target)} (url=${fullUrl})`,
    );
  }
}

main();
