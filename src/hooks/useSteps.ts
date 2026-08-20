'use client'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'

/**
 * The set of ticked study steps, live. Returned as a Set because every caller
 * asks "is this one done" rather than iterating, and `nextStep` takes a Set.
 *
 * `undefined` is never returned: an empty set while the first query resolves is
 * the same thing as "nothing ticked yet", and it means the roadmap can render
 * its first step immediately instead of flashing a skeleton.
 */
export function useDoneSteps(): Set<string> {
  const rows = useLiveQuery(() => db.steps.toArray(), [])
  return new Set(rows?.map((r) => r.stepId) ?? [])
}
