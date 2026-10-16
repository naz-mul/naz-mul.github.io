import { preservedPaths, notePaths, readManifest, visitDocument } from './artifact'
import { test, expect, observeBrowser } from './fixtures'

const normalize = (value: string) => value.replace(/\s+/g, ' ').trim()

for (const path of preservedPaths) {
  test(`direct static document and no-JS full-text parity: ${path}`, async ({ page, browser, baseURL }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const manifest = await readManifest()
    const route = manifest.routes.find((entry) => entry.path === path)
    expect(route, 'Every preserved/new public document must be in the shared contract.').toBeDefined()
    const response = await visitDocument(page, path)
    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    await expect(page.getByRole('heading', { level: 1 })).not.toBeEmpty()
    await expect(page).toHaveTitle(route!.metadata.title)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://nalam.me${path}`)
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', route!.metadata.description)
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', `https://nalam.me${path}`)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', route!.indexable ? 'index,follow' : 'noindex,follow')
    await expect(page.getByRole('main')).toContainText(route!.expectedText)
    const completeMainText = normalize(await page.getByRole('main').innerText())

    const noJsContext = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 390, height: 844 }, colorScheme: 'light' })
    try {
      const noJsPage = await noJsContext.newPage()
      const evidence = observeBrowser(noJsContext, noJsPage, baseURL!)
      const noJsResponse = await noJsPage.goto(path)
      expect(noJsResponse?.status()).toBe(200)
      await expect(noJsPage.getByRole('heading', { level: 1 })).toBeVisible()
      expect(normalize(await noJsPage.getByRole('main').innerText()), 'All main content survives without JavaScript.').toBe(completeMainText)
      expect(evidence.externalRequests).toEqual([])
      expect(evidence.pageErrors).toEqual([])
      expect(evidence.console.filter((entry) => entry.type === 'error')).toEqual([])
      expect(evidence.failedRequests).toEqual([])
      if (path === '/') {
        const copy = noJsPage.getByRole('button', { name: 'Copy profile JSON', exact: true, includeHidden: true })
        if (await copy.count()) expect(await copy.isHidden() || await copy.isDisabled()).toBe(true)
      }
      await testInfo.attach('no-js-browser-evidence', { body: JSON.stringify(evidence, null, 2), contentType: 'application/json' })
    } finally {
      await noJsContext.close()
    }
  })
}

test('the public artifact exposes exactly the approved document inventory and sitemap', async ({ request }) => {
  const manifest = await readManifest()
  expect(manifest.origin).toBe('https://nalam.me')
  expect(manifest.routes.map((route) => route.path).sort()).toEqual([...preservedPaths].sort())
  const sitemap = await request.get('/sitemap.xml')
  expect(sitemap.status()).toBe(200)
  const urls = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
  expect(urls.sort()).toEqual(preservedPaths.filter((path) => path !== '/404.html').map((path) => `https://nalam.me${path}`).sort())
  for (const privatePath of ['/publication-manifest.json', '/src/content/site.ts', '/docs/resume/', '/prompt-workflow/', '/firebase.json', '/package.json']) {
    expect((await request.get(privatePath)).status(), privatePath).toBe(404)
  }
})

test.describe('genuine browser 404', () => {
  test.use({ allowedConsoleErrors: ['^Failed to load resource: the server responded with a status of 404 \\(Not Found\\)$'] })

  test('unknown deep links use the genuine error document and HTTP 404', async ({ page, evidence }) => {
    const path = '/unknown-engineering-route/nested/'
    const response = await page.goto(path)
    expect(response?.status()).toBe(404)
    expect(await response!.text()).toContain('That page does not exist.')
    expect(await response!.text()).not.toContain('http-equiv="refresh"')
    await expect(page).toHaveURL(path)
    await expect(page.getByRole('heading', { level: 1, name: 'Not found', exact: true })).toBeVisible()
    await expect(page.getByRole('main')).toContainText('That page does not exist.')
    expect(evidence.responses.filter((entry) => entry.status >= 400).map((entry) => new URL(entry.url).pathname)).toEqual([path])
  })
})

test('home preserves the seven-section order and the three honest in-progress summaries', async ({ page }) => {
  await page.goto('/')
  expect(await page.getByRole('main').locator(':scope > section[id]').evaluateAll((sections) => sections.map((section) => section.id))).toEqual(['intro', 'projects', 'focus', 'experience', 'writing', 'about', 'contact'])
  const projects = page.getByRole('region', { name: 'Featured projects', exact: true })
  for (const title of ['AI Voice Platform', 'Developer Learning Platform', 'Community Technology']) {
    const row = projects.getByRole('listitem').filter({ has: page.getByRole('heading', { name: title, exact: true }) })
    await expect(row).toBeVisible()
    await expect(row.getByText('In progress', { exact: true })).toHaveCount(1)
    await expect(row.getByRole('link'), 'No public project destination has been supplied.').toHaveCount(0)
  }
  await expect(page.getByRole('link', { name: /view project/i })).toHaveCount(0)
})

test('writing discovery leads to the two original notes without invented LinkedIn cards', async ({ page }) => {
  await page.goto('/writing/')
  const main = page.getByRole('main')
  for (const path of notePaths) await expect(main.locator(`a[href="${path}"]`)).toHaveCount(1)
  await expect(main.getByRole('link', { name: 'Read on LinkedIn', exact: true })).toHaveCount(0)
  await expect(main.locator('a[href*="linkedin.com/pulse/"], a[href*="linkedin.com/posts/"]')).toHaveCount(0)
  await main.locator(`a[href="${notePaths[0]}"]`).click()
  await expect(page).toHaveURL(notePaths[0])
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Testing real-time voice orchestration')
})
