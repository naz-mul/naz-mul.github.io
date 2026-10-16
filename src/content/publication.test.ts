import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { technicalNotes } from './routePages.ts'
import {
  createPublicationProjection,
  createPublicManifest,
  publicationSchema,
} from './publication.ts'

function original(overrides: Record<string, unknown> = {}) {
  return {
    id: 'session-boundaries',
    kind: 'technical-note',
    title: 'Session boundaries',
    description: 'A reviewed analysis of session boundaries.',
    permalink: '/notes/session-boundaries/',
    publicationState: 'published',
    visibility: 'public',
    reviewed: true,
    source: { kind: 'original', evidence: ['Reviewed local engineering analysis.'] },
    ...overrides,
  }
}

test('published originals are self-canonical and expose a complete static route', () => {
  const result = createPublicationProjection([original()])
  assert.equal(result.routes[0]?.path, '/notes/session-boundaries/')
  assert.equal(result.routes[0]?.input, 'notes/session-boundaries/index.html')
  assert.equal(result.routes[0]?.metadata.canonical, 'https://nalam.me/notes/session-boundaries/')
  assert.equal(result.writing[0]?.id, 'session-boundaries')
})

test('work state remains In progress when its reviewed summary is published', () => {
  const result = createPublicationProjection([original({
    id: 'ai-voice-platform',
    kind: 'featured-work',
    title: 'AI Voice Platform',
    description: 'Real-time speech-to-speech integrations, load testing, observability, retries, and production reliability.',
    permalink: undefined,
    workState: 'in-progress',
  })])
  assert.equal(result.featuredWork[0]?.workState, 'in-progress')
  assert.equal(result.featuredWork[0]?.publicationState, 'published')
  assert.deepEqual(result.routes, [])
  assert.deepEqual(result.featuredWork[0]?.links, [])
})

test('curated LinkedIn entries remain external writing without local reading routes', () => {
  const result = createPublicationProjection([original({
    id: 'reviewed-linkedin-reading',
    kind: 'external-article',
    permalink: undefined,
    source: {
      kind: 'linkedin',
      url: 'https://www.linkedin.com/pulse/session-boundaries-example',
      evidence: ['Title and synopsis reviewed by the author.'],
    },
  })])
  assert.equal(result.writing[0]?.source.kind, 'linkedin')
  assert.deepEqual(result.routes, [])
})

test('draft, review, private and unreviewed canaries leave no routes, discovery or metadata', () => {
  const canaries = [
    original({
      id: 'private-canary', permalink: '/notes/private-canary/', title: 'PRIVATE_CANARY', visibility: 'private',
      assets: [{ path: '/img/private-canary.png', alt: 'PRIVATE_ASSET_CANARY', reviewed: false }],
    }),
    original({ id: 'draft-canary', permalink: '/notes/draft-canary/', title: 'DRAFT_CANARY', publicationState: 'draft' }),
    original({ id: 'review-canary', permalink: '/notes/review-canary/', title: 'REVIEW_CANARY', publicationState: 'review' }),
    original({ id: 'unreviewed-canary', permalink: '/notes/unreviewed-canary/', title: 'UNREVIEWED_CANARY', reviewed: false }),
  ]
  const result = createPublicationProjection([original(), ...canaries])
  assert.equal(result.records.length, 1)
  assert.equal(result.byId.size, 1)
  assert.equal(result.writing.length, 1)
  assert.equal(result.routes.length, 1)
  assert.deepEqual(result.assets, [])
  const manifest = JSON.stringify(createPublicManifest(result))
  assert.doesNotMatch(manifest, /CANARY|canary/)
  assert.deepEqual(Object.keys(createPublicManifest(result).routes[0]!).sort(),
    ['expectedText', 'indexable', 'input', 'metadata', 'path'])
})

test('duplicate identities, paths and canonical URLs are rejected', () => {
  assert.throws(() => createPublicationProjection([original(), original()]), /Duplicate publication id/)
  assert.throws(() => createPublicationProjection([original(), original({ id: 'other-reading' })]), /Duplicate publication path/)
  const external = original({
    kind: 'external-article',
    permalink: undefined,
    source: { kind: 'linkedin', url: 'https://www.linkedin.com/pulse/reviewed-reading', evidence: ['Reviewed.'] },
  })
  assert.throws(() => createPublicationProjection([external, { ...external, id: 'other-external' }]), /Duplicate canonical/)
})

test('local originals cannot select a foreign canonical and curated entries cannot create mirrors', () => {
  assert.equal(publicationSchema.safeParse(original({ canonical: 'https://example.com/notes/session-boundaries/' })).success, false)
  assert.equal(publicationSchema.safeParse(original({
    kind: 'external-article',
    source: { kind: 'linkedin', url: 'https://www.linkedin.com/pulse/reviewed-reading', evidence: ['Reviewed.'] },
  })).success, false)
  assert.equal(publicationSchema.safeParse(original({ body: 'A prohibited copied external article body.' })).success, false)
})

