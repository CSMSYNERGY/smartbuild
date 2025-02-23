export default {
  transform: {},
  testEnvironment: "node",
  testMatch: ["<rootDir>/test/**/*.test.js"],
  moduleFileExtensions: ["js", "json"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/**/*.config.js",
    "!**/node_modules/**",
  ],
};
