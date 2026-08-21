import { phases } from '@/content/phases'
import { inScope } from '@/content/cert-registry'
import type { Phase } from '@/content/schema'
import type { CertId } from '@/content/schema'

/**
 * Turns "my exam is on this date and I have this many hours a week" into a
 * week-by-week plan. Two design choices matter:
 *
 *   · When time is short, breadth is compressed, never the building phase.
 *     Hands-on practice is what converts reading into the recall the exam tests,
 *     so cutting it is the one compression that reliably costs marks.
 *   · The plan always leaves a review taper before the exam. Cramming into the
 *     final week is how people arrive with a full head and no retrieval speed.
 */

export interface PlanWeek {
  week: number
  /** ISO date of the Monday this week starts. */
  startsOn: string
  phaseId: string
  phaseTitle: string
  hours: number
  focus: string
  /** Marked when this week is the taper before the exam. */
  taper: boolean
}

export interface StudyPlan {
  certId: CertId
  weeklyHours: number
  totalHours: number
  weeks: PlanWeek[]
  examDate: string | null
  /** Weeks available versus weeks needed. Negative means you are short. */
  slackWeeks: number
  feasible: boolean
  /** Honest assessment, including when the date does not work. */
  verdict: string
  compression: 'none' | 'mild' | 'heavy' | 'unrealistic'
}

const MS_WEEK = 7 * 86_400_000

function mondayOf(d: Date): Date {
  const out = new Date(d)
  const day = out.getDay()
  const diff = (day + 6) % 7
  out.setDate(out.getDate() - diff)
  out.setHours(0, 0, 0, 0)
  return out
}

// Format from local components, not toISOString: the plan's weeks are local
// Mondays, and UTC conversion shifts them into Sunday for any timezone ahead
// of UTC.
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Weeks between now and the exam, floored at zero. */
export function weeksUntil(examDate: string, from = new Date()): number {
  const target = new Date(`${examDate}T00:00:00`)
  return Math.max(0, Math.floor((target.getTime() - mondayOf(from).getTime()) / MS_WEEK))
}

export function generate(opts: {
  certId: CertId
  weeklyHours: number
  examDate?: string | null
  from?: Date
}): StudyPlan {
  const { certId, weeklyHours } = opts
  const from = opts.from ?? new Date()
  const relevant = phases.filter((p) => inScope(p, certId))
  const totalHours = relevant.reduce((n, p) => n + p.hours, 0)

  const naturalWeeks = Math.ceil(totalHours / Math.max(1, weeklyHours))
  const available = opts.examDate ? weeksUntil(opts.examDate, from) : naturalWeeks
  // Always hold back a week of review before the exam.
  const taperWeeks = available >= 4 ? 1 : 0
  const buildWeeks = Math.max(1, available - taperWeeks)

  const ratio = buildWeeks / naturalWeeks
  const compression: StudyPlan['compression'] =
    ratio >= 0.95 ? 'none' : ratio >= 0.75 ? 'mild' : ratio >= 0.5 ? 'heavy' : 'unrealistic'

  // Distribute the available weeks across phases in proportion to their hours,
  // but protect the build phase from compression.
  const protectedIds = new Set(['phase-2'])
  const protectedHours = relevant.filter((p) => protectedIds.has(p.id)).reduce((n, p) => n + p.hours, 0)
  const flexibleHours = totalHours - protectedHours

  const protectedWeeks = Math.min(
    buildWeeks - 1,
    Math.ceil(protectedHours / Math.max(1, weeklyHours)),
  )
  const flexibleWeeks = Math.max(1, buildWeeks - protectedWeeks)

  const weeks: PlanWeek[] = []
  let cursor = 1
  const start = mondayOf(from)

  const focusFor = (p: Phase, i: number, n: number) => {
    if (n === 1) return p.purpose
    const share = i / Math.max(1, n - 1)
    if (share < 0.34) return `Start ${p.title.toLowerCase()} — read, then build the same week.`
    if (share < 0.67) return `Mid ${p.title.toLowerCase()} — build it, then break it deliberately.`
    return `Close out ${p.title.toLowerCase()} — write the comparison tables from memory.`
  }

  for (const p of relevant) {
    const isProtected = protectedIds.has(p.id)
    const weeksForPhase = isProtected
      ? Math.max(1, protectedWeeks)
      : Math.max(1, Math.round((p.hours / Math.max(1, flexibleHours)) * flexibleWeeks))

    for (let i = 0; i < weeksForPhase; i++) {
      weeks.push({
        week: cursor,
        startsOn: iso(new Date(start.getTime() + (cursor - 1) * MS_WEEK)),
        phaseId: p.id,
        phaseTitle: p.title,
        hours: weeklyHours,
        focus: focusFor(p, i, weeksForPhase),
        taper: false,
      })
      cursor += 1
    }
  }

  for (let i = 0; i < taperWeeks; i++) {
    weeks.push({
      week: cursor,
      startsOn: iso(new Date(start.getTime() + (cursor - 1) * MS_WEEK)),
      phaseId: 'taper',
      phaseTitle: 'Taper & review',
      hours: Math.max(2, Math.round(weeklyHours * 0.6)),
      focus:
        'No new material. Fresh full papers, clear the mistake log, and re-drill the keyword decoder. Sleep matters more than one more topic.',
      taper: true,
    })
    cursor += 1
  }

  const slackWeeks = available - naturalWeeks
  const feasible = compression !== 'unrealistic'

  const verdict = !opts.examDate
    ? `No exam booked. At ${weeklyHours} hours a week this takes about ${naturalWeeks} weeks — book a date once you can see week ${Math.max(1, naturalWeeks - 4)} from here, because an open-ended plan is the one people abandon.`
    : compression === 'none'
      ? `Comfortable. ${available} weeks available, about ${naturalWeeks} needed, so there is room for a week to go wrong.`
      : compression === 'mild'
        ? `Tight but workable. You have ${available} weeks for roughly ${naturalWeeks} weeks of material — protect the building phase and compress breadth instead.`
        : compression === 'heavy'
          ? `Aggressive. ${available} weeks for about ${naturalWeeks} weeks of work means ${Math.ceil(totalHours / Math.max(1, available))} hours a week, not ${weeklyHours}. Either raise the hours or move the date.`
          : `Not realistic at ${weeklyHours} hours a week. You would need about ${Math.ceil(totalHours / Math.max(1, available))} hours a week. Move the date, or accept that this becomes a familiarity pass rather than a pass.`

  return {
    certId,
    weeklyHours,
    totalHours,
    weeks,
    examDate: opts.examDate ?? null,
    slackWeeks,
    feasible,
    verdict,
    compression,
  }
}

