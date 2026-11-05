import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default defineConfig((env) =>
  mergeConfig(viteConfig(env), {
    test: {
      environment: 'jsdom',
      // Process component CSS so tests can check what ends up in the shadow root.
      css: true,
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
  }),
)
