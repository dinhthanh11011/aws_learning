import { describe, expect, it } from 'vitest'
import { phases } from '@/content/phases'
import { currentCertFor, phasesFor } from '@/content'
import type { Phase } from '@/content/schema'
import { guidedProgress, nextStep, phaseStepProgress } from './steps'

const saa = phasesFor(currentCertFor('saa')!.id)

describe('nextStep', () => {
  it('starts at the very first step when nothing is done', () => {
    const n = nextStep(saa, new Set())
    expect(n?.step.id).toBe('phase-0-s1')
    expect(n?.position).toBe(1)
    expect(n?.overallDone).toBe(0)
  })

  it('walks forward as steps are ticked', () => {
    const done = new Set(['phase-0-s1', 'phase-0-s2'])
    const n = nextStep(saa, done)
    expect(n?.step.id).toBe('phase-0-s3')
    expect(n?.position).toBe(3)
    expect(n?.overallDone).toBe(2)
  })

  it('crosses into the next phase once one is finished', () => {
    const first = saa[0]
    const done = new Set(first.steps.map((s) => s.id))
    const n = nextStep(saa, done)
    expect(n?.phaseId).toBe(saa[1].id)
    expect(n?.position).toBe(1)
  })

  it('does not skip an earlier gap when a later step is ticked out of order', () => {
    const n = nextStep(saa, new Set(['phase-0-s4']))
    expect(n?.step.id).toBe('phase-0-s1')
  })

  it('returns null once every step is done', () => {
    const done = new Set(saa.flatMap((p) => p.steps.map((s) => s.id)))
    expect(nextStep(saa, done)).toBeNull()
  })

  it('has no next step for a cert with no phases', () => {
    expect(nextStep([], new Set())).toBeNull()
  })
})

describe('phaseStepProgress', () => {
  it('counts only steps belonging to the phase', () => {
    const p = saa[0]
    const done = new Set([p.steps[0].id, 'phase-1-s1'])
    const r = phaseStepProgress(p, done)
    expect(r.done).toBe(1)
    expect(r.total).toBe(p.steps.length)
    expect(r.minutesDone).toBe(p.steps[0].minutes)
  })

  it('never claims more guided minutes than the phase is budgeted', () => {
    for (const p of phases) {
      expect(phaseStepProgress(p, new Set()).minutes).toBeLessThanOrEqual(p.hours * 60)
    }
  })
})

describe('guidedProgress', () => {
  it('weights by minutes, not by step count', () => {
    const fake: Phase[] = [
      {
        ...saa[0],
        steps: [
          { ...saa[0].steps[0], id: 'phase-0-s1', minutes: 30 },
          { ...saa[0].steps[1], id: 'phase-0-s2', minutes: 90 },
        ],
      },
    ]
    expect(guidedProgress(fake, new Set(['phase-0-s1']))).toBeCloseTo(0.25)
    expect(guidedProgress(fake, new Set(['phase-0-s2']))).toBeCloseTo(0.75)
  })

  it('is 0 with nothing done and 1 with everything done', () => {
    expect(guidedProgress(saa, new Set())).toBe(0)
    expect(guidedProgress(saa, new Set(saa.flatMap((p) => p.steps.map((s) => s.id))))).toBe(1)
  })

  it('is 0 rather than NaN when there are no steps at all', () => {
    expect(guidedProgress([], new Set())).toBe(0)
  })
})
