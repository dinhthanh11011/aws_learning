import {
  db,
  DEFAULT_PROFILE,
  today,
  type Attempt,
  type DailyStat,
  type LabRecord,
  type LessonRecord,
  type MistakeNote,
  type Profile,
  type ServiceMark,
  type SrsCard,
  type StepRecord,
  type StoryRecord,
} from '..'
import { levelFromXp, touchStreak, XP } from '@/engines/gamify/rules'
import type { CertId } from '@/content/schema'
import { retirementTarget } from '@/content/cert-registry'
import { normaliseSrsRow, orphanCardIds } from '../migrate'

/**
 * All database access goes through here. Components never see Dexie, which
 * keeps the persistence choice swappable and means every write that should
 * award XP or touch the streak actually does.
 */

/* ── Profile ─────────────────────────────────────────────────────────────── */

export async function getProfile(): Promise<Profile> {
  const existing = await db.profile.get('me')
  if (!existing) {
    const fresh = { ...DEFAULT_PROFILE, createdAt: Date.now() }
    await db.profile.put(fresh)
    return fresh
  }
  // Move a learner off a retired exam version, here rather than in a Dexie
  // upgrade: retirement is a content edit, and shipping a schema version for
  // each one would be a migration per year for a one-field change. Progress
  // carries across because mastery is keyed on services and tasks, not on the
  // paper's id.
  const target = retirementTarget(existing.targetCert)
  if (target === existing.targetCert) return existing
  const moved = { ...existing, targetCert: target }
  await db.profile.put(moved)
  return moved
}

export async function updateProfile(patch: Partial<Profile>): Promise<Profile> {
  const p = await getProfile()
  const next = { ...p, ...patch }
  await db.profile.put(next)
  return next
}

export interface XpAward {
  xp: number
  levelUp: boolean
  newLevel: number
  streak: number
  streakEvent: ReturnType<typeof touchStreak>['event']
  freezeEarned: boolean
}

/**
 * The single write path for earning XP. It also advances the streak and the
 * daily stat, so there is no way to award XP and forget the rest.
 */
export async function awardXp(amount: number, opts: { seconds?: number } = {}): Promise<XpAward> {
  const p = await getProfile()
  const before = levelFromXp(p.xp)
  const streak = touchStreak(p)
  const next: Profile = { ...streak.profile, xp: streak.profile.xp + amount }
  await db.profile.put(next)
  const after = levelFromXp(next.xp)

  await bumpDaily({ xp: amount, seconds: opts.seconds ?? 0 })

  return {
    xp: next.xp,
    levelUp: after.level > before.level,
    newLevel: after.level,
    streak: next.streak,
    streakEvent: streak.event,
    freezeEarned: streak.freezeEarned,
  }
}

/* ── Daily stats ─────────────────────────────────────────────────────────── */

export async function bumpDaily(patch: Partial<Omit<DailyStat, 'day'>>): Promise<void> {
  const day = today()
  const cur = (await db.dailyStats.get(day)) ?? {
    day,
    xp: 0,
    seconds: 0,
    reviews: 0,
    answered: 0,
    correct: 0,
  }
  await db.dailyStats.put({
    day,
    xp: cur.xp + (patch.xp ?? 0),
    seconds: cur.seconds + (patch.seconds ?? 0),
    reviews: cur.reviews + (patch.reviews ?? 0),
    answered: cur.answered + (patch.answered ?? 0),
    correct: cur.correct + (patch.correct ?? 0),
  })
}

export const getToday = () => db.dailyStats.get(today())
export const recentDays = (n = 90) => db.dailyStats.orderBy('day').reverse().limit(n).toArray()

/* ── SRS cards ───────────────────────────────────────────────────────────── */

export const allCards = () => db.srsCards.toArray()
export const dueCards = (now = Date.now()) => db.srsCards.where('due').belowOrEqual(now).toArray()

export async function ensureCards(cards: SrsCard[]): Promise<number> {
  const existing = new Set((await db.srsCards.toCollection().primaryKeys()) as string[])
  const missing = cards.filter((c) => !existing.has(c.cardId))
  if (missing.length) await db.srsCards.bulkPut(missing)
  return missing.length
}

