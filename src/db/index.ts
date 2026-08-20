import Dexie, { type Table } from 'dexie'
import type { CertId } from '@/content/schema'

/**
 * Everything you do lives in this browser, in IndexedDB. No account, no server,
 * no network call. The cost of that is that a cleared browser profile loses your
 * progress, which is why /settings ships an export.
 *
 * Feature code never touches these tables directly — it goes through
 * `src/db/repo/*`, so a sync backend could be added later without rewriting UI.
 */

export type LessonStatus = 'unseen' | 'started' | 'done'

export interface Profile {
  id: 'me'
  createdAt: number
  targetCert: CertId
  /** ISO date, or null if no exam booked yet. */
  examDate: string | null
  weeklyHours: number
  xp: number
  /** Consecutive days with activity. */
  streak: number
  bestStreak: number
  /** Skips a missed day without breaking the streak. Earned, not bought. */
  freezes: number
  /** yyyy-mm-dd of the last day with any activity. */
  lastActiveDay: string | null
  /** Set once onboarding has been completed. */
  onboarded: boolean
}

export interface SrsCard {
  /** Content card id, or `q:<questionId>` for a card generated from a wrong answer. */
  cardId: string
  certs: CertId[]
  serviceSlugs: string[]
  taskId?: string
  /** Serialised ts-fsrs card state. */
  fsrs: unknown
  due: number
  reps: number
  lapses: number
  /** Your own 1–5 honesty rating, separate from the algorithm's view. */
  confidence: number | null
  updatedAt: number
}

export interface Attempt {
  id?: number
  questionId: string
  certId: CertId
  taskId: string
  domainId: string
  serviceSlugs: string[]
  chosen: string[]
  correct: boolean
  ms: number
  at: number
  /** Which surface it came from, so exam data can be separated from drilling. */
  source: 'exam' | 'quiz' | 'drill' | 'lesson'
}

export interface LessonRecord {
  lessonId: string
  status: LessonStatus
  checksPassed: number
  checksTotal: number
  seconds: number
  at: number
}

export interface ExamSession {
  id: string
  certId: CertId
  mode: 'full' | 'quiz'
  domainId?: string
  startedAt: number
  endedAt: number | null
  /** Seconds remaining when last saved — lets a reload resume mid-exam. */
  remaining: number
  questionIds: string[]
  answers: Record<string, string[]>
  flagged: string[]
  cursor: number
  scaled: number | null
  passed: boolean | null
}

export interface LabRecord {
  labId: string
  attempts: number
  bestScore: number
  /** Break-it challenges solved, by challenge id. */
  broken: string[]
  at: number
}

export interface MistakeNote {
  id?: number
  questionId: string
  serviceSlugs: string[]
  domainId: string
  /** One line: what you actually got wrong. The point is writing it, not storing it. */
  note: string
  at: number
  resolved: boolean
}

export interface Achievement {
  id: string
  unlockedAt: number
}

export interface DailyStat {
  /** yyyy-mm-dd */
  day: string
  xp: number
  seconds: number
  reviews: number
  answered: number
  correct: number
}

export interface ServiceMark {
  slug: string
  /** Self-rated 1–5 confidence. Honest self-rating drives the weak-spot view. */
  confidence: number
  starred: boolean
  at: number
}

class AwsDb extends Dexie {
  profile!: Table<Profile, string>
  srsCards!: Table<SrsCard, string>
  attempts!: Table<Attempt, number>
  lessons!: Table<LessonRecord, string>
  exams!: Table<ExamSession, string>
  labs!: Table<LabRecord, string>
  mistakes!: Table<MistakeNote, number>
  achievements!: Table<Achievement, string>
  dailyStats!: Table<DailyStat, string>
  serviceMarks!: Table<ServiceMark, string>

  constructor() {
    super('aws-learning')
    this.version(1).stores({
      profile: 'id',
      srsCards: 'cardId, due, *serviceSlugs, *certs, taskId',
      attempts: '++id, questionId, at, domainId, correct, source, *serviceSlugs',
      lessons: 'lessonId, status, at',
      exams: 'id, certId, startedAt, endedAt',
      labs: 'labId, at',
      mistakes: '++id, questionId, at, resolved, domainId',
      achievements: 'id, unlockedAt',
      dailyStats: 'day',
      serviceMarks: 'slug, confidence, starred',
    })
  }
}

export const db = new AwsDb()

/** yyyy-mm-dd in the user's own timezone — streaks should follow local midnight. */
export function today(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  const ms = Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)
  return Math.round(ms / 86_400_000)
}

export const DEFAULT_PROFILE: Profile = {
  id: 'me',
  createdAt: 0,
  targetCert: 'SAA-C03',
  examDate: null,
  weeklyHours: 6,
  xp: 0,
  streak: 0,
  bestStreak: 0,
  freezes: 2,
  lastActiveDay: null,
  onboarded: false,
}
