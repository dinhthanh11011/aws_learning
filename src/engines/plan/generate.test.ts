import { describe, expect, it } from 'vitest'
import { dailyMission, generate, weeksUntil } from './generate'
import { phases } from '@/content/phases'

const from = new Date('2026-08-20T09:00:00')

describe('weeksUntil', () => {
  it('counts whole weeks and never goes negative', () => {
    expect(weeksUntil('2026-09-17', from)).toBe(4)
    expect(weeksUntil('2026-01-01', from)).toBe(0)
  })
})

describe('generate', () => {
  it('covers every phase for the chosen cert', () => {
    const plan = generate({ certId: 'SAA-C03', weeklyHours: 6, from })
    const saaPhases = phases.filter((p) => p.certs.includes('SAA-C03')).map((p) => p.id)
    const covered = new Set(plan.weeks.map((w) => w.phaseId))
    for (const id of saaPhases) expect(covered.has(id)).toBe(true)
  })

  it('numbers weeks consecutively from 1 with weekly Monday dates', () => {
    const plan = generate({ certId: 'SAA-C03', weeklyHours: 6, from })
    plan.weeks.forEach((w, i) => expect(w.week).toBe(i + 1))
    const days = plan.weeks.map((w) => new Date(`${w.startsOn}T00:00:00`).getDay())
    expect(new Set(days)).toEqual(new Set([1]))
  })

  it('takes longer at fewer hours per week', () => {
    const slow = generate({ certId: 'SAA-C03', weeklyHours: 3, from })
    const fast = generate({ certId: 'SAA-C03', weeklyHours: 12, from })
    expect(slow.weeks.length).toBeGreaterThan(fast.weeks.length)
  })

  it('always ends with a taper when there is room', () => {
    const plan = generate({ certId: 'SAA-C03', weeklyHours: 6, examDate: '2027-03-01', from })
    expect(plan.weeks.at(-1)?.taper).toBe(true)
    expect(plan.weeks.at(-1)?.phaseTitle).toMatch(/taper/i)
  })

  it('protects the build phase when time is short', () => {
    const roomy = generate({ certId: 'SAA-C03', weeklyHours: 6, examDate: '2027-04-01', from })
    const tight = generate({ certId: 'SAA-C03', weeklyHours: 6, examDate: '2026-11-01', from })
    const buildWeeks = (p: typeof roomy) => p.weeks.filter((w) => w.phaseId === 'phase-2').length
    const otherWeeks = (p: typeof roomy) =>
      p.weeks.filter((w) => w.phaseId !== 'phase-2' && !w.taper).length

    expect(tight.weeks.length).toBeLessThan(roomy.weeks.length)
    // Breadth gets compressed harder than building does.
    const buildRatio = buildWeeks(tight) / buildWeeks(roomy)
    const otherRatio = otherWeeks(tight) / otherWeeks(roomy)
    expect(buildRatio).toBeGreaterThanOrEqual(otherRatio)
  })

  it('says plainly when a date is not achievable', () => {
    const plan = generate({ certId: 'SAA-C03', weeklyHours: 2, examDate: '2026-09-20', from })
    expect(plan.feasible).toBe(false)
    expect(plan.compression).toBe('unrealistic')
    expect(plan.verdict).toMatch(/not realistic/i)
  })

  it('is comfortable when there is plenty of time', () => {
    const plan = generate({ certId: 'SAA-C03', weeklyHours: 10, examDate: '2027-06-01', from })
    expect(plan.compression).toBe('none')
    expect(plan.slackWeeks).toBeGreaterThan(0)
  })

  it('nudges toward booking a date when none is set', () => {
    const plan = generate({ certId: 'SAA-C03', weeklyHours: 6, from })
    expect(plan.examDate).toBeNull()
    expect(plan.verdict).toMatch(/no exam booked/i)
  })
})

describe('dailyMission', () => {
  const base = {
    dueReviews: 12,
    newCards: 5,
    openMistakes: 0,
    weakestDomainTitle: 'Design Secure Architectures',
    currentPhase: phases[1],
    certId: 'SAA-C03' as const,
    answeredToday: 0,
    reviewedToday: 0,
  }

  it('returns at most three tasks', () => {
    expect(dailyMission(base).length).toBeLessThanOrEqual(3)
  })

  it('mixes recall with something active rather than stacking flashcards', () => {
    const kinds = new Set(dailyMission(base).map((m) => m.kind))
    expect(kinds.size).toBeGreaterThan(1)
  })

  it('names the weakest domain in the quiz task', () => {
    const quiz = dailyMission(base).find((m) => m.kind === 'quiz')!
    expect(quiz.title).toContain('Design Secure Architectures')
  })

  it('prioritises the mistake log once it has real entries', () => {
    const kinds = dailyMission({ ...base, openMistakes: 6 }).map((m) => m.kind)
    expect(kinds).toContain('review')
  })

  it('warns when the review backlog has become the priority', () => {
    const drill = dailyMission({ ...base, dueReviews: 60 }).find((m) => m.kind === 'drill')!
    expect(drill.detail).toMatch(/backlog/i)
  })

  it('marks the quiz done once ten questions are answered', () => {
    const quiz = dailyMission({ ...base, answeredToday: 10 }).find((m) => m.kind === 'quiz')!
    expect(quiz.done).toBe(true)
  })
})
