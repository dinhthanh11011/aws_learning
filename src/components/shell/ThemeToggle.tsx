'use client'
import { useEffect, useSyncExternalStore } from 'react'
import {
  applyTheme,
  getServerTheme,
  getTheme,
  setTheme,
  subscribeTheme,
  type Theme,
} from '@/lib/theme-store'
import { cn } from '@/lib/cn'

const OPTIONS: { id: Theme; label: string; icon: string }[] = [
  { id: 'light', label: 'Light', icon: '☀' },
  { id: 'dark', label: 'Dark', icon: '☾' },
  { id: 'system', label: 'System', icon: '◐' },
]

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, getServerTheme)

  // Re-stamp the attribute after hydration in case the stored choice differs
  // from the CSS default. A DOM write, not a state update.
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  return (
    <div
      className="flex gap-0.5 rounded-lg border border-border bg-bg-inset p-0.5"
      role="group"
      aria-label="Theme"
    >
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          onClick={() => setTheme(o.id)}
          aria-pressed={theme === o.id}
          title={o.label}
          className={cn(
            'h-6 w-7 rounded-md text-[12px] transition-colors',
            theme === o.id ? 'bg-bg-overlay text-fg' : 'text-fg-subtle hover:text-fg',
          )}
        >
          {o.icon}
        </button>
      ))}
    </div>
  )
}
