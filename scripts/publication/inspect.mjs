import { parse as parseHtml } from 'parse5'
import { init, parse as parseModule } from 'es-module-lexer/minimal/js'
import postcss from 'postcss'
import { origin, cspHash } from './paths.mjs'

const normalize = (text) => text.replace(/\s+/gu, ' ').trim()
const textOf = (node) => node.nodeName === '#text' ? node.value :
  ['script', 'style', 'template'].includes(node.tagName) ? '' : (node.childNodes ?? []).map(textOf).join('') +
    (['p', 'div', 'section', 'article', 'li', 'pre', 'h1', 'h2', 'h3', 'h4', 'br'].includes(node.tagName) ? ' ' : '')
const sourceOf = (node) => (node.childNodes ?? []).map((child) => child.value ?? '').join('')

function descendants(node, result = []) {
  if (node.tagName) result.push(node)
  for (const child of node.childNodes ?? []) descendants(child, result)
  // Content in an inert template still needs validation: Astro can move it live.
  if (node.content) descendants(node.content, result)
  return result
}

function one(nodes, predicate, label) {
  const matches = nodes.filter(predicate)
  if (matches.length !== 1) throw new Error(`Expected exactly one ${label}; found ${matches.length}.`)
  return matches[0]
}

function equal(actual, expected, label) {
  if (normalize(actual ?? '') !== normalize(expected)) throw new Error(`Rendered ${label} mismatch.`)
}

