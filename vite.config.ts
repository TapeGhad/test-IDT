import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Dev server (playground) + the standalone Web Component bundle (Vue and Chart.js included).
// The Vue library build lives in vite.lib.config.ts.
// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Library mode leaves `process.env.NODE_ENV` for the consumer's bundler; this bundle has none.
  define: command === 'build' ? { 'process.env.NODE_ENV': JSON.stringify('production') } : {},
  build: {
    outDir: 'dist/wc',
    copyPublicDir: false,
    lib: {
      entry: fileURLToPath(new URL('./src/entry-wc.ts', import.meta.url)),
      formats: ['es'],
      fileName: () => 'store-sales-report.js',
    },
    // Lib mode keeps whitespace in ES output for downstream bundlers; this file goes to browsers as is.
    rolldownOptions: {
      output: { minify: true },
    },
  },
}))
