'use client'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import type { MasteryInput } from '@/engines/progress/mastery'

/**
 * One live subscription feeding every mastery calculation on the page. Reading
 * the four tables once and deriving from them is far cheaper than each ring
 * running its own query.
 */
export function useMasteryInput(): MasteryInput | undefined {
  return useLiveQuery(async () => {
    const [cards, attempts, lessons, labs, marks] = await Promise.all([
      db.srsCards.toArray(),
      db.attempts.toArray(),
      db.lessons.toArray(),
      db.labs.toArray(),
      db.serviceMarks.toArray(),
    ])
    return { cards, attempts, lessons, labs, marks }
  }, [])
}
