import { z } from 'astro/zod'
import { siteOrigin } from './routes.ts'

const nonEmptyText = z.string().trim().min(1)
const identity = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
const directoryPath = /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)*$/
const assetPath = /^\/(?:img|images|figures)\/[a-zA-Z0-9/_\-.]+\.(?:avif|gif|jpe?g|png|svg|webp)$/

function isLocalPermalink(value: string) {
  return directoryPath.test(value) || value === '/404.html'
}

function isLocalAsset(value: string) {
  return assetPath.test(value) && !value.includes('..') && !value.includes('//')
}

function httpsUrl(value: string): URL | undefined {
  if (/[\s\\\u0000-\u001f\u007f]/u.test(value) || /%(?:00|0a|0d)/i.test(value)) return
  try {
    const url = new URL(value)
    if (url.protocol === 'https:' && !url.username && !url.password) return url
  } catch {
    return
  }
}

function safeHref(value: string) {
  if (value.startsWith('/')) {
    const [path] = value.split('#')
    return isLocalPermalink(path!) || isLocalAsset(path!)
  }
  if (/^#[a-zA-Z0-9_-]+$/.test(value)) return true
  if (/^mailto:[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) return true
  return Boolean(httpsUrl(value))
}

const reviewedLink = z.object({
  label: nonEmptyText,
  url: z.string().refine(safeHref, 'Use a safe HTTPS, local, fragment or email link.'),
  reviewed: z.boolean(),
}).strict()

const reviewedAsset = z.object({
  path: z.string().refine(isLocalAsset, 'Use an approved same-origin image path.'),
  alt: nonEmptyText,
  caption: nonEmptyText.optional(),
  reviewed: z.boolean(),
}).strict()

/** Metadata is public input. Private drafting belongs outside this collection. */
export const publicationSchema = z.object({
  id: identity,
  kind: z.enum(['page', 'case-study', 'technical-note', 'article', 'research-note', 'featured-work', 'external-article']),
  title: nonEmptyText,
  description: nonEmptyText,
  documentTitle: nonEmptyText.optional(),
  permalink: z.string().refine(isLocalPermalink, 'Use an explicit local directory permalink.').optional(),
  canonical: z.string().refine((value) => Boolean(httpsUrl(value)), 'Use an HTTPS canonical URL.').optional(),
  publicationState: z.enum(['draft', 'review', 'published']),
  visibility: z.enum(['public', 'private']),
  reviewed: z.boolean(),
  source: z.object({
    kind: z.enum(['original', 'linkedin']),
    url: z.string().refine((value) => Boolean(httpsUrl(value)), 'Use an HTTPS source URL.').optional(),
    evidence: z.array(nonEmptyText).min(1),
  }).strict(),
  workState: z.enum(['planned', 'in-progress', 'delivered']).optional(),
  knowledgeState: z.enum(['analysis', 'exploration', 'research-in-progress', 'research-result']).optional(),
  publishedAt: z.iso.date().optional(),
  updatedAt: z.iso.date().optional(),
  sourcePublishedAt: z.iso.date().optional(),
  links: z.array(reviewedLink).default([]),
  assets: z.array(reviewedAsset).default([]),
  references: z.array(identity).default([]),
  order: z.number().int().nonnegative().default(0),
  indexable: z.boolean().default(true),
  openGraphType: z.enum(['article', 'profile', 'website']).optional(),
  expectedText: nonEmptyText.optional(),
}).strict().superRefine((record, context) => {
  const issue = (message: string) => context.addIssue({ code: 'custom', message })
  if (record.kind === 'external-article') {
    const source = record.source.url && httpsUrl(record.source.url)
    if (record.source.kind !== 'linkedin' || !source ||
      !['linkedin.com', 'www.linkedin.com'].includes(source.hostname) ||
      !/^\/(?:pulse|posts|feed\/update)\//.test(source.pathname)) {
      issue('A curated LinkedIn entry needs its actual LinkedIn article URL.')
    }
    if (record.permalink) issue('Curated external entries cannot create local reading mirrors.')
  } else {
    if (record.source.kind !== 'original' || record.source.url) issue('Local content must use original source semantics.')
    if (record.kind !== 'featured-work' && !record.permalink) issue('Local reading records need an explicit permalink.')
  }
  if (record.kind === 'featured-work') {
    if (!record.workState) issue('Featured work needs an independent work state.')
    if (record.permalink) issue('A featured summary references reviewed detail records rather than creating an empty detail route.')
  }
  if (record.permalink === '/404.html' && record.indexable) issue('The genuine 404 must not be indexable.')
  if (record.canonical) {
    const expected = record.permalink ? canonicalFor(record.permalink) : externalCanonical(record.source.url)
    if (record.canonical !== expected) issue('The canonical must match the local permalink or original external source.')
  }
  if (record.publishedAt && record.updatedAt && record.updatedAt < record.publishedAt) {
    issue('An update date cannot precede publication.')
  }
})

export type PublicationRecord = z.infer<typeof publicationSchema>
export type ReviewedAsset = z.infer<typeof reviewedAsset>

export type PublicationMetadata = {
  title: string
  description: string
  canonical: string
  openGraph: { type: 'article' | 'profile' | 'website'; title: string; description: string; url: string }
}

export type PublicationRoute = {
  recordId: string
  path: string
  input: string
  metadata: PublicationMetadata
  indexable: boolean
  delivery: { prerender: true; expectedText: string }
}

export type PublicationProjection = {
  records: PublicationRecord[]
  byId: Map<string, PublicationRecord>
  routes: PublicationRoute[]
  indexableRoutes: PublicationRoute[]
  writing: PublicationRecord[]
  featuredWork: PublicationRecord[]
  assets: ReviewedAsset[]
}

export function canonicalFor(path: string) {
  if (!isLocalPermalink(path)) throw new Error(`Invalid local permalink: ${path}`)
  return `${siteOrigin}${path}`
}

function externalCanonical(source: string | undefined) {
  const url = source && httpsUrl(source)
  if (!url) return undefined
  url.hash = ''
  return url.href
}

function canonicalOf(record: PublicationRecord) {
  return record.permalink ? canonicalFor(record.permalink) : externalCanonical(record.source.url)
}

function rejectDuplicate(value: string | undefined, values: Set<string>, label: string) {
  if (value === undefined) return
  if (values.has(value)) throw new Error(`Duplicate ${label}: ${value}`)
  values.add(value)
}

function publicRoute(record: PublicationRecord): PublicationRoute {
  const path = record.permalink!
  const canonical = canonicalFor(path)
  const title = record.documentTitle ?? `${record.title} — Nazmul Alam`
  return {
    recordId: record.id,
    path,
    input: path === '/' ? 'index.html' : path === '/404.html' ? '404.html' : `${path.slice(1)}index.html`,
    metadata: {
      title,
      description: record.description,
      canonical,
      openGraph: {
        type: record.openGraphType ?? (record.kind === 'page' ? 'website' : 'article'),
        title,
        description: record.description,
        url: canonical,
      },
    },
    indexable: record.indexable,
    delivery: { prerender: true, expectedText: record.expectedText ?? record.description },
  }
}

function validatePublicLinks(record: PublicationRecord, paths: Set<string>, assets: Set<string>) {
  for (const link of record.links) {
    if (!link.reviewed) throw new Error(`Unreviewed public link: ${record.id}`)
    if (link.url.startsWith('#') || link.url.startsWith('mailto:')) continue
    const url = new URL(link.url, siteOrigin)
    if (url.origin === siteOrigin && !paths.has(url.pathname) && !assets.has(url.pathname)) {
      throw new Error(`Missing public link destination: ${record.id} -> ${url.pathname}`)
    }
  }
}

/** Every route/discovery consumer receives the same eligible records. */
export function createPublicationProjection(
  inputs: readonly unknown[],
  { assetExists }: { assetExists?: (path: string) => boolean } = {},
): PublicationProjection {
  const parsed = inputs.map((input) => publicationSchema.parse(input))
  const ids = new Set<string>()
  const paths = new Set<string>()
  const canonicals = new Set<string>()
  for (const record of parsed) {
    rejectDuplicate(record.id, ids, 'publication id')
    rejectDuplicate(record.permalink, paths, 'publication path')
    rejectDuplicate(canonicalOf(record), canonicals, 'canonical URL')
  }
  const records = parsed.filter((record) => record.publicationState === 'published' && record.visibility === 'public' && record.reviewed)
  const byId = new Map(records.map((record) => [record.id, record]))
  const publicPaths = new Set(records.flatMap((record) => record.permalink ? [record.permalink] : []))
  const assets = new Map<string, ReviewedAsset>()
  for (const record of records) {
    for (const reference of record.references) {
      if (!byId.has(reference)) throw new Error(`Missing public reference: ${record.id} -> ${reference}`)
    }
    for (const asset of record.assets) {
      if (!asset.reviewed) throw new Error(`Unreviewed public asset: ${record.id}`)
      if (!assetExists) throw new Error(`Asset verification is required: ${asset.path}`)
      if (!assetExists(asset.path)) throw new Error(`Missing public asset: ${asset.path}`)
      assets.set(asset.path, asset)
    }
  }
  for (const record of records) validatePublicLinks(record, publicPaths, new Set(assets.keys()))
  const routes = records.filter((record) => record.permalink).map(publicRoute)
  const ordered = [...records].sort((left, right) => left.order - right.order || left.title.localeCompare(right.title))
  return {
    records,
    byId,
    routes,
    indexableRoutes: routes.filter((route) => route.indexable),
    writing: ordered.filter((record) => ['technical-note', 'article', 'research-note', 'external-article'].includes(record.kind)),
    featuredWork: ordered.filter((record) => record.kind === 'featured-work'),
    assets: [...assets.values()],
  }
}

/** Build-only export: explicit fields prevent bodies/provenance/drafts leaking. */
export function createPublicManifest(projection: Pick<PublicationProjection, 'routes' | 'assets'>) {
  return {
    version: 1,
    origin: siteOrigin,
    routes: projection.routes.map(({ path, input, metadata, indexable, delivery }) => ({
      path,
      input,
      metadata: {
        title: metadata.title,
        description: metadata.description,
        canonical: metadata.canonical,
        openGraph: {
          type: metadata.openGraph.type,
          title: metadata.openGraph.title,
          description: metadata.openGraph.description,
          url: metadata.openGraph.url,
        },
      },
      indexable,
      expectedText: delivery.expectedText,
    })),
    assets: projection.assets.map(({ path, alt, caption }) => ({ path, alt, ...(caption ? { caption } : {}) })),
  }
}
