import type { DiagramEdge, DiagramGroup, DiagramNode, Story, StoryChapter } from '@/content/schema'

/**
 * The story's architecture is declared once, whole, and each chapter says only
 * what it *adds*. "What is on screen at chapter N" is therefore a fold over the
 * chapters up to N — which is the whole reason the content is shaped this way.
 *
 * Fourteen separate diagrams would have been fourteen chances for a node to
 * drift two grid units sideways between chapters, and the learner would see the
 * architecture jump rather than grow. Here that is not expressible.
 *
 * Pure, and no clock: everything is a function of the story and an index.
 */

/** `new` means this chapter introduced it; `settled` means an earlier one did. */
export type AddState = 'new' | 'settled'

export interface VisibleAt {
  nodes: { node: DiagramNode; state: AddState }[]
  edges: { edge: DiagramEdge; state: AddState }[]
  groups: { group: DiagramGroup; state: AddState }[]
}

/** Clamped rather than throwing: a bad `?chapter=` should show the last one. */
export function clampIndex(story: Story, index: number): number {
  if (!Number.isFinite(index)) return 0
  return Math.max(0, Math.min(Math.trunc(index), story.chapters.length - 1))
}

export function visibleAt(story: Story, index: number): VisibleAt {
  const at = clampIndex(story, index)

  const introducedIn = <T extends { nodeIds: string[]; edgeIds: string[]; groupIds: string[] }>(
    pick: (adds: T) => string[],
  ): Map<string, number> => {
    const first = new Map<string, number>()
    story.chapters.forEach((c, i) => {
      for (const id of pick(c.adds as T)) if (!first.has(id)) first.set(id, i)
    })
    return first
  }

  const nodeAt = introducedIn((a) => a.nodeIds)
  const edgeAt = introducedIn((a) => a.edgeIds)
  const groupAt = introducedIn((a) => a.groupIds)

  const state = (i: number | undefined): AddState | null => {
    if (i === undefined || i > at) return null
    return i === at ? 'new' : 'settled'
  }

  const arch = story.architecture
  return {
    nodes: arch.nodes.flatMap((node) => {
      const s = state(nodeAt.get(node.id))
      return s ? [{ node, state: s }] : []
    }),
    edges: arch.edges.flatMap((edge) => {
      const s = state(edgeAt.get(edge.id))
      return s ? [{ edge, state: s }] : []
    }),
    groups: arch.groups.flatMap((group) => {
      const s = state(groupAt.get(group.id))
      return s ? [{ group, state: s }] : []
    }),
  }
}

export interface StoryProgress {
  done: number
  total: number
  minutes: number
  minutesDone: number
}

export function storyProgress(story: Story, done: ReadonlySet<string>): StoryProgress {
  let d = 0
  let minutesDone = 0
  for (const c of story.chapters) {
    if (done.has(c.id)) {
      d += 1
      minutesDone += c.minutes
    }
  }
  return {
    done: d,
    total: story.chapters.length,
    minutes: story.chapters.reduce((n, c) => n + c.minutes, 0),
    minutesDone,
  }
}

export interface NextChapter {
  chapter: StoryChapter
  /** 1-based, which is how the UI numbers it. */
  position: number
  of: number
}

/**
 * The first unread chapter. Same rule as `nextStep` on the roadmap: strictly in
 * order, no skipping ahead and no locking — a story read out of order is the
 * learner's business, and pretending there is nothing to do would be a lie.
 */
export function nextChapter(story: Story, done: ReadonlySet<string>): NextChapter | null {
  for (const [i, chapter] of story.chapters.entries()) {
    if (done.has(chapter.id)) continue
    return { chapter, position: i + 1, of: story.chapters.length }
  }
  return null
}
