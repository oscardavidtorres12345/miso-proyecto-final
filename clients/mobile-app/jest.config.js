module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/tests/setupEnv.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/tests/e2e/'],
  moduleNameMapper: {
    '\\.svg$': '<rootDir>/tests/__mocks__/svgMock.tsx',
    '^react-native-svg$': '<rootDir>/tests/__mocks__/react-native-svg.tsx',
    '^react-native-calendars$': '<rootDir>/tests/__mocks__/react-native-calendars.tsx',
    '^react-native-safe-area-context$': '<rootDir>/tests/__mocks__/react-native-safe-area-context.ts',
    '^lucide-react-native$': '<rootDir>/tests/__mocks__/lucide-react-native.tsx',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**',
    '!src/config/**',
  ],
  coverageThreshold: {
    global: {
      lines: 90,
      functions: 90,
      branches: 90,
      statements: 90,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
};
