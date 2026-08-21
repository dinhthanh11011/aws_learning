import type { Question } from '@/content/schema'

/**
 * Every option list in the corpus is authored with the correct answer first —
 * it reads better in the source file and it makes review diffs legible. Left
 * unshuffled that is a fatal tell: the learner stops reading the distractors
 * and drills "pick A" instead of the actual discrimination. So order is a
 * presentation concern, decided here.
 *
 * The permutation is seeded rather than random because the same question is
 * rendered again after a reload and again on the review screen, from answers
 * persisted as option ids. A fresh `Math.random()` on each render would move
 * the letters under a stored answer and make a correct pick look wrong.
 *
 * Option `id`s are deliberately *not* relabelled. They are the key stored in
 * `Attempt.chosen`, so keeping them means an answer recorded months ago still
 * names the option the content file names. The displayed letter comes from the
 * position instead — see `QuestionCard`.
 */

/** FNV-1a. Small, fast and stable across runs — the last two matter here. */
export function hashSeed(...parts: string[]): number {
  let h = 0x811c9dc5
  for (const part of parts) {
    for (let i = 0; i < part.length; i++) {
      h ^= part.charCodeAt(i)
      h = Math.imul(h, 0x01000193)
    }
    h ^= 0x2f // separator, so ['ab','c'] and ['a','bc'] do not collide
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** mulberry32 — one uint32 of state, uniform enough for a Fisher-Yates. */
export function rngFor(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Unbiased Fisher-Yates. `Array.sort(() => Math.random() - 0.5)` is not. */
export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function seededShuffle<T>(items: readonly T[], ...seed: string[]): T[] {
  return shuffle(items, rngFor(hashSeed(...seed)))
}

/**
 * Returns the question with its options permuted. Seed with something that
 * identifies the sitting — an exam session id, a quiz run id — so the same
 * question shows a different order next time it comes round, but the same
 * order for as long as this attempt is live.
 */
export function shuffleQuestionOptions(question: Question, ...seed: string[]): Question {
  return { ...question, options: seededShuffle(question.options, question.id, ...seed) }
}
