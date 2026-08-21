/**
 * A content fingerprint: one hash over the whole corpus, in registry order.
 *
 * This exists for the mechanical refactors — splitting a 2,400-line question
 * file into banks, moving a service between category files. A count comparison
 * proves nothing there: 274 questions before and 274 after is equally true if
 * two of them swapped places, and for concepts the order *is* the teaching
 * (you cannot understand a subnet before a CIDR block). So the hash covers
 * order as well as content, and equality before/after is the proof that a file
 * move changed nothing but the filenames.
 *
 * Services are exempt from the ordering claim only because the registry sorts
 * them by name anyway — but they still hash in that sorted order, so a lost or
 * mutated entry still shows up.
 */
import { createHash } from 'node:crypto'

/**
 * Stable stringify: object keys sorted, arrays left in order. Key order in the
 * source literal is a formatting choice and must not affect the hash; array
 * order is data and must.
 */
function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null'
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`
}

const sha = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16)

export interface Fingerprint {
  parts: Record<string, { count: number; hash: string }>
  overall: string
}

/** Functions are not data — a break-it challenge's `apply` cannot be hashed. */
const strip = (v: unknown): unknown =>
  typeof v === 'function' ? '[fn]' : Array.isArray(v) ? v.map(strip) : v

export function fingerprint(corpus: Record<string, readonly unknown[]>): Fingerprint {
  const parts: Fingerprint['parts'] = {}
  for (const key of Object.keys(corpus).sort()) {
    const items = corpus[key]
    parts[key] = { count: items.length, hash: sha(canonical(items.map(strip))) }
  }
  const overall = sha(
    Object.entries(parts)
      .map(([k, p]) => `${k}:${p.count}:${p.hash}`)
      .join('|'),
  )
  return { parts, overall }
}
