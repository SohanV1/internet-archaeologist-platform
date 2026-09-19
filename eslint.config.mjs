import tsParser from '@typescript-eslint/parser';

export default [
  {
    files: ['src/**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }]
    }
  },
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      '.netlify/**',
      'coverage/**',
      'dist/**',
      'build/**'
    ]
  }
];
