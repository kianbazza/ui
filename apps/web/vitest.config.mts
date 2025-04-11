import path from 'node:path'
import react from '@vitejs/plugin-react'
import tsConfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsConfigPaths(), react()],
  test: {
    include: ['./**/*.test.?(c|m)[jt]s?(x)'],
    exclude: ['./node_modules/**/*'],
    globals: true,
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
