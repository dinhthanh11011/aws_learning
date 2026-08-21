import { describe, expect, it } from 'vitest'
import { allocate, sample } from './sampler'
import { isCorrect, marksAtStake, score, toScaled } from './score'
import { saaC03 } from '@/content/certs/saa-c03'
import type { Question } from '@/content/schema'

/**
 * A synthetic pool. `perTask` must be large enough that the smallest domain can
 * still fill its allocation: SAA domain 2 has only two task statements but is
 * allocated 17 of 65 questions, so 8 per task would legitimately short-fall.
 */
function pool(perTask = 12): Question[] {
  const out: Question[] = []
  for (const d of saaC03.domains) {
    for (const t of d.tasks) {
      for (let i = 0; i < perTask; i++) {
        out.push({
          id: `${t.id}-q${i}`,
          families: ['saa'],
          taskId: t.id,
          type: 'single',
          stem: `Question ${i} for ${t.id}`,
          options: [
            { id: 'A', text: 'right', correct: true, why: 'because' },
            { id: 'B', text: 'wrong', correct: false, why: 'because not' },
            { id: 'C', text: 'wrong', correct: false, why: 'because not' },
            { id: 'D', text: 'wrong', correct: false, why: 'because not' },
          ],
          explanation: 'the rule',
          serviceSlugs: [],
          difficulty: ((i % 3) + 1) as 1 | 2 | 3,
        })
      }
    }
  }
  return out
}

// Deterministic RNG so a failure is reproducible rather than "sometimes".
function seeded(seed = 42) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

describe('allocate — the paper must match the published weighting', () => {
  it('splits 65 questions as 30/26/24/20 percent', () => {
    const a = allocate(saaC03, 65)
    expect(Object.values(a).reduce((n, v) => n + v, 0)).toBe(65)
    // Floors are 19/16/15/13 = 63; the two spare questions go to the largest
    // fractional parts, which are domain 2 (.9) and domain 3 (.6).
    expect(a['saa-d1']).toBe(19) // 30% of 65 = 19.5
    expect(a['saa-d2']).toBe(17) // 26% → 16.9 + 1
    expect(a['saa-d3']).toBe(16) // 24% → 15.6 + 1
    expect(a['saa-d4']).toBe(13) // 20% → 13.0
  })

  it('always totals exactly the requested count, at any size', () => {
    for (const n of [10, 20, 33, 50, 65, 100]) {
      const total = Object.values(allocate(saaC03, n)).reduce((s, v) => s + v, 0)
      expect(total).toBe(n)
    }
  })

  it('gives the heaviest domain the most questions', () => {
    const a = allocate(saaC03, 65)
    expect(a['saa-d1']).toBeGreaterThan(a['saa-d4'])
  })
})

describe('sample', () => {
  it('produces a full paper with the right domain split', () => {
    const r = sample({ cert: saaC03, pool: pool(), count: 65, rng: seeded() })
    expect(r.questions).toHaveLength(65)
    expect(r.shortfall).toHaveLength(0)

    const domainOf = new Map<string, string>()
    for (const d of saaC03.domains) for (const t of d.tasks) domainOf.set(t.id, d.id)
    const counts: Record<string, number> = {}
    for (const q of r.questions) {
      const id = domainOf.get(q.taskId)!
      counts[id] = (counts[id] ?? 0) + 1
    }
    expect(counts).toEqual(allocate(saaC03, 65))
  })

  it('never repeats a question inside one paper', () => {
    const r = sample({ cert: saaC03, pool: pool(), count: 65, rng: seeded(7) })
    expect(new Set(r.questions.map((q) => q.id)).size).toBe(65)
  })

  it('prefers unseen questions but still fills the paper', () => {
    const p = pool()
    const exclude = new Set(p.slice(0, 40).map((q) => q.id))
    const r = sample({ cert: saaC03, pool: p, count: 65, exclude, rng: seeded(3) })
    expect(r.questions).toHaveLength(65)
    const reused = r.questions.filter((q) => exclude.has(q.id)).length
    expect(reused).toBeLessThan(20)
  })

  it('reports a shortfall rather than silently returning a short paper', () => {
    const thin = pool(1)
    const r = sample({ cert: saaC03, pool: thin, count: 65, rng: seeded() })
    expect(r.shortfall.length).toBeGreaterThan(0)
    expect(r.questions.length).toBeLessThan(65)
  })

  it('holds the split across many runs', () => {
    const rng = seeded(99)
    for (let run = 0; run < 25; run++) {
      const r = sample({ cert: saaC03, pool: pool(), count: 65, rng })
      expect(r.questions).toHaveLength(65)
    }
  })
})

