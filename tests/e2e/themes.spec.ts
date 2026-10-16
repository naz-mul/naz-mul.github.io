import type { Page } from '@playwright/test'
import { test, expect } from './fixtures'

const palette = (page: Page) => page.evaluate(() => ({
  background: getComputedStyle(document.body).backgroundColor,
  foreground: getComputedStyle(document.body).color,
}))

test('the classless default follows operating-system changes in both directions', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('combobox', { name: 'Colour theme', exact: true })).toBeEnabled()
  await expect(page.locator('html')).not.toHaveClass(/\b(?:light|dark)\b/)
  const light = await palette(page)
  await page.emulateMedia({ colorScheme: 'dark' })
  await expect.poll(() => palette(page)).not.toEqual(light)
  await expect(page.locator('html')).not.toHaveClass(/\b(?:light|dark)\b/)
  await page.emulateMedia({ colorScheme: 'light' })
  await expect.poll(() => palette(page)).toEqual(light)
})

test('explicit light and dark choices persist and system clears the stored override', async ({ page }) => {
  await page.goto('/')
  const theme = page.getByRole('combobox', { name: 'Colour theme', exact: true })
  await expect(theme).toBeEnabled()
  const light = await palette(page)
  await theme.selectOption('dark')
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  const dark = await palette(page)
  expect(dark).not.toEqual(light)
  await page.reload()
  await expect(theme).toHaveValue('dark')
  await expect.poll(() => palette(page)).toEqual(dark)
  await page.emulateMedia({ colorScheme: 'dark' })
  await theme.selectOption('light')
  await expect.poll(() => palette(page)).toEqual(light)
  await page.emulateMedia({ colorScheme: 'light' })
  await page.emulateMedia({ colorScheme: 'dark' })
  await expect.poll(() => palette(page)).toEqual(light)
  await theme.selectOption('system')
  await expect(page.locator('html')).not.toHaveClass(/\b(?:light|dark)\b/)
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBeNull()
  await expect.poll(() => palette(page)).toEqual(dark)
})

test('storage denial falls back to system and still permits a temporary explicit theme', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Storage unavailable', 'SecurityError') } })
  })
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')
  const theme = page.getByRole('combobox', { name: 'Colour theme', exact: true })
  await expect(theme).toBeEnabled()
  await expect(theme).toHaveValue('system')
  await expect(page.locator('html')).not.toHaveClass(/\b(?:light|dark)\b/)
  const dark = await palette(page)
  await theme.selectOption('light')
  await expect(page.locator('html')).toHaveClass(/\blight\b/)
  await expect.poll(() => palette(page)).not.toEqual(dark)
  await page.reload()
  await expect(theme).toHaveValue('system')
  await expect.poll(() => palette(page)).toEqual(dark)
})

test('a stored override is applied before the first contentful paint', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('theme', 'dark')
    const probe = { darkAppliedAt: 0 }
    Object.defineProperty(window, '__nalamThemePaintProbe', { value: probe })
    const observer = new MutationObserver(() => {
      if (!probe.darkAppliedAt && document.documentElement?.classList.contains('dark')) {
        probe.darkAppliedAt = performance.now()
        observer.disconnect()
      }
    })
    observer.observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] })
  })
  await page.goto('/')
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  await page.waitForFunction(() => performance.getEntriesByName('first-contentful-paint').length > 0)
  const timing = await page.evaluate(() => ({
    applied: Reflect.get(window, '__nalamThemePaintProbe').darkAppliedAt as number,
    painted: performance.getEntriesByName('first-contentful-paint')[0]!.startTime,
  }))
  expect(timing.applied).toBeGreaterThan(0)
  expect(timing.applied).toBeLessThanOrEqual(timing.painted)
})
