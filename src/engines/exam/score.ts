import type { Cert, Question } from '@/content/schema'

/**
 * AWS reports a scaled score from 100 to 1000 with 720 to pass, using a
 * compensatory model — you do not need to pass each domain, only the whole
 * paper. The exact scaling is proprietary and varies by exam form, so this is an
 * honest linear estimate anchored on the pass mark, and the UI says so.
 */

export interface DomainBreakdown {
  domainId: string
  title: string
  weight: number
  answered: number
  correct: number
  accuracy: number
  /** AWS's own language on the score report. */
  classification: 'Needs improvement' | 'Meets competencies' | 'Exceeds competencies'
}

export interface ScoreResult {
  rawCorrect: number
  rawTotal: number
  accuracy: number
  scaled: number
  passed: boolean
  /** Marks the estimate as an estimate wherever it is displayed. */
  estimate: true
  domains: DomainBreakdown[]
  weakest: DomainBreakdown[]
}

/**
 * Maps raw accuracy onto the cert's scaled range with a hinge at the pass mark,
 * so the cert's `passAccuracy` lands exactly on its `passScore` rather than
 * somewhere arbitrary. The anchor is per-cert data rather than a constant here,
 * because a new exam version can move its pass mark.
 */
export function toScaled(accuracy: number, cert: Cert): number {
  const { passScore, scaleMin, scaleMax } = cert
  const hinge = cert.passAccuracy
  const clamped = Math.max(0, Math.min(1, accuracy))
  const scaled =
    clamped <= hinge
      ? scaleMin + (clamped / hinge) * (passScore - scaleMin)
      : passScore + ((clamped - hinge) / (1 - hinge)) * (scaleMax - passScore)
  return Math.round(Math.max(scaleMin, Math.min(scaleMax, scaled)))
}

function classify(accuracy: number): DomainBreakdown['classification'] {
  if (accuracy < 0.66) return 'Needs improvement'
  if (accuracy < 0.85) return 'Meets competencies'
  return 'Exceeds competencies'
}

export function isCorrect(question: Question, chosen: string[]): boolean {
  const correct = question.options.filter((o) => o.correct).map((o) => o.id)
  if (chosen.length !== correct.length) return false
  const set = new Set(chosen)
  return correct.every((id) => set.has(id))
}

export function score(
  cert: Cert,
  questions: Question[],
  answers: Record<string, string[]>,
): ScoreResult {
  const domainOf = new Map<string, string>()
  for (const d of cert.domains) for (const t of d.tasks) domainOf.set(t.id, d.id)

  const perDomain = new Map<string, { answered: number; correct: number }>()
  let rawCorrect = 0

  for (const q of questions) {
    const chosen = answers[q.id] ?? []
    const ok = chosen.length > 0 && isCorrect(q, chosen)
    if (ok) rawCorrect += 1
    const did = domainOf.get(q.taskId) ?? 'unknown'
    const acc = perDomain.get(did) ?? { answered: 0, correct: 0 }
    acc.answered += 1
    if (ok) acc.correct += 1
    perDomain.set(did, acc)
  }

  const rawTotal = questions.length
  const accuracy = rawTotal ? rawCorrect / rawTotal : 0

  const domains: DomainBreakdown[] = cert.domains.map((d) => {
    const acc = perDomain.get(d.id) ?? { answered: 0, correct: 0 }
    const a = acc.answered ? acc.correct / acc.answered : 0
    return {
      domainId: d.id,
      title: d.title,
      weight: d.weight,
      answered: acc.answered,
      correct: acc.correct,
      accuracy: a,
      classification: classify(a),
    }
  })

  const scaled = toScaled(accuracy, cert)

  return {
    rawCorrect,
    rawTotal,
    accuracy,
    scaled,
    passed: scaled >= cert.passScore,
    estimate: true,
    domains,
    // Rank by the marks at stake, not raw accuracy: being weak in a 30% domain
    // costs far more than being weak in a 20% one.
    weakest: [...domains]
      .filter((d) => d.answered > 0)
      .sort((a, b) => (1 - a.accuracy) * a.weight - (1 - b.accuracy) * b.weight)
      .reverse()
      .slice(0, 3),
  }
}

/** Marks at stake per domain — what to study next, in order. */
export function marksAtStake(result: ScoreResult): { domainId: string; title: string; points: number }[] {
  return result.domains
    .map((d) => ({ domainId: d.domainId, title: d.title, points: (1 - d.accuracy) * d.weight }))
    .sort((a, b) => b.points - a.points)
}
