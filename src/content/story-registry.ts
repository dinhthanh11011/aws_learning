import type { CertId, Story, StoryChapter } from './schema'
import { inScope } from './cert-registry'
import { startupSaa } from './stories/startup-saa'

/**
 * Aggregates the storylines.
 *
 * Named `story-registry.ts` rather than `stories/index.ts` for the same reason
 * the service and concept registries are: a directory index that the `@/content`
 * barrel also re-exports breaks Turbopack's module graph, and the runtime error
 * points nowhere near the cause.
 *
 * Not sorted. Stories are read in the order they are listed, and there is a
 * deliberate first one.
 */
export const stories: Story[] = [startupSaa]

export const storyBySlug = new Map(stories.map((s) => [s.slug, s]))
export const story = (slug: string): Story | undefined => storyBySlug.get(slug)

export const storiesFor = (certId: CertId): Story[] => stories.filter((s) => inScope(s, certId))

/** Chapters are addressed by id across the whole corpus, so one flat index. */
export const chapterById = new Map<string, { story: Story; chapter: StoryChapter; index: number }>(
  stories.flatMap((s) => s.chapters.map((c, i) => [c.id, { story: s, chapter: c, index: i }])),
)
