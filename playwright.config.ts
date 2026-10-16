import { existsSync } from 'node:fs'
import { defineConfig } from '@playwright/test'

const installedChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
const channel = !executablePath && existsSync(installedChrome) ? 'chrome' : undefined

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 2,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  outputDir: './dist/verification/playwright-results',
  reporter: [
    ['list'],
    ['json', { outputFile: './dist/verification/playwright-report.json' }],
  ],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    channel,
    launchOptions: executablePath ? { executablePath } : undefined,
    viewport: { width: 1440, height: 1000 },
    colorScheme: 'light',
    reducedMotion: 'no-preference',
    locale: 'en-IE',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    trace: 'retain-on-failure',
    screenshot: 'off',
    video: 'off',
  },
  webServer: {
    command: 'node scripts/serve-public.mjs',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 15_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
