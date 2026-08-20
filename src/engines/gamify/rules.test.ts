import { describe, expect, it } from 'vitest'
import { comboMultiplier, levelFromXp, levelTitle, touchStreak, XP } from './rules'
import { DEFAULT_PROFILE, type Profile } from '@/db'

const at = (iso: string) => new Date(`${iso}T12:00:00`)
const base: Profile = { ...DEFAULT_PROFILE, createdAt: 0 }

describe('levelFromXp', () => {
  it('starts at level 1 with no XP', () => {
    expect(levelFromXp(0)).toMatchObject({ level: 1, into: 0 })
  })

  it('reaches level 2 at 100 XP', () => {
    expect(levelFromXp(99).level).toBe(1)
    expect(levelFromXp(100).level).toBe(2)
  })

  it('increases monotonically and keeps `into` inside `span`', () => {
    let last = 1
    for (let xp = 0; xp < 200_000; xp += 137) {
      const l = levelFromXp(xp)
      expect(l.level).toBeGreaterThanOrEqual(last)
      expect(l.into).toBeLessThan(l.span)
      expect(l.into).toBeGreaterThanOrEqual(0)
      last = l.level
    }
  })

  it('gives a title at every level, including far beyond the list', () => {
    expect(levelTitle(1)).toBeTruthy()
    expect(levelTitle(99)).toBeTruthy()
  })
})

describe('XP rewards recall over reading', () => {
  it('pays more for a correct hard question than for finishing a lesson', () => {
    expect(XP.questionCorrect(3)).toBeGreaterThan(XP.lessonSection)
    expect(XP.questionCorrect(3)).toBeGreaterThan(XP.questionCorrect(1))
  })

  it('still pays something for a wrong answer that was reviewed', () => {
    expect(XP.questionWrongButReviewed).toBeGreaterThan(0)
    expect(XP.questionWrongButReviewed).toBeLessThan(XP.questionCorrect(1))
  })
})

describe('touchStreak', () => {
  it('starts a streak on the first active day', () => {
    const r = touchStreak(base, at('2026-08-20'))
    expect(r.event).toBe('started')
    expect(r.profile.streak).toBe(1)
  })

  it('does nothing on a second visit the same day', () => {
    const p = { ...base, streak: 3, lastActiveDay: '2026-08-20' }
    const r = touchStreak(p, at('2026-08-20'))
    expect(r.event).toBe('same-day')
    expect(r.profile.streak).toBe(3)
  })

  it('continues on consecutive days and tracks the best streak', () => {
    const p = { ...base, streak: 3, bestStreak: 3, lastActiveDay: '2026-08-19' }
    const r = touchStreak(p, at('2026-08-20'))
    expect(r.event).toBe('continued')
    expect(r.profile.streak).toBe(4)
    expect(r.profile.bestStreak).toBe(4)
  })

  it('spends a freeze to survive exactly one missed day', () => {
    const p = { ...base, streak: 10, freezes: 2, lastActiveDay: '2026-08-18' }
    const r = touchStreak(p, at('2026-08-20'))
    expect(r.event).toBe('frozen')
    expect(r.freezeUsed).toBe(true)
    expect(r.profile.streak).toBe(11)
    expect(r.profile.freezes).toBe(1)
  })

  it('breaks the streak when a day is missed with no freeze left', () => {
    const p = { ...base, streak: 10, freezes: 0, lastActiveDay: '2026-08-18' }
    const r = touchStreak(p, at('2026-08-20'))
    expect(r.event).toBe('broken')
    expect(r.profile.streak).toBe(1)
  })

  it('breaks the streak after two missed days even with freezes', () => {
    const p = { ...base, streak: 10, freezes: 3, lastActiveDay: '2026-08-16' }
    const r = touchStreak(p, at('2026-08-20'))
    expect(r.event).toBe('broken')
    expect(r.profile.freezes).toBe(3)
  })

  it('never lowers the best streak when the current one breaks', () => {
    const p = { ...base, streak: 30, bestStreak: 30, freezes: 0, lastActiveDay: '2026-08-01' }
    expect(touchStreak(p, at('2026-08-20')).profile.bestStreak).toBe(30)
  })

  it('earns a freeze every seventh day, capped at three', () => {
    const p = { ...base, streak: 6, freezes: 0, lastActiveDay: '2026-08-19' }
    const r = touchStreak(p, at('2026-08-20'))
    expect(r.profile.streak).toBe(7)
    expect(r.freezeEarned).toBe(true)
    expect(r.profile.freezes).toBe(1)

    const full = { ...base, streak: 13, freezes: 3, lastActiveDay: '2026-08-19' }
    const r2 = touchStreak(full, at('2026-08-20'))
    expect(r2.profile.freezes).toBe(3)
    expect(r2.freezeEarned).toBe(false)
  })

  it('handles a month boundary correctly', () => {
    const p = { ...base, streak: 5, lastActiveDay: '2026-07-31' }
    expect(touchStreak(p, at('2026-08-01')).event).toBe('continued')
  })
})

describe('comboMultiplier', () => {
  it('stays at 1x until a run of three', () => {
    expect(comboMultiplier(0)).toBe(1)
    expect(comboMultiplier(2)).toBe(1)
    expect(comboMultiplier(3)).toBeGreaterThan(1)
  })

  it('caps at 2x so volume cannot beat accuracy', () => {
    expect(comboMultiplier(1000)).toBe(2)
  })
})
