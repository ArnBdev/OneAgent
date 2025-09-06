import js from '@eslint/js';
import tseslint from 'typescript-eslint';

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
      'coreagent/vscode-extension/out/**',
      // Legacy/JS scripts and tests are not part of strict TS lint
      'scripts/**/*.{js,cjs,mjs}',
      'tests/**/*.js',
      'tests/**/*.cjs',
      'tests/**/*.mjs',
      // Deprecated Context7 and legacy hybrid registry/discovery tests (active duplicates ignored; archived copies retained)
      'tests/test-context7-*.ts',
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
    },
  },
];
