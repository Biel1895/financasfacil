import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'test-results/**',
      'backups/**',
      'tests/fixtures/previous-version/**',
      'app.js',
      'style.css',
      'landing.js',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
    },
    rules: {
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/js/**/*.js', 'config.js'],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['src/pwa/service-worker.js'],
    languageOptions: { globals: globals.serviceworker },
  },
  {
    files: ['scripts/**/*.mjs', 'tests/unit/**/*.js', 'eslint.config.js'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['tests/e2e/**/*.cjs'],
    languageOptions: {
      globals: {
        FF_STATE: 'readonly',
        ...globals.browser,
        ...globals.node,
        FF_LocalDB: 'readonly',
        FF_Finance: 'readonly',
        FF_Planning: 'readonly',
        FF_NLP: 'readonly',
      },
    },
  },
];
