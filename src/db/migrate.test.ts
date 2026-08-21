import { describe, expect, it } from 'vitest'
import { familiesFromLegacyCerts, normaliseSrsRow } from './migrate'

/**
 * These guard the one step of the families refactor that can lose real user
 * data. A wrong mapping here empties the drill queue for every existing
 * learner, and a Dexie upgrade cannot be undone.
 */
describe('familiesFromLegacyCerts', () => {
  it('maps both legacy version ids onto their families', () => {
    expect(familiesFromLegacyCerts(['SAA-C03'])).toEqual(['saa'])
    expect(familiesFromLegacyCerts(['DVA-C02'])).toEqual(['dva'])
  })

  it('keeps a card that was on both exams on both families', () => {
    expect(familiesFromLegacyCerts(['SAA-C03', 'DVA-C02']).sort()).toEqual(['dva', 'saa'])
  })

  it('de-duplicates rather than repeating a family', () => {
    expect(familiesFromLegacyCerts(['SAA-C03', 'SAA-C03'])).toEqual(['saa'])
  })

  it('ignores values it does not recognise instead of inventing a family', () => {
    expect(familiesFromLegacyCerts(['SOA-C02', 42, null, undefined])).toEqual([])
  })
})

describe('normaliseSrsRow', () => {
  it('rewrites a pre-refactor row and drops the old column', () => {
    const row = normaliseSrsRow({ cardId: 'num:s3:0', certs: ['SAA-C03'], reps: 3 })
    expect(row).toEqual({ cardId: 'num:s3:0', families: ['saa'], reps: 3 })
    expect('certs' in row).toBe(false)
  })

  it('leaves an already-migrated row alone, so it is safe to re-run', () => {
    const once = normaliseSrsRow({ cardId: 'a', certs: ['DVA-C02'] })
    const twice = normaliseSrsRow({ ...once })
    expect(twice).toEqual(once)
  })

  it('does not drop a card that has no recognisable cert tag', () => {
    // Better an unscoped card than a silently deleted one — the drill queue
    // filters by an allow-set built from content, so an empty families array
    // costs nothing beyond that card not being offered.
    const row = normaliseSrsRow({ cardId: 'orphan' })
    expect(row).toEqual({ cardId: 'orphan', families: [] })
  })
})
