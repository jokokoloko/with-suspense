import { defineConfig } from 'tsup'

const tsupConfig = defineConfig({
  entry: ['src/index.ts'],
  tsconfig: 'tsconfig.build.json',
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  external: ['react'],
  sourcemap: true,
})

export default tsupConfig
