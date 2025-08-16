module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', '@typescript-eslint/recommended'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  rules: {
    // Code quality rules
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',

    // Import rules
    'no-duplicate-imports': 'error',

    // General code quality
    'no-console': 'off', // Allow console for logging in this project
    'prefer-const': 'error',
    'no-var': 'error',

    // OneAgent specific rules
    'no-unused-expressions': 'off', // Allow for agent method chaining
    '@typescript-eslint/no-unused-expressions': 'off',
  },
  ignorePatterns: [
    'dist/**',
    'node_modules/**',
    '*.js',
    'temp/**',
    'logs/**',
    'data/**',
    '__pycache__/**',
    '*.d.ts',
    'scripts/**/*.js',
    'scripts/**/*.cjs',
    'scripts/**/*.mjs',
    'tests/**/*.js',
    '*.config.js',
    'test-*.js',
    'tests/test-tier-system-implementation.ts',
    'docs/**/*.ts',
  ],
  env: {
    node: true,
    es2020: true,
  },
};
