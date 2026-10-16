import { test, expect } from './fixtures'

const approvedProfile = {
  name: 'Nazmul Alam',
  role: 'Senior Software Engineer',
  company: 'Cisco',
  experience_years: 10,
  tagline: 'Building systems. Sharing the decisions.',
  focus: ['Distributed systems', 'Real-time voice'],
  exploring: ['Agentic AI', 'Software architecture'],
}

test('the profile copy control writes only the approved JSON and announces success', async ({ page, context, baseURL }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: baseURL! })
  await page.goto('/')
  const mainBeforeCopy = await page.getByRole('main').innerText()
  const copy = page.getByRole('button', { name: 'Copy profile JSON', exact: true })
  await expect(copy).toBeEnabled()
  await copy.click()
  await expect(page.locator('#profile').getByRole('status')).toHaveText('Profile copied.')

  // Compare in the browser and return booleans; never expose arbitrary clipboard contents.
  const result = await page.evaluate(async (expected) => {
    const copied = await navigator.clipboard.readText()
    const source = document.querySelector('.profile-json-source code')?.textContent
    let approved = false
    try {
      const value = JSON.parse(copied)
      approved = Boolean(value && typeof value === 'object' && !Array.isArray(value)
        && Object.keys(value).length === Object.keys(expected).length
        && Object.entries(expected).every(([key, field]) => JSON.stringify(value[key]) === JSON.stringify(field)))
    } catch { /* A clipboard payload outside the approved JSON remains undisclosed. */ }
    return { matchesSource: typeof source === 'string' && copied.trim() === source.trim(), approved }
  }, approvedProfile)
  expect(result).toEqual({ matchesSource: true, approved: true })
  expect(await page.getByRole('main').innerText()).toBe(mainBeforeCopy)
})

test('clipboard rejection selects only the profile source and announces a bounded fallback', async ({ page, evidence }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: async () => { throw new DOMException('Clipboard unavailable', 'NotAllowedError') } },
      configurable: true,
    })
  })
  await page.goto('/')
  const mainBeforeCopy = await page.getByRole('main').innerText()
  const source = page.locator('.profile-json-source code')
  const copy = page.getByRole('button', { name: 'Copy profile JSON', exact: true })
  await expect(copy).toBeEnabled()
  await copy.click()
  await expect(page.locator('#profile').getByRole('status')).toHaveText('Copy unavailable. The profile text is selected; use your copy shortcut.')
  const selection = await source.evaluate((code) => {
    const selected = document.getSelection()
    return {
      matchesSource: Boolean(selected && selected.toString() === code.textContent),
      containedBySource: Boolean(selected && code.contains(selected.anchorNode) && code.contains(selected.focusNode)),
    }
  })
  expect(selection).toEqual({ matchesSource: true, containedBySource: true })
  expect(await page.getByRole('main').innerText()).toBe(mainBeforeCopy)
  expect(evidence.console.filter((entry) => ['error', 'warning'].includes(entry.type))).toEqual([])
})

test('profile and notes gutters number every rendered source row and stay hidden from assistive technology', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  for (const width of [1506, 1024, 390]) {
    await page.setViewportSize({ width, height: 1045 })
    for (const [container, sourceSelector] of [
      ['.profile-json', '.profile-json-source'],
      ['#personal-notes', '.personal-notes-source'],
    ]) {
      const panel = page.locator(container!)
      const source = panel.locator(sourceSelector!)
      const gutter = panel.locator('.workspace-source-numbers')
      await expect(source).toBeVisible()
      await expect(gutter).toHaveAttribute('aria-hidden', 'true')
      await expect.poll(async () => {
        const geometry = await source.evaluate((element) => {
          const style = getComputedStyle(element)
          const lineHeight = parseFloat(style.lineHeight)
          const height = element.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)
          return { lineHeight, height }
        })
        if (!Number.isFinite(geometry.lineHeight) || geometry.lineHeight <= 0) throw new Error('Source rows need a measurable line height.')
        const rows = Math.max(1, Math.round(geometry.height / geometry.lineHeight))
        const numbers = await gutter.locator(':scope > *').allTextContents()
        return numbers.map((number) => number.trim()).join(',') === Array.from({ length: rows }, (_, index) => String(index + 1)).join(',')
      }, { message: `${container} gutter must match actual rendered source rows at ${width}px.` }).toBe(true)
    }
  }
})
