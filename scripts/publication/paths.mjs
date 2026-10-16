import { constants } from 'node:fs'
import { access, lstat, mkdir, open, readdir, realpath, rename, unlink, writeFile } from 'node:fs/promises'
import { createHash, randomUUID } from 'node:crypto'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'

export const origin = 'https://nalam.me'
export const inventoryName = '.publication-inventory.json'
export const protectedFiles = new Set(['CNAME', '.nojekyll', 'favicon.ico'])
export const staticFonts = new Set([
  'fonts/geist-sans-var.woff2', 'fonts/geist-mono-var.woff2',
  'fonts/newsreader-var.woff2', 'fonts/newsreader-italic-var.woff2',
])
const prohibitedSegments = new Set([
  'src', 'docs', 'resume', 'node_modules', 'scripts', 'tests', 'test', 'admin',
  'prompt-workflow', 'postman', 'coverage', 'dist', 'private', 'drafts',
])

export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')
export const cspHash = (text) => `'sha256-${createHash('sha256').update(text).digest('base64')}'`
export const inventoryDigest = (files) => sha256(JSON.stringify([...files].sort((a, b) => a.path.localeCompare(b.path))))

export function safeRelative(path, { hidden = false } = {}) {
  if (typeof path !== 'string' || !path || path.length > 1024 || isAbsolute(path) ||
    path.includes('\\') || path.includes('%') || path.includes('//') || /[\u0000-\u0020\u007f]/u.test(path)) {
    throw new Error(`Unsafe relative path: ${String(path)}`)
  }
  const parts = path.split('/')
  if (parts.some((part) => !part || part === '.' || part.includes('..') || part.length > 255 ||
    (!hidden && part.startsWith('.') && path !== '.nojekyll') || !/^[a-zA-Z0-9_.-]+$/.test(part))) {
    throw new Error(`Unsafe path component: ${path}`)
  }
  return path
}

export function assertPublicPath(path) {
  safeRelative(path)
  if (path.split('/').some((part) => prohibitedSegments.has(part.toLowerCase())) ||
    /(?:^|\/)(?:AGENTS|CLAUDE|CONTEXT|PRODUCT|README)\./i.test(path) ||
    /\.(?:map|md|mdx|ts|tsx|json|ya?ml|toml|log|pem|key|env)$/i.test(path) ||
    /^(?:firebase|package|yarn|astro|vite|tsconfig)(?:[.-]|$)/i.test(path)) {
    throw new Error(`Prohibited public path or source map: ${path}`)
  }
  return path
}

export function isEmittedAsset(path) {
  return /^assets\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_.-]+[.-][a-zA-Z0-9_-]{8,}\.(?:css|m?js|avif|gif|jpe?g|png|svg|webp|ico|woff2?|ttf|otf|wasm)$/.test(path)
}

export function isImage(path) {
  return /^(?:img|images|figures)\/[a-zA-Z0-9/_\-.]+\.(?:avif|gif|jpe?g|png|svg|webp)$/.test(path)
}

export function routeInput(path) {
  if (typeof path !== 'string' || !(path === '/404.html' || /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)*$/.test(path))) {
    throw new Error(`Unsafe route path: ${String(path)}`)
  }
  return path === '/' ? 'index.html' : path === '/404.html' ? '404.html' : `${path.slice(1)}index.html`
}

export async function exists(path) {
  try { await access(path); return true } catch (error) { if (error.code === 'ENOENT') return false; throw error }
}

export async function canonicalRoot(path) {
  const root = await realpath(path)
  if (!(await lstat(root)).isDirectory()) throw new Error(`Not a directory: ${path}`)
  return root
}

// macOS exposes system temporary directories through /var -> /private/var.
// Resolve only the caller's root alias; relative descendants still pass every
// explicit symlink guard before a read or write.
export function resolveForRoot(requestedRoot, actualRoot, path) {
  const requested = resolve(requestedRoot)
  const absolute = resolve(path)
  return absolute === requested || inside(requested, absolute)
    ? resolve(actualRoot, relative(requested, absolute)) : absolute
}

export function inside(root, path) {
  const rel = relative(root, path)
  return rel !== '' && rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel)
}

/** Reject every symlink in a relative path, including links that stay in root. */
export async function guardedPath(root, path, { allowMissing = false, hidden = false } = {}) {
  safeRelative(path, { hidden })
  let current = root
  for (const part of path.split('/')) {
    current = resolve(current, part)
    try {
      const stat = await lstat(current)
      if (stat.isSymbolicLink()) throw new Error(`Symlink is prohibited: ${path}`)
    } catch (error) {
      if (error.code === 'ENOENT' && allowMissing) break
      throw error
    }
  }
  const destination = resolve(root, path)
  if (!inside(root, destination)) throw new Error(`Path escapes root: ${path}`)
  return destination
}

export async function readSafe(root, path, { hidden = false } = {}) {
  const file = await guardedPath(root, path, { hidden })
  const handle = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const stat = await handle.stat()
    if (!stat.isFile() || stat.size > 100 * 1024 * 1024) throw new Error(`Not a bounded regular file: ${path}`)
    return await handle.readFile()
  } finally { await handle.close() }
}

export async function walkFiles(root, prefix = '') {
  const directory = prefix ? await guardedPath(root, prefix, { hidden: true }) : root
  const result = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name
    safeRelative(path, { hidden: true })
    if (entry.isSymbolicLink()) throw new Error(`Symlink is prohibited: ${path}`)
    if (entry.isDirectory()) result.push(...await walkFiles(root, path))
    else if (entry.isFile()) result.push(path)
    else throw new Error(`Special file is prohibited: ${path}`)
    if (result.length > 10000) throw new Error('Public artifact exceeds the file-count limit.')
  }
  return result.sort()
}

export async function ensureParent(root, path, { hidden = false } = {}) {
  await guardedPath(root, path, { allowMissing: true, hidden })
  await mkdir(dirname(resolve(root, path)), { recursive: true })
  await guardedPath(root, path, { allowMissing: true, hidden })
}

/** Atomic per-file replacement, never a shell copy or repository mirror. */
export async function writeAtomic(root, path, bytes, { hidden = false } = {}) {
  await ensureParent(root, path, { hidden })
  const target = await guardedPath(root, path, { allowMissing: true, hidden })
  const temporary = resolve(dirname(target), `.publication-${randomUUID()}.tmp`)
  try {
    await writeFile(temporary, bytes, { flag: 'wx', mode: 0o644 })
    await rename(temporary, target)
  } catch (error) {
    await unlink(temporary).catch(() => {})
    throw error
  }
}

export function parseJson(bytes, label) {
  try { return JSON.parse(bytes.toString('utf8')) } catch { throw new Error(`Invalid ${label} JSON.`) }
}

export function validateFileInventory(files, { allowEmpty = false } = {}) {
  if (!Array.isArray(files) || (!allowEmpty && files.length === 0) || files.length > 10000) throw new Error('Invalid ownership inventory file list.')
  const paths = new Set()
  for (const file of files) {
    assertPublicPath(file.path)
    if (paths.has(file.path)) throw new Error(`Duplicate inventory path: ${file.path}`)
    paths.add(file.path)
    if (!/^[a-f0-9]{64}$/.test(file.sha256) || !Number.isSafeInteger(file.size) || file.size < 0) throw new Error(`Invalid inventory identity: ${file.path}`)
  }
  return files
}
