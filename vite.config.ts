/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

/** Emits /precache-manifest.json listing every built asset so the service worker can cache all engines. */
function precacheManifest(): Plugin {
  return {
    name: 'precache-manifest',
    apply: 'build',
    generateBundle(_options, bundle) {
      const files = Object.keys(bundle)
        .filter((f) => f.startsWith('assets/'))
        .map((f) => `/${f}`)
      this.emitFile({ type: 'asset', fileName: 'precache-manifest.json', source: JSON.stringify(files) })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), precacheManifest()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 600,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setupTests.ts'],
    exclude: ['**/node_modules/**', '**/e2e/**', '**/dist/**'],
  },
})
