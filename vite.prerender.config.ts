import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('./src', import.meta.url))

export default defineConfig({
  root,
  plugins: [react()],
  resolve: {
    alias: { '@': root },
  },
  build: {
    ssr: resolve(root, 'prerender.tsx'),
    outDir: resolve(root, '../.prerender'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'prerender.mjs',
      },
    },
  },
})
