/**
 * What the quick-look panel is showing, as a small external store.
 *
 * It is a *stack*, not a single entry: reading Aurora's card and following
 * "commonly confused with → RDS" should let you come back, the way a
 * conversation does. And it is a module store rather than context because the
 * callers are scattered — a question review, a drill card, a decision tree, the
 * command palette — and none of them should have to be inside a provider or
 * thread a prop down to reach it.
 *
 * The stack holds services *and* concepts, so following "a subnet lives in one
 * Availability Zone" from the VPC card and coming back is one stack, not two.
 *
 * Nothing here is persisted. A quick look is a glance, not a place you were.
 */

export type PeekKind = 'service' | 'concept'
export type PeekTarget = { kind: PeekKind; slug: string }

const listeners = new Set<() => void>()

const EMPTY: readonly PeekTarget[] = []
let stack: readonly PeekTarget[] = EMPTY

/** `useSyncExternalStore` compares snapshots by identity, so replace, never mutate. */
function set(next: readonly PeekTarget[]): void {
  stack = next
  for (const l of listeners) l()
}

function push(target: PeekTarget): void {
  const top = stack[stack.length - 1]
  if (top && top.kind === target.kind && top.slug === target.slug) return
  set([...stack, target])
}

export function subscribePeek(onChange: () => void): () => void {
  listeners.add(onChange)
  return () => {
    listeners.delete(onChange)
  }
}

export function getPeek(): readonly PeekTarget[] {
  return stack
}

/** The server renders no panel; the store starts empty on the client too. */
export const getServerPeek = (): readonly PeekTarget[] => EMPTY

/** Open a service, or push it on top of whatever is already showing. */
export function openService(slug: string): void {
  push({ kind: 'service', slug })
}

/** Open a concept — CIDR, RPO, idempotency — in the same panel and stack. */
export function openConcept(slug: string): void {
  push({ kind: 'concept', slug })
}

/** Back one step; closes the panel when it was the last card. */
export function backPeek(): void {
  set(stack.length > 1 ? stack.slice(0, -1) : EMPTY)
}

export function closePeek(): void {
  if (stack.length) set(EMPTY)
}
