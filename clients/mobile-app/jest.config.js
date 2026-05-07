module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/tests/setupEnv.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setupAfterFramework.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/tests/e2e/'],
  moduleNameMapper: {
    '\\.svg$': '<rootDir>/tests/__mocks__/svgMock.tsx',
    '\\.(avif|png|jpg|jpeg|webp)$': '<rootDir>/tests/__mocks__/fileMock.ts',
    '^react-native-svg$': '<rootDir>/tests/__mocks__/react-native-svg.tsx',
    '^react-native-calendars$': '<rootDir>/tests/__mocks__/react-native-calendars.tsx',
    '^react-native-safe-area-context$': '<rootDir>/tests/__mocks__/react-native-safe-area-context.ts',
    '^lucide-react-native$': '<rootDir>/tests/__mocks__/lucide-react-native.tsx',
    '^@react-native-async-storage/async-storage$': '<rootDir>/tests/__mocks__/async-storage.ts',
    '^expo-camera$': '<rootDir>/tests/__mocks__/expo-camera.tsx',
    '^react-native/Libraries/Lists/VirtualizedList$': '<rootDir>/tests/__mocks__/VirtualizedList.js',
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
  coverageReporters: process.env.CI ? ['text', 'lcov'] : ['text', 'lcov', 'html'],
};
