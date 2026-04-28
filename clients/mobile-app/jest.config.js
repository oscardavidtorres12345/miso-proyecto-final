module.exports = {
  preset: 'react-native',
  testPathIgnorePatterns: ['/node_modules/', '/tests/e2e/'],
  moduleNameMapper: {
    '\\.svg$': '<rootDir>/tests/__mocks__/svgMock.tsx',
  },
};
