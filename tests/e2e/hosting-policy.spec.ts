import { readFile } from 'node:fs/promises'
import { firebaseAppChunk, notePaths, visitDocument } from './artifact'
import { test, expect } from './fixtures'

type HostingConfiguration = {
  hosting: { headers: { source: string; headers: { key: string; value: string }[] }[] }
}

test('the generated Firebase CSP permits the actual static site, themes, SDK and reading', async ({ page }, testInfo) => {
  const configuration: HostingConfiguration = JSON.parse(await readFile('firebase.json', 'utf8'))
  const policies = configuration.hosting.headers
    .filter((rule) => rule.source === '**')
    .flatMap((rule) => rule.headers)
    .filter((header) => header.key.toLowerCase() === 'content-security-policy')
  expect(policies, 'Generate the enforced artifact-specific policy before browser verification.').toHaveLength(1)
  const policy = policies[0]!.value
  expect(policy).toContain("'sha256-")
  expect(policy).not.toContain("'unsafe-inline'")

  await page.addInitScript(() => {
    const violations: { blockedURI: string; directive: string; sourceFile: string; disposition: string }[] = []
    Object.defineProperty(window, '__nalamCspViolations', { value: violations })
    document.addEventListener('securitypolicyviolation', (event) => violations.push({
      blockedURI: event.blockedURI,
      directive: event.effectiveDirective,
      sourceFile: event.sourceFile,
      disposition: event.disposition,
    }))
  })
  await page.route('**/*', async (route) => {
    if (route.request().resourceType() !== 'document') return route.continue()
    const response = await route.fetch()
    await route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': policy } })
  })

  const home = await visitDocument(page, '/')
  expect(await home!.headerValue('Content-Security-Policy')).toBe(policy)
  const theme = page.getByRole('combobox', { name: 'Colour theme', exact: true })
  await expect(theme).toBeEnabled()
  await theme.selectOption('dark')
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  const homeViolations = await page.evaluate(() => Reflect.get(window, '__nalamCspViolations'))
  expect(homeViolations).toEqual([])

  const reading = await visitDocument(page, notePaths[0])
  expect(await reading!.headerValue('Content-Security-Policy')).toBe(policy)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Testing real-time voice orchestration')
  await expect(theme).toBeEnabled()
  await expect(theme).toHaveValue('dark')
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  const contents = page.getByRole('navigation', { name: 'On this page', exact: true })
  const destination = await contents.getByRole('link').first().getAttribute('href')
  expect(destination).toMatch(/^#[a-z0-9-]+$/)
  await contents.getByRole('link').first().click()
  await expect(page.locator(destination!)).toBeInViewport()
  const sdk = await firebaseAppChunk()
  expect(await page.evaluate(async (url) => (await import(url)).getApps().map((app: { name: string }) => app.name), sdk)).toEqual(['[DEFAULT]'])
  const readingViolations = await page.evaluate(() => Reflect.get(window, '__nalamCspViolations'))
  expect(readingViolations).toEqual([])
  await testInfo.attach('proposed-hosting-policy-evidence', {
    body: JSON.stringify({ policy, homeViolations, readingViolations, scope: 'Local browser compatibility of the generated policy; no provider/header deployment parity.' }, null, 2),
    contentType: 'application/json',
  })
})
