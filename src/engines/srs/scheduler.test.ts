import { describe, expect, it } from 'vitest'
import { buildQueue, describeInterval, forecast, newCard, retrievability, review } from './scheduler'
import type { SrsCard } from '@/db'

const NOW = new Date('2026-08-20T09:00:00Z')
const card = (id: string, over: Partial<SrsCard> = {}): SrsCard => ({
  ...newCard(id, ['SAA-C03'], ['s3'], undefined, NOW),
  ...over,
})

describe('review', () => {
  it('schedules "again" sooner than "good", and "good" sooner than "easy"', () => {
    const c = card('a')
    const again = review(c, 'again', NOW).intervalDays
    const hard = review(c, 'hard', NOW).intervalDays
    const good = review(c, 'good', NOW).intervalDays
    const easy = review(c, 'easy', NOW).intervalDays
    expect(again).toBeLessThan(good)
    expect(hard).toBeLessThan(easy)
    expect(good).toBeLessThanOrEqual(easy)
  })

  it('advances the repetition count and pushes the due date forward', () => {
    const c = card('a')
    const out = review(c, 'good', NOW)
    expect(out.card.reps).toBe(1)
    expect(out.card.due).toBeGreaterThan(NOW.getTime())
  })

  it('records a lapse when a previously learned card is failed', () => {
    let c = card('a')
    for (const g of ['good', 'good', 'good'] as const) {
      c = review(c, g, new Date(c.due)).card
    }
    const lapsed = review(c, 'again', new Date(c.due)).card
    expect(lapsed.lapses).toBeGreaterThan(0)
  })

  it('stretches intervals as a card is repeatedly recalled', () => {
    let c = card('a')
    const intervals: number[] = []
    for (let i = 0; i < 5; i++) {
      const out = review(c, 'good', new Date(c.due))
      intervals.push(out.intervalDays)
      c = out.card
    }
    expect(intervals.at(-1)!).toBeGreaterThan(intervals[0])
  })
})

describe('retrievability', () => {
  it('is zero for a card never reviewed', () => {
    expect(retrievability(card('a'), NOW)).toBe(0)
  })

  it('decays as time passes since the review', () => {
    const reviewed = review(card('a'), 'good', NOW).card
    const soon = retrievability(reviewed, new Date(NOW.getTime() + 3_600_000))
    const later = retrievability(reviewed, new Date(NOW.getTime() + 30 * 86_400_000))
    expect(soon).toBeGreaterThan(later)
    expect(soon).toBeLessThanOrEqual(1)
  })
})

describe('buildQueue', () => {
  it('returns nothing from an empty collection', () => {
    const q = buildQueue([], { now: NOW })
    expect(q.cards).toHaveLength(0)
    expect(q.dueCount).toBe(0)
  })

  it('caps new cards at the configured limit', () => {
    const cards = Array.from({ length: 60 }, (_, i) => card(`n${i}`))
    const q = buildQueue(cards, { newLimit: 15, now: NOW })
    expect(q.newCount).toBe(15)
    expect(q.cards).toHaveLength(15)
  })

  it('puts the most overdue reviews first', () => {
    const cards = [
      card('recent', { reps: 2, due: NOW.getTime() - 1000 }),
      card('ancient', { reps: 2, due: NOW.getTime() - 30 * 86_400_000 }),
    ]
    const q = buildQueue(cards, { newLimit: 0, now: NOW })
    expect(q.cards[0].cardId).toBe('ancient')
  })

  it('respects the total limit', () => {
    const cards = Array.from({ length: 200 }, (_, i) =>
      card(`d${i}`, { reps: 3, due: NOW.getTime() - i * 1000 }),
    )
    const q = buildQueue(cards, { totalLimit: 40, newLimit: 0, now: NOW })
    expect(q.cards.length).toBeLessThanOrEqual(40)
    expect(q.dueCount).toBe(200)
  })

  it('interleaves new cards among reviews rather than stacking them at the end', () => {
    const reviews = Array.from({ length: 20 }, (_, i) =>
      card(`r${i}`, { reps: 2, due: NOW.getTime() - 5000 }),
    )
    const fresh = Array.from({ length: 4 }, (_, i) => card(`n${i}`))
    const q = buildQueue([...reviews, ...fresh], { newLimit: 4, totalLimit: 40, now: NOW })
    const firstNewAt = q.cards.findIndex((c) => c.reps === 0)
    expect(firstNewAt).toBeGreaterThan(0)
    expect(firstNewAt).toBeLessThan(q.cards.length - 1)
  })

  it('filters by certification', () => {
    const cards: SrsCard[] = [
      { ...card('saa'), certs: ['SAA-C03'] },
      { ...card('dva'), certs: ['DVA-C02'] },
    ]
    const q = buildQueue(cards, { certId: 'DVA-C02', now: NOW })
    expect(q.cards.map((c) => c.cardId)).toEqual(['dva'])
  })

  it('counts cards due later today separately from those due now', () => {
    const cards = [
      card('now', { reps: 2, due: NOW.getTime() - 1000 }),
      card('later', { reps: 2, due: NOW.getTime() + 3_600_000 }),
    ]
    const q = buildQueue(cards, { newLimit: 0, now: NOW })
    expect(q.dueCount).toBe(1)
    expect(q.laterToday).toBe(1)
  })
})

describe('forecast', () => {
  it('collapses everything overdue onto today rather than hiding it', () => {
    const cards = [
      card('old', { reps: 2, due: NOW.getTime() - 40 * 86_400_000 }),
      card('older', { reps: 2, due: NOW.getTime() - 90 * 86_400_000 }),
    ]
    const f = forecast(cards, 7, NOW)
    expect(f[0].count).toBe(2)
    expect(f.slice(1).every((d) => d.count === 0)).toBe(true)
  })

  it('returns one entry per requested day', () => {
    expect(forecast([], 30, NOW)).toHaveLength(30)
  })
})

describe('describeInterval', () => {
  it('scales the unit to the magnitude', () => {
    expect(describeInterval(60_000 * 10)).toMatch(/min/)
    expect(describeInterval(3_600_000 * 5)).toMatch(/h/)
    expect(describeInterval(86_400_000 * 5)).toMatch(/d/)
    expect(describeInterval(86_400_000 * 90)).toMatch(/mo/)
    expect(describeInterval(86_400_000 * 500)).toMatch(/yr/)
  })
})
