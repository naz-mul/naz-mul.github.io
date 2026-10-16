import { realpathSync, statSync } from 'node:fs'
import { relative, resolve, sep } from 'node:path'
import { getCollection, type CollectionEntry } from 'astro:content'
import { content } from './site.ts'
import { routes as legacyRoutes, type RouteRenderIdentity } from './routes.ts'
import { showcaseRecords } from './showcase.ts'
import {
  createPublicationProjection,
  type PublicationRecord,
  type PublicationRoute,
} from './publication.ts'

export type PublicRoute = PublicationRoute & {
  id: string
  render: RouteRenderIdentity | { kind: 'writing' } | { kind: 'article'; slug: string }
  navigation: { label: string; order: number } | null
  articleId?: string
}

type ArticleEntry = CollectionEntry<'articles'>

function approvedAssetExists(path: string) {
  const publicRoot = resolve(process.cwd(), 'src/public')
  try {
    const file = realpathSync(resolve(publicRoot, `.${path}`))
    const within = relative(realpathSync(publicRoot), file)
    return within !== '..' && !within.startsWith(`..${sep}`) && !within.startsWith(sep) && statSync(file).isFile()
  } catch {
    return false
  }
}

function legacyPublicationRecords() {
  return legacyRoutes.filter((route) => route.render.kind !== 'technical-note').map((route) => {
    const render = route.render
    const kind = render.kind === 'case-study' ? 'case-study' : 'page'
    const study = render.kind === 'case-study'
      ? [...content.flagships, content.supportingProof, content.currentWork].find((candidate) => candidate.slug === render.slug)
      : undefined
    const officialContext = study ? (Array.isArray(study.officialContext) ? study.officialContext : [study.officialContext]) : []
    return {
      id: route.id === 'notFound' ? 'not-found' : route.id,
      kind,
      title: route.metadata.title.replace(/ — Nazmul Alam$/, ''),
      documentTitle: route.metadata.title,
      description: route.metadata.description,
      permalink: route.path,
      publicationState: 'published',
      visibility: 'public',
      reviewed: true,
      source: {
        kind: 'original',
        evidence: [study ? 'Existing reviewed first-person account; official context remains a separate evidence class.' : 'Existing reviewed public site content.'],
      },
      links: officialContext.map((source) => ({ label: source.label, url: source.url, reviewed: true })),
      assets: route.render.kind === 'home' ? [{ path: '/img/profile.jpg', alt: 'Nazmul Alam', reviewed: true }] : [],
      order: route.navigation?.order ?? 0,
      indexable: route.indexable,
      openGraphType: route.metadata.openGraph.type,
      expectedText: route.delivery.expectedText,
    }
  })
}

const writingIndex = {
  id: 'writing',
  kind: 'page',
  title: 'Technical writing',
  description: 'Engineering notes on real-time voice systems, identity migration, and system boundaries.',
  permalink: '/writing/',
  publicationState: 'published',
  visibility: 'public',
  reviewed: true,
  source: { kind: 'original', evidence: ['Approved site-owned writing and curated external-reading model.'] },
  expectedText: 'Technical writing',
  order: 80,
} as const

function articleRecord(entry: ArticleEntry) {
  const legacy = legacyRoutes.find((route) => route.path === entry.data.permalink)
  return {
    ...entry.data,
    documentTitle: entry.data.documentTitle ?? `${entry.data.title} — Nazmul Alam`,
    expectedText: entry.data.expectedText ?? legacy?.delivery.expectedText,
  }
}

function routePresentation(route: PublicationRoute, record: PublicationRecord, articles: Map<string, ArticleEntry>): PublicRoute {
  const legacy = legacyRoutes.find((candidate) => candidate.path === route.path)
  const isArticle = articles.has(record.id)
  return {
    ...route,
    id: legacy?.id ?? record.id,
    render: legacy?.render ?? (record.id === 'writing' ? { kind: 'writing' } : { kind: 'article', slug: record.id }),
    navigation: legacy?.navigation ?? (record.id === 'writing' ? { label: 'Writing', order: 80 } : null),
    ...(isArticle ? { articleId: record.id } : {}),
  }
}

/** Build-time only. Every UI, route and exporter consumes this same projection. */
export async function getPublication() {
  const articleEntries = await getCollection('articles')
  const projection = createPublicationProjection([
    ...legacyPublicationRecords(),
    ...articleEntries.map(articleRecord),
    writingIndex,
    ...showcaseRecords,
  ], { assetExists: approvedAssetExists })

  const articlesById = new Map(articleEntries
    .filter((entry) => projection.byId.has(entry.data.id))
    .map((entry) => [entry.data.id, entry]))
  for (const [id, entry] of articlesById) {
    if (!entry.body?.trim()) throw new Error(`Published reading has no substantive body: ${id}`)
  }
  const routes = projection.routes.map((route) => routePresentation(route, projection.byId.get(route.recordId)!, articlesById))
  for (const legacy of legacyRoutes) {
    if (!routes.some((route) => route.path === legacy.path)) throw new Error(`Missing preserved route: ${legacy.path}`)
  }
  return {
    ...projection,
    routes,
    indexableRoutes: routes.filter((route) => route.indexable),
    navigationRoutes: routes.filter((route) => route.navigation !== null)
      .sort((left, right) => left.navigation!.order - right.navigation!.order),
    articlesById,
  }
}
