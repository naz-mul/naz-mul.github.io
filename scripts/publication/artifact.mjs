import { mkdir, rename, rm, lstat } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import {
  assertPublicPath, canonicalRoot, exists, guardedPath, inside, inventoryDigest,
  isEmittedAsset, origin, parseJson, protectedFiles, readSafe,
  resolveForRoot, safeRelative, sha256, staticFonts, walkFiles, writeAtomic,
} from './paths.mjs'
import { eligibleFile, validateManifest } from './contract.mjs'
export { eligibleFile, validateManifest } from './contract.mjs'
import { contentSecurityPolicy, cssReferences, inspectHtml, inspectSvg, moduleReferences, referenceUrl } from './inspect.mjs'

function xmlLocations(xml) {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('Sitemap DTD/entity declarations are prohibited.')
  return [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map((match) => match[1].trim()
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'"))
}

async function validatePluginSitemap(buildRoot, sourceFiles, manifest) {
  const expected = manifest.routes.filter((route) => route.indexable).map((route) => route.metadata.canonical).sort()
  let actual = []
  if (sourceFiles.includes('sitemap-index.xml')) {
    const index = (await readSafe(buildRoot, 'sitemap-index.xml')).toString('utf8')
    if (!/<sitemapindex\b/.test(index)) throw new Error('Invalid generated sitemap index.')
    for (const location of xmlLocations(index)) {
      const url = new URL(location)
      if (url.origin !== origin || !/^\/sitemap-\d+\.xml$/.test(url.pathname) || url.search || url.hash) throw new Error('Invalid generated sitemap projection path.')
      const xml = (await readSafe(buildRoot, url.pathname.slice(1))).toString('utf8')
      if (!/<urlset\b/.test(xml)) throw new Error('Invalid generated sitemap URL set.')
      actual.push(...xmlLocations(xml))
    }
  } else if (sourceFiles.includes('sitemap.xml')) {
    actual = xmlLocations((await readSafe(buildRoot, 'sitemap.xml')).toString('utf8'))
  } else return
  if (new Set(actual).size !== actual.length || JSON.stringify(actual.sort()) !== JSON.stringify(expected)) throw new Error('Generated sitemap membership differs from eligible routes.')
}

function sitemapXml(manifest) {
  const urls = manifest.routes.filter((route) => route.indexable).map((route) => `  <url><loc>${route.metadata.canonical}</loc></url>`)
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
}

async function confinedOutput(root, path) {
  const absolute = resolve(path)
  if (!inside(resolve(root, 'dist'), absolute)) throw new Error('Publication staging/report must be inside the disposable dist directory.')
  const rel = relative(root, absolute).split('\\').join('/')
  await guardedPath(root, rel, { allowMissing: true, hidden: true })
  return absolute
}

/** Build an in-memory reviewed allowlist before replacing any public artifact. */
export async function preparePublic({ root = process.cwd(), buildDir, outDir, reportPath } = {}) {
  const requestedRoot = root
  root = await canonicalRoot(root)
  buildDir = resolveForRoot(requestedRoot, root, buildDir ?? resolve(root, 'dist/site-build'))
  outDir = await confinedOutput(root, resolveForRoot(requestedRoot, root, outDir ?? resolve(root, 'dist/public')))
  reportPath = await confinedOutput(root, resolveForRoot(requestedRoot, root, reportPath ?? resolve(root, 'dist/publication-report.json')))
  if (outDir === buildDir || inside(buildDir, outDir) || inside(outDir, buildDir) || reportPath === outDir ||
    reportPath === buildDir || inside(outDir, reportPath) || inside(buildDir, reportPath)) throw new Error('Build, public artifact and report paths must remain separate.')
  if (await exists(reportPath) && !(await lstat(reportPath)).isFile()) throw new Error('Public artifact report destination is not a regular file.')
  const buildRelative = relative(root, buildDir).split('\\').join('/')
  await guardedPath(root, buildRelative)
  const buildRoot = await canonicalRoot(buildDir)
  const sourceFiles = await walkFiles(buildRoot)
  const manifest = validateManifest(parseJson(await readSafe(buildRoot, 'publication-manifest.json'), 'publication manifest'))
  const routeFiles = new Set(manifest.routes.map((route) => route.input))
  const routeByPath = new Map(manifest.routes.map((route) => [route.path, route]))
  const approvedAssets = new Set(manifest.assets.map((asset) => asset.path.slice(1)))
  for (const file of sourceFiles) {
    if (file === 'publication-manifest.json' || /^sitemap(?:-index|-\d+)?\.xml$/.test(file)) continue
    assertPublicPath(file)
    if (file.endsWith('.html') && !routeFiles.has(file)) throw new Error(`Orphan/undeclared HTML route: ${file}`)
    if (!eligibleFile(file, manifest)) throw new Error(`Unapproved build file outside the public allowlist: ${file}`)
  }
  await validatePluginSitemap(buildRoot, sourceFiles, manifest)

  const contents = new Map()
  const facts = new Map()
  const edges = new Map()
  const pending = []
  const scriptHashes = new Set()
  const styleHashes = new Set()
  const styleAttributeHashes = new Set()
  let embeddedImages = false
  const absorb = (target, values) => { for (const value of values) target.add(value) }
  const read = async (path) => {
    if (!contents.has(path)) {
      if (!eligibleFile(path, manifest)) throw new Error(`Unapproved asset outside the public allowlist: ${path}`)
      contents.set(path, await readSafe(buildRoot, path))
    }
    return contents.get(path)
  }
  const seedResource = (value, base, pageFacts, embeddedDepth = 0) => {
    if (embeddedDepth > 5) throw new Error('Embedded image nesting exceeds the validation limit.')
    const result = referenceUrl(value, base, { resource: true })
    if (result.embedded) {
      embeddedImages = true
      if (result.svg !== undefined) {
        const detail = inspectSvg(result.svg, 'embedded SVG image')
        absorb(styleHashes, detail.styleHashes); absorb(styleAttributeHashes, detail.styleAttributeHashes)
        for (const resource of detail.references) seedResource(resource, base, undefined, embeddedDepth + 1)
      }
      return
    }
    if (pageFacts && result.path === base && result.fragment) {
      if (!pageFacts.ids.has(result.fragment)) throw new Error(`Missing local SVG fragment: ${base}#${result.fragment}`)
      return
    }
    const file = result.path.slice(1)
    safeRelative(file)
    if (routeFiles.has(file) || routeByPath.has(result.path)) throw new Error(`HTML cannot be used as an asset: ${result.path}`)
    if (!(isEmittedAsset(file) || staticFonts.has(file) || protectedFiles.has(file) || approvedAssets.has(file))) throw new Error(`Unapproved runtime asset outside the public allowlist: ${result.path}`)
    pending.push(file)
  }

  for (const route of manifest.routes) {
    const body = (await read(route.input)).toString('utf8')
    const detail = inspectHtml(body, route)
    facts.set(route.path, detail)
    absorb(scriptHashes, detail.scriptHashes); absorb(styleHashes, detail.styleHashes); absorb(styleAttributeHashes, detail.styleAttributeHashes)
    for (const resource of detail.resources) seedResource(resource, route.path, detail)
    for (const script of detail.scripts) for (const resource of await moduleReferences(script, route.input)) seedResource(resource, route.path, detail)
    for (const style of detail.styles) for (const resource of cssReferences(style, route.input)) seedResource(resource, route.path, detail)
  }

  // Body links resolve only to eligible routes, discovery or reviewed resources.
  for (const route of manifest.routes) {
    const linkedRoutes = new Set()
    for (const link of facts.get(route.path).links) {
      const target = referenceUrl(link, route.path)
      if (target.external) continue
      const destination = routeByPath.get(target.path)
      if (destination) {
        if (target.fragment && !facts.get(target.path).ids.has(target.fragment)) throw new Error(`Missing link fragment: ${target.path}#${target.fragment}`)
        if (destination.indexable) linkedRoutes.add(target.path)
      } else if (target.path === '/sitemap.xml') {
        if (target.fragment) throw new Error('Sitemap links cannot name HTML fragments.')
      } else {
        if (target.fragment) throw new Error(`Non-HTML link fragment cannot be verified: ${target.path}`)
        seedResource(link, route.path)
      }
    }
    edges.set(route.path, linkedRoutes)
  }
  const reachable = new Set(['/'])
  const queue = ['/']
  for (let index = 0; index < queue.length; index++) {
    for (const path of edges.get(queue[index]) ?? []) if (!reachable.has(path)) { reachable.add(path); queue.push(path) }
  }
  for (const route of manifest.routes) if (route.indexable && !reachable.has(route.path)) throw new Error(`Orphan/unreachable public route: ${route.path}`)

  const visited = new Set()
  while (pending.length) {
    const path = pending.pop()
    if (visited.has(path)) continue
    visited.add(path)
    const bytes = await read(path)
    const base = `/${path}`
    if (/\.m?js$/.test(path)) for (const resource of await moduleReferences(bytes.toString('utf8'), path)) seedResource(resource, base)
    if (/\.css$/.test(path)) for (const resource of cssReferences(bytes.toString('utf8'), path)) seedResource(resource, base)
    if (/\.svg$/.test(path)) {
      const detail = inspectSvg(bytes.toString('utf8'), path)
      absorb(styleHashes, detail.styleHashes); absorb(styleAttributeHashes, detail.styleAttributeHashes)
      for (const resource of detail.references) seedResource(resource, base)
    }
  }
  const cname = await read('CNAME')
  if (cname.toString('utf8').trim() !== 'nalam.me') throw new Error('CNAME does not match the canonical domain.')
  await read('favicon.ico')
  if (sourceFiles.includes('.nojekyll') && (await readSafe(buildRoot, '.nojekyll')).length !== 0) throw new Error('The .nojekyll marker must be empty.')
  contents.set('.nojekyll', Buffer.from(''))
  contents.set('sitemap.xml', Buffer.from(sitemapXml(manifest)))
  const files = [...contents].map(([path, bytes]) => ({ path, sha256: sha256(bytes), size: bytes.length })).sort((a, b) => a.path.localeCompare(b.path))
  const csp = contentSecurityPolicy({ scriptHashes, styleHashes, styleAttributeHashes, embeddedImages })
  const report = {
    version: 1, origin, artifactDigest: inventoryDigest(files), files,
    routes: manifest.routes.map(({ path, indexable }) => ({ path, indexable })), manifest,
    csp, inlineScripts: scriptHashes.size, inlineStyles: styleHashes.size, inlineStyleAttributes: styleAttributeHashes.size,
    omittedBuildFiles: sourceFiles.filter((path) => !contents.has(path)),
  }

  // Only now create a fresh disposable directory. Never clean the repo root.
  const parent = dirname(outDir)
  await mkdir(parent, { recursive: true })
  const stage = resolve(parent, `.public-staging-${randomUUID()}`)
  await mkdir(stage)
  let previous
  try {
    for (const [path, bytes] of contents) await writeAtomic(stage, path, bytes)
    if (await exists(outDir)) {
      if (!(await lstat(outDir)).isDirectory()) throw new Error('Public artifact destination is not a directory.')
      await walkFiles(outDir)
      previous = resolve(parent, `.public-previous-${randomUUID()}`)
      await rename(outDir, previous)
    }
    await rename(stage, outDir)
    await writeAtomic(root, relative(root, reportPath).split('\\').join('/'), `${JSON.stringify(report, null, 2)}\n`)
    if (previous) await rm(previous, { recursive: true })
  } catch (error) {
    await rm(stage, { recursive: true, force: true })
    if (previous && !await exists(outDir)) await rename(previous, outDir)
    throw error
  }
  return report
}

/** Explicit local synchronization, separate from artifact preparation/deployment. */
export async function writeHostingCsp({ root = process.cwd(), report } = {}) {
  root = await canonicalRoot(root)
  const config = parseJson(await readSafe(root, 'firebase.json'), 'Firebase configuration')
  if (Array.isArray(config.hosting) || config.hosting?.public !== 'dist/public' || config.hosting.rewrites?.length || config.hosting.target || config.hosting.site) throw new Error('Unsafe/unexpected future Firebase Hosting binding/public configuration.')
  const headers = config.hosting.headers.find((rule) => rule.source === '**')?.headers
  if (!headers || typeof report?.csp !== 'string') throw new Error('Cannot synchronize Hosting CSP without the validated artifact report.')
  const old = headers.find((header) => /content-security-policy/i.test(header.key))
  if (old) { old.key = 'Content-Security-Policy'; old.value = report.csp }
  else headers.push({ key: 'Content-Security-Policy', value: report.csp })
  await writeAtomic(root, 'firebase.json', `${JSON.stringify(config, null, 2)}\n`)
  return report.csp
}
