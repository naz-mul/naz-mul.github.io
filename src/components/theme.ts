/**
 * Three-way theme preference: light / dark / system, defaulting to system.
 *
 * The "system" state is implemented in CSS, not here — see globals.css. No class on
 * <html> means "follow the OS", so the browser reacts to an OS theme change with no
 * listener and no re-render, and it still works with JavaScript disabled.
 *
 * This module's only job is recording an explicit override and reflecting it as a
 * class. It deliberately does NOT resolve "system" to a concrete theme: nothing needs
 * to know, and asking would only introduce state that can drift from what CSS paints.
 */

export type ThemePreference = 'light' | 'dark' | 'system'

export const THEME_STORAGE_KEY = 'theme'
export const DEFAULT_PREFERENCE: ThemePreference = 'system'

function isExplicit(value: unknown): value is 'light' | 'dark' {
  return value === 'light' || value === 'dark'
}

/** Stored preference, or "system" when absent or unreadable (private browsing throws). */
export function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (isExplicit(stored)) return stored
  } catch {
    // Storage blocked — fall through to the default.
  }
  return DEFAULT_PREFERENCE
}

/** Reflects the preference onto <html>. No class at all means "follow the OS". */
export function applyPreference(preference: ThemePreference) {
  const root = document.documentElement
  root.classList.toggle('light', preference === 'light')
  root.classList.toggle('dark', preference === 'dark')
}

export function writePreference(preference: ThemePreference) {
  try {
    if (isExplicit(preference)) {
      localStorage.setItem(THEME_STORAGE_KEY, preference)
    } else {
      // Storing nothing means "system", so a cleared key and an explicit choice of
      // system behave identically on the next visit.
      localStorage.removeItem(THEME_STORAGE_KEY)
    }
  } catch {
    // Non-fatal: the theme still applies for this page view.
  }
}

export const THEME_OPTIONS: readonly { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]
