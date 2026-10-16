import assert from 'node:assert/strict'
import { request } from 'node:http'
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, test } from 'node:test'
import { createPublicServer } from './serve-public.mjs'

let fixture
let server
let port

before(async () => {
  fixture = await mkdtemp(join(tmpdir(), 'nalam-public-server-'))
  const root = join(fixture, 'public')
  await mkdir(join(root, 'notes', 'example'), { recursive: true })
  await mkdir(join(root, 'empty'))
  await writeFile(join(root, 'index.html'), '<h1>Public home</h1>')
  await writeFile(join(root, '404.html'), '<h1>Page not found</h1>')
  await writeFile(join(root, 'notes', 'example', 'index.html'), '<h1>Useful reading</h1>')
  await writeFile(join(root, 'client.js'), 'export const answer = 42')
  await writeFile(join(root, 'font.woff2'), Buffer.from([0, 1, 2]))
  await writeFile(join(root, '.env'), 'PRIVATE_DOTFILE_CANARY')
  await writeFile(join(fixture, 'outside.txt'), 'PRIVATE_OUTSIDE_CANARY')
  await symlink(join(fixture, 'outside.txt'), join(root, 'outside-link.txt'))
  await symlink(join(root, 'index.html'), join(root, 'inside-link.html'))
  await symlink(join(fixture), join(root, 'linked-directory'))
  server = await createPublicServer(root)
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  port = server.address().port
})

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve))
  if (fixture) await rm(fixture, { recursive: true, force: true })
})

function get(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const call = request({ host: '127.0.0.1', port, path, method }, (response) => {
      const chunks = []
      response.on('data', (chunk) => chunks.push(chunk))
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks).toString() }))
    })
    call.once('error', reject)
    call.end()
  })
}

test('serves useful directory documents and preserves query strings on slash redirects', async () => {
  const home = await get('/')
  assert.equal(home.status, 200)
  assert.equal(home.body, '<h1>Public home</h1>')
  const reading = await get('/notes/example/?source=test')
  assert.equal(reading.status, 200)
  assert.match(reading.body, /Useful reading/)
  const redirect = await get('/notes/example?source=test')
  assert.equal(redirect.status, 308)
  assert.equal(redirect.headers.location, '/notes/example/?source=test')
})

test('serves the genuine error document with HTTP 404 for unknown routes, files and empty directories', async () => {
  for (const path of ['/not-a-route/', '/missing.js', '/empty/']) {
    const result = await get(path)
    assert.equal(result.status, 404, path)
    assert.equal(result.body, '<h1>Page not found</h1>')
  }
})

test('cannot expose traversal paths, dotfiles or symlinks', async () => {
  for (const path of [
    '/../outside.txt', '/%2e%2e/outside.txt', '/%2E%2E%2foutside.txt', '/.%2e/outside.txt',
    '/%5c..%5coutside.txt', '/%00', '/%zz', '//outside.txt', '/.env',
    '/outside-link.txt', '/inside-link.html', '/linked-directory/outside.txt',
  ]) {
    const result = await get(path)
    assert.equal(result.status, 404, path)
    assert.doesNotMatch(result.body, /PRIVATE_/)
  }
})

test('returns module/font MIME types, HEAD metadata and GET/HEAD-only semantics', async () => {
  const module = await get('/client.js')
  assert.match(module.headers['content-type'], /^text\/javascript/)
  assert.equal(module.headers['x-content-type-options'], 'nosniff')
  const font = await get('/font.woff2')
  assert.equal(font.headers['content-type'], 'font/woff2')
  const head = await get('/client.js', 'HEAD')
  assert.equal(head.status, 200)
  assert.equal(head.body, '')
  assert.equal(Number(head.headers['content-length']), Buffer.byteLength(module.body))
  const unsupported = await get('/', 'POST')
  assert.equal(unsupported.status, 405)
  assert.equal(unsupported.headers.allow, 'GET, HEAD')
})

test('fails startup when the selected artifact has no genuine error document', async () => {
  const invalid = join(fixture, 'invalid')
  await mkdir(invalid)
  await assert.rejects(() => createPublicServer(invalid), /genuine 404/)
})
