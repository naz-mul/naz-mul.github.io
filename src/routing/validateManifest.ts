import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { content } from '../content/site.ts'
import { routeManifest, routes, siteOrigin } from '../content/routes.ts'
import { technicalNotes } from '../content/routePages.ts'

function assertUnique(values: readonly string[], label: string) {
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index)
  if (duplicates.length > 0) {
    throw new Error(`Duplicate ${label}: ${[...new Set(duplicates)].join(', ')}`)
  }
}

export function validateRouteManifest(sourceRoot: string) {
  assertUnique(routes.map((route) => route.path), 'route paths')
  assertUnique(routes.map((route) => route.input), 'route inputs')
  assertUnique(routes.map((route) => route.entryScript), 'entry scripts')
  assertUnique(routes.map((route) => route.metadata.canonical), 'canonical URLs')

  for (const route of routes) {
    const expectedCanonical = `${siteOrigin}${route.path}`
    const metadata = route.metadata
    const requiredMetadata = [
      metadata.title,
      metadata.description,
      metadata.canonical,
      metadata.openGraph.type,
      metadata.openGraph.title,
      metadata.openGraph.description,
      metadata.openGraph.url,
    ]

    if (requiredMetadata.some((value) => value.trim().length === 0)) {
      throw new Error(`Incomplete metadata for route "${route.id}"`)
    }
    if (
      metadata.canonical !== expectedCanonical ||
      metadata.openGraph.url !== expectedCanonical
    ) {
      throw new Error(`Canonical URL does not match path for route "${route.id}"`)
    }
    if (metadata.openGraph.title !== metadata.title) {
      throw new Error(`Open Graph title does not match page title for route "${route.id}"`)
    }
    if (!route.delivery.prerender || !route.delivery.expectedText.trim()) {
      throw new Error(`Missing prerender registration for route "${route.id}"`)
    }

    const inputPath = resolve(sourceRoot, route.input)
    const entryPath = resolve(sourceRoot, route.entryScript.replace(/^\//, ''))
    if (!existsSync(inputPath)) throw new Error(`Missing route input: ${route.input}`)
    if (!existsSync(entryPath)) throw new Error(`Missing route entry: ${route.entryScript}`)

    const sourceHtml = readFileSync(inputPath, 'utf8')
    if (!sourceHtml.includes('<div id="root"></div>')) {
      throw new Error(`Route input has no empty #root shell: ${route.input}`)
    }
    if (
      /<title>|rel=["']canonical["']|name=["']description["']|property=["']og:|<script[^>]+type=["']module["']/i.test(
        sourceHtml,
      )
    ) {
      throw new Error(
        `Route input duplicates manifest-owned metadata or entry script: ${route.input}`,
      )
    }
  }

  const caseStudyPaths: string[] = [
    content.currentWork.href,
    content.supportingProof.href,
    ...content.flagships.map((study) => study.href),
  ]
  const notePaths: string[] = technicalNotes.map((note) => note.href)
  const registeredContentPaths: string[] = routes
    .filter((route) => route.render.kind === 'case-study' || route.render.kind === 'technical-note')
    .map((route) => route.path)

  assertUnique([...caseStudyPaths, ...notePaths], 'published content paths')
  const missingContentRoutes = [...caseStudyPaths, ...notePaths].filter(
    (path) => !registeredContentPaths.includes(path),
  )
  const unknownContentRoutes = registeredContentPaths.filter(
    (path) => ![...caseStudyPaths, ...notePaths].includes(path),
  )
  if (missingContentRoutes.length || unknownContentRoutes.length) {
    throw new Error(
      `Manifest/content drift (missing: ${missingContentRoutes.join(', ') || 'none'}; unknown: ${
        unknownContentRoutes.join(', ') || 'none'
      })`,
    )
  }

  const routeIds = Object.keys(routeManifest)
  assertUnique(routeIds, 'route IDs')
}
