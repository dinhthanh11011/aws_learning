export type Theme = 'light' | 'dark' | 'system'

const KEY = 'aws-theme'
const listeners = new Set<() => void>()

/**
 * A one-value external store for the theme choice, so components can read it
 * with `useSyncExternalStore` instead of copying localStorage into state inside
 * an effect. The `storage` event only fires in *other* tabs, so same-tab writes
 * notify subscribers explicitly.
 */
export function subscribeTheme(onChange: () => void): () => void {
  listeners.add(onChange)
  window.addEventListener('storage', onChange)
  return () => {
    listeners.delete(onChange)
    window.removeEventListener('storage', onChange)
  }
}

export function getTheme(): Theme {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

/** The server has no localStorage, and the CSS default is system. */
export const getServerTheme = (): Theme => 'system'

export function setTheme(theme: Theme): void {
  try {
    if (theme === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, theme)
  } catch {
    // Private browsing with storage denied — the attribute below still applies.
  }
  applyTheme(theme)
  for (const l of listeners) l()
}

/**
 * "System" removes the attribute and lets the CSS media query decide; an
 * explicit choice stamps it. No JavaScript runs before first paint either way.
 */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  if (theme === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', theme)
}
