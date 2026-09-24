const path = require('path');

/** @type {import('jest').Config} */
module.exports = {
  rootDir: __dirname,
  moduleDirectories: ['node_modules', path.resolve(__dirname, 'node_modules')],
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
  },
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
            tsx: true,
          },
          transform: {
            react: {
              runtime: 'automatic',
            },
          },
        },
      },
    ],
  },
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/node_modules_corrupt/'],
  collectCoverageFrom: [
    'src/lib/osint/history.ts',
    'src/lib/osint/cryptoHash.ts',
    'src/lib/osint/fetchWithRetry.ts',
    'src/lib/osint/codebaseData.ts',
    'src/components/ErrorBoundary.tsx',
    'src/components/SkeletonLoader.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
