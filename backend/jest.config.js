module.exports = {
  testEnvironment: "node",
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/index.js",
    "!src/server.js",
    "!src/config/**"
  ],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/tests/"
  ],
  testMatch: [
    "**/tests/**/*.test.js"
  ],
  setupFilesAfterEnv: [
    "<rootDir>/tests/setup.js"
  ],
  testTimeout: 60000
};
