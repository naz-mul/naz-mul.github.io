import { useEffect, useState } from 'react'
import { ChevronDown, Monitor, Moon, Sun } from 'lucide-react'
import {
  applyPreference,
  readPreference,
  THEME_OPTIONS,
  THEME_STORAGE_KEY,
  writePreference,
  type ThemePreference,
} from '../theme'

const icons = { light: Sun, dark: Moon, system: Monitor } as const

/** A native select keeps the three theme choices usable by keyboard and touch. */
export function ThemeSelect() {
  const [preference, setPreference] = useState<ThemePreference>('system')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setPreference(readPreference())
    setReady(true)
    const synchronize = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY && event.key !== null) return
      const next = readPreference()
      applyPreference(next)
      setPreference(next)
    }
    window.addEventListener('storage', synchronize)
    return () => window.removeEventListener('storage', synchronize)
  }, [])

  const Icon = icons[preference]
  return (
    <label className="workspace-theme">
      <Icon size={19} strokeWidth={1.7} aria-hidden="true" />
      <span aria-hidden="true">Theme:</span>
      <select
        aria-label="Colour theme"
        value={preference}
        disabled={!ready}
        onChange={(event) => {
          const next = THEME_OPTIONS.find((option) => option.value === event.currentTarget.value)?.value
          if (!next) return
          writePreference(next)
          applyPreference(next)
          setPreference(next)
        }}
      >
        {THEME_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <ChevronDown size={14} strokeWidth={1.6} aria-hidden="true" />
    </label>
  )
}
