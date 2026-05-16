module.exports = {
  root: true,
  extends: '@react-native',
  ignorePatterns: ['coverage/**'],
  overrides: [
    {
      files: ['.eslintrc.js'],
      parser: 'espree',
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'script',
      },
    },
    {
      files: ['tests/e2e/**/*.js'],
      parser: 'espree',
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'script',
      },
      env: {
        jest: true,
      },
      globals: {
        device: 'readonly',
        element: 'readonly',
        waitFor: 'readonly',
        by: 'readonly',
      },
    },
  ],
};
