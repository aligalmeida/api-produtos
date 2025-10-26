/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js'],
  testTimeout: 30000,
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/tests/"
  ]
};
