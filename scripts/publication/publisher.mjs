import { mkdir, open, unlink } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import {
  assertPublicPath, canonicalRoot, exists, guardedPath, inside, inventoryDigest, inventoryName,
  isEmittedAsset, isImage, origin, parseJson, protectedFiles, readSafe, sha256, staticFonts,
  resolveForRoot, validateFileInventory, walkFiles, writeAtomic,
} from './paths.mjs'
import { eligibleFile, validateManifest } from './contract.mjs'

const legacyRoutes = new Set([
  'index.html', '404.html', 'experience/index.html', 'sitemap.xml',
  'work/cisco/index.html', 'work/fidelity/index.html', 'work/hmh/index.html', 'work/optum/index.html',
  'notes/testing-real-time-voice-orchestration-under-interruption/index.html',
  'notes/consistency-guarantees-for-deprovisioning/index.html',
])
const publicHtml = (path) => path === 'index.html' || path === '404.html' || /^(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)+index\.html$/.test(path)
const managedPath = (path) => publicHtml(path) || path === 'sitemap.xml' || isEmittedAsset(path) || staticFonts.has(path) || isImage(path)

function validateOwnership(inventory, { legacy = false } = {}) {
  if (!inventory || inventory.version !== 1 || inventory.origin !== origin ||
    inventory.kind !== (legacy ? 'legacy-generated-output' : 'managed-root-publication')) throw new Error('Invalid or prohibited ownership inventory.')
  validateFileInventory(inventory.files, { allowEmpty: true })
  for (const file of inventory.files) {
    assertPublicPath(file.path)
    if (protectedFiles.has(file.path) || (legacy ? !(legacyRoutes.has(file.path) || isEmittedAsset(file.path)) : !managedPath(file.path))) throw new Error(`Protected/unmanaged deletion path outside ownership allowlist: ${file.path}`)
  }
  if (!legacy && (!/^[a-f0-9]{64}$/.test(inventory.artifactDigest) || inventory.digest !== inventoryDigest(inventory.files))) throw new Error('Ownership inventory digest mismatch.')
  return inventory
}

async function optionalRootRead(root, path, options) {
  const file = await guardedPath(root, path, { allowMissing: true, ...options })
  return await exists(file) ? readSafe(root, path, options) : undefined
}

async function verifyExisting(root, files) {
  const bytes = new Map()
  for (const file of files) {
    const value = await optionalRootRead(root, file.path)
    if (!value || value.length !== file.size || sha256(value) !== file.sha256) throw new Error(`Owned output changed or identity mismatch: ${file.path}`)
    bytes.set(file.path, value)
  }
  return bytes
}

async function readArtifact({ root, artifactDir, reportPath }) {
  const artifactRelative = relative(root, artifactDir).split('\\').join('/')
  if (!inside(resolve(root, 'dist'), artifactDir)) throw new Error('The publication artifact must be inside isolated dist output.')
  await guardedPath(root, artifactRelative)
  const reportRelative = relative(root, reportPath).split('\\').join('/')
  await guardedPath(root, reportRelative)
  const report = parseJson(await readSafe(root, reportRelative), 'public artifact report')
  const manifest = validateManifest(report.manifest)
  validateFileInventory(report.files)
  if (report.version !== 1 || report.origin !== origin || report.artifactDigest !== inventoryDigest(report.files)) throw new Error('Public artifact report identity mismatch.')
  const paths = await walkFiles(artifactDir)
  if (JSON.stringify(paths) !== JSON.stringify(report.files.map((file) => file.path).sort())) throw new Error('Public artifact has missing/unmanaged files relative to its report.')
  const bytes = new Map()
  for (const file of report.files) {
    if (!eligibleFile(file.path, manifest)) throw new Error(`Unapproved artifact publication path: ${file.path}`)
    const content = await readSafe(artifactDir, file.path)
    if (content.length !== file.size || sha256(content) !== file.sha256) throw new Error(`Public artifact changed or identity mismatch: ${file.path}`)
    bytes.set(file.path, content)
  }
  return { report, bytes }
}

