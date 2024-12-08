import pkg from '@typescript-eslint/eslint-plugin';
const { eslintPlugin } = pkg;
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from './prettier.config.js';

export default [
  {
    files: ['**/*.ts'],
    ignores: ['node_modules', 'dist'],
    languageOptions: {
      parser: '@typescript-eslint/parser',
      ecmaVersion: '2020',
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': eslintPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': ['error', prettierConfig], // 确保 Prettier 的规则应用
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
];
