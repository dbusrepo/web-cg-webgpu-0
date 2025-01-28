import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { /* fixupConfigRules, */ fixupPluginRules, includeIgnoreFile } from '@eslint/compat';
import pluginJs from '@eslint/js';
import typescriptEslintParser from '@typescript-eslint/parser';
import eslintConfigPrettier from 'eslint-config-prettier';
import pluginJsxA11y from 'eslint-plugin-jsx-a11y';
import pluginNoRelativeImports from 'eslint-plugin-no-relative-import-paths';
import pluginPrettier from 'eslint-plugin-prettier';
// import eslintConfigPreact from 'eslint-config-preact';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginReactRefresh from 'eslint-plugin-react-refresh';
import pluginUnusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, '.gitignore');

/** @type {import('eslint').Linter.Config[]} */
export default [
  includeIgnoreFile(gitignorePath),
  {
    ignores: ['src/engine/wasmEngine/wasm', 'src/ui/guify'],
  },
  { files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  // ...tseslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  // ...fixupConfigRules(eslintConfigPreact),
  pluginReact.configs.flat.recommended,
  eslintConfigPrettier,
  {
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        node: {
          paths: ['src'],
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
    languageOptions: {
      parser: typescriptEslintParser,
      parserOptions: { project: ['tsconfig.json'] },
      globals: { ...globals.node, ...globals.amd, ...globals.browser },
    },
  },
  {
    plugins: {
      'jsx-a11y': pluginJsxA11y,
      'react-refresh': pluginReactRefresh,
      'react-hooks': fixupPluginRules(pluginReactHooks),
      'no-relative-import-paths': pluginNoRelativeImports,
      'unused-imports': pluginUnusedImports,
      prettier: pluginPrettier,
    },
    rules: {
      'prettier/prettier': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': ['off', { ignoreRestSiblings: true }],
      '@typescript-eslint/no-inferrable-types': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
];
