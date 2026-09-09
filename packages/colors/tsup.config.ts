import { defineConfig, type Options } from 'tsup'

export default defineConfig((options: Options) => ({
  entry: { index: './src/index.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  minify: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  external: [],
  ignoreWatch: ['src/**/*.test.ts'],
  outDir: 'dist/',
  ...options,
}))
