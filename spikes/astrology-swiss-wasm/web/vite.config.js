import { resolve } from 'node:path'
import { defineConfig } from 'vite'

const neutralOnly = process.env.ASTRO_SPIKE_NEUTRAL_ONLY === '1'

export default defineConfig({
  publicDir: neutralOnly ? resolve(import.meta.dirname, 'public-neutral') : 'public',
  build: {
    rollupOptions: {
      input: neutralOnly
        ? resolve(import.meta.dirname, 'index.html')
        : {
            probe: resolve(import.meta.dirname, 'index.html'),
            swissLocal: resolve(import.meta.dirname, 'swiss-local.html'),
          },
    },
  },
})
