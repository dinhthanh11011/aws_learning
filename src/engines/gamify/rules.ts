import type { Profile } from '@/db'
import { daysBetween, today } from '@/db'

/**
 * The motivation layer. Two rules keep it honest:
 *
 *   1. XP is only ever awarded for *recall* — answering, reviewing, building.
 *      Getting a hard question right earns real XP; reading earns nothing at
 *      all. Otherwise the numbers reward the wrong behaviour.
 *   2. Nothing here is purchasable and nothing is random enough to feel like a
 *      slot machine. Streak freezes are earned by consistency, not bought.
 */

export const XP = {
  /**
   * Both deliberately unused, and kept only so the intent is written down: the
   * lesson player awards nothing for *reading* a lesson, exactly as marking a
   * study step or a story chapter awards nothing. Reading is not evidence of
   * recall. If you are here to wire these up, the answer is no — the checks
   * below are what the lesson pays for.
   */
  lessonSection: 2,
  lessonComplete: 15,
  checkCorrect: 5,
  /** Scaled by difficulty: 1→8, 2→12, 3→18. */
  questionCorrect: (difficulty: 1 | 2 | 3) => [0, 8, 12, 18][difficulty],
  questionWrongButReviewed: 3,
  reviewCard: 4,
  reviewCardHard: 6,
  labSolved: 40,
  breakItSolved: 25,
  quizPassed: 50,
  examCompleted: 120,
  mistakeLogged: 6,
  triggerDrilled: 3,
  /**
   * A story chapter's "you decide" pick, sat deliberately between a quiz
   * question and a lab: naming the service before the chapter reveals it is a
   * harder retrieval than recognising a card and an easier one than building
   * something. Note there is no entry for *reading* a chapter — reading is not
   * evidence of anything, so it awards nothing.
   */
  storyDecideCorrect: 14,
  storyDecideWrongButReviewed: 4,
} as const

/**
 * A gentle exponential curve: early levels arrive quickly to establish the
 * habit, later ones stretch out so level 20 still means something.
 */
export function levelFromXp(xp: number): {
  level: number
  into: number
  span: number
  nextAt: number
} {
  let level = 1
  let need = 100
  let acc = 0
  while (xp >= acc + need) {
    acc += need
    level += 1
    need = Math.round(need * 1.18)
  }
  return { level, into: xp - acc, span: need, nextAt: acc + need }
}

export const LEVEL_TITLES = [
  'Curious',
  'Account Opened',
  'Subnet Wrangler',
  'Route Table Reader',
  'Policy Debugger',
  'Multi-AZ Thinker',
  'Decoupler',
  'Cost Hawk',
  'Failure Domain Mapper',
  'Scenario Reader',
  'Architect in Training',
  'Exam Ready',
] as const

export function levelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)] ?? 'Architect'
}

export interface StreakUpdate {
  profile: Profile
  /** What to tell the user, if anything worth saying happened. */
  event: 'continued' | 'started' | 'broken' | 'frozen' | 'same-day'
  freezeUsed: boolean
  /** Awarded when the streak crosses a milestone. */
  freezeEarned: boolean
}

/**
 * Streaks use loss aversion, which works — and which is exactly why they need a
 * safety valve. One missed day spends a freeze rather than destroying weeks of
 * work, because a streak that punishes a single bad day trains people to quit.
 */
export function touchStreak(profile: Profile, now = new Date()): StreakUpdate {
  const day = today(now)
  if (profile.lastActiveDay === day) {
    return { profile, event: 'same-day', freezeUsed: false, freezeEarned: false }
  }

  if (!profile.lastActiveDay) {
    const next = {
      ...profile,
      streak: 1,
      bestStreak: Math.max(1, profile.bestStreak),
      lastActiveDay: day,
    }
    return { profile: next, event: 'started', freezeUsed: false, freezeEarned: false }
  }

  const gap = daysBetween(profile.lastActiveDay, day)

  if (gap === 1) {
    const streak = profile.streak + 1
    // Every seven days of consistency earns a freeze, capped so it cannot be
    // hoarded into meaninglessness.
    const earned = streak % 7 === 0 && profile.freezes < 3
    return {
      profile: {
        ...profile,
        streak,
        bestStreak: Math.max(streak, profile.bestStreak),
        freezes: earned ? profile.freezes + 1 : profile.freezes,
        lastActiveDay: day,
      },
      event: 'continued',
      freezeUsed: false,
      freezeEarned: earned,
    }
  }

  // One missed day, and a freeze available: spend it and keep the streak.
  if (gap === 2 && profile.freezes > 0) {
    const streak = profile.streak + 1
    return {
      profile: {
        ...profile,
        streak,
        bestStreak: Math.max(streak, profile.bestStreak),
        freezes: profile.freezes - 1,
        lastActiveDay: day,
      },
      event: 'frozen',
      freezeUsed: true,
      freezeEarned: false,
    }
  }

  return {
    profile: { ...profile, streak: 1, lastActiveDay: day },
    event: 'broken',
    freezeUsed: false,
    freezeEarned: false,
  }
}

