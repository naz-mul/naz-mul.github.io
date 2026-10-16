import type { FirebaseApp, FirebaseAppSettings, FirebaseOptions } from 'firebase/app'
import { firebaseConfig } from './config.ts'

export type FirebaseStartupFailure = 'configuration-conflict' | 'sdk-startup-failed'

interface FirebaseAppSdk {
  getApps: () => readonly FirebaseApp[]
  initializeApp: (options: FirebaseOptions, settings?: FirebaseAppSettings) => FirebaseApp
}

interface FirebaseBrowserDependencies {
  isBrowser?: boolean
  loadSdk?: () => Promise<FirebaseAppSdk>
  reportFailure?: (failure: FirebaseStartupFailure) => void
}

class FirebaseConfigurationConflict extends Error {
  constructor() {
    super('The default Firebase app has a conflicting configuration.')
    this.name = 'FirebaseConfigurationConflict'
  }
}

function hasIntendedOptions(options: FirebaseOptions): boolean {
  const intended = Object.entries(firebaseConfig)
  const existing = Object.entries(options).filter(([, value]) => value !== undefined)
  return existing.length === intended.length
    && intended.every(([key, value]) => existing.some(([field, option]) => field === key && option === value))
}

function initializeIntendedApp(sdk: FirebaseAppSdk): FirebaseApp {
  const existing = sdk.getApps().find((app) => app.name === '[DEFAULT]')
  if (!existing) return sdk.initializeApp(firebaseConfig, { automaticDataCollectionEnabled: false })
  if (!hasIntendedOptions(existing.options) || existing.automaticDataCollectionEnabled) {
    throw new FirebaseConfigurationConflict()
  }
  return existing
}

function reportStartupFailure(failure: FirebaseStartupFailure): void {
  // Keep diagnostics bounded: never log options, SDK exceptions, or visitor data.
  console.warn(`[nalam.me] Firebase browser initialization skipped (${failure}).`)
}

/** Reading and navigation never await this optional browser-only startup. */
export async function startFirebaseBrowserApp({
  isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined',
  loadSdk = () => import('firebase/app'),
  reportFailure = reportStartupFailure,
}: FirebaseBrowserDependencies = {}): Promise<FirebaseApp | undefined> {
  if (!isBrowser) return undefined
  try {
    return initializeIntendedApp(await loadSdk())
  } catch (error) {
    reportFailure(error instanceof FirebaseConfigurationConflict ? 'configuration-conflict' : 'sdk-startup-failed')
    return undefined
  }
}
