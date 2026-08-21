import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import Dexie from 'dexie'

/**
 * Exercises the *real* v2 -> v3 upgrade shipped in ./index.ts against a
 * database built with the pre-refactor schema.
 *
 * This is the one step of the families refactor that cannot be undone: an
 * IndexedDB upgrade runs once per browser, so a mistake here silently empties
 * every existing learner's drill queue with no way back. `migrate.test.ts`
 * covers the pure helper; this proves the shipped hook is wired to it and that
 * the changed multi-entry index comes out queryable.
 *
 * The real module is imported dynamically, after the legacy database exists,
 * because it constructs its Dexie instance at module scope.
 */
describe('srsCards v2 -> v3 upgrade (shipped schema)', () => {
  it('retags legacy rows, keeps review state, and leaves the index usable', async () => {
    // Build the pre-refactor database under the name the app actually uses.
    const legacy = new Dexie('aws-learning')
    legacy.version(1).stores({
      profile: 'id',
      srsCards: 'cardId, due, *serviceSlugs, *certs, taskId',
      attempts: '++id, questionId, at, domainId, correct, source, *serviceSlugs',
      lessons: 'lessonId, status, at',
      exams: 'id, certId, startedAt, endedAt',
      labs: 'labId, at',
      mistakes: '++id, questionId, at, resolved, domainId',
      achievements: 'id, unlockedAt',
      dailyStats: 'day',
      serviceMarks: 'slug, confidence, starred',
    })
    legacy.version(2).stores({ steps: 'stepId, at' })
    await legacy.open()
    expect(legacy.verno).toBe(2)
    await legacy.table('srsCards').bulkPut([
      { cardId: 'num:s3:0', certs: ['SAA-C03'], serviceSlugs: ['s3'], due: 1, reps: 4, lapses: 1 },
      {
        cardId: 'num:lambda:0',
        certs: ['SAA-C03', 'DVA-C02'],
        serviceSlugs: ['lambda'],
        due: 2,
        reps: 0,
        lapses: 0,
      },
      { cardId: 'idea:cidr', certs: ['DVA-C02'], serviceSlugs: [], due: 3, reps: 9, lapses: 2 },
    ])
    legacy.close()

    // Now open with the shipped schema, which must run the v3 upgrade.
    const { db } = await import('.')
    await db.open()
    // At least 3, not exactly 3: this test is about the v3 retag surviving, and
    // pinning the number means every later additive version has to edit a test
    // that is not about it. The assertions below are what actually matter.
    expect(db.verno).toBeGreaterThanOrEqual(3)

    const rows = await db.srsCards.orderBy('cardId').toArray()
    expect(rows.map((r) => r.cardId)).toEqual(['idea:cidr', 'num:lambda:0', 'num:s3:0'])
    expect(rows.map((r) => r.families)).toEqual([['dva'], ['saa', 'dva'], ['saa']])
    for (const row of rows) expect('certs' in row).toBe(false)

    // The FSRS-facing fields must survive, or the learner loses their schedule.
    const s3 = rows.find((r) => r.cardId === 'num:s3:0')!
    expect(s3.reps).toBe(4)
    expect(s3.lapses).toBe(1)
    expect(s3.due).toBe(1)

    // The new multi-entry index must actually be queryable.
    const saa = await db.srsCards.where('families').equals('saa').toArray()
    expect(saa.map((r) => r.cardId).sort()).toEqual(['num:lambda:0', 'num:s3:0'])
    db.close()
  })
})
