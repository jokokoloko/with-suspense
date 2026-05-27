import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const vitestConfig = defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
})

export default vitestConfig
