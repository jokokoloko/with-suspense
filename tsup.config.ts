import { defineConfig } from 'tsup'

const tsupConfig = defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  external: ['react'],
  sourcemap: true,
})

export default tsupConfig