export function inspectHtml(source, route) {
  if (/\b(?:PRIVATE_DRAFT_CANARY|RESUME_PRIVACY_CANARY|PUBLICATION_PRIVATE_CANARY)\b/.test(source)) throw new Error('Privacy canary reached public HTML.')
  const document = parseHtml(source)
  const nodes = descendants(document)
  const attrs = (node) => new Map((node.attrs ?? []).map(({ name, value }) => [name, value]))
  const tags = nodes.map((node) => ({ node, tag: node.tagName, attrs: attrs(node) }))
  if (tags.some(({ tag }) => tag === 'base')) throw new Error('A base URL can bypass local-link validation.')
  if (tags.some(({ tag }) => ['iframe', 'object', 'embed', 'form'].includes(tag))) throw new Error('Unrequested embedded documents/forms are prohibited.')
  if (tags.some(({ tag, attrs: a }) => tag === 'meta' && a.get('http-equiv')?.toLowerCase() === 'refresh')) throw new Error('SPA/refresh redirects are prohibited.')
  equal(sourceOf(one(nodes, (node) => node.tagName === 'title', 'title')), route.metadata.title, 'title')
  const meta = (name, key = 'name') => {
    const item = one(tags, ({ tag, attrs: a }) => tag === 'meta' && a.get(key) === name, `meta ${name}`)
    return item.attrs.get('content')
  }
  equal(meta('description'), route.metadata.description, 'description')
  const canonical = one(tags, ({ tag, attrs: a }) => tag === 'link' && a.get('rel')?.split(/\s+/).includes('canonical'), 'canonical')
  equal(canonical.attrs.get('href'), route.metadata.canonical, 'canonical')
  for (const field of ['type', 'title', 'description', 'url']) equal(meta(`og:${field}`, 'property'), route.metadata.openGraph[field], `open graph ${field}`)
  const robots = tags.filter(({ tag, attrs: a }) => tag === 'meta' && a.get('name') === 'robots').map(({ attrs: a }) => a.get('content') ?? '').join(',')
  if (route.indexable ? /\bnoindex\b/i.test(robots) : !/\bnoindex\b/i.test(robots)) throw new Error(`Rendered robots indexability mismatch: ${route.path}`)
  const main = one(nodes, (node) => node.tagName === 'main', 'main landmark')
  const prose = normalize(textOf(main))
  if (prose.length < 20 || !prose.includes(normalize(route.expectedText))) throw new Error(`Missing meaningful expected HTML text: ${route.path}`)

  const ids = new Set()
  const links = []
  const resources = []
  const scripts = []
  const styles = []
  const scriptHashes = new Set()
  const styleHashes = new Set()
  const styleAttributeHashes = new Set()
  for (const { node, tag, attrs: a } of tags) {
    if (a.has('id')) {
      if (ids.has(a.get('id'))) throw new Error(`Duplicate HTML id in ${route.path}: ${a.get('id')}`)
      ids.add(a.get('id'))
    }
    for (const [name, value] of a) {
      if (/^on[a-z]+$/i.test(name)) throw new Error(`Inline event handler is prohibited: ${route.path}`)
      if (name === 'style') {
        styleAttributeHashes.add(cspHash(value))
        styles.push(`element{${value}}`)
      }
    }
    if (tag === 'a' || tag === 'area') {
      if (a.has('href')) links.push(a.get('href'))
    } else if (a.has('href') && tag !== 'link') {
      // SVG use/image references are real resources or same-document fragments.
      resources.push(a.get('href'))
    }
    if (tag === 'link') {
      const rel = a.get('rel')?.split(/\s+/) ?? []
      if (rel.some((value) => ['stylesheet', 'icon', 'apple-touch-icon', 'preload', 'modulepreload'].includes(value))) resources.push(a.get('href'))
      else if (rel.some((value) => ['preconnect', 'dns-prefetch', 'prefetch', 'prerender'].includes(value))) resources.push(a.get('href'))
      else if (!rel.includes('canonical') && a.has('href')) links.push(a.get('href'))
    }
    for (const name of ['src', 'poster', 'data', 'background', 'xlink:href']) if (a.has(name)) resources.push(a.get(name))
    for (const name of ['component-url', 'renderer-url', 'before-hydration-url']) if (a.has(name)) resources.push(a.get(name))
    for (const name of ['srcset', 'imagesrcset']) {
      if (!a.has(name)) continue
      // Build-produced candidate URLs use ordinary same-origin file paths.
      // Reject embedded data/commas instead of ambiguously splitting srcset.
      if (/data:|["'()]/i.test(a.get(name))) throw new Error(`Unsupported/unsafe srcset: ${route.path}`)
      for (const candidate of a.get(name).split(',')) {
        const parts = candidate.trim().split(/\s+/)
        if (parts.length > 2 || (parts[1] && !/^\d+(?:\.\d+)?[wx]$/.test(parts[1]))) throw new Error(`Malformed srcset: ${route.path}`)
        resources.push(parts[0])
      }
    }
    if (tag === 'script' && !a.has('src')) {
      const body = sourceOf(node)
      if (!body.trim()) continue
      scriptHashes.add(cspHash(body))
      const type = a.get('type')?.toLowerCase()
      if (!type || ['module', 'text/javascript', 'application/javascript'].includes(type)) scripts.push(body)
      else if (type !== 'application/ld+json' && type !== 'application/json') throw new Error(`Unsupported inline script type: ${type}`)
    }
    if (tag === 'style') {
      const body = sourceOf(node)
      styles.push(body)
      styleHashes.add(cspHash(body))
    }
  }
  return { ids, links, resources, scripts, styles, scriptHashes, styleHashes, styleAttributeHashes }
}

export function referenceUrl(value, base, { resource = false } = {}) {
  if (resource && typeof value === 'string' && /^data:/i.test(value)) {
    // An embedded image payload is not a filesystem path. Decode SVG only as
    // bounded data so the same no-script/no-remote-reference inspection can run.
    const match = value.match(/^data:(image\/(?:png|gif|jpe?g|webp|svg\+xml))(?:;charset=utf-8)?(;base64)?,([\s\S]*)$/i)
    if (!match || value.length > 1024 * 1024 || /[\u0000-\u001f\u007f]/u.test(value)) throw new Error('Unapproved or oversized embedded image resource.')
    const svg = match[1].toLowerCase() === 'image/svg+xml'
    let decoded
    try {
      if (match[2]) {
        if (!/^[a-zA-Z0-9+/]*={0,2}$/.test(match[3])) throw new Error('Invalid base64.')
        const bytes = Buffer.from(match[3], 'base64')
        if (bytes.toString('base64').replace(/=+$/, '') !== match[3].replace(/=+$/, '')) throw new Error('Non-canonical base64.')
        if (svg) decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
      } else if (svg) decoded = decodeURIComponent(match[3])
      else if (/%(?![a-f0-9]{2})/i.test(match[3])) throw new Error('Invalid percent encoding.')
    } catch { throw new Error('Malformed embedded image encoding.') }
    return { embedded: true, ...(svg ? { svg: decoded } : {}) }
  }
  if (typeof value !== 'string' || !value || /[\u0000-\u0020\u007f\\]/u.test(value) || /%(?:2e|2f|5c|00|0a|0d|25)/i.test(value)) throw new Error(`Unsafe URL path or scheme: ${String(value)}`)
  let url
  try { url = new URL(value, new URL(base, origin)) } catch { throw new Error(`Invalid URL: ${value}`) }
  if (url.username || url.password) throw new Error('URLs with credentials are prohibited.')
  if (url.protocol === 'mailto:' && !resource) {
    if (!/^mailto:[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) throw new Error('Unsafe mailto URL.')
    return { external: true }
  }
  if (url.protocol !== 'https:') throw new Error(`Unsafe URL scheme: ${url.protocol}`)
  if (url.origin !== origin) {
    if (resource) throw new Error(`Third-party runtime resource is prohibited: ${url.origin}`)
    return { external: true }
  }
  let path, fragment
  try { path = decodeURIComponent(url.pathname); fragment = decodeURIComponent(url.hash.slice(1)) } catch { throw new Error('Malformed encoded URL path/fragment.') }
  return { path, fragment, resource }
}

/** Parse module imports, preserving literal dynamic-import chunks and exports. */
export async function moduleReferences(source, label) {
  await init()
  let imports
  try { [imports] = parseModule(source) } catch { throw new Error(`Invalid emitted JavaScript: ${label}`) }
  // Astro's generated island loader imports the explicit component/renderer
  // URLs already validated from <astro-island>. Other computed import paths
  // cannot be proven reachable from a static dependency graph and fail closed.
  const astroLoader = /customElements\.define\(["'`]astro-island["'`]/.test(source) &&
    /getAttribute\(["'`](?:component-url|renderer-url)["'`]/.test(source)
  if (imports.some((item) => item.d >= 0 && item.n === undefined) && !astroLoader) throw new Error(`Unresolved computed dynamic import: ${label}`)
  const references = imports.filter((item) => item.n !== undefined).map((item) => item.n)
  for (const match of source.matchAll(/\bnew\s+URL\(\s*(["'])([^"'\\]+)\1\s*,\s*import\.meta\.url\s*\)/g)) references.push(match[2])
  // Vite can put CSS and modulepreload dependencies in its generated lookup
  // array. Read that explicit emitted dependency table, not arbitrary strings.
  for (const match of source.matchAll(/\bm\.f\s*\|\|\s*\(\s*m\.f\s*=\s*(\[[^\]]*\])/g)) {
    let list
    try { list = JSON.parse(match[1]) } catch { throw new Error(`Unsupported Vite dependency table: ${label}`) }
    if (!Array.isArray(list) || list.some((item) => typeof item !== 'string')) throw new Error(`Invalid Vite dependency table: ${label}`)
    for (const value of list) references.push(value.startsWith('assets/') ? `/${value}` : value)
  }
  if (/sourceMappingURL\s*=/.test(source)) throw new Error(`Undeclared source map reference: ${label}`)
  return references
}

export function inspectSvg(source, label) {
  if (/<!DOCTYPE|<!ENTITY/i.test(source)) throw new Error(`SVG DTD/entity declarations are prohibited: ${label}`)
  if (!/<svg(?:\s|>)/i.test(source)) throw new Error(`Embedded image is not an SVG document: ${label}`)
  const nodes = descendants(parseHtml(source))
  const references = []
  const styleHashes = new Set()
  const styleAttributeHashes = new Set()
  for (const node of nodes) {
    if (['script', 'foreignObject', 'iframe', 'object', 'embed'].includes(node.tagName)) throw new Error(`Executable embedded SVG content is prohibited: ${label}`)
    for (const { name, value } of node.attrs ?? []) {
      if (/^on[a-z]+$/i.test(name)) throw new Error(`Inline SVG event handler is prohibited: ${label}`)
      if (['href', 'src'].includes(name) && !value.startsWith('#')) references.push(value)
      if (name === 'style') {
        references.push(...cssReferences(`element{${value}}`, label))
        styleAttributeHashes.add(cspHash(value))
      }
      if (/^url\(/i.test(value)) references.push(...cssReferences(`element{value:${value}}`, label))
    }
    if (node.tagName === 'style') {
      references.push(...cssReferences(sourceOf(node), label))
      styleHashes.add(cspHash(sourceOf(node)))
    }
  }
  return { references: references.filter((value) => !value.startsWith('#')), styleHashes, styleAttributeHashes }
}

function cssUrlFunctions(value, label) {
  const references = []
  const skipString = (start, { url = false } = {}) => {
    const quote = value[start]
    for (let index = start + 1; index < value.length; index++) {
      if (value[index] === '\\') {
        if (url) throw new Error(`Unsupported escaped CSS URL in ${label}`)
        index++
      } else if (value[index] === quote) return index
      else if (url && /[\r\n]/.test(value[index])) throw new Error(`Unsupported CSS URL newline in ${label}`)
    }
    throw new Error(`Unterminated CSS string in ${label}`)
  }
  for (let index = 0; index < value.length; index++) {
    if (value[index] === '"' || value[index] === "'") { index = skipString(index); continue }
    if (index > 0 && /[a-zA-Z0-9_-]/.test(value[index - 1])) continue
    const call = value.slice(index).match(/^url\s*\(/i)
    if (!call) continue
    let cursor = index + call[0].length
    while (/\s/.test(value[cursor] ?? '') && cursor < value.length) cursor++
    let literal
    if (value[cursor] === '"' || value[cursor] === "'") {
      const end = skipString(cursor, { url: true })
      literal = value.slice(cursor + 1, end)
      cursor = end + 1
      while (/\s/.test(value[cursor] ?? '') && cursor < value.length) cursor++
    } else {
      const start = cursor
      while (cursor < value.length && value[cursor] !== ')') {
        if (/[()"'\\]/.test(value[cursor])) throw new Error(`Unsupported/unsafe CSS URL syntax in ${label}`)
        cursor++
      }
      literal = value.slice(start, cursor).trim()
    }
    if (!literal || value[cursor] !== ')') throw new Error(`Unsupported/unsafe CSS URL syntax in ${label}`)
    references.push(literal)
    index = cursor
  }
  return references
}

export function cssReferences(source, label) {
  let sheet
  try { sheet = postcss.parse(source, { from: label }) } catch { throw new Error(`Invalid emitted CSS: ${label}`) }
  const references = []
  sheet.walkComments((comment) => {
    if (/sourceMappingURL\s*=/.test(comment.text)) throw new Error(`Undeclared CSS source map: ${label}`)
    comment.remove()
  })
  const urls = (value) => references.push(...cssUrlFunctions(value, label))
  sheet.walkDecls((declaration) => urls(declaration.value))
  sheet.walkAtRules((rule) => {
    if (rule.name.toLowerCase() === 'import') {
      if (/^url\(/i.test(rule.params)) urls(rule.params)
      else {
        const match = rule.params.match(/^(["'])([^"'\\]+)\1(?:\s|$)/)
        if (!match) throw new Error(`Unsupported CSS import: ${label}`)
        references.push(match[2])
      }
    }
  })
  return references
}

export function contentSecurityPolicy({ scriptHashes, styleHashes, styleAttributeHashes, embeddedImages }) {
  const sorted = (values) => [...values].sort().join(' ')
  return [
    "default-src 'self'", "base-uri 'none'", "object-src 'none'", "frame-ancestors 'none'", "form-action 'none'",
    `script-src 'self' ${sorted(scriptHashes)}`.trim(), "script-src-attr 'none'", "style-src 'self'",
    `style-src-elem 'self' ${sorted(styleHashes)}`.trim(),
    styleAttributeHashes.size ? `style-src-attr 'unsafe-hashes' ${sorted(styleAttributeHashes)}` : "style-src-attr 'none'",
    `img-src 'self'${embeddedImages ? ' data:' : ''}`, "font-src 'self'", "connect-src 'self'", "manifest-src 'none'",
    'upgrade-insecure-requests',
  ].join('; ')
}
