/**
 * Which service the quick-look panel is showing, as a small external store.
 *
 * It is a *stack*, not a single slug: reading Aurora's card and following
 * "commonly confused with → RDS" should let you come back, the way a
 * conversation does. And it is a module store rather than context because the
 * callers are scattered — a question review, a drill card, a decision tree, the
 * command palette — and none of them should have to be inside a provider or
 * thread a prop down to reach it.
 *
 * Nothing here is persisted. A quick look is a glance, not a place you were.
 */

const listeners = new Set<() => void>()

const EMPTY: readonly string[] = []
let stack: readonly string[] = EMPTY

/** `useSyncExternalStore` compares snapshots by identity, so replace, never mutate. */
function set(next: readonly string[]): void {
  stack = next
  for (const l of listeners) l()
}

export function subscribeServicePeek(onChange: () => void): () => void {
  listeners.add(onChange)
  return () => {
    listeners.delete(onChange)
  }
}

export function getServicePeek(): readonly string[] {
  return stack
}

/** The server renders no panel; the store starts empty on the client too. */
export const getServerServicePeek = (): readonly string[] => EMPTY

/** Open a service, or push it on top of the one already showing. */
export function openService(slug: string): void {
  if (stack[stack.length - 1] === slug) return
  set([...stack, slug])
}

/** Back one step; closes the panel when it was the last card. */
export function backService(): void {
  set(stack.length > 1 ? stack.slice(0, -1) : EMPTY)
}

export function closeServicePeek(): void {
  if (stack.length) set(EMPTY)
}
