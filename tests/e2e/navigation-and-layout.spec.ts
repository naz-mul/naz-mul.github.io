import type { Locator, Page } from '@playwright/test'
import { notePaths, visitDocument } from './artifact'
import { test, expect, observeBrowser } from './fixtures'

async function focusWithTab(page: Page, target: Locator) {
  for (let index = 0; index < 15; index += 1) {
    await page.keyboard.press('Tab')
    if (await target.evaluate((element) => element === document.activeElement)) return
  }
  await expect(target).toBeFocused()
}

test('the keyboard skip link reaches main content with a visible focus indicator', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Skip to content', exact: true })
  await expect(skip).toBeFocused()
  await expect(skip).toBeInViewport()
  expect(await skip.evaluate((element) => {
    const style = getComputedStyle(element)
    return (style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0) || style.boxShadow !== 'none'
  }), 'Keyboard focus needs a visible outline or shadow.').toBe(true)
  await page.keyboard.press('Enter')
  await expect(page.getByRole('main')).toBeFocused()
  await expect(page.getByRole('main')).toHaveCount(1)
  await expect(page.getByRole('contentinfo')).toHaveCount(1)
  await expect(page.locator('img:not([alt])')).toHaveCount(0)
})

test('mobile navigation opens and follows a section using only the keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const summary = page.locator('summary').filter({ hasText: /^Explore nalam\.me$/ })
  const navigation = page.getByRole('navigation', { name: 'Explore the site', exact: true })
  await expect(navigation).toBeHidden()
  await focusWithTab(page, summary)
  await page.keyboard.press('Enter')
  await expect(navigation).toBeVisible()
  const projects = navigation.getByRole('link', { name: 'projects/', exact: true })
  await focusWithTab(page, projects)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL('/#projects')
  await expect(navigation).toBeHidden()
  await expect(page.getByRole('heading', { name: 'Featured projects', exact: true })).toBeInViewport()
})

test('mobile navigation supports touch and closes after a destination is chosen', async ({ browser, baseURL }, testInfo) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  try {
    const page = await context.newPage()
    const evidence = observeBrowser(context, page, baseURL!)
    await page.goto('/')
    await page.locator('summary').filter({ hasText: /^Explore nalam\.me$/ }).tap()
    const navigation = page.getByRole('navigation', { name: 'Explore the site', exact: true })
    await expect(navigation).toBeVisible()
    await navigation.getByRole('link', { name: 'writing/', exact: true }).tap()
    await expect(page).toHaveURL('/#writing')
    await expect(navigation).toBeHidden()
    await expect(page.getByRole('heading', { name: 'Technical writing', exact: true })).toBeInViewport()
    expect(evidence.externalRequests).toEqual([])
    expect(evidence.pageErrors).toEqual([])
    expect(evidence.console.filter((entry) => entry.type === 'error')).toEqual([])
    expect(evidence.failedRequests).toEqual([])
    await testInfo.attach('touch-browser-evidence', { body: JSON.stringify(evidence, null, 2), contentType: 'application/json' })
  } finally {
    await context.close()
  }
})

test('mobile contents navigation remains useful with JavaScript disabled', async ({ browser, baseURL }, testInfo) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 390, height: 844 }, colorScheme: 'light' })
  try {
    const page = await context.newPage()
    const evidence = observeBrowser(context, page, baseURL!)
    await page.goto(notePaths[0])
    await page.locator('summary').filter({ hasText: /^Contents$/ }).click()
    const contents = page.getByRole('navigation', { name: 'Article contents', exact: true })
    await expect(contents).toBeVisible()
    const first = contents.getByRole('link').first()
    const destination = await first.getAttribute('href')
    expect(destination).toMatch(/^#[a-z0-9-]+$/)
    await first.click()
    await expect(page).toHaveURL(`${notePaths[0]}${destination}`)
    await expect(page.locator(destination!)).toBeInViewport()
    expect(evidence.externalRequests).toEqual([])
    expect(evidence.pageErrors).toEqual([])
    expect(evidence.console.filter((entry) => entry.type === 'error')).toEqual([])
    expect(evidence.failedRequests).toEqual([])
    await testInfo.attach('no-js-contents-evidence', { body: JSON.stringify(evidence, null, 2), contentType: 'application/json' })
  } finally {
    await context.close()
  }
})

const representativePaths = ['/', '/writing/', notePaths[0], '/work/cisco/', '/experience/'] as const

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`representative routes reflow without document overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    for (const path of representativePaths) {
      await visitDocument(page, path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      const bounds = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth }))
      expect(bounds.scroll, `${path} must reflow; bounded code/table scrolling may stay local.`).toBeLessThanOrEqual(bounds.viewport + 1)
      const clippedProse = await page.getByRole('main').locator('h1, h2, h3, p').evaluateAll((elements) => elements.filter((element) => {
        if (!element.getClientRects().length) return false
        const rect = element.getBoundingClientRect()
        return rect.left < -1 || rect.right > document.documentElement.clientWidth + 1
      }).map((element) => element.textContent?.trim().slice(0, 100)))
      expect(clippedProse, `${path} must not hide overflowing headings or prose behind document clipping.`).toEqual([])
    }
  })
}

test('200-percent zoom-equivalent geometry retains content and navigation', async ({ browser, baseURL }, testInfo) => {
  // A 1280-device-pixel viewport at 2x has 640 CSS pixels. This verifies reflow,
  // not operating-system magnification or a manual browser chrome zoom command.
  const context = await browser.newContext({ baseURL, viewport: { width: 640, height: 450 }, deviceScaleFactor: 2 })
  try {
    const page = await context.newPage()
    const evidence = observeBrowser(context, page, baseURL!)
    for (const path of ['/', notePaths[1]]) {
      await visitDocument(page, path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      expect(await page.evaluate(() => window.devicePixelRatio)).toBe(2)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true)
      await expect(page.locator('summary').filter({ hasText: /^Explore nalam\.me$/ })).toBeVisible()
    }
    expect(evidence.externalRequests).toEqual([])
    expect(evidence.pageErrors).toEqual([])
    expect(evidence.console.filter((entry) => entry.type === 'error')).toEqual([])
    expect(evidence.failedRequests).toEqual([])
    await testInfo.attach('zoom-equivalent-evidence', { body: JSON.stringify(evidence, null, 2), contentType: 'application/json' })
  } finally {
    await context.close()
  }
})

test('reduced motion keeps scroll and visible animations quiet', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true)
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto')
  const movingElements = await page.evaluate(() => [...document.querySelectorAll('body *')].filter((element) => {
    if (!element.getClientRects().length) return false
    const style = getComputedStyle(element)
    return style.animationName !== 'none' && style.animationDuration.split(',').some((value) => parseFloat(value) > 0.01)
  }).map((element) => element.tagName))
  expect(movingElements, 'Reduced motion must not retain substantial visible animations.').toEqual([])
})
