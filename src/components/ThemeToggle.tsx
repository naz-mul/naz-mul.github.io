import { useCallback, useEffect, useRef, useState } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  applyPreference,
  readPreference,
  THEME_OPTIONS,
  writePreference,
  type ThemePreference,
} from './theme'

const ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const

/**
 * Three-way theme control: light / dark / system.
 *
 * Implemented as a radiogroup rather than three toggle buttons, because the options are
 * mutually exclusive — that gives screen readers "2 of 3" instead of three unrelated
 * pressed/unpressed states. Arrow keys move between options (roving tabindex), so the
 * whole control is a single tab stop.
 */
export function ThemeToggle({ className }: { className?: string }) {
  // Server/first render must match the HTML the inline bootstrap script saw, so start
  // at the default and correct in an effect.
  const [preference, setPreference] = useState<ThemePreference>('system')
  const [mounted, setMounted] = useState(false)
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    setPreference(readPreference())
    setMounted(true)
  }, [])

  const choose = useCallback((next: ThemePreference) => {
    setPreference(next)
    writePreference(next)
    applyPreference(next)
  }, [])

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent, index: number) => {
      const delta =
        event.key === 'ArrowRight' || event.key === 'ArrowDown'
          ? 1
          : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
            ? -1
            : 0
      if (delta === 0) return
      event.preventDefault()
      const next = (index + delta + THEME_OPTIONS.length) % THEME_OPTIONS.length
      choose(THEME_OPTIONS[next].value)
      buttonsRef.current[next]?.focus()
    },
    [choose],
  )

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full border border-border/70 bg-muted/40 p-0.5',
        className,
      )}
    >
      {THEME_OPTIONS.map((option, index) => {
        const Icon = ICONS[option.value]
        const selected = mounted && preference === option.value
        return (
          <button
            key={option.value}
            ref={(el) => {
              buttonsRef.current[index] = el
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.label}
            title={option.label}
            tabIndex={selected || (!mounted && option.value === 'system') ? 0 : -1}
            onClick={() => choose(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              'inline-flex size-7 items-center justify-center rounded-full transition-colors duration-150',
              'text-muted-foreground hover:text-foreground',
              selected && 'bg-card text-foreground shadow-xs',
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
          </button>
        )
      })}
    </div>
  )
}
