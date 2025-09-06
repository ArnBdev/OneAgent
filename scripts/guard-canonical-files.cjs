#!/usr/bin/env node
/*
  Canonical Files Guard
  - Enforces a single canonical roadmap file at docs/ROADMAP.md
  - Enforces a single canonical agent instruction file at AGENTS.md (root)
  - Emits warnings if path-scoped instruction files don't reference AGENTS.md
*/

const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();

/** Normalize a relative path to POSIX-style lowercase for comparisons */
function norm(rel) {
  return rel.split(path.sep).join('/');
}

/** Recursively list all files under a directory, excluding common vendor/build dirs. */
function listFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    const rel = norm(path.relative(repoRoot, full));
    // Exclusions
    if (
      rel.startsWith('.git/') ||
      rel.startsWith('node_modules/') ||
      rel.startsWith('dist/') ||
      rel.startsWith('oneagent_gemini_memory/') ||
      rel.startsWith('oneagent_unified_memory/') ||
      rel.startsWith('.vscode/') ||
      rel.startsWith('logs/')
    ) {
      continue;
    }
    if (e.isDirectory()) files.push(...listFiles(full));
    else files.push(rel);
  }
  return files;
}

function main() {
  const all = listFiles(repoRoot);
  const violations = [];
  const warnings = [];

  // Roadmap rule: only docs/ROADMAP.md allowed
  const roadmapCandidates = all.filter((p) => /(^|\/)\w*roadmap\w*\.md$/i.test(p));
  const allowedRoadmap = 'docs/ROADMAP.md';
  const allowedRoadmapLower = allowedRoadmap.toLowerCase();
  const allLower = new Map(all.map((p) => [p.toLowerCase(), p]));
  const hasAllowedRoadmapCI = allLower.has(allowedRoadmapLower);
  const hasAllowedRoadmapExact = all.includes(allowedRoadmap);
  if (!hasAllowedRoadmapCI) {
    violations.push(
      `Missing canonical roadmap file: ${allowedRoadmap}. Add or rename your roadmap to this path.`,
    );
  } else if (!hasAllowedRoadmapExact) {
    const actual = allLower.get(allowedRoadmapLower);
    warnings.push(
      `WARN: Canonical roadmap exists at '${actual}', but case should be '${allowedRoadmap}'. Consider a case-only rename in git.`,
    );
  }
  const disallowedRoadmaps = roadmapCandidates.filter(
    (p) => p.toLowerCase() !== allowedRoadmapLower,
  );
  if (disallowedRoadmaps.length > 0) {
    violations.push(
      `Found non-canonical roadmap files: ${disallowedRoadmaps.join(
        ', ',
      )}. Keep only ${allowedRoadmap}.`,
    );
  }

  // Agents rule: only AGENTS.md at repo root, exact case
  const agentCandidates = all.filter((p) => /(^|\/)agents?\.md$/i.test(p));
  const canonicalAgents = 'AGENTS.md';
  const hasCanonicalAgents = all.includes(canonicalAgents);
  if (!hasCanonicalAgents) {
    violations.push(
      `Missing canonical agent instruction file at ${canonicalAgents}. Create it or rename existing files to this exact path and case.`,
    );
  }
  const disallowedAgents = agentCandidates.filter((p) => p !== canonicalAgents);
  if (disallowedAgents.length > 0) {
    violations.push(
      `Found non-canonical agent instruction files: ${disallowedAgents.join(
        ', ',
      )}. Only ${canonicalAgents} at repository root is allowed.`,
    );
  }

  // Instruction hint: ensure path-scoped instruction files reference AGENTS.md (warn only)
  const pathScoped = all.filter(
    (p) => p.startsWith('.github/instructions/') && p.endsWith('.instructions.md'),
  );
  for (const file of pathScoped) {
    try {
      const text = fs.readFileSync(path.join(repoRoot, file), 'utf8');
      if (!/AGENTS\.md/.test(text)) {
        warnings.push(
          `WARN: ${file} does not mention AGENTS.md. Consider adding a canonicalization note deferring to root-level AGENTS.md.`,
        );
      }
    } catch {
      // ignore read errors
    }
  }

  // Output
  if (warnings.length) {
    for (const w of warnings) console.warn(w);
  }
  if (violations.length) {
    console.error('\nCanonical Files Guard failed with the following issues:');
    for (const v of violations) console.error('- ' + v);
    process.exit(1);
  } else {
    console.log('Canonical Files Guard: PASS');
  }
}

main();