async function publicationPlan(options) {
  const requestedRoot = options.root ?? process.cwd()
  const root = await canonicalRoot(requestedRoot)
  const artifactDir = resolveForRoot(requestedRoot, root, options.artifactDir ?? resolve(root, 'dist/public'))
  const reportPath = resolveForRoot(requestedRoot, root, options.reportPath ?? resolve(root, 'dist/publication-report.json'))
  const { report, bytes: artifactBytes } = await readArtifact({ root, artifactDir, reportPath })
  const priorInventoryBytes = await optionalRootRead(root, inventoryName, { hidden: true })
  let prior
  if (priorInventoryBytes) prior = validateOwnership(parseJson(priorInventoryBytes, 'ownership inventory'))
  else {
    const initialPath = resolveForRoot(requestedRoot, root, options.legacyInventoryPath ?? resolve(root, 'scripts/publication/legacy-root-inventory.json'))
    if (!inside(root, initialPath)) throw new Error('Initial legacy inventory must be a reviewed file inside this root.')
    try { prior = validateOwnership(parseJson(await readSafe(root, relative(root, initialPath).split('\\').join('/')), 'legacy ownership inventory'), { legacy: true }) }
    catch (error) { throw new Error(`Initial ownership inventory is required and must match the reviewed baseline: ${error.message}`) }
  }
  const beforeBytes = await verifyExisting(root, prior.files)
  const owned = new Map(prior.files.map((file) => [file.path, file]))
  const nextOwned = []
  const writes = []
  const preservations = []
  for (const file of report.files) {
    const previous = owned.get(file.path)
    const current = previous ? beforeBytes.get(file.path) : await optionalRootRead(root, file.path)
    if (protectedFiles.has(file.path)) {
      if (!current || sha256(current) !== file.sha256) throw new Error(`Protected ${file.path} is absent or would change; resolve it explicitly before publication.`)
      preservations.push(file.path)
      continue
    }
    if (!managedPath(file.path)) throw new Error(`Unmanaged public destination: ${file.path}`)
    if (!previous && current) {
      // Existing reviewed static resources stay user-owned. The publisher can
      // reference them, but cannot adopt/delete/replace them without ownership.
      if ((staticFonts.has(file.path) || isImage(file.path)) && sha256(current) === file.sha256) {
        preservations.push(file.path)
        continue
      }
      throw new Error(`Unowned destination collision: ${file.path}`)
    }
    nextOwned.push(file)
    if (!current || sha256(current) !== file.sha256) writes.push(file.path)
  }
  const nextPaths = new Set(nextOwned.map((file) => file.path))
  const removals = prior.files.filter((file) => !nextPaths.has(file.path)).map((file) => file.path)
  for (const path of [...writes, ...removals]) await guardedPath(root, path, { allowMissing: true })
  const nextInventory = {
    version: 1, kind: 'managed-root-publication', origin,
    artifactDigest: report.artifactDigest, digest: inventoryDigest(nextOwned), files: nextOwned,
  }
  return { root, artifactBytes, report, prior, priorInventoryBytes, beforeBytes, nextInventory, writes, removals, preservations }
}

function publicPlan(plan, extra = {}) {
  return {
    applied: false, artifactDigest: plan.report.artifactDigest,
    writes: plan.writes, removals: plan.removals, preserved: plan.preservations,
    ownedFileCount: plan.nextInventory.files.length, ...extra,
  }
}

async function withPublicationLock(root, run) {
  await guardedPath(root, 'dist/.publication.lock', { allowMissing: true, hidden: true })
  await mkdir(resolve(root, 'dist'), { recursive: true })
  let lock
  try { lock = await open(resolve(root, 'dist/.publication.lock'), 'wx', 0o600) }
  catch (error) { if (error.code === 'EEXIST') throw new Error('A publication lock exists; inspect the active transaction before retrying.'); throw error }
  try { await lock.writeFile(`${process.pid}\n`); return await run() }
  finally { await lock.close(); await unlink(resolve(root, 'dist/.publication.lock')) }
}

async function restorePlanBefore(plan) {
  for (const path of plan.writes) {
    const old = plan.beforeBytes.get(path)
    if (old) await writeAtomic(plan.root, path, old)
    else if (await optionalRootRead(plan.root, path)) await unlink(await guardedPath(plan.root, path))
  }
  for (const path of plan.removals) await writeAtomic(plan.root, path, plan.beforeBytes.get(path))
  if (plan.priorInventoryBytes) await writeAtomic(plan.root, inventoryName, plan.priorInventoryBytes, { hidden: true })
  else if (await optionalRootRead(plan.root, inventoryName, { hidden: true })) await unlink(await guardedPath(plan.root, inventoryName, { hidden: true }))
}

/** Dry-run is the default. Applying only changes prevalidated owned destinations. */
export async function publishRoot(options = {}) {
  if (!options.apply) return publicPlan(await publicationPlan(options))
  const root = await canonicalRoot(options.root ?? process.cwd())
  return withPublicationLock(root, async () => {
    const plan = await publicationPlan(options)
    const transactionRelative = `dist/publication-backups/${new Date().toISOString().replaceAll(':', '-')}-${randomUUID()}`
    await guardedPath(root, transactionRelative, { allowMissing: true })
    const transactionDir = resolve(root, transactionRelative)
    await mkdir(transactionDir, { recursive: true })
    for (const [path, bytes] of plan.beforeBytes) await writeAtomic(transactionDir, `before/${path}`, bytes)
    if (plan.priorInventoryBytes) await writeAtomic(transactionDir, 'before-inventory.json', plan.priorInventoryBytes)
    const nextInventoryBytes = Buffer.from(`${JSON.stringify(plan.nextInventory, null, 2)}\n`)
    await writeAtomic(transactionDir, 'after-inventory.json', nextInventoryBytes)
    const transaction = {
      version: 1, origin, root, status: 'prepared', artifactDigest: plan.report.artifactDigest,
      before: plan.prior, after: plan.nextInventory,
      hadPriorInventory: Boolean(plan.priorInventoryBytes), afterInventorySha256: sha256(nextInventoryBytes),
      writes: plan.writes, removals: plan.removals,
    }
    await writeAtomic(transactionDir, 'transaction.json', `${JSON.stringify(transaction, null, 2)}\n`)
    try {
      for (const path of plan.writes) await writeAtomic(root, path, plan.artifactBytes.get(path))
      for (const path of plan.removals) await unlink(await guardedPath(root, path))
      await writeAtomic(root, inventoryName, nextInventoryBytes, { hidden: true })
      transaction.status = 'applied'
      await writeAtomic(transactionDir, 'transaction.json', `${JSON.stringify(transaction, null, 2)}\n`)
    } catch (error) {
      try {
        await restorePlanBefore(plan)
        transaction.status = 'failed-and-restored'
        await writeAtomic(transactionDir, 'transaction.json', `${JSON.stringify(transaction, null, 2)}\n`)
      } catch (recoveryError) { throw new Error(`Publication failed; recovery needs inspection at ${transactionDir}: ${error.message}; ${recoveryError.message}`) }
      throw new Error(`Publication failed and prior output was restored. Recovery record: ${transactionDir}. ${error.message}`)
    }
    return publicPlan(plan, { applied: true, transactionDir })
  })
}

