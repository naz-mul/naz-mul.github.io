import { createServer } from 'node:http'
import { lstat, readFile, realpath, stat } from 'node:fs/promises'
import { extname, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export const publicDirectory = fileURLToPath(new URL('../dist/public/', import.meta.url))

const mediaTypes = new Map(Object.entries({
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}))

function isWithin(root, file) {
  const path = relative(root, file)
  return path !== '..' && !path.startsWith(`..${sep}`) && !path.startsWith(sep)
}

function requestPath(rawUrl) {
  if (!rawUrl?.startsWith('/') || rawUrl.startsWith('//')) return
  try {
    const pathname = decodeURIComponent(rawUrl.split('?')[0])
    if (/[\\\u0000-\u001f\u007f]/u.test(pathname)) return
    if (pathname.split('/').some((part) => part === '..' || part === '.' || part.startsWith('.'))) return
    return pathname
  } catch {
    return
  }
}

async function safePath(root, pathname) {
  const candidate = resolve(root, `.${pathname}`)
  if (!isWithin(root, candidate)) return
  try {
    let segment = root
    for (const part of relative(root, candidate).split(sep).filter(Boolean)) {
      segment = resolve(segment, part)
      if ((await lstat(segment)).isSymbolicLink()) return
    }
    const actual = await realpath(candidate)
    if (!isWithin(root, actual)) return
    return { path: actual, info: await stat(actual) }
  } catch (error) {
    if (['ENOENT', 'ENOTDIR', 'ELOOP'].includes(error.code)) return
    throw error
  }
}

function send(response, method, status, body, type, headers = {}) {
  response.writeHead(status, {
    'Content-Type': type,
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  })
  response.end(method === 'HEAD' ? undefined : body)
}

/** A fixture directory can be injected by the server tests; the CLI always serves dist/public. */
export async function createPublicServer(directory = publicDirectory) {
  const root = await realpath(directory)
  if (!(await stat(root)).isDirectory()) throw new Error('The public artifact must be a directory.')
  const notFound = await safePath(root, '/404.html')
  if (!notFound?.info.isFile()) throw new Error('The public artifact needs a genuine 404.html document.')
  const notFoundBody = await readFile(notFound.path)

  return createServer((request, response) => {
    const handle = async () => {
      const method = request.method ?? 'GET'
      if (!['GET', 'HEAD'].includes(method)) {
        send(response, method, 405, 'Method not allowed', 'text/plain; charset=utf-8', { Allow: 'GET, HEAD' })
        return
      }
      const pathname = requestPath(request.url)
      const candidate = pathname && await safePath(root, pathname)
      let file = candidate
      if (candidate?.info.isDirectory()) {
        if (!pathname.endsWith('/')) {
          const query = request.url.includes('?') ? `?${request.url.split('?').slice(1).join('?')}` : ''
          send(response, method, 308, '', 'text/plain; charset=utf-8', { Location: `${encodeURI(pathname)}/${query}` })
          return
        }
        file = await safePath(root, `${pathname}index.html`)
      }
      if (!file?.info.isFile()) {
        send(response, method, 404, notFoundBody, 'text/html; charset=utf-8')
        return
      }
      const body = await readFile(file.path)
      send(response, method, 200, body, mediaTypes.get(extname(file.path)) ?? 'application/octet-stream')
    }
    void handle().catch(() => {
      if (!response.headersSent) send(response, request.method, 500, 'Unable to read public artifact', 'text/plain; charset=utf-8')
      else response.destroy()
    })
  })
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const port = Number(process.env.NALAM_PREVIEW_PORT ?? 4173)
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('NALAM_PREVIEW_PORT must be an available TCP port.')
    const server = await createPublicServer()
    server.on('error', (error) => { console.error(error.message); process.exitCode = 1 })
    server.listen(port, '127.0.0.1', () => console.log(`Public artifact preview: http://127.0.0.1:${port}`))
    for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close())
  } catch (error) {
    console.error(`Public artifact preview failed: ${error.message}`)
    process.exitCode = 1
  }
}
