import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'

// The generator only owns disposable staging output. GitHub Pages publication
// is a separate, validated operation; never use the repository root as outDir.
export default defineConfig({
  site: 'https://nalam.me',
  server: { host: '127.0.0.1', port: 3000 },
  output: 'static',
  trailingSlash: 'always',
  srcDir: './src',
  publicDir: './src/public',
  outDir: './dist/site-build',
  integrations: [
    react(),
    mdx(),
    sitemap({ filter: (page) => !['/404.html', '/publication-manifest.json'].includes(new URL(page).pathname) }),
  ],
  build: { format: 'directory', assets: 'assets' },
  devToolbar: { enabled: false },
  vite: {
    plugins: [tailwindcss()],
    build: { sourcemap: false },
  },
})