async function rollbackPlan({ root, transactionDir }) {
  const requestedRoot = root ?? process.cwd()
  root = await canonicalRoot(root ?? process.cwd())
  transactionDir = resolveForRoot(requestedRoot, root, transactionDir ?? '')
  if (!inside(resolve(root, 'dist/publication-backups'), transactionDir)) throw new Error('Rollback must use a saved local publication transaction.')
  await guardedPath(root, relative(root, transactionDir).split('\\').join('/'))
  const transaction = parseJson(await readSafe(transactionDir, 'transaction.json'), 'rollback transaction')
  if (transaction.version !== 1 || transaction.origin !== origin || transaction.root !== root || transaction.status !== 'applied') throw new Error('Invalid/not-applied rollback transaction.')
  validateOwnership(transaction.before, { legacy: transaction.before.kind === 'legacy-generated-output' })
  validateOwnership(transaction.after)
  const currentInventoryBytes = await readSafe(root, inventoryName, { hidden: true })
  if (sha256(currentInventoryBytes) !== transaction.afterInventorySha256) throw new Error('Current ownership inventory changed since this transaction.')
  const afterBytes = await verifyExisting(root, transaction.after.files)
  const beforeBytes = new Map()
  const afterPaths = new Set(transaction.after.files.map((file) => file.path))
  for (const file of transaction.before.files) {
    const bytes = await readSafe(transactionDir, `before/${file.path}`)
    if (bytes.length !== file.size || sha256(bytes) !== file.sha256) throw new Error(`Rollback backup identity mismatch: ${file.path}`)
    if (!afterPaths.has(file.path) && await optionalRootRead(root, file.path)) throw new Error(`Unowned rollback destination collision: ${file.path}`)
    beforeBytes.set(file.path, bytes)
  }
  let priorInventoryBytes
  if (transaction.hadPriorInventory) {
    priorInventoryBytes = await readSafe(transactionDir, 'before-inventory.json')
    const prior = validateOwnership(parseJson(priorInventoryBytes, 'prior ownership inventory'))
    if (prior.digest !== transaction.before.digest) throw new Error('Prior rollback inventory identity mismatch.')
  }
  const beforePaths = new Set(transaction.before.files.map((file) => file.path))
  const removals = transaction.after.files.filter((file) => !beforePaths.has(file.path)).map((file) => file.path)
  const writes = transaction.before.files.filter((file) => !afterBytes.has(file.path) || sha256(afterBytes.get(file.path)) !== file.sha256).map((file) => file.path)
  return { root, transactionDir, transaction, beforeBytes, afterBytes, priorInventoryBytes, writes, removals }
}

/** Guarded rollback also previews first and refuses post-publication user edits. */
export async function rollbackRoot(options = {}) {
  if (!options.apply) {
    const plan = await rollbackPlan(options)
    return { applied: false, writes: plan.writes, removals: plan.removals, transactionDir: plan.transactionDir }
  }
  const root = await canonicalRoot(options.root ?? process.cwd())
  return withPublicationLock(root, async () => {
    const plan = await rollbackPlan(options)
    for (const path of plan.writes) await writeAtomic(root, path, plan.beforeBytes.get(path))
    for (const path of plan.removals) await unlink(await guardedPath(root, path))
    if (plan.priorInventoryBytes) await writeAtomic(root, inventoryName, plan.priorInventoryBytes, { hidden: true })
    else await unlink(await guardedPath(root, inventoryName, { hidden: true }))
    plan.transaction.status = 'rolled-back'
    await writeAtomic(plan.transactionDir, 'transaction.json', `${JSON.stringify(plan.transaction, null, 2)}\n`)
    return { applied: true, writes: plan.writes, removals: plan.removals, transactionDir: plan.transactionDir }
  })
}