/**
 * Drops stored rows for cards the corpus no longer derives. `validIds` must be
 * every card id in the corpus, not one cert's — see `orphanCardIds`.
 */
export async function pruneOrphanCards(validIds: ReadonlySet<string>): Promise<number> {
  const stored = (await db.srsCards.toCollection().primaryKeys()) as string[]
  const orphans = orphanCardIds(stored, validIds)
  if (orphans.length) await db.srsCards.bulkDelete(orphans)
  return orphans.length
}

export async function saveCard(card: SrsCard): Promise<void> {
  await db.srsCards.put(card)
}

export async function recordReview(
  card: SrsCard,
  seconds: number,
  hard: boolean,
): Promise<XpAward> {
  await db.srsCards.put(card)
  await bumpDaily({ reviews: 1 })
  return awardXp(hard ? XP.reviewCardHard : XP.reviewCard, { seconds })
}

export async function setCardConfidence(cardId: string, confidence: number): Promise<void> {
  const c = await db.srsCards.get(cardId)
  if (c) await db.srsCards.put({ ...c, confidence, updatedAt: Date.now() })
}

/* ── Attempts ────────────────────────────────────────────────────────────── */

export const allAttempts = () => db.attempts.toArray()
export const attemptsSince = (ms: number) => db.attempts.where('at').above(ms).toArray()

/**
 * The repository stamps `at` itself. Callers should not read the clock during
 * render — and "when did this happen" is the persistence layer's business.
 */
export async function recordAttempt(a: Omit<Attempt, 'id' | 'at'>): Promise<void> {
  await db.attempts.add({ ...a, at: Date.now() })
  await bumpDaily({ answered: 1, correct: a.correct ? 1 : 0 })
}

/** Question ids seen recently, so a fresh paper stays fresh. */
export async function seenQuestionIds(withinDays = 10): Promise<Set<string>> {
  const since = Date.now() - withinDays * 86_400_000
  const rows = await db.attempts.where('at').above(since).toArray()
  return new Set(rows.map((r) => r.questionId))
}

/* ── Lessons ─────────────────────────────────────────────────────────────── */

export const allLessons = () => db.lessons.toArray()
export const getLesson = (id: string) => db.lessons.get(id)
export async function saveLesson(rec: LessonRecord): Promise<void> {
  await db.lessons.put(rec)
}

/* ── Exams ───────────────────────────────────────────────────────────────── */

export const allExams = () => db.exams.orderBy('startedAt').reverse().toArray()
export const getExam = (id: string) => db.exams.get(id)
export async function saveExam(e: Parameters<typeof db.exams.put>[0]): Promise<void> {
  await db.exams.put(e)
}
/** The exam that was started and never finished, if any. */
export async function activeExam(): Promise<Awaited<ReturnType<typeof getExam>>> {
  const rows = await db.exams.orderBy('startedAt').reverse().limit(5).toArray()
  return rows.find((e) => e.endedAt === null)
}

/* ── Labs ────────────────────────────────────────────────────────────────── */

export const allLabs = () => db.labs.toArray()

export async function recordLab(labId: string, score: number, brokenId?: string): Promise<XpAward> {
  const cur = await db.labs.get(labId)
  const broken = new Set(cur?.broken ?? [])
  const isNewBreak = brokenId ? !broken.has(brokenId) : false
  if (brokenId) broken.add(brokenId)
  const rec: LabRecord = {
    labId,
    attempts: (cur?.attempts ?? 0) + 1,
    bestScore: Math.max(cur?.bestScore ?? 0, score),
    broken: [...broken],
    at: Date.now(),
  }
  await db.labs.put(rec)
  const gained = isNewBreak ? XP.breakItSolved : score > (cur?.bestScore ?? 0) ? XP.labSolved : 5
  return awardXp(gained)
}

/* ── Mistake log ─────────────────────────────────────────────────────────── */

