import type { Attempt, LabRecord, LessonRecord, ServiceMark, SrsCard } from '@/db'
import { retrievability } from '../srs/scheduler'
import type { CertId, Domain, Service, Task } from '@/content/schema'

/**
 * Mastery is 0–5 rings on the map. It deliberately blends four different kinds
 * of evidence, because any single one is easy to fool:
 *
 *   · recall     — FSRS retrievability, i.e. would you remember it right now
 *   · accuracy   — recent answers on real exam-format questions
 *   · practice   — did you actually build it in a lab
 *   · honesty    — your own 1–5 confidence rating
 *
 * A learner who watched every lesson but cannot answer a question scores low,
 * which is the entire point.
 */

export const MASTERY_MAX = 5

export interface MasteryInput {
  cards: SrsCard[]
  attempts: Attempt[]
  lessons: LessonRecord[]
  labs: LabRecord[]
  marks: ServiceMark[]
  now?: Date
  /**
   * Maps a stored `taskId` onto the current exam version's task ids, so work
   * done against a superseded task statement still counts. Defaults to
   * identity. Supplied at the React boundary — the engine stays pure by taking
   * the function rather than importing the cert registry.
   */
  taskAlias?: (taskId: string) => string
}

export interface Mastery {
  /** 0–5, rounded for display. */
  rings: number
  /** 0–1, the underlying continuous score. */
  score: number
  recall: number
  accuracy: number
  coverage: number
  confidence: number | null
  /** Enough evidence to trust the number? */
  confident: boolean
  /** The single most useful next action. */
  next: 'learn' | 'drill' | 'quiz' | 'build' | 'maintain'
}

const EMPTY: Mastery = {
  rings: 0,
  score: 0,
  recall: 0,
  accuracy: 0,
  coverage: 0,
  confidence: null,
  confident: false,
  next: 'learn',
}

/** Recent attempts weigh more — a wrong answer from six weeks ago is stale news. */
function weightedAccuracy(attempts: Attempt[], now: number): { value: number; weight: number } {
  if (!attempts.length) return { value: 0, weight: 0 }
  let num = 0
  let den = 0
  for (const a of attempts) {
    const ageDays = (now - a.at) / 86_400_000
    const w = Math.exp(-ageDays / 21) // half-life around a fortnight
    den += w
    if (a.correct) num += w
  }
  return { value: den ? num / den : 0, weight: Math.min(1, attempts.length / 5) }
}

function combine(
  recall: number,
  recallWeight: number,
  accuracy: number,
  accuracyWeight: number,
  coverage: number,
  confidence: number | null,
): Mastery {
  // Weights reflect what predicts exam performance: recall and accuracy carry
  // it, coverage shows you have met the material, self-rating is a small nudge.
  const parts: [number, number][] = [
    [recall, 0.35 * recallWeight],
    [accuracy, 0.4 * accuracyWeight],
    [coverage, 0.2],
  ]
  if (confidence !== null) parts.push([(confidence - 1) / 4, 0.05])

  const totalWeight = parts.reduce((n, [, w]) => n + w, 0)
  const score = totalWeight ? parts.reduce((n, [v, w]) => n + v * w, 0) / totalWeight : 0
  const confident = recallWeight > 0.4 && accuracyWeight > 0.4

  let next: Mastery['next'] = 'maintain'
  if (coverage < 0.3) next = 'learn'
  else if (accuracyWeight < 0.4) next = 'quiz'
  else if (accuracy < 0.7) next = 'drill'
  else if (recall < 0.7) next = 'drill'
  else if (coverage < 0.999) next = 'build'

  return {
    score,
    rings: Math.round(score * MASTERY_MAX),
    recall,
    accuracy,
    coverage,
    confidence,
    confident,
    next,
  }
}

/** Mastery of one service. */
export function serviceMastery(service: Service, input: MasteryInput): Mastery {
  const now = (input.now ?? new Date()).getTime()
  const cards = input.cards.filter((c) => c.serviceSlugs.includes(service.slug))
  const attempts = input.attempts.filter((a) => a.serviceSlugs.includes(service.slug))
  const mark = input.marks.find((m) => m.slug === service.slug)

  if (!cards.length && !attempts.length && !mark) return EMPTY

  const recall = cards.length
    ? cards.reduce((n, c) => n + retrievability(c, new Date(now)), 0) / cards.length
    : 0
  const recallWeight = Math.min(1, cards.length / 3)
  const { value: accuracy, weight: accuracyWeight } = weightedAccuracy(attempts, now)
  // A tier-1 service needs more evidence before we call it covered.
  const needed = service.tier === 1 ? 4 : service.tier === 2 ? 2 : 1
  const coverage = Math.min(1, (cards.filter((c) => c.reps > 0).length + attempts.length) / needed)

  return combine(recall, recallWeight, accuracy, accuracyWeight, coverage, mark?.confidence ?? null)
}

