import { describe, it, expect } from 'vitest'
import { questions } from '@/content'
import { hashSeed, rngFor, seededShuffle, shuffle, shuffleQuestionOptions } from './shuffle'

describe('seeded shuffle', () => {
  it('is deterministic for a given seed', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8]
    expect(seededShuffle(items, 'a', 'b')).toEqual(seededShuffle(items, 'a', 'b'))
  })

  it('differs between seeds', () => {
    const items = Array.from({ length: 20 }, (_, i) => i)
    expect(seededShuffle(items, 'session-1')).not.toEqual(seededShuffle(items, 'session-2'))
  })

  it('does not collide on the same parts split differently', () => {
    expect(hashSeed('ab', 'c')).not.toBe(hashSeed('a', 'bc'))
  })

  it('is a permutation, never a filter', () => {
    const items = Array.from({ length: 50 }, (_, i) => i)
    const out = seededShuffle(items, 'x')
    expect([...out].sort((a, b) => a - b)).toEqual(items)
  })

  it('is close to uniform — every item reaches every position', () => {
    // Guards against the `sort(() => Math.random() - 0.5)` failure mode, where
    // the head of the array stays put far more often than 1-in-n.
    const seen = [new Set<number>(), new Set<number>(), new Set<number>(), new Set<number>()]
    for (let s = 0; s < 400; s++) {
      const out = seededShuffle([0, 1, 2, 3], `seed-${s}`)
      out.forEach((v, i) => seen[i].add(v))
    }
    for (const positions of seen) expect(positions.size).toBe(4)
  })

  it('rngFor stays in range', () => {
    const rng = rngFor(hashSeed('seed'))
    for (let i = 0; i < 1000; i++) {
      const n = rng()
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThan(1)
    }
  })
})

describe('shuffleQuestionOptions', () => {
  it('preserves option ids so stored attempts stay meaningful', () => {
    const q = questions[0]
    const out = shuffleQuestionOptions(q, 'session')
    expect([...out.options].map((o) => o.id).sort()).toEqual(q.options.map((o) => o.id).sort())
    for (const o of out.options) {
      const original = q.options.find((x) => x.id === o.id)!
      expect(o.text).toBe(original.text)
      expect(o.correct).toBe(original.correct)
    }
  })

  it('moves the correct answer off position A across the bank', () => {
    // Every question in the corpus is authored correct-first. Shuffled, the
    // correct option must land somewhere other than the top most of the time —
    // this is the regression that made the whole bank answerable by picking A.
    const single = questions.filter((q) => q.type === 'single')
    const atTop = single.filter(
      (q) => shuffleQuestionOptions(q, 'sitting-1').options[0].correct,
    ).length
    expect(single.length).toBeGreaterThan(100)
    expect(atTop / single.length).toBeLessThan(0.4)
    expect(atTop / single.length).toBeGreaterThan(0.1)
  })

  it('varies the position between sittings', () => {
    const q = questions.find((x) => x.options.length >= 4)!
    const seeds = ['s1', 's2', 's3', 's4', 's5', 's6']
    const positions = new Set(
      seeds.map((s) => shuffleQuestionOptions(q, s).options.findIndex((o) => o.correct)),
    )
    expect(positions.size).toBeGreaterThan(1)
  })

  it('shuffle() with an explicit rng is a plain permutation', () => {
    const rng = rngFor(1)
    expect(shuffle([1, 2, 3], rng).sort()).toEqual([1, 2, 3])
  })
})
