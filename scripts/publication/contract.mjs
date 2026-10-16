import { assertPublicPath, isEmittedAsset, isImage, origin, protectedFiles, routeInput, staticFonts } from './paths.mjs'

function nonEmpty(value, label) {
  if (typeof value !== 'string' || !value.trim() || value.length > 20000) throw new Error(`Invalid ${label}.`)
  return value
}

export function validateManifest(input) {
  if (!input || input.version !== 1 || input.origin !== origin || !Array.isArray(input.routes) ||
    !input.routes.length || input.routes.length > 5000 || !Array.isArray(input.assets)) throw new Error('Invalid publication manifest.')
  const paths = new Set()
  const files = new Set()
  const canonicals = new Set()
  const routes = input.routes.map((record) => {
    const expectedInput = routeInput(record.path)
    assertPublicPath(expectedInput)
    if (record.input !== expectedInput) throw new Error(`Route input/path mismatch: ${record.path}`)
    if (paths.has(record.path) || files.has(record.input) || canonicals.has(record.metadata?.canonical)) throw new Error(`Duplicate route/input/canonical: ${record.path}`)
    if (typeof record.indexable !== 'boolean' || (record.path === '/404.html' && record.indexable)) throw new Error('Invalid 404/indexability contract.')
    const canonical = `${origin}${record.path}`
    if (record.metadata?.canonical !== canonical || record.metadata?.openGraph?.url !== canonical) throw new Error(`Manifest canonical mismatch: ${record.path}`)
    for (const field of ['title', 'description']) nonEmpty(record.metadata[field], `route ${field}`)
    for (const field of ['type', 'title', 'description', 'url']) nonEmpty(record.metadata.openGraph[field], `open graph ${field}`)
    if (!['website', 'article', 'profile'].includes(record.metadata.openGraph.type)) throw new Error('Invalid open graph type.')
    nonEmpty(record.expectedText, 'meaningful expected text')
    paths.add(record.path); files.add(record.input); canonicals.add(canonical)
    return { path: record.path, input: record.input, metadata: record.metadata, indexable: record.indexable, expectedText: record.expectedText }
  })
  if (!paths.has('/') || !paths.has('/404.html')) throw new Error('The manifest needs the home and genuine 404 routes.')
  const assetPaths = new Set()
  const assets = input.assets.map((record) => {
    if (typeof record.path !== 'string' || !record.path.startsWith('/') || !isImage(record.path.slice(1))) throw new Error('Unapproved manifest image path.')
    assertPublicPath(record.path.slice(1))
    if (assetPaths.has(record.path)) throw new Error(`Duplicate manifest asset: ${record.path}`)
    assetPaths.add(record.path)
    nonEmpty(record.alt, 'asset alternative text')
    if (record.caption !== undefined) nonEmpty(record.caption, 'asset caption')
    return { path: record.path, alt: record.alt, ...(record.caption ? { caption: record.caption } : {}) }
  })
  return { version: 1, origin, routes, assets }
}

export function eligibleFile(path, manifest) {
  assertPublicPath(path)
  return manifest.routes.some((route) => route.input === path) || path === 'sitemap.xml' ||
    protectedFiles.has(path) || staticFonts.has(path) || isEmittedAsset(path) ||
    manifest.assets.some((asset) => asset.path === `/${path}`)
}
