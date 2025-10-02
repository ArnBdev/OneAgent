// Jest configuration (canonical)
// - Adds top-level tests directory (tests/**/*)
// - Retains existing coreagent tests path until migration completes
// - Uses new ts-jest transform configuration (no deprecated globals usage)
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/coreagent/tests', '<rootDir>/coreagent/tests/unit'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
        diagnostics: true,
        isolatedModules: false,
      },
    ],
    // Transform ESM modules to CommonJS for Jest
    '^.+\\.m?js$': [
      'ts-jest',
      {
        useESM: false,
        tsconfig: {
          allowJs: true,
          esModuleInterop: true,
        },
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'mjs'],
  // Transform ESM modules (marked, etc.) that Jest can't parse by default
  transformIgnorePatterns: ['node_modules/(?!(marked)/)'],
  // Setup requiring Jest globals (beforeEach/afterEach) must run after env install
  setupFilesAfterEnv: ['<rootDir>/coreagent/tests/jest.setup.ts'],
  // Future: enable coverage thresholds once suite expanded
  collectCoverageFrom: [
    'coreagent/**/*.ts',
    '!coreagent/**/*.d.ts',
    '!coreagent/**/index.ts',
    '!coreagent/**/types/**',
  ],
};