/**
 * The daily mission: three tasks, sized to a single sitting. Deliberately mixed
 * — one recall task, one new-material task, one active task — because a session
 * that is only flashcards or only reading trains one muscle.
 */
export interface Mission {
  id: string
  kind: 'drill' | 'learn' | 'quiz' | 'lab' | 'trigger' | 'review'
  title: string
  detail: string
  href: string
  /** Estimated minutes. */
  minutes: number
  done: boolean
}

export function dailyMission(input: {
  dueReviews: number
  newCards: number
  openMistakes: number
  weakestDomainTitle: string | null
  currentPhase: Phase | undefined
  certId: CertId
  answeredToday: number
  reviewedToday: number
}): Mission[] {
  const out: Mission[] = []

  if (input.dueReviews > 0 || input.newCards > 0) {
    out.push({
      id: 'drill',
      kind: 'drill',
      title: input.dueReviews > 0 ? `Clear ${input.dueReviews} due reviews` : `Start ${input.newCards} new cards`,
      detail:
        input.dueReviews > 20
          ? 'A backlog this size compounds. Clear it before adding anything new.'
          : 'Retrieval beats re-reading, and it is the whole reason this queue exists.',
      href: '/drill',
      minutes: Math.min(25, Math.max(5, Math.round((input.dueReviews + input.newCards) * 0.4))),
      done: input.reviewedToday >= Math.min(input.dueReviews, 10) && input.dueReviews > 0,
    })
  }

  out.push({
    id: 'quiz',
    kind: 'quiz',
    title: input.weakestDomainTitle
      ? `Ten questions on ${input.weakestDomainTitle}`
      : 'Ten exam-format questions',
    detail: input.weakestDomainTitle
      ? 'This is where the most marks are currently going begging.'
      : 'Scenario questions, four plausible options, every option explained.',
    href: '/quiz',
    minutes: 12,
    done: input.answeredToday >= 10,
  })

  if (input.openMistakes >= 3) {
    out.push({
      id: 'mistakes',
      kind: 'review',
      title: `Work through ${input.openMistakes} logged mistakes`,
      detail:
        'A service appearing three times is a conceptual hole, not a memory lapse. This list is a better study plan than any syllabus.',
      href: '/progress#mistakes',
      minutes: 10,
      done: false,
    })
  } else if (input.currentPhase?.labIds.length) {
    out.push({
      id: 'lab',
      kind: 'lab',
      title: `Build something: ${input.currentPhase.title}`,
      detail: 'Read about it, then build it the same session. Then break it on purpose.',
      href: '/labs',
      minutes: 20,
      done: false,
    })
  } else {
    out.push({
      id: 'trigger',
      kind: 'trigger',
      title: 'Drill the keyword decoder',
      detail: 'Recognising the phrase eliminates two options before you finish reading the stem.',
      href: '/decoder',
      minutes: 8,
      done: false,
    })
  }

  return out.slice(0, 3)
}
