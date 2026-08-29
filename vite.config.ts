import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('./src', import.meta.url))

// The site is a GitHub *user pages* repo served from the branch root, so the built
// output is committed at the repo root and `base` is '/'.
//
// This is a multi-page build, not a SPA: every route below is a real HTML file, so
// deep links resolve as static files. That avoids the 404.html redirect hack, which
// would otherwise collide with the genuine 404 page.
export default defineConfig(({ command }) => ({
  root,
  base: '/',
  // Dev only. In production the out dir IS the repo root, where CNAME, favicon.ico and
  // img/ already live permanently — copying them over themselves is redundant, and Vite
  // warns when publicDir sits inside outDir. src/public mirrors them so the dev server
  // resolves /img/... and /favicon.ico the same way the deployed site does.
  publicDir: command === 'serve' ? resolve(root, 'public') : false,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': root },
  },
  build: {
    // Emit to the repo root. `emptyOutDir` MUST stay false — the out dir is the repo
    // itself, and emptying it would delete CNAME, img/, docs/ and the source tree.
    // `yarn prebuild` clears assets/ instead so stale hashed bundles don't accumulate.
    outDir: resolve(root, '..'),
    emptyOutDir: false,
    rollupOptions: {
      input: {
        home: resolve(root, 'index.html'),
        notFound: resolve(root, '404.html'),
        cisco: resolve(root, 'work/cisco/index.html'),
        fidelity: resolve(root, 'work/fidelity/index.html'),
        hmh: resolve(root, 'work/hmh/index.html'),
        optum: resolve(root, 'work/optum/index.html'),
      },
    },
  },
}))
