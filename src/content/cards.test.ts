import { describe, expect, it } from 'vitest'
import { cards } from './cards'
import { services } from './service-registry'

/**
 * These tests exist because card ids are the SRS schedule's primary key. A
 * duplicate id merges two facts into one review row; a *positional* id silently
 * rebinds a learner's history to a different fact when content above it moves.
 * Neither failure is visible in the UI, so it has to be visible here.
 */
describe('card ids', () => {
  it('are unique across the whole set', () => {
    const seen = new Map<string, number>()
    for (const c of cards) seen.set(c.id, (seen.get(c.id) ?? 0) + 1)
    expect([...seen].filter(([, n]) => n > 1).map(([id]) => id)).toEqual([])
  })

  it('encode no positional index', () => {
    // `num:s3:3` is the shape this forbids. Trailing digits that are part of a
    // real name (`opt:ebs:volume-type:gp3`, `io2`) are fine, so the assertion is
    // on a segment that is *only* digits.
    const positional = cards.filter((c) => c.id.split(':').some((seg) => /^\d+$/.test(seg)))
    expect(positional.map((c) => c.id)).toEqual([])
  })

  it('use only lower-case slug characters', () => {
    expect(cards.filter((c) => !/^[a-z][a-z0-9:_-]*$/.test(c.id)).map((c) => c.id)).toEqual([])
  })
})

describe('option cards', () => {
  const withSets = services.filter((s) => (s.optionSets ?? []).length)

  it('derive one whichOption card per option, for tier 1 and 2 only', () => {
    for (const s of withSets) {
      for (const set of s.optionSets ?? []) {
        const derived = cards.filter((c) => c.id.startsWith(`opt:${s.slug}:${set.id}:`))
        expect(derived.length, `${s.slug}/${set.id}`).toBe(s.tier <= 2 ? set.options.length : 0)
        for (const c of derived) expect(c.kind).toBe('whichOption')
      }
    }
  })

  it('answer with the option name and offer the signal as the extra line', () => {
    for (const s of withSets.filter((x) => x.tier <= 2)) {
      for (const set of s.optionSets ?? []) {
        for (const o of set.options) {
          const c = cards.find((x) => x.id === `opt:${s.slug}:${set.id}:${slug(o.name)}`)
          expect(c, `${s.slug}/${set.id}/${o.name}`).toBeDefined()
          expect(c!.back).toBe(o.name)
          expect(c!.extra).toBe(o.signal)
        }
      }
    }
  })

  it('derive a trap card only where the option carries a gotcha', () => {
    for (const s of withSets) {
      for (const set of s.optionSets ?? []) {
        for (const o of set.options) {
          const id = `trap:opt:${s.slug}:${set.id}:${slug(o.name)}`
          expect(cards.some((c) => c.id === id), id).toBe(Boolean(o.gotcha))
        }
      }
    }
  })

  it('reach both entries when an option is also a corpus entry', () => {
    for (const s of withSets.filter((x) => x.tier <= 2)) {
      for (const set of s.optionSets ?? []) {
        for (const o of set.options.filter((x) => x.slug && x.slug !== s.slug)) {
          const c = cards.find((x) => x.id === `opt:${s.slug}:${set.id}:${slug(o.name)}`)
          expect(c!.serviceSlugs).toContain(o.slug)
        }
      }
    }
  })

  it('derive a roster card for tier 1 only, naming every option', () => {
    for (const s of withSets) {
      for (const set of s.optionSets ?? []) {
        const roster = cards.find((c) => c.id === `optset:${s.slug}:${set.id}`)
        if (s.tier !== 1) {
          expect(roster, `${s.slug}/${set.id}`).toBeUndefined()
          continue
        }
        expect(roster, `${s.slug}/${set.id}`).toBeDefined()
        for (const o of set.options) expect(roster!.back).toContain(o.name)
      }
    }
  })
})

function slug(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'x'
  )
}
