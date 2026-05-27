import js from '@eslint/js'
import prettier from 'eslint-config-prettier/flat'
import pluginReact from 'eslint-plugin-react'
import pluginReactHooks from 'eslint-plugin-react-hooks'
import { defineConfig, globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'

const eslintConfig = defineConfig([
  js.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat['jsx-runtime'],
  pluginReactHooks.configs.flat['recommended-latest'],
  prettier,
  {
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  globalIgnores(['dist/**', 'node_modules/**']),
])

export default eslintConfig
