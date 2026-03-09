import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import prettierConfig from 'eslint-config-prettier'
import globals from 'globals'

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'coverage'] },
  {
    files: ['src/**/*.ts'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, prettierConfig],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
    },
  },
  {
    // node-sqlite3-wasm has no TypeScript types; any is required for the WASM import pattern
    files: ['src/services/db.ts', 'src/services/db.test.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  }
)
