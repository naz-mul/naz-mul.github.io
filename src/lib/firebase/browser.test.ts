import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { test } from 'node:test'
import type { FirebaseApp, FirebaseAppSettings, FirebaseOptions } from 'firebase/app'
import { firebaseConfig } from './config.ts'
import { startFirebaseBrowserApp, type FirebaseStartupFailure } from './browser.ts'

function registry(initialApps: FirebaseApp[] = []) {
  const apps = [...initialApps]
  let initializationCount = 0
  let initializationSettings: FirebaseAppSettings | undefined

  return {
    get initializationCount() {
      return initializationCount
    },
    get initializationSettings() {
      return initializationSettings
    },
    getApps: () => apps,
    initializeApp(options: FirebaseOptions, settings?: FirebaseAppSettings): FirebaseApp {
      initializationCount += 1
      initializationSettings = settings
      const app = {
        name: settings?.name ?? '[DEFAULT]',
        options,
        automaticDataCollectionEnabled: settings?.automaticDataCollectionEnabled ?? false,
      }
      apps.push(app)
      return app
    },
  }
}

test('the public config retains all six user-supplied values without logging them', () => {
  const sortedConfig = Object.fromEntries(Object.entries(firebaseConfig).sort())
  const digest = createHash('sha256').update(JSON.stringify(sortedConfig)).digest('hex')

  assert.equal(digest, '82a32b97c1d69ad9c36191a3527bfdc849df6a9e068d39a612c6bbd22f40131c')
  assert.equal(Object.keys(firebaseConfig).length, 6)
  assert.ok(Object.isFrozen(firebaseConfig))
})

test('server/build entry does not import or initialize the SDK', async () => {
  let importCount = 0
  const app = await startFirebaseBrowserApp({
    loadSdk: async () => {
      importCount += 1
      return registry()
    },
    reportFailure: () => assert.fail('Server entry must not report a startup attempt'),
  })

  assert.equal(app, undefined)
  assert.equal(importCount, 0)
})

test('concurrent and repeated browser entries retain the same default app', async () => {
  const sdk = registry()
  const dependencies = {
    isBrowser: true,
    loadSdk: async () => sdk,
    reportFailure: () => assert.fail('The intended app should initialize'),
  }

  const [first, concurrent] = await Promise.all([
    startFirebaseBrowserApp(dependencies),
    startFirebaseBrowserApp(dependencies),
  ])
  const repeated = await startFirebaseBrowserApp(dependencies)

  assert.ok(first)
  assert.equal(first.name, '[DEFAULT]')
  assert.equal(first, concurrent)
  assert.equal(first, repeated)
  assert.equal(sdk.initializationCount, 1)
  assert.equal(sdk.initializationSettings?.automaticDataCollectionEnabled, false)
  assert.equal(first.options, firebaseConfig)
})

test('a different default-app configuration is rejected without replacement', async () => {
  const existing = {
    name: '[DEFAULT]',
    options: { ...firebaseConfig, projectId: 'different-project' },
    automaticDataCollectionEnabled: false,
  }
  const sdk = registry([existing])
  const failures: FirebaseStartupFailure[] = []
  const app = await startFirebaseBrowserApp({
    isBrowser: true,
    loadSdk: async () => sdk,
    reportFailure: (failure) => failures.push(failure),
  })

  assert.equal(app, undefined)
  assert.equal(sdk.initializationCount, 0)
  assert.equal(sdk.getApps()[0], existing)
  assert.deepEqual(failures, ['configuration-conflict'])
})

test('an existing default app with an extra service configuration is rejected', async () => {
  const sdk = registry([{
    name: '[DEFAULT]',
    options: { ...firebaseConfig, measurementId: 'different-configuration' },
    automaticDataCollectionEnabled: false,
  }])
  const failures: FirebaseStartupFailure[] = []

  assert.equal(await startFirebaseBrowserApp({
    isBrowser: true,
    loadSdk: async () => sdk,
    reportFailure: (failure) => failures.push(failure),
  }), undefined)
  assert.equal(sdk.initializationCount, 0)
  assert.deepEqual(failures, ['configuration-conflict'])
})

test('an unrelated named app is never mistaken for the intended default app', async () => {
  const sdk = registry([{
    name: 'other-app',
    options: { projectId: 'other-project' },
    automaticDataCollectionEnabled: false,
  }])

  const app = await startFirebaseBrowserApp({
    isBrowser: true,
    loadSdk: async () => sdk,
  })

  assert.equal(app?.name, '[DEFAULT]')
  assert.equal(sdk.initializationCount, 1)
})

test('an existing default app with automatic data collection enabled is rejected', async () => {
  const sdk = registry([{
    name: '[DEFAULT]',
    options: firebaseConfig,
    automaticDataCollectionEnabled: true,
  }])
  const failures: FirebaseStartupFailure[] = []

  assert.equal(await startFirebaseBrowserApp({
    isBrowser: true,
    loadSdk: async () => sdk,
    reportFailure: (failure) => failures.push(failure),
  }), undefined)
  assert.equal(sdk.initializationCount, 0)
  assert.deepEqual(failures, ['configuration-conflict'])
})

test('SDK import failure resolves safely with a bounded diagnostic', async () => {
  const failures: FirebaseStartupFailure[] = []
  const app = await startFirebaseBrowserApp({
    isBrowser: true,
    loadSdk: async () => { throw new Error('An import failure with arbitrary detail') },
    reportFailure: (failure) => failures.push(failure),
  })

  assert.equal(app, undefined)
  assert.deepEqual(failures, ['sdk-startup-failed'])
})

test('SDK initialization failure resolves safely without exposing its exception', async () => {
  const failures: FirebaseStartupFailure[] = []
  const app = await startFirebaseBrowserApp({
    isBrowser: true,
    loadSdk: async () => ({
      getApps: () => [],
      initializeApp: () => { throw new Error('An initialization failure with arbitrary detail') },
    }),
    reportFailure: (failure) => failures.push(failure),
  })

  assert.equal(app, undefined)
  assert.deepEqual(failures, ['sdk-startup-failed'])
})
