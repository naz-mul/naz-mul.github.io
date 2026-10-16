import { firebaseAppChunk, notePaths } from './artifact'
import { test, expect } from './fixtures'

test('the real app SDK loads locally and retains one intended browser app', async ({ page, evidence }) => {
  const chunk = await firebaseAppChunk()
  const loaded = page.waitForResponse((response) => new URL(response.url()).pathname === chunk && response.status() === 200)
  await page.goto('/')
  await loaded
  const app = await page.evaluate(async (url) => {
    const sdk = await import(url)
    if (typeof sdk.getApps !== 'function') throw new Error('The emitted app SDK has no inspectable getApps export.')
    const apps = sdk.getApps()
    const intended = apps.find((candidate: { name: string }) => candidate.name === '[DEFAULT]')
    if (!intended) throw new Error('The browser bootstrap did not initialize the default app.')
    const stableOptions = Object.fromEntries(Object.entries(intended.options).sort())
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(stableOptions)))
    return {
      count: apps.length,
      name: intended.name,
      project: intended.options.projectId,
      automaticDataCollectionEnabled: intended.automaticDataCollectionEnabled,
      sameInstance: sdk.getApps().find((candidate: { name: string }) => candidate.name === '[DEFAULT]') === intended,
      configDigest: [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join(''),
    }
  }, chunk)
  expect(app).toEqual({
    count: 1,
    name: '[DEFAULT]',
    project: 'nalam-aa058',
    automaticDataCollectionEnabled: false,
    sameInstance: true,
    configDigest: '82a32b97c1d69ad9c36191a3527bfdc849df6a9e068d39a612c6bbd22f40131c',
  })
  expect(evidence.console.filter((entry) => entry.type === 'warning' && entry.text.includes('Firebase'))).toEqual([])
})

test.describe('SDK loading failure', () => {
  test.use({ allowedConsoleErrors: ['Failed to load resource: net::ERR_FAILED'], allowedRequestFailures: ['/assets/.*\\.m?js$'] })

  test('reading and contents navigation survive a blocked app SDK with one bounded diagnostic', async ({ page, evidence }) => {
    const chunk = await firebaseAppChunk()
    await page.route((url) => url.pathname === chunk, (route) => route.abort('failed'))
    const warning = page.waitForEvent('console', (message) => message.type() === 'warning' && message.text().includes('Firebase browser initialization skipped'))
    await page.goto(notePaths[0])
    await warning
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Testing real-time voice orchestration')
    const contents = page.getByRole('navigation', { name: 'On this page', exact: true })
    await expect(contents).toBeVisible()
    const first = contents.getByRole('link').first()
    const destination = await first.getAttribute('href')
    expect(destination).toMatch(/^#[a-z0-9-]+$/)
    await first.click()
    await expect(page.locator(destination!)).toBeInViewport()
    expect(evidence.failedRequests).toHaveLength(1)
    expect(new URL(evidence.failedRequests[0]!.url).pathname).toBe(chunk)
    expect(evidence.console.filter((entry) => entry.type === 'warning').map((entry) => entry.text)).toEqual(['[nalam.me] Firebase browser initialization skipped (sdk-startup-failed).'])
  })
})
