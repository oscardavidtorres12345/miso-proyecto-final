module.exports = {
  root: true,
  extends: '@react-native',
  ignorePatterns: ['coverage/**'],
  overrides: [
    {
      files: ['tests/e2e/**/*.js'],
      globals: {
        device: 'readonly',
        element: 'readonly',
        by: 'readonly',
      },
    },
  ],
};
