import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile, symlink, rm, access } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { preparePublic, writeHostingCsp } from './artifact.mjs'
import { publishRoot, rollbackRoot } from './publisher.mjs'
import { inventoryDigest } from './paths.mjs'

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')
const missing = async (path) => assert.rejects(access(path), { code: 'ENOENT' })

async function put(root, path, text) {
  const file = join(root, path)
  await mkdir(join(file, '..'), { recursive: true })
  await writeFile(file, text)
}

function route(path, title) {
  const canonical = `https://nalam.me${path}`
  return {
    path,
    input: path === '/' ? 'index.html' : path === '/404.html' ? '404.html' : `${path.slice(1)}index.html`,
    metadata: {
      title,
      description: `${title}: reviewed public engineering notes.`,
      canonical,
      openGraph: { type: 'website', title, description: `${title}: reviewed public engineering notes.`, url: canonical },
    },
    indexable: path !== '/404.html',
    expectedText: `${title} has useful public engineering content.`,
  }
}

function html(record, body = '') {
  const meta = record.metadata
  return `<!doctype html><html lang="en"><head><title>${meta.title}</title><meta name="description" content="${meta.description}"><link rel="canonical" href="${meta.canonical}"><meta property="og:type" content="website"><meta property="og:title" content="${meta.title}"><meta property="og:description" content="${meta.description}"><meta property="og:url" content="${meta.canonical}">${record.indexable ? '' : '<meta name="robots" content="noindex,follow">'}<link rel="stylesheet" href="/assets/main-AbCd1234.css"><script>document.documentElement.dataset.ready='true'</script><script type="module" src="/assets/main-AbCd1234.js"></script></head><body><main id="main"><h1>${meta.title}</h1><p>${record.expectedText}</p>${body}<a href="/">Home</a><a href="/writing/#reading">Writing</a></main></body></html>`
}

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'nalam-publication-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const buildDir = join(root, 'dist/site-build')
  const outDir = join(root, 'dist/public')
  const reportPath = join(root, 'dist/publication-report.json')
  const routes = [route('/', 'Home'), route('/writing/', 'Writing'), route('/404.html', 'Not found')]
  const manifest = { version: 1, origin: 'https://nalam.me', routes, assets: [{ path: '/img/profile.jpg', alt: 'Nazmul Alam' }] }
  await put(buildDir, 'publication-manifest.json', JSON.stringify(manifest))
  await put(buildDir, 'CNAME', 'nalam.me\n')
  await put(buildDir, 'favicon.ico', Buffer.from([0, 0, 1, 0, 1, 0]))
  await put(buildDir, 'img/profile.jpg', Buffer.from([255, 216, 255, 217]))
  await put(buildDir, 'fonts/geist-sans-var.woff2', 'wOF2 used fixture font')
  await put(buildDir, 'fonts/newsreader-var.woff2', 'wOF2 unused font')
  await put(buildDir, 'assets/main-AbCd1234.css', '@font-face{font-family:Geist;src:url("/fonts/geist-sans-var.woff2")}main{color:blue}')
  await put(buildDir, 'assets/main-AbCd1234.js', 'import "./shared-AbCd1234.js"; import("./dynamic-AbCd1234.js");')
  await put(buildDir, 'assets/shared-AbCd1234.js', 'export const ready = true;')
  await put(buildDir, 'assets/dynamic-AbCd1234.js', 'export const later = true;')
  await put(buildDir, 'assets/unused-AbCd1234.js', 'export const unused = true;')
  for (const record of routes) {
    await put(buildDir, record.input, html(record, record.path === '/' ? '<img src="/img/profile.jpg" alt="Nazmul Alam">' : '<h2 id="reading">Reading</h2>'))
  }
  return { root, buildDir, outDir, reportPath, manifest, routes }
}

