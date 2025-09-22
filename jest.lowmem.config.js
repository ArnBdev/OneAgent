// Minimal Jest config for low-memory quick validation
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/coreagent/tests/memgraph', '<rootDir>/tests/unit'],
  testMatch: ['**/optionalNeo4jShim.test.ts', '**/canonical-id-generation.test.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      { tsconfig: '<rootDir>/tsconfig.json', diagnostics: false, isolatedModules: true },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  setupFilesAfterEnv: [],
};