/**
 * A combo multiplier during a quiz or drill. Capped at 2x and reset by any
 * wrong answer, so it rewards a run of genuine recall rather than volume.
 */
export function comboMultiplier(streakInSession: number): number {
  if (streakInSession < 3) return 1
  return Math.min(2, 1 + (streakInSession - 2) * 0.1)
}

export interface AchievementDef {
  id: string
  title: string
  description: string
  /** Shown before unlocking, so achievements double as a to-do list. */
  hint: string
  icon: string
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-blood',
    title: 'First Answer',
    description: 'Answered your first exam-format question.',
    hint: 'Answer one question.',
    icon: '🎯',
  },
  {
    id: 'budget-alarm',
    title: 'Budget Alarm',
    description: 'Read every idle-cost warning before touching a real account.',
    hint: 'Review the teardown checklist.',
    icon: '💸',
  },
  {
    id: 'week-one',
    title: 'Seven Days',
    description: 'A seven-day streak. The habit is forming.',
    hint: 'Study seven days in a row.',
    icon: '🔥',
  },
  {
    id: 'month-one',
    title: 'Thirty Days',
    description: 'A thirty-day streak. This is how people actually pass.',
    hint: 'Study thirty days in a row.',
    icon: '🏔️',
  },
  {
    id: 'policy-master',
    title: 'Explicit Deny',
    description: 'Solved every IAM policy puzzle.',
    hint: 'Complete the IAM lab.',
    icon: '🔒',
  },
  {
    id: 'packet-whisperer',
    title: 'Packet Whisperer',
    description: 'Diagnosed every break-it challenge in the VPC lab.',
    hint: 'Break the VPC seven ways and predict each symptom.',
    icon: '📡',
  },
  {
    id: 'trigger-happy',
    title: 'Keyword Decoder',
    description: 'Drilled all the exam trigger phrases to mastery.',
    hint: 'Reach mastery on the keyword decoder.',
    icon: '🔑',
  },
  {
    id: 'first-exam',
    title: 'Full Paper',
    description: 'Sat a complete full-length timed exam.',
    hint: 'Complete a full exam simulation.',
    icon: '📝',
  },
  {
    id: 'passing-grade',
    title: 'Above the Line',
    description: 'Scored at or above the pass mark on a full paper.',
    hint: 'Pass a full exam simulation.',
    icon: '✅',
  },
  {
    id: 'eighty-club',
    title: 'Eighty Club',
    description: 'Scored 80%+ on a paper you had never seen. This is the signal to book.',
    hint: 'Score 80% on a fresh paper.',
    icon: '🎓',
  },
  {
    id: 'honest-review',
    title: 'Honest Reviewer',
    description: 'Logged twenty mistakes in your own words.',
    hint: 'Write up twenty mistakes.',
    icon: '📓',
  },
  {
    id: 'clean-log',
    title: 'Clean Log',
    description: 'Resolved every entry in your mistake log.',
    hint: 'Clear the mistake log.',
    icon: '🧹',
  },
  {
    id: 'tier-one',
    title: 'Core Fifty',
    description: 'Reached three rings or better on every core service.',
    hint: 'Master all tier-1 services.',
    icon: '⭐',
  },
  {
    id: 'the-whole-map',
    title: 'Cartographer',
    description: 'Visited every service card at least once.',
    hint: 'Open every service in the atlas.',
    icon: '🗺️',
  },
]

export const achievementById = new Map(ACHIEVEMENTS.map((a) => [a.id, a]))