test('unsafe schemes, credentials, protocol-relative URLs and deceptive LinkedIn hosts are rejected', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,bad', '//example.com/article', 'https://user:password@example.com/article', 'https://example.com\\@linkedin.com/article']) {
    assert.equal(publicationSchema.safeParse(original({ links: [{ label: 'Article', url, reviewed: true }] })).success, false, url)
  }
  assert.equal(publicationSchema.safeParse(original({
    kind: 'external-article', permalink: undefined,
    source: { kind: 'linkedin', url: 'https://www.linkedin.com.example.com/pulse/article', evidence: ['Reviewed.'] },
  })).success, false)
})

test('permalinks are explicit safe directory URLs, with a genuine 404 exception', () => {
  for (const permalink of ['/notes/../private/', '/notes/%2e%2e/private/', '//outside/', '/notes/article?draft=true', '/notes/article/#draft', '/notes/article']) {
    assert.equal(publicationSchema.safeParse(original({ permalink })).success, false, permalink)
  }
  const result = createPublicationProjection([original({ id: 'not-found', kind: 'page', permalink: '/404.html', indexable: false })])
  assert.equal(result.routes[0]?.input, '404.html')
  assert.deepEqual(result.indexableRoutes, [])
})

test('public references and local links must resolve to eligible public destinations', () => {
  assert.throws(() => createPublicationProjection([original({ references: ['missing-note'] })]), /Missing public reference/)
  assert.throws(() => createPublicationProjection([
    original({ references: ['private-note'] }),
    original({ id: 'private-note', permalink: '/notes/private-note/', visibility: 'private' }),
  ]), /Missing public reference/)
  assert.throws(() => createPublicationProjection([original({ links: [{ label: 'Missing', url: '/notes/missing/', reviewed: true }] })]), /Missing public link destination/)
  assert.doesNotThrow(() => createPublicationProjection([original({ links: [{ label: 'This note', url: '/notes/session-boundaries/#invariant', reviewed: true }] })]))
})

test('published links and local assets require review and existing approved files', () => {
  assert.throws(() => createPublicationProjection([original({ links: [{ label: 'Unreviewed', url: 'https://example.com/article', reviewed: false }] })]), /Unreviewed public link/)
  const withAsset = original({ assets: [{ path: '/img/approved-diagram.svg', alt: 'An approved diagram.', reviewed: true }] })
  assert.throws(() => createPublicationProjection([original({ assets: [{ path: '/img/approved-diagram.svg', alt: 'Unreviewed.', reviewed: false }] })], { assetExists: () => true }), /Unreviewed public asset/)
  assert.throws(() => createPublicationProjection([withAsset], { assetExists: () => false }), /Missing public asset/)
  assert.throws(() => createPublicationProjection([withAsset]), /Asset verification is required/)
  assert.equal(createPublicationProjection([withAsset], { assetExists: () => true }).assets.length, 1)
  for (const path of ['https://example.com/image.png', '/img/../private.png', '/img/%2e%2e/private.png', '/docs/resume/private.pdf']) {
    assert.equal(publicationSchema.safeParse(original({ assets: [{ path, alt: 'Invalid.', reviewed: true }] })).success, false, path)
  }
})

test('dates are optional confirmed calendar dates and never inferred from the build clock', () => {
  assert.equal(publicationSchema.parse(original()).publishedAt, undefined)
  assert.equal(publicationSchema.safeParse(original({ publishedAt: '2026-02-30' })).success, false)
  assert.equal(publicationSchema.parse(original({ publishedAt: '2026-10-15' })).publishedAt, '2026-10-15')
})

test('private authoring, previews and the resume are ignored and have no tracked source files', () => {
  const paths = ['.private-drafts/publication-canary.md', '.private-preview/publication-canary.html', 'docs/resume/publication-canary.md']
  const ignored = execFileSync('git', ['check-ignore', '--no-index', '--', ...paths], { encoding: 'utf8' }).trim().split('\n')
  assert.deepEqual(ignored, paths)
  const tracked = execFileSync('git', ['ls-files', '-z', '--', '.private-drafts/', '.private-preview/', 'docs/resume/'], { encoding: 'utf8' })
  assert.equal(tracked, '')
})

test('the Markdown migrations preserve every substantive reviewed note string', () => {
  for (const note of technicalNotes) {
    const markdown = readFileSync(new URL(`./articles/${note.slug}.md`, import.meta.url), 'utf8')
    const strings = [
      note.title, note.description, ...note.introduction,
      ...note.principles.flatMap((principle) => [principle.heading, ...principle.body]),
      note.timeline.heading, note.timeline.introduction,
      ...note.timeline.steps.flatMap((step) => [step.phase, step.event, step.invariant, step.observe]),
      note.matrix.heading, note.matrix.introduction, ...note.matrix.columns,
      ...note.matrix.rows.flatMap((row) => [row.scenario, row.pressure, row.requiredBehaviour, row.evidence]),
      note.sidebar.label, note.sidebar.heading, ...note.sidebar.body,
      ...note.sources.flatMap((source) => [source.label, source.url, source.boundary]),
    ]
    for (const text of strings) assert.ok(markdown.includes(text), `Missing reviewed text from ${note.slug}: ${text}`)
  }
})
