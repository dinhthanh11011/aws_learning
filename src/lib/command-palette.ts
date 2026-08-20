/**
 * Whether the ⌘K palette is open, as a small external store.
 *
 * The keyboard shortcut is not discoverable on its own, so the palette also has
 * to be openable from a button — and the buttons live in the sidebar and the
 * mobile top bar, neither of which is a parent of the palette. A module store
 * is cheaper than hoisting the state into `AppShell` and threading it down two
 * unrelated branches of the tree.
 */

const listeners = new Set<() => void>()

let open = false

function set(next: boolean): void {
  if (open === next) return
  open = next
  for (const l of listeners) l()
}

export function subscribeCommandPalette(onChange: () => void): () => void {
  listeners.add(onChange)
  return () => {
    listeners.delete(onChange)
  }
}

export function getCommandPaletteOpen(): boolean {
  return open
}

/** The server renders no palette, so it starts closed there too. */
export const getServerCommandPaletteOpen = (): boolean => false

export function openCommandPalette(): void {
  set(true)
}

export function closeCommandPalette(): void {
  set(false)
}