test('exports only eligible HTML and reachable static/import/CSS dependencies, projecting sitemap.xml', async (t) => {
  const options = await fixture(t)
  await put(options.buildDir, 'index.html', html(options.routes[0], '<img src="/img/profile.jpg" alt="Nazmul Alam">').replace('engineering content.</p>', 'engineering <code>content</code>.</p>'))
  await put(options.buildDir, 'sitemap-0.xml', `<urlset>${options.routes.filter((item) => item.indexable).map((item) => `<url><loc>${item.metadata.canonical}</loc></url>`).join('')}</urlset>`)
  await put(options.buildDir, 'sitemap-index.xml', '<sitemapindex><sitemap><loc>https://nalam.me/sitemap-0.xml</loc></sitemap></sitemapindex>')
  const report = await preparePublic(options)
  assert.equal(report.routes.length, 3)
  for (const file of ['index.html', 'writing/index.html', '404.html', 'sitemap.xml', '.nojekyll', 'assets/dynamic-AbCd1234.js', 'assets/shared-AbCd1234.js', 'fonts/geist-sans-var.woff2', 'img/profile.jpg']) await access(join(options.outDir, file))
  for (const file of ['publication-manifest.json', 'sitemap-index.xml', 'fonts/newsreader-var.woff2', 'assets/unused-AbCd1234.js']) await missing(join(options.outDir, file))
  const sitemap = await readFile(join(options.outDir, 'sitemap.xml'), 'utf8')
  assert.match(sitemap, /https:\/\/nalam.me\/writing\//)
  assert.doesNotMatch(sitemap, /404|publication-manifest/)
  assert.ok(report.csp.includes("script-src 'self' 'sha256-"))
  assert.ok(!report.csp.includes('unsafe-inline'))
})

for (const [name, mutate, expected] of [
  ['privacy canary', (o) => put(o.buildDir, 'docs/resume/private.txt', 'PRIVATE_DRAFT_CANARY'), /prohibited|private|privacy/i],
  ['source map', (o) => put(o.buildDir, 'assets/main-AbCd1234.js.map', '{}'), /source map|prohibited/i],
  ['missing asset', (o) => rm(join(o.buildDir, 'assets/dynamic-AbCd1234.js')), /missing|ENOENT/i],
  ['missing eligible document', (o) => rm(join(o.buildDir, 'writing/index.html')), /missing|ENOENT/i],
  ['private text canary', (o) => put(o.buildDir, 'index.html', html(o.routes[0], '<p>PRIVATE_DRAFT_CANARY</p>')), /privacy/i],
  ['wrong canonical', (o) => put(o.buildDir, 'index.html', html(o.routes[0]).replace('href="https://nalam.me/"', 'href="https://other.test/"')), /canonical/i],
  ['indexable 404', (o) => put(o.buildDir, '404.html', html(o.routes[2]).replace('name="robots"', 'name="other"')), /robots/i],
  ['sitemap drift', (o) => put(o.buildDir, 'sitemap.xml', '<urlset><url><loc>https://nalam.me/404.html</loc></url></urlset>'), /sitemap membership/i],
  ['unsafe body href', (o) => put(o.buildDir, 'index.html', html(o.routes[0], '<a href="javascript:alert(1)">Bad</a>')), /scheme|unsafe/i],
  ['third-party runtime image', (o) => put(o.buildDir, 'index.html', html(o.routes[0], '<img src="https://other.example/private.png" alt="Bad">')), /third-party/i],
  ['inline CSS resource', (o) => put(o.buildDir, 'index.html', html(o.routes[0], '<div style="background:url(https://other.example/pixel.png)">Bad</div>')), /third-party/i],
  ['computed dynamic import', (o) => put(o.buildDir, 'assets/main-AbCd1234.js', 'const path = globalThis.dynamicPath; import(path);'), /computed dynamic import/i],
  ['missing fragment', (o) => put(o.buildDir, 'index.html', html(o.routes[0], '<a href="/writing/#missing">Bad</a>')), /fragment/i],
  ['unapproved static asset', (o) => put(o.buildDir, 'index.html', html(o.routes[0], '<img src="/img/private.jpg" alt="Bad">')), /unapproved|allowlist/i],
  ['orphan HTML', (o) => put(o.buildDir, 'stray/index.html', html(route('/stray/', 'Stray'))), /orphan|undeclared/i],
  ['unreachable route', async (o) => {
    const extra = route('/orphan/', 'Orphan')
    o.manifest.routes.push(extra)
    await put(o.buildDir, 'publication-manifest.json', JSON.stringify(o.manifest))
    await put(o.buildDir, extra.input, html(extra))
  }, /orphan|unreachable/i],
  ['duplicate route', async (o) => { o.manifest.routes.push(o.manifest.routes[0]); await put(o.buildDir, 'publication-manifest.json', JSON.stringify(o.manifest)) }, /duplicate/i],
  ['path escape', async (o) => { o.manifest.routes[0].input = '../index.html'; await put(o.buildDir, 'publication-manifest.json', JSON.stringify(o.manifest)) }, /path|input/i],
  ['encoded path escape', (o) => put(o.buildDir, 'index.html', html(o.routes[0], '<a href="/%2e%2e/docs/resume/">Bad</a>')), /path|unsafe|allowlist/i],
  ['asset symlink escape', async (o) => { await rm(join(o.buildDir, 'assets/shared-AbCd1234.js')); await symlink('/etc/hosts', join(o.buildDir, 'assets/shared-AbCd1234.js')) }, /symlink/i],
]) {
  test(`fails closed for ${name} before replacing a prior artifact`, async (t) => {
    const options = await fixture(t)
    await put(options.outDir, 'prior.txt', 'recoverable prior artifact')
    await mutate(options)
    await assert.rejects(preparePublic(options), expected)
    assert.equal(await readFile(join(options.outDir, 'prior.txt'), 'utf8'), 'recoverable prior artifact')
  })
}

async function legacyFixture(t) {
  const options = await fixture(t)
  await preparePublic(options)
  await put(options.root, 'index.html', 'old generated home')
  await put(options.root, 'assets/stale-AbCd1234.js', 'old generated bundle')
  await put(options.root, 'assets/unrelated.txt', 'unrelated asset')
  await put(options.root, 'src/index.html', 'source must survive')
  await put(options.root, 'docs/guide.md', 'docs must survive')
  await put(options.root, 'CNAME', 'nalam.me\n')
  await put(options.root, '.nojekyll', '')
  await put(options.root, 'favicon.ico', Buffer.from([0, 0, 1, 0, 1, 0]))
  const files = []
  for (const path of ['index.html', 'assets/stale-AbCd1234.js']) {
    const bytes = await readFile(join(options.root, path))
    files.push({ path, sha256: hash(bytes), size: bytes.length })
  }
  const legacyInventoryPath = join(options.root, 'legacy-inventory.json')
  await put(options.root, 'legacy-inventory.json', JSON.stringify({ version: 1, kind: 'legacy-generated-output', origin: 'https://nalam.me', files }))
  return { ...options, artifactDir: options.outDir, legacyInventoryPath }
}

test('root publication is a dry run by default; explicit fixture apply prunes only owned output and supports guarded rollback', async (t) => {
  const options = await legacyFixture(t)
  const dry = await publishRoot(options)
  assert.equal(dry.applied, false)
  assert.equal(await readFile(join(options.root, 'index.html'), 'utf8'), 'old generated home')
  await missing(join(options.root, '.publication-inventory.json'))
  const result = await publishRoot({ ...options, apply: true })
  assert.equal(result.applied, true)
  await missing(join(options.root, 'assets/stale-AbCd1234.js'))
  assert.match(await readFile(join(options.root, 'index.html'), 'utf8'), /useful public engineering content/)
  for (const [path, text] of [['src/index.html', 'source must survive'], ['docs/guide.md', 'docs must survive'], ['assets/unrelated.txt', 'unrelated asset'], ['CNAME', 'nalam.me\n'], ['.nojekyll', '']]) assert.equal(await readFile(join(options.root, path), 'utf8'), text)
  const repeat = await publishRoot(options)
  assert.equal(repeat.writes.length, 0)
  assert.equal(repeat.removals.length, 0)
  const rollbackPreview = await rollbackRoot({ root: options.root, transactionDir: result.transactionDir })
  assert.equal(rollbackPreview.applied, false)
  const rolled = await rollbackRoot({ root: options.root, transactionDir: result.transactionDir, apply: true })
  assert.equal(rolled.applied, true)
  assert.equal(await readFile(join(options.root, 'index.html'), 'utf8'), 'old generated home')
  assert.equal(await readFile(join(options.root, 'assets/stale-AbCd1234.js'), 'utf8'), 'old generated bundle')
  await missing(join(options.root, 'writing/index.html'))
  await missing(join(options.root, '.publication-inventory.json'))
})

for (const [name, mutate, expected] of [
  ['missing initial inventory', (o) => rm(o.legacyInventoryPath), /inventory/i],
  ['corrupt ownership inventory', (o) => put(o.root, '.publication-inventory.json', '{bad'), /inventory/i],
  ['edited legacy output', (o) => put(o.root, 'index.html', 'unreviewed changed baseline'), /changed|mismatch/i],
  ['unowned destination collision', (o) => put(o.root, 'writing/index.html', 'unrelated page'), /unowned|collision/i],
  ['protected CNAME change', (o) => put(o.root, 'CNAME', 'other.example\n'), /protected|CNAME/i],
  ['root symlink escape', async (o) => { await mkdir(join(o.root, 'outside')); await symlink(join(o.root, 'outside'), join(o.root, 'writing')) }, /symlink/i],
  ['malicious deletion inventory', async (o) => {
    const bytes = await readFile(join(o.root, 'src/index.html'))
    const files = [{ path: 'src/index.html', size: bytes.length, sha256: hash(bytes) }]
    await put(o.root, '.publication-inventory.json', JSON.stringify({ version: 1, kind: 'managed-root-publication', origin: 'https://nalam.me', artifactDigest: 'a'.repeat(64), digest: inventoryDigest(files), files }))
  }, /protected|prohibited|allowlist/i],
]) {
  test(`publisher rejects ${name} without changing source, output or unrelated files`, async (t) => {
    const options = await legacyFixture(t)
    await mutate(options)
    const prior = await readFile(join(options.root, 'index.html'))
    await assert.rejects(publishRoot({ ...options, apply: true }), expected)
    assert.deepEqual(await readFile(join(options.root, 'index.html')), prior)
    assert.equal(await readFile(join(options.root, 'src/index.html'), 'utf8'), 'source must survive')
  })
}

test('rollback refuses to overwrite output modified after the recorded publication', async (t) => {
  const options = await legacyFixture(t)
  const result = await publishRoot({ ...options, apply: true })
  await put(options.root, 'index.html', 'new user work after publication')
  await assert.rejects(rollbackRoot({ root: options.root, transactionDir: result.transactionDir, apply: true }), /changed|mismatch/i)
  assert.equal(await readFile(join(options.root, 'index.html'), 'utf8'), 'new user work after publication')
})

test('includes only approved SVG figures and generates exact script/element/style-attribute hashes for local Hosting config', async (t) => {
  const options = await fixture(t)
  options.manifest.assets.push({ path: '/figures/architecture.svg', alt: 'Reviewed architecture diagram' })
  await put(options.buildDir, 'publication-manifest.json', JSON.stringify(options.manifest))
  await put(options.buildDir, 'figures/architecture.svg', '<svg xmlns="http://www.w3.org/2000/svg"><style>circle{stroke:blue}</style><circle style="fill:green" r="10"/></svg>')
  await put(options.buildDir, 'index.html', html(options.routes[0], '<img src="/figures/architecture.svg" alt="Reviewed architecture diagram"><pre style="color:#123456">A code example</pre>'))
  await put(options.root, 'firebase.json', JSON.stringify({ hosting: { public: 'dist/public', headers: [{ source: '**', headers: [{ key: 'Content-Security-Policy-Report-Only', value: "default-src 'self'" }] }] } }))
  const report = await preparePublic(options)
  await writeHostingCsp({ root: options.root, report })
  const config = JSON.parse(await readFile(join(options.root, 'firebase.json'), 'utf8'))
  const policy = config.hosting.headers[0].headers.find((header) => header.key === 'Content-Security-Policy')?.value
  assert.equal(policy, report.csp)
  assert.ok(policy.includes("style-src-attr 'unsafe-hashes' 'sha256-"))
  assert.ok(policy.includes("style-src-elem 'self' 'sha256-"))
  assert.ok(!policy.includes('unsafe-inline'))
  await access(join(options.outDir, 'figures/architecture.svg'))
  await missing(join(options.outDir, 'firebase.json'))
})

test('rejects executable/remote SVG resource content and unsafe output destinations', async (t) => {
  const options = await fixture(t)
  options.manifest.assets.push({ path: '/figures/architecture.svg', alt: 'Reviewed architecture diagram' })
  await put(options.buildDir, 'publication-manifest.json', JSON.stringify(options.manifest))
  await put(options.buildDir, 'figures/architecture.svg', '<svg xmlns="http://www.w3.org/2000/svg"><image href="https://other.example/pixel.png"/></svg>')
  await put(options.buildDir, 'index.html', html(options.routes[0], '<img src="/figures/architecture.svg" alt="Reviewed architecture diagram">'))
  await assert.rejects(preparePublic(options), /third-party/i)
  await assert.rejects(preparePublic({ ...options, outDir: options.root }), /disposable dist/i)
})

test('accepts a quoted embedded SVG image with spaces, percentages and an internal url() filter without treating its payload as CSS syntax', async (t) => {
  const options = await fixture(t)
  const texture = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"
  await put(options.buildDir, 'assets/main-AbCd1234.css', `body{background-image:url("${texture}")}@font-face{font-family:Geist;src:url("/fonts/geist-sans-var.woff2")}`)
  const report = await preparePublic(options)
  assert.ok(report.csp.includes("img-src 'self' data:"))
  assert.ok(!report.files.some((file) => file.path.includes('data:')))
  await access(join(options.outDir, 'fonts/geist-sans-var.woff2'))
})

test('accepts bounded embedded raster data without decoding binary bytes as UTF-8', async (t) => {
  const options = await fixture(t)
  await put(options.buildDir, 'assets/main-AbCd1234.css', 'main{background:url("data:image/png,%89PNG%0D%0A%1A%0A")}aside{background:url("data:image/png;base64,iVBORw0KGgo=")}')
  const report = await preparePublic(options)
  assert.ok(report.csp.includes("img-src 'self' data:"))
})

for (const [name, svg, expected] of [
  ['script element', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', /executable embedded SVG/i],
  ['event attribute', '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><rect width="10"/></svg>', /SVG event handler/i],
  ['remote image', '<svg xmlns="http://www.w3.org/2000/svg"><image href="https://other.example/pixel.png"/></svg>', /third-party/i],
  ['remote CSS', '<svg xmlns="http://www.w3.org/2000/svg"><style>rect{fill:url(https://other.example/pixel.svg)}</style><rect width="10"/></svg>', /third-party/i],
]) {
  test(`rejects embedded SVG ${name} before replacing the prior artifact`, async (t) => {
    const options = await fixture(t)
    await put(options.outDir, 'prior.txt', 'recoverable prior artifact')
    await put(options.buildDir, 'assets/main-AbCd1234.css', `main{background:url("data:image/svg+xml,${encodeURIComponent(svg)}")}`)
    await assert.rejects(preparePublic(options), expected)
    assert.equal(await readFile(join(options.outDir, 'prior.txt'), 'utf8'), 'recoverable prior artifact')
  })
}
