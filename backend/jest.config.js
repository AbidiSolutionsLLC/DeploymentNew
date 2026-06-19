module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  clearMocks: true,
  restoreMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/'],
  testTimeout: 30000,
};
