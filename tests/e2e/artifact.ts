import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { Page } from '@playwright/test'

export const preservedPaths = [
  '/',
  '/work/hmh/',
  '/work/optum/',
  '/work/fidelity/',
  '/work/cisco/',
  '/notes/testing-real-time-voice-orchestration-under-interruption/',
  '/notes/consistency-guarantees-for-deprovisioning/',
  '/experience/',
  '/404.html',
  '/writing/',
] as const

export const notePaths = [
  '/notes/testing-real-time-voice-orchestration-under-interruption/',
  '/notes/consistency-guarantees-for-deprovisioning/',
] as const

type PublicManifest = {
  origin: string
  routes: {
    path: string
    input: string
    indexable: boolean
    expectedText: string
    metadata: { title: string; description: string; canonical: string }
  }[]
}

/** This build-time contract is deliberately read from staging, never the public artifact. */
export async function readManifest(): Promise<PublicManifest> {
  return JSON.parse(await readFile(resolve('dist/site-build/publication-manifest.json'), 'utf8'))
}

async function moduleFiles(directory: string): Promise<string[]> {
  const result: string[] = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) result.push(...await moduleFiles(path))
    else if (entry.isFile() && /\.m?js$/.test(entry.name)) result.push(path)
  }
  return result
}

/** Find the real emitted app SDK, so its content hash may change without weakening the failure test. */
export async function firebaseAppChunk(): Promise<string> {
  const candidates: string[] = []
  for (const path of await moduleFiles(resolve('dist/public/assets'))) {
    const source = await readFile(path, 'utf8')
    if (source.includes('Firebase App named') && source.includes('automaticDataCollectionEnabled')) candidates.push(path)
  }
  if (candidates.length !== 1) throw new Error(`Expected one emitted Firebase app SDK chunk; found ${candidates.length}.`)
  return `/${candidates[0]!.slice(resolve('dist/public').length + 1).split('\\').join('/')}`
}

/** Settle the intended local startup before a test deliberately leaves a document. */
export async function visitDocument(page: Page, path: string) {
  const chunk = await firebaseAppChunk()
  const loaded = page.waitForResponse((response) => new URL(response.url()).pathname === chunk && response.status() === 200)
  const response = await page.goto(path)
  await loaded
  await page.waitForFunction(async (url) => {
    const sdk = await import(url)
    return typeof sdk.getApps === 'function' && sdk.getApps().some((app: { name: string }) => app.name === '[DEFAULT]')
  }, chunk)
  return response
}
