import { defineConfig, type HtmlTagDescriptor, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { routes, type Route } from './src/content/routes.ts'
import { validateRouteManifest } from './src/routing/validateManifest.ts'

const root = fileURLToPath(new URL('./src', import.meta.url))

function metadataTags(route: Route): HtmlTagDescriptor[] {
  const tags: HtmlTagDescriptor[] = [
    { tag: 'title', children: route.metadata.title, injectTo: 'head-prepend' },
    {
      tag: 'meta',
      attrs: { name: 'description', content: route.metadata.description },
      injectTo: 'head',
    },
    {
      tag: 'link',
      attrs: { rel: 'canonical', href: route.metadata.canonical },
      injectTo: 'head',
    },
    {
      tag: 'meta',
      attrs: { property: 'og:type', content: route.metadata.openGraph.type },
      injectTo: 'head',
    },
    {
      tag: 'meta',
      attrs: { property: 'og:site_name', content: 'Nazmul Alam' },
      injectTo: 'head',
    },
    {
      tag: 'meta',
      attrs: { property: 'og:title', content: route.metadata.openGraph.title },
      injectTo: 'head',
    },
    {
      tag: 'meta',
      attrs: {
        property: 'og:description',
        content: route.metadata.openGraph.description,
      },
      injectTo: 'head',
    },
    {
      tag: 'meta',
      attrs: { property: 'og:url', content: route.metadata.openGraph.url },
      injectTo: 'head',
    },
    {
      tag: 'meta',
      attrs: { name: 'twitter:card', content: 'summary' },
      injectTo: 'head',
    },
    {
      tag: 'script',
      attrs: { type: 'module', src: route.entryScript },
      injectTo: 'body',
    },
  ]

  if (!route.indexable) {
    tags.push({
      tag: 'meta',
      attrs: { name: 'robots', content: 'noindex' },
      injectTo: 'head',
    })
  }

  return tags
}

function routeDocumentPlugin(): Plugin {
  return {
    name: 'route-document-manifest',
    transformIndexHtml: {
      order: 'pre',
      handler(html, context) {
        const input = relative(root, context.filename).replaceAll('\\', '/')
        const route = routes.find((candidate) => candidate.input === input)
        if (!route) throw new Error(`No route manifest record for HTML input: ${input}`)
        return { html, tags: metadataTags(route) }
      },
    },
  }
}

// The site is a GitHub *user pages* repo served from the branch root, so the built
// output is committed at the repo root and `base` is '/'.
//
// This is a multi-page build, not a SPA: every route below is a real HTML file, so
// deep links resolve as static files. That avoids the 404.html redirect hack, which
// would otherwise collide with the genuine 404 page.
export default defineConfig(({ command }) => {
  validateRouteManifest(root)

  return {
    root,
    base: '/',
    // Dev only. In production the out dir IS the repo root, where CNAME, favicon.ico and
    // img/ already live permanently — copying them over themselves is redundant, and Vite
    // warns when publicDir sits inside outDir. src/public mirrors them so the dev server
    // resolves /img/... and /favicon.ico the same way the deployed site does.
    publicDir: command === 'serve' ? resolve(root, 'public') : false,
    plugins: [routeDocumentPlugin(), react(), tailwindcss()],
    resolve: {
      alias: { '@': root },
    },
    build: {
      // Emit to the repo root. `emptyOutDir` MUST stay false — the out dir is the repo
      // itself, and emptying it would delete CNAME, img/, docs/ and the source tree.
      // `yarn clean` clears assets/ explicitly so stale hashed bundles don't accumulate.
      outDir: resolve(root, '..'),
      emptyOutDir: false,
      rollupOptions: {
        input: Object.fromEntries(
          routes.map((route) => [route.id, resolve(root, route.input)]),
        ),
      },
    },
  }
})
