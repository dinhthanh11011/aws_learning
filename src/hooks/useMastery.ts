'use client'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import type { MasteryInput } from '@/engines/progress/mastery'
import { taskAliasFor } from '@/content'
import type { CertId } from '@/content/schema'

/**
 * One live subscription feeding every mastery calculation on the page. Reading
 * the four tables once and deriving from them is far cheaper than each ring
 * running its own query.
 */
export function useMasteryInput(certId?: CertId): MasteryInput | undefined {
  return useLiveQuery(async () => {
    const [cards, attempts, lessons, labs, marks] = await Promise.all([
      db.srsCards.toArray(),
      db.attempts.toArray(),
      db.lessons.toArray(),
      db.labs.toArray(),
      db.serviceMarks.toArray(),
    ])
    // The alias is attached here, at the React boundary, because the engine
    // must stay free of content imports. It is identity until an exam version
    // supersedes another's task statements, at which point work recorded
    // against the old statement keeps counting.
    return {
      cards,
      attempts,
      lessons,
      labs,
      marks,
      taskAlias: certId ? taskAliasFor(certId) : undefined,
    }
  }, [certId])
}