export const openMistakes = () => db.mistakes.where('resolved').equals(0).toArray()
export const allMistakes = () => db.mistakes.orderBy('at').reverse().toArray()

export async function logMistake(m: Omit<MistakeNote, 'id' | 'at'>): Promise<XpAward> {
  await db.mistakes.add({ ...m, at: Date.now() })
  return awardXp(XP.mistakeLogged)
}

export async function resolveMistake(id: number): Promise<void> {
  const m = await db.mistakes.get(id)
  if (m) await db.mistakes.put({ ...m, resolved: true })
}

/**
 * Mistakes grouped by service. A service appearing three or more times is a
 * conceptual hole rather than a memory lapse — which is a far better study plan
 * than any generic syllabus.
 */
export async function mistakeClusters(): Promise<{ slug: string; count: number }[]> {
  const rows = await db.mistakes.toArray()
  const counts = new Map<string, number>()
  for (const m of rows) {
    for (const s of m.serviceSlugs) counts.set(s, (counts.get(s) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([slug, count]) => ({ slug, count }))
    .sort((a, b) => b.count - a.count)
}

/* ── Service marks ───────────────────────────────────────────────────────── */

export const allMarks = () => db.serviceMarks.toArray()

export async function markService(slug: string, patch: Partial<ServiceMark>): Promise<void> {
  const cur = await db.serviceMarks.get(slug)
  await db.serviceMarks.put({
    slug,
    confidence: patch.confidence ?? cur?.confidence ?? 0,
    starred: patch.starred ?? cur?.starred ?? false,
    at: Date.now(),
  })
}

/* ── Study steps ─────────────────────────────────────────────────────────── */

export const allSteps = () => db.steps.toArray()

/**
 * Ticking a step awards no XP and feeds no mastery ring. It is a self-report, and
 * the app's whole premise is that progress is measured from what you recalled,
 * answered or built — the lab, quiz and drill a step points at award their own XP
 * when you actually do them.
 */
export async function setStepDone(stepId: string, done: boolean): Promise<void> {
  if (done) await db.steps.put({ stepId, at: Date.now() })
  else await db.steps.delete(stepId)
}

/* ── Story chapters ──────────────────────────────────────────────────────── */

export const allStoryChapters = () => db.storyChapters.toArray()

/**
 * Marking a chapter read awards nothing, for exactly the reason `setStepDone`
 * awards nothing: it is a self-report. The chapter's "you decide" pick and its
 * recall checks are what award, because those are retrieval.
 */
export async function setChapterRead(chapterId: string, read: boolean): Promise<void> {
  if (read) await db.storyChapters.put({ chapterId, at: Date.now() })
  else await db.storyChapters.delete(chapterId)
}

/** Clears a storyline's ticks — the "read it again" escape hatch. */
export async function clearStoryChapters(chapterIds: string[]): Promise<void> {
  await db.storyChapters.bulkDelete(chapterIds)
}

/** Clears a phase's ticks — the "start this phase again" escape hatch. */
export async function clearSteps(stepIds: string[]): Promise<void> {
  await db.steps.bulkDelete(stepIds)
}

/* ── Achievements ────────────────────────────────────────────────────────── */

export const allAchievements = () => db.achievements.toArray()

export async function unlock(id: string): Promise<boolean> {
  if (await db.achievements.get(id)) return false
  await db.achievements.put({ id, unlockedAt: Date.now() })
  return true
}

/* ── Export / import — the only backup that exists ───────────────────────── */

export interface Backup {
  format: 'aws-learning-backup'
  version: 1
  exportedAt: string
  profile: Profile
  srsCards: SrsCard[]
  attempts: Attempt[]
  lessons: LessonRecord[]
  exams: unknown[]
  labs: LabRecord[]
  mistakes: MistakeNote[]
  achievements: { id: string; unlockedAt: number }[]
  dailyStats: DailyStat[]
  serviceMarks: ServiceMark[]
  steps: StepRecord[]
  storyChapters?: StoryRecord[]
}

export async function exportAll(): Promise<Backup> {
  return {
    format: 'aws-learning-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: await getProfile(),
    srsCards: await db.srsCards.toArray(),
    attempts: await db.attempts.toArray(),
    lessons: await db.lessons.toArray(),
    exams: await db.exams.toArray(),
    labs: await db.labs.toArray(),
    mistakes: await db.mistakes.toArray(),
    achievements: await db.achievements.toArray(),
    dailyStats: await db.dailyStats.toArray(),
    serviceMarks: await db.serviceMarks.toArray(),
    steps: await db.steps.toArray(),
    storyChapters: await db.storyChapters.toArray(),
  }
}

/** Strips an auto-increment key so bulkPut assigns a fresh one. */
function omitId<T extends { id?: number }>(row: T): Omit<T, 'id'> {
  const copy = { ...row }
  delete copy.id
  return copy
}

export async function importAll(data: unknown): Promise<{ ok: boolean; message: string }> {
  const b = data as Partial<Backup>
  if (b?.format !== 'aws-learning-backup') {
    return { ok: false, message: 'That file is not an export from this app.' }
  }
  if (b.version !== 1) {
    return { ok: false, message: `Unsupported backup version ${String(b.version)}.` }
  }
  await db.transaction(
    'rw',
    [
      db.profile,
      db.srsCards,
      db.attempts,
      db.lessons,
      db.exams,
      db.labs,
      db.mistakes,
      db.achievements,
      db.dailyStats,
      db.serviceMarks,
      db.steps,
      db.storyChapters,
    ],
    async () => {
      await Promise.all([
        db.srsCards.clear(),
        db.attempts.clear(),
        db.lessons.clear(),
        db.exams.clear(),
        db.labs.clear(),
        db.mistakes.clear(),
        db.achievements.clear(),
        db.dailyStats.clear(),
        db.serviceMarks.clear(),
        db.steps.clear(),
        db.storyChapters.clear(),
      ])
      if (b.profile) await db.profile.put(b.profile)
      // Backups taken before cards were tagged by family carry `certs`
      // instead. Normalising on the way in matters: without it, restoring an
      // old export would write pre-refactor rows into an upgraded table and
      // the drill queue would quietly come back empty.
      if (b.srsCards?.length) {
        await db.srsCards.bulkPut(
          b.srsCards.map(
            (c) =>
              normaliseSrsRow({ ...c } as unknown as Record<string, unknown>) as unknown as SrsCard,
          ),
        )
      }
      if (b.attempts?.length) await db.attempts.bulkPut(b.attempts.map((a) => omitId(a) as Attempt))
      if (b.lessons?.length) await db.lessons.bulkPut(b.lessons)
      if (b.exams?.length) await db.exams.bulkPut(b.exams as never[])
      if (b.labs?.length) await db.labs.bulkPut(b.labs)
      if (b.mistakes?.length)
        await db.mistakes.bulkPut(b.mistakes.map((m) => omitId(m) as MistakeNote))
      if (b.achievements?.length) await db.achievements.bulkPut(b.achievements)
      if (b.dailyStats?.length) await db.dailyStats.bulkPut(b.dailyStats)
      if (b.serviceMarks?.length) await db.serviceMarks.bulkPut(b.serviceMarks)
      // Absent from backups taken before the roadmap had steps, hence the guard.
      if (b.steps?.length) await db.steps.bulkPut(b.steps)
      // Absent from backups taken before the story reader existed, same guard.
      if (b.storyChapters?.length) await db.storyChapters.bulkPut(b.storyChapters)
    },
  )
  return { ok: true, message: 'Backup restored.' }
}

export async function resetAll(): Promise<void> {
  await Promise.all([
    db.profile.clear(),
    db.srsCards.clear(),
    db.attempts.clear(),
    db.lessons.clear(),
    db.exams.clear(),
    db.labs.clear(),
    db.mistakes.clear(),
    db.achievements.clear(),
    db.dailyStats.clear(),
    db.serviceMarks.clear(),
    db.steps.clear(),
    db.storyChapters.clear(),
  ])
}

export type { CertId }
