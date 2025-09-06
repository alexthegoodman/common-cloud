/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>"],
  testMatch: [
    "**/__tests__/**/*.test.(ts|tsx|js)",
    "**/*.(test|spec).(ts|tsx|js)",
  ],
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.test.json",
    },
  },
  transform: {
    "^.+.(ts|tsx)$": [
      "ts-jest",
      {
        useESM: true,
        astTransformers: {
          before: ["ts-jest-mock-import-meta"],
        },
      },
    ],
    "^.+.(js|jsx|mjs)$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  collectCoverageFrom: [
    "**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  transformIgnorePatterns: [
    // "/node_modules/(?!(@thi.ng|gl-matrix|uuid))",
    "^.+.module.(css|sass|scss)$",
  ],
  extensionsToTreatAsEsm: [".ts", ".tsx"],
};