describe('isCorrect', () => {
  const multi: Question = {
    ...pool(1)[0],
    id: 'm1',
    type: 'multi',
    options: [
      { id: 'A', text: '', correct: true, why: '' },
      { id: 'B', text: '', correct: true, why: '' },
      { id: 'C', text: '', correct: false, why: '' },
      { id: 'D', text: '', correct: false, why: '' },
      { id: 'E', text: '', correct: false, why: '' },
    ],
  }

  it('requires every correct option and no extras', () => {
    expect(isCorrect(multi, ['A', 'B'])).toBe(true)
    expect(isCorrect(multi, ['B', 'A'])).toBe(true)
    expect(isCorrect(multi, ['A'])).toBe(false)
    expect(isCorrect(multi, ['A', 'B', 'C'])).toBe(false)
    expect(isCorrect(multi, [])).toBe(false)
  })
})

describe('toScaled', () => {
  it('puts the pass mark at 72% raw', () => {
    expect(toScaled(0.72, saaC03)).toBe(720)
  })

  it('is monotonic and stays inside the reported range', () => {
    let last = -1
    for (let a = 0; a <= 1.0001; a += 0.05) {
      const s = toScaled(a, saaC03)
      expect(s).toBeGreaterThanOrEqual(100)
      expect(s).toBeLessThanOrEqual(1000)
      expect(s).toBeGreaterThanOrEqual(last)
      last = s
    }
  })

  it('fails below the hinge and passes above it', () => {
    expect(toScaled(0.6, saaC03)).toBeLessThan(720)
    expect(toScaled(0.8, saaC03)).toBeGreaterThan(720)
    expect(toScaled(1, saaC03)).toBe(1000)
  })
})

describe('score', () => {
  const paper = sample({ cert: saaC03, pool: pool(), count: 65, rng: seeded(11) }).questions

  it('scores a perfect paper as a pass at 1000', () => {
    const answers = Object.fromEntries(paper.map((q) => [q.id, ['A']]))
    const r = score(saaC03, paper, answers)
    expect(r.rawCorrect).toBe(65)
    expect(r.scaled).toBe(1000)
    expect(r.passed).toBe(true)
  })

  it('scores an empty paper as a fail and counts unanswered as wrong', () => {
    const r = score(saaC03, paper, {})
    expect(r.rawCorrect).toBe(0)
    expect(r.passed).toBe(false)
    expect(r.accuracy).toBe(0)
  })

  it('reports per-domain accuracy that reflects the answers given', () => {
    // Answer domain 1 correctly, everything else wrongly.
    const d1Tasks = new Set(saaC03.domains[0].tasks.map((t) => t.id))
    const answers = Object.fromEntries(
      paper.map((q) => [q.id, d1Tasks.has(q.taskId) ? ['A'] : ['B']]),
    )
    const r = score(saaC03, paper, answers)
    const d1 = r.domains.find((d) => d.domainId === 'saa-d1')!
    expect(d1.accuracy).toBe(1)
    expect(d1.classification).toBe('Exceeds competencies')
    for (const d of r.domains.filter((x) => x.domainId !== 'saa-d1')) {
      expect(d.accuracy).toBe(0)
      expect(d.classification).toBe('Needs improvement')
    }
  })

  it('ranks the weakest domains by marks at stake, not raw accuracy', () => {
    // 50% in the 30%-weighted domain costs more than 40% in the 20% one.
    const d1 = new Set(saaC03.domains[0].tasks.map((t) => t.id))
    const d4 = new Set(saaC03.domains[3].tasks.map((t) => t.id))
    const answers: Record<string, string[]> = {}
    let i = 0
    for (const q of paper) {
      if (d1.has(q.taskId)) answers[q.id] = i++ % 2 === 0 ? ['A'] : ['B']
      else if (d4.has(q.taskId)) answers[q.id] = i++ % 10 < 4 ? ['A'] : ['B']
      else answers[q.id] = ['A']
    }
    const r = score(saaC03, paper, answers)
    const stake = marksAtStake(r)
    expect(stake[0].domainId).toBe('saa-d1')
  })

  it('accounts for every question exactly once across domains', () => {
    const answers = Object.fromEntries(paper.map((q) => [q.id, ['A']]))
    const r = score(saaC03, paper, answers)
    expect(r.domains.reduce((n, d) => n + d.answered, 0)).toBe(65)
  })
})
