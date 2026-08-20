import type { Phase, StudyStep } from '@/content/schema'

/**
 * "What do I do next" as a pure function of the phases and the set of steps
 * already ticked off.
 *
 * The rule is deliberately the simplest one that is still honest: the next step
 * is the first unticked step in phase order. It does not skip ahead to a phase
 * you have partly done, and it does not hide a step because the phase it belongs
 * to is locked — the lock is advice about ordering, and a learner who has read
 * ahead should not be told there is nothing to do.
 */

export interface PhaseStepProgress {
  done: number
  total: number
  /** Guided minutes in this phase — always less than the phase's own budget. */
  minutes: number
  minutesDone: number
}

export function phaseStepProgress(phase: Phase, done: ReadonlySet<string>): PhaseStepProgress {
  let d = 0
  let minutesDone = 0
  for (const s of phase.steps) {
    if (done.has(s.id)) {
      d += 1
      minutesDone += s.minutes
    }
  }
  return {
    done: d,
    total: phase.steps.length,
    minutes: phase.steps.reduce((n, s) => n + s.minutes, 0),
    minutesDone,
  }
}

export interface NextStep {
  step: StudyStep
  phaseId: string
  phaseTitle: string
  /** 1-based position within its own phase, which is how the UI numbers it. */
  position: number
  ofPhase: number
  /** Progress across every step of every phase for this cert. */
  overallDone: number
  overallTotal: number
}

/**
 * The first unticked step, or null once everything is ticked. `phases` is
 * expected to be already filtered to the target cert and in learning order —
 * `phasesFor()` returns exactly that.
 */
export function nextStep(phases: Phase[], done: ReadonlySet<string>): NextStep | null {
  const all = phases.flatMap((p) => p.steps)
  const overallTotal = all.length
  const overallDone = all.reduce((n, s) => n + (done.has(s.id) ? 1 : 0), 0)

  for (const phase of phases) {
    for (const [i, step] of phase.steps.entries()) {
      if (done.has(step.id)) continue
      return {
        step,
        phaseId: phase.id,
        phaseTitle: phase.title,
        position: i + 1,
        ofPhase: phase.steps.length,
        overallDone,
        overallTotal,
      }
    }
  }
  return null
}

/**
 * How much of the guided path is behind you, 0–1. Weighted by minutes rather
 * than by step count, so ticking a 45-minute reading does not count the same as
 * a two-hour build.
 */
export function guidedProgress(phases: Phase[], done: ReadonlySet<string>): number {
  let total = 0
  let complete = 0
  for (const p of phases) {
    for (const s of p.steps) {
      total += s.minutes
      if (done.has(s.id)) complete += s.minutes
    }
  }
  return total === 0 ? 0 : complete / total
}
