import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { routes, sitemapRoutes, type RegisteredRoute } from '@/content/routes'
import { routeRenderers, renderRoute } from '@/routing/render'
import { validateRouteManifest } from '@/routing/validateManifest'

const repositoryRoot = process.cwd()
const sourceRoot = resolve(repositoryRoot, 'src')

function outputPath(route: RegisteredRoute) {
  return resolve(repositoryRoot, route.input)
}

function countOccurrences(value: string, fragment: string) {
  return value.split(fragment).length - 1
}

function validateRenderRegistrations() {
  const manifestIds = routes.map((route) => route.id).sort()
  const rendererIds = Object.keys(routeRenderers).sort()
  if (
    manifestIds.length !== rendererIds.length ||
    manifestIds.some((id, index) => id !== rendererIds[index])
  ) {
    throw new Error(
      `Manifest/render registration drift (manifest: ${manifestIds.join(
        ', ',
      )}; renderers: ${rendererIds.join(', ')})`,
    )
  }
}

function validateBuiltDocument(route: RegisteredRoute, html: string) {
  const checks = [
    `<title>${route.metadata.title}</title>`,
    `name="description" content="${route.metadata.description}"`,
    `rel="canonical" href="${route.metadata.canonical}"`,
    `property="og:title" content="${route.metadata.openGraph.title}"`,
    `property="og:description" content="${route.metadata.openGraph.description}"`,
    `property="og:url" content="${route.metadata.openGraph.url}"`,
  ]
  const missing = checks.filter((check) => !html.includes(check))
  if (missing.length > 0) {
    throw new Error(`Missing generated metadata for route "${route.id}": ${missing.join(', ')}`)
  }
  if (countOccurrences(html, 'rel="canonical"') !== 1) {
    throw new Error(`Expected one canonical link for route "${route.id}"`)
  }
  if (!html.includes('<div id="root"></div>')) {
    throw new Error(`Expected empty build shell before prerender for route "${route.id}"`)
  }
}

function prerenderRoute(route: RegisteredRoute) {
  const file = outputPath(route)
  const html = readFileSync(file, 'utf8')
  validateBuiltDocument(route, html)

  const markup = renderToString(<StrictMode>{renderRoute(route.id)}</StrictMode>)
  if (markup.length < 500 || !markup.includes(route.delivery.expectedText)) {
    throw new Error(`Prerendered content is incomplete for route "${route.id}"`)
  }

  for (const crawlableRoute of sitemapRoutes) {
    if (!markup.includes(`href="${crawlableRoute.path}"`)) {
      throw new Error(
        `Route "${route.id}" has no crawlable link to "${crawlableRoute.path}"`,
      )
    }
  }

  const renderedDocument = html.replace(
    '<div id="root"></div>',
    `<div id="root">${markup}</div>`,
  )
  if (renderedDocument === html || renderedDocument.includes('<div id="root"></div>')) {
    throw new Error(`Failed to write prerendered root for route "${route.id}"`)
  }

  writeFileSync(file, renderedDocument)
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function writeSitemap() {
  const locations = sitemapRoutes.map(
    (route) => `  <url><loc>${escapeXml(route.metadata.canonical)}</loc></url>`,
  )
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...locations,
    '</urlset>',
    '',
  ].join('\n')

  if (sitemap.includes('/404.html') || locations.length !== sitemapRoutes.length) {
    throw new Error('Sitemap registration is incomplete or includes the 404 route')
  }

  writeFileSync(resolve(repositoryRoot, 'sitemap.xml'), sitemap)
}

validateRouteManifest(sourceRoot)
validateRenderRegistrations()
routes.forEach(prerenderRoute)
writeSitemap()

console.log(`Prerendered ${routes.length} routes and generated sitemap.xml`)
