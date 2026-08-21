import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  State,
  type Card as FsrsCard,
  type Grade as FsrsGrade,
} from 'ts-fsrs'
import type { SrsCard } from '@/db'
import type { CertFamily } from '@/content/schema'

/**
 * Spaced repetition over FSRS-6 (via ts-fsrs). We do not invent scheduling —
 * the algorithm is trained on hundreds of millions of real reviews and will
 * beat anything hand-rolled. What lives here is the *policy* around it: how the
 * daily queue is built, how new cards interleave with reviews, and how
 * retrievability maps onto the mastery rings on the map.
 */

export const GRADES = ['again', 'hard', 'good', 'easy'] as const
export type Grade = (typeof GRADES)[number]

const RATING: Record<Grade, FsrsGrade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
}

export const GRADE_META: Record<Grade, { label: string; hint: string; key: string; tone: string }> = {
  again: { label: 'Again', hint: 'No idea, or I got it wrong', key: '1', tone: 'bad' },
  hard: { label: 'Hard', hint: 'Right, but it was a struggle', key: '2', tone: 'warn' },
  good: { label: 'Good', hint: 'Right, with normal effort', key: '3', tone: 'ok' },
  easy: { label: 'Easy', hint: 'Instant — space this out more', key: '4', tone: 'info' },
}

/**
 * Target retention of 0.9 is the FSRS default and the right choice here: higher
 * means far more reviews for marginal gain, lower risks forgetting a limit you
 * will be asked about under time pressure.
 */
const scheduler = fsrs(generatorParameters({ enable_fuzz: true, request_retention: 0.9 }))

export function newCard(
  cardId: string,
  families: CertFamily[],
  serviceSlugs: string[],
  taskId?: string,
  now = new Date(),
): SrsCard {
  const card = createEmptyCard(now)
  return {
    cardId,
    families,
    serviceSlugs,
    taskId,
    fsrs: card,
    due: card.due.getTime(),
    reps: 0,
    lapses: 0,
    confidence: null,
    updatedAt: now.getTime(),
  }
}

function toFsrs(card: SrsCard): FsrsCard {
  const raw = card.fsrs as FsrsCard
  // Dates survive structuredClone in IndexedDB, but be defensive about strings.
  return {
    ...raw,
    due: new Date(raw.due),
    last_review: raw.last_review ? new Date(raw.last_review) : undefined,
  } as FsrsCard
}

export interface ReviewOutcome {
  card: SrsCard
  /** Human description of when this comes back, for the toast. */
  nextIn: string
  intervalDays: number
}

export function review(card: SrsCard, grade: Grade, now = new Date()): ReviewOutcome {
  const result = scheduler.next(toFsrs(card), now, RATING[grade])
  const next = result.card
  const intervalMs = next.due.getTime() - now.getTime()
  const intervalDays = intervalMs / 86_400_000

  return {
    card: {
      ...card,
      fsrs: next,
      due: next.due.getTime(),
      reps: next.reps,
      lapses: next.lapses,
      updatedAt: now.getTime(),
    },
    nextIn: describeInterval(intervalMs),
    intervalDays,
  }
}

export function describeInterval(ms: number): string {
  const mins = ms / 60_000
  if (mins < 60) return `${Math.max(1, Math.round(mins))} min`
  const hours = mins / 60
  if (hours < 24) return `${Math.round(hours)} h`
  const days = hours / 24
  if (days < 31) return `${Math.round(days)} d`
  const months = days / 30.44
  if (months < 12) return `${months.toFixed(months < 3 ? 1 : 0)} mo`
  return `${(days / 365.25).toFixed(1)} yr`
}

/** Probability you would recall this card right now, 0–1. */
export function retrievability(card: SrsCard, now = new Date()): number {
  const raw = toFsrs(card)
  if (raw.state === State.New || !raw.last_review) return 0
  return scheduler.get_retrievability(raw, now, false) as number
}

export function isDue(card: SrsCard, now = Date.now()): boolean {
  return card.due <= now
}

export interface QueueOptions {
  /** Cap on brand-new cards per session, so a session cannot balloon. */
  newLimit?: number
  /** Cap on total cards per session. */
  totalLimit?: number
  /**
   * Card ids eligible for this session. The caller builds it from
   * `cardsFor(certId)`, because scope depends on `versionScope` overrides that
   * the stored row does not carry — so the one place that knows is the content
   * registry, not this engine and not the database.
   */
  allow?: ReadonlySet<string>
  now?: Date
}

export interface Queue {
  cards: SrsCard[]
  dueCount: number
  newCount: number
  /** Cards due later today but not yet — shown as "coming up". */
  laterToday: number
}

/**
 * Builds a session queue: overdue reviews first (most overdue leading), then
 * new cards interleaved so the session does not become a wall of unfamiliar
 * material. Interleaving is what stops a session feeling like a cliff.
 */
export function buildQueue(all: SrsCard[], opts: QueueOptions = {}): Queue {
  const now = opts.now ?? new Date()
  const t = now.getTime()
  const endOfDay = new Date(now)
  endOfDay.setHours(23, 59, 59, 999)

  const pool = opts.allow ? all.filter((c) => opts.allow!.has(c.cardId)) : all
  const newLimit = opts.newLimit ?? 15
  const totalLimit = opts.totalLimit ?? 40

  const isNew = (c: SrsCard) => c.reps === 0
  const due = pool.filter((c) => !isNew(c) && c.due <= t).sort((a, b) => a.due - b.due)
  const fresh = pool.filter(isNew).slice(0, newLimit)
  const laterToday = pool.filter((c) => !isNew(c) && c.due > t && c.due <= endOfDay.getTime()).length

  const reviewsToTake = due.slice(0, Math.max(0, totalLimit - fresh.length))
  const cards: SrsCard[] = []

  // Interleave: roughly one new card per three reviews, so recall practice
  // dominates and new material arrives as a change of pace.
  const step = reviewsToTake.length ? Math.max(1, Math.floor(reviewsToTake.length / (fresh.length + 1))) : 0
  let f = 0
  reviewsToTake.forEach((c, i) => {
    cards.push(c)
    if (step && (i + 1) % step === 0 && f < fresh.length) cards.push(fresh[f++])
  })
  while (f < fresh.length) cards.push(fresh[f++])

  return { cards, dueCount: due.length, newCount: fresh.length, laterToday }
}

/**
 * Forecast of how many reviews land on each of the next `days` days. Drives the
 * calendar heatmap, and — more usefully — warns you when a wall of reviews is
 * about to arrive the week of your exam.
 */
export function forecast(all: SrsCard[], days = 30, now = new Date()): { day: string; count: number }[] {
  const out: { day: string; count: number }[] = []
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  for (let i = 0; i < days; i++) {
    const from = start.getTime() + i * 86_400_000
    const to = from + 86_400_000
    const d = new Date(from)
    const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    // Everything overdue collapses onto today, which is the honest picture.
    const count = all.filter((c) => (i === 0 ? c.due < to : c.due >= from && c.due < to)).length
    out.push({ day, count })
  }
  return out
}
