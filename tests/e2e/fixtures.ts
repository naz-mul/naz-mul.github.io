import { test as base, expect, type BrowserContext, type Page } from '@playwright/test'

type ConsoleEntry = { type: string; text: string; url: string }
export type BrowserEvidence = {
  browserVersion: string
  requests: string[]
  externalRequests: string[]
  failedRequests: { url: string; failure: string | null }[]
  responses: { url: string; status: number }[]
  console: ConsoleEntry[]
  pageErrors: string[]
}

export function observeBrowser(context: BrowserContext, page: Page, baseURL: string): BrowserEvidence {
  const evidence: BrowserEvidence = { browserVersion: context.browser()?.version() ?? 'unavailable', requests: [], externalRequests: [], failedRequests: [], responses: [], console: [], pageErrors: [] }
  const origin = new URL(baseURL).origin
  context.on('request', (request) => {
    evidence.requests.push(request.url())
    if (new URL(request.url()).origin !== origin) evidence.externalRequests.push(request.url())
  })
  context.on('requestfailed', (request) => evidence.failedRequests.push({ url: request.url(), failure: request.failure()?.errorText ?? null }))
  context.on('response', (response) => evidence.responses.push({ url: response.url(), status: response.status() }))
  page.on('console', (message) => evidence.console.push({ type: message.type(), text: message.text(), url: message.location().url }))
  page.on('pageerror', (error) => evidence.pageErrors.push(error.message))
  return evidence
}

type Options = {
  allowedConsoleErrors: string[]
  allowedRequestFailures: string[]
}

export const test = base.extend<Options & { evidence: BrowserEvidence }>({
  allowedConsoleErrors: [[], { option: true }],
  allowedRequestFailures: [[], { option: true }],
  evidence: [async ({ context, page, baseURL, allowedConsoleErrors, allowedRequestFailures }, use, testInfo) => {
    if (!baseURL) throw new Error('Browser verification needs a local baseURL.')
    const evidence = observeBrowser(context, page, baseURL)
    await use(evidence)
    await testInfo.attach('browser-evidence', { body: JSON.stringify(evidence, null, 2), contentType: 'application/json' })
    expect(evidence.externalRequests, 'Every observed built-page request must stay on the preview origin.').toEqual([])
    expect(evidence.pageErrors, 'No uncaught browser exception is expected.').toEqual([])
    expect(evidence.console.filter((entry) => entry.type === 'error' && !allowedConsoleErrors.some((pattern) => new RegExp(pattern).test(entry.text))), 'Unexpected browser console errors.').toEqual([])
    expect(evidence.failedRequests.filter((entry) => !allowedRequestFailures.some((pattern) => new RegExp(pattern).test(entry.url))), 'Unexpected failed requests.').toEqual([])
  }, { auto: true }],
})

export { expect }
