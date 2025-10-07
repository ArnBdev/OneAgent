import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

// Load local OneAgent eslint plugin (custom rules)
// Resolve relative to this config file to avoid cwd-dependent path issues.
// On Windows, convert absolute paths to file:// URLs for the ESM loader.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pluginFileUrl = pathToFileURL(
  path.join(__dirname, 'scripts', 'eslint-plugin-oneagent.js'),
).href;
const oneagentPlugin = await import(pluginFileUrl).then((m) => m.default || m);

export default [
  {
    // Unified ignore list (migrated from .eslintignore and legacy configs)
    ignores: [
      'dist/**',
      'node_modules/**',
      'venv/**',
      '**/*.d.ts',
      'ui/**',
      'temp/**',
      'logs/**',
      'data/**',
      'oneagent_unified_memory/**',
      'oneagent_gemini_memory/**',
      'coreagent/dist/**',
      'coreagent/vscode-extension/**',
      // Temporarily ignore newly added large consolidation files pending modular refactor
      // (mission-control-ws.ts modularized; re-enabled for lint)
      'coreagent/monitoring/LatencySeries.ts',
      'coreagent/services/optionalNeo4jShim.ts',
      // Large integration test suites (temporary ignore until split/modularized)
      'coreagent/tests/integration/mission-control-ws.*.test.ts',
      'coreagent/tests/integration/unified-mcp-server.health.test.ts',
      'coreagent/tests/integration/**',
      'coreagent/tests/schemas/mission-control-message-schemas.json',
      // Targeted ignore: this single file in the VS Code extension triggers stale lint warnings in the monorepo run
      // The extension lints itself separately; we keep monorepo lint clean without masking other extension files
      'coreagent/vscode-extension/src/utils/unified-backbone.ts',
      // Legacy/JS scripts and tests are not part of strict TS lint
      'scripts/**/*.{js,cjs,mjs}',
      'tests/**/*.js',
      'tests/**/*.cjs',
      'tests/**/*.mjs',
      // Deprecated legacy hybrid registry/discovery tests (active duplicates ignored; archived copies retained)
      'tests/test-hybrid-registry-discovery*.ts',
      'tests/test-memory-driven-fallback.ts',
      'tests/test-simple-docs.ts',
      // Root JS utilities (kept runnable, not linted by TS rules)
      'validate-phase3.js',
      'final-verification.js',
      'final-verification.mjs',
      'production-verification.ts',
      'bmad-*.js',
      'test-*.js',
      // Legacy/deprecated test archives
      'tests/_legacy_archive/**',
      'tests/deprecated/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        global: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        AbortController: 'readonly',
        AbortSignal: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        self: 'readonly',
      },
    },
    rules: {
      // Allow CommonJS require in plain JS scripts/tests
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-useless-escape': 'warn',
      'no-case-declarations': 'warn',
      'prefer-const': 'warn',
    },
  },
  // Apply TypeScript recommended configs ONLY to TS files to avoid TS rules on JS
  ...tseslint.configs.recommended.map((c) => ({
    ...c,
    files: ['**/*.ts', '**/*.tsx'],
  })),
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        global: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        AbortController: 'readonly',
        AbortSignal: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'no-useless-escape': 'warn',
      'no-case-declarations': 'warn',
      'prefer-const': 'warn',
      'no-prototype-builtins': 'warn',
      // OneAgent custom rules (production TS)
      // Transitional: enforce as warning while migrating remaining modules to unified cache
      'oneagent/no-parallel-cache': [
        'warn',
        { allowLocal: true, allowFilesPattern: '(?:^|/)tests/|(?:^|/)scripts/|(?:^|/)ui/' },
      ],
      'oneagent/prefer-unified-time': 'warn',
      'oneagent/prefer-unified-id': 'warn',
    },
    plugins: {
      oneagent: oneagentPlugin,
    },
  },
  // Loosen some rules in tests to reduce noise while we focus on canonical consolidation
  {
    files: ['tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      // Tests often contain illustrative variables and scaffolding; disable unused-var noise there
      '@typescript-eslint/no-unused-vars': 'off',
      // Prevent tests from calling process.exit() which can kill CI runners
      // Warn on process.exit usage in tests; prevent CI hard failures until tests are updated
      'no-process-exit': 'warn',
      // Relax OneAgent custom rules in tests
      'oneagent/no-parallel-cache': 'off',
      'oneagent/prefer-unified-time': 'off',
      'oneagent/prefer-unified-id': 'off',
    },
    plugins: {
      oneagent: oneagentPlugin,
    },
  },
  // Per-file override to suppress stale monorepo lint warnings on this extension utility file
  {
    files: ['coreagent/vscode-extension/src/utils/unified-backbone.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
  },
];