/** Mastery of a task statement — rolls up its services plus direct attempts. */
export function taskMastery(task: Task, services: Service[], input: MasteryInput): Mastery {
  const now = (input.now ?? new Date()).getTime()
  const alias = input.taskAlias ?? ((id: string) => id)
  const attempts = input.attempts.filter((a) => a.taskId && alias(a.taskId) === task.id)
  const cards = input.cards.filter((c) => c.taskId && alias(c.taskId) === task.id)
  const relevant = services.filter((s) => task.serviceSlugs.includes(s.slug))

  const perService = relevant.map((s) => serviceMastery(s, input))
  // Weight core services higher — knowing three tier-3 services does not
  // compensate for not knowing the tier-1 one the questions are about.
  const weightOf = (s: Service) => (s.tier === 1 ? 3 : s.tier === 2 ? 2 : 1)
  const wTotal = relevant.reduce((n, s) => n + weightOf(s), 0) || 1
  const svcScore = relevant.reduce((n, s, i) => n + perService[i].score * weightOf(s), 0) / wTotal

  const { value: accuracy, weight: accuracyWeight } = weightedAccuracy(attempts, now)
  const recall = cards.length
    ? cards.reduce((n, c) => n + retrievability(c, new Date(now)), 0) / cards.length
    : svcScore
  const coverage = perService.length
    ? perService.filter((m) => m.coverage > 0).length / perService.length
    : 0

  const m = combine(recall, cards.length ? Math.min(1, cards.length / 3) : 0.6, accuracy, accuracyWeight, coverage, null)
  // Blend in the service roll-up so a task with no direct questions still moves.
  const score = m.score * 0.6 + svcScore * 0.4
  return { ...m, score, rings: Math.round(score * MASTERY_MAX) }
}

export function domainMastery(
  domain: Domain,
  services: Service[],
  input: MasteryInput,
): Mastery & { perTask: { taskId: string; mastery: Mastery }[] } {
  const perTask = domain.tasks.map((t) => ({ taskId: t.id, mastery: taskMastery(t, services, input) }))
  const score = perTask.length ? perTask.reduce((n, p) => n + p.mastery.score, 0) / perTask.length : 0
  const avg = (pick: (m: Mastery) => number) =>
    perTask.length ? perTask.reduce((n, p) => n + pick(p.mastery), 0) / perTask.length : 0
  const weakest = [...perTask].sort((a, b) => a.mastery.score - b.mastery.score)[0]
  return {
    score,
    rings: Math.round(score * MASTERY_MAX),
    recall: avg((m) => m.recall),
    accuracy: avg((m) => m.accuracy),
    coverage: avg((m) => m.coverage),
    confidence: null,
    confident: perTask.every((p) => p.mastery.confident),
    next: weakest?.mastery.next ?? 'learn',
    perTask,
  }
}

/**
 * Readiness: the probability-flavoured headline number on the dashboard.
 * Weighted by domain weight, because a weak 30% domain hurts far more than a
 * weak 20% one — and deliberately capped until there is real exam evidence, so
 * it cannot tell you you are ready on the strength of flashcards alone.
 */
export function readiness(
  domains: Domain[],
  services: Service[],
  input: MasteryInput,
  certId: CertId,
  opts: {
    /**
     * Does an attempt recorded against `attemptCertId` count as evidence for
     * `certId`? Defaults to strict equality; callers pass a family comparison
     * so that sitting SAA-C03 papers still counts once C03 retires. Without
     * that, a retirement would silently wipe every learner's exam evidence and
     * drop readiness back under the 70% cap overnight.
     */
    sameExam?: (attemptCertId: CertId) => boolean
  } = {},
): {
  percent: number
  perDomain: { domainId: string; title: string; weight: number; score: number; marksAtStake: number }[]
  examEvidence: number
  capped: boolean
  advice: string
} {
  const perDomain = domains.map((d) => {
    const m = domainMastery(d, services, input)
    return {
      domainId: d.id,
      title: d.title,
      weight: d.weight,
      score: m.score,
      marksAtStake: (1 - m.score) * d.weight,
    }
  })
  const weighted = perDomain.reduce((n, d) => n + d.score * d.weight, 0) / 100

  const sameExam = opts.sameExam ?? ((id: CertId) => id === certId)
  const examAttempts = input.attempts.filter((a) => a.source === 'exam' && sameExam(a.certId))
  const examEvidence = Math.min(1, examAttempts.length / 130) // two full papers
  // Without exam evidence the ceiling is 70%: content mastery is necessary but
  // it is not proof you can do it against the clock and four plausible options.
  const cap = 0.7 + 0.3 * examEvidence
  const capped = weighted > cap
  const percent = Math.round(Math.min(weighted, cap) * 100)

  const worst = [...perDomain].sort((a, b) => b.marksAtStake - a.marksAtStake)[0]
  const advice = capped
    ? `Your content mastery is ahead of your exam evidence. Sit a full timed paper — that is the only thing that moves this number now.`
    : percent < 40
      ? `Early days. Work through ${worst.title} — it is where the most marks are currently going begging.`
      : percent < 70
        ? `Solid progress. ${worst.title} is costing you the most: about ${worst.marksAtStake.toFixed(0)} marks of the paper.`
        : `Close. Keep sitting fresh papers and clear the mistake log; book when you clear 80% on a paper you have never seen.`

  return { percent, perDomain, examEvidence, capped, advice }
}
