#!/usr/bin/env node
/*
 * OneAgent Workspace Cleanup
 * - Removes obsolete memory folders, caches, and logs
 * - Safe no-op when paths do not exist
 */
const fs = require('fs');
const path = require('path');

function rmrf(target) {
  try {
    if (!fs.existsSync(target)) return;
    const stat = fs.lstatSync(target);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(target)) {
        rmrf(path.join(target, entry));
      }
      fs.rmdirSync(target);
    } else {
      fs.unlinkSync(target);
    }
    console.log(`Removed: ${target}`);
  } catch (err) {
    console.warn(`Skip remove (permission or in use): ${target} -> ${err.message}`);
  }
}

function cleanGlob(dir, predicate) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (predicate(entry, full)) rmrf(full);
  }
}

const ROOT = process.cwd();
const paths = {
  pycache: path.join(ROOT, '__pycache__'),
  oldMemory: path.join(ROOT, 'oneagent_gemini_memory'),
  unifiedMemory: path.join(ROOT, 'oneagent_unified_memory'),
  logsMcp: path.join(ROOT, 'logs', 'mcp-server'),
};

// Remove old Python cache
rmrf(paths.pycache);
// Remove old memory store (canonical path is oneagent_unified_memory)
rmrf(paths.oldMemory);
// Trim MCP server logs (keep directory)
if (fs.existsSync(paths.logsMcp)) {
  cleanGlob(paths.logsMcp, () => true);
  console.log(`Cleaned logs directory: ${paths.logsMcp}`);
}

console.log('Workspace cleanup complete.');
