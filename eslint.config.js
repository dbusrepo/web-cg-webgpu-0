import path from 'path';
import { fileURLToPath } from 'url';
import { includeIgnoreFile } from '@eslint/compat';
import pluginJs from '@eslint/js';
import typescriptEslintParser from '@typescript-eslint/parser';
import eslintConfigPrettier from 'eslint-config-prettier';
import * as depend from 'eslint-plugin-depend';
import github from 'eslint-plugin-github';
import pluginJsxA11y from 'eslint-plugin-jsx-a11y';
import pluginNoRelativeImports from 'eslint-plugin-no-relative-import-paths';
import pluginPrettier from 'eslint-plugin-prettier';
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
// import eslintConfigPreact from 'eslint-config-preact'; // TODO
import pluginUnusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import sonarjs from 'eslint-plugin-sonarjs';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, '.gitignore');

/** @type {import('eslint').Linter.Config[]} */
export default [
  includeIgnoreFile(gitignorePath),
  {
    ignores: ['eslint.config.js', 'src/engine/wasmEngine/wasm', 'src/ui/guify'],
  },
  { files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  // ...tseslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  // ...fixupConfigRules(eslintConfigPreact),
  depend.configs['flat/recommended'],
  github.getFlatConfigs().browser,
  github.getFlatConfigs().recommended,
  github.getFlatConfigs().react,
  ...github.getFlatConfigs().typescript,
  sonarjs.configs.recommended,
  // see https://github.com/sindresorhus/eslint-plugin-unicorn/issues/2546
  // eslintPluginUnicorn.configs.recommended,
  eslintPluginUnicorn.configs["flat/recommended"],
  eslintConfigPrettier,
  eslintPluginPrettierRecommended,
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
      'no-relative-import-paths': pluginNoRelativeImports,
      'unused-imports': pluginUnusedImports,
      prettier: pluginPrettier,
    },
    rules: {
      'unicorn/better-regex': 'warn',
      // 'github/array-foreach': 'error',
      // 'github/async-preventdefault': 'warn',
      // 'github/no-then': 'error',
      // 'github/no-blur': 'error',
      'prettier/prettier': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      '@typescript-eslint/no-empty-function': 'error',
      '@typescript-eslint/no-empty-interface': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-useless-escape': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-vars': [
        'off',
        { ignoreRestSiblings: true },
      ],
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      'array-callback-return': 'warn',
      eqeqeq: ['warn', 'smart'],
      curly: ['error', 'all'],
      complexity: ['warn', 35],
      'unused-imports/no-unused-imports': 'warn',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      // 'no-duplicate-imports': 0,
      'no-nested-ternary': 'warn',
      'no-relative-import-paths/no-relative-import-paths': [
        'error',
        { allowSameFolder: true, rootDir: 'src' },
      ],
      'no-unused-vars': 'off',
      'no-unneeded-ternary': 'warn',
      'require-await': 'warn',
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/display-name': 0,
      'react/prop-types': 'off',
      'react/require-default-props': 'off',
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/no-autofocus': 'warn',
    },
  },
];
