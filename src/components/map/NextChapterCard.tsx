'use client'
import Link from 'next/link'
import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { storiesFor } from '@/content'
import { useProfile } from '@/hooks/useProfile'
import { allStoryChapters } from '@/db/repo'
import { nextChapter, storyProgress } from '@/engines/story/cumulative'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'

/**
 * "Carry on with the story" — the sibling of `NextStepCard`, kept separate
 * rather than folded into it. A card that sometimes means a study step and
 * sometimes means a story chapter is a card the learner has to read before they
 * can act on it, and the point of both is to be actionable at a glance.
 *
 * Renders nothing once the storyline is finished, rather than congratulating
 * anybody: an empty slot is honest and a permanent trophy is clutter.
 */
export function NextChapterCard({ compact = false }: { compact?: boolean }) {
  const profile = useProfile()
  const rows = useLiveQuery(() => allStoryChapters(), [], undefined)
  const read = useMemo(() => new Set((rows ?? []).map((r) => r.chapterId)), [rows])

  const story = storiesFor(profile.targetCert)[0]
  if (!story) return null

  const next = nextChapter(story, read)
  if (!next) return null

  const progress = storyProgress(story, read)

  return (
    <section className="surface p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="accent">Story</Badge>
        <span className="nums text-[12px] text-fg-subtle">
          chapter {next.position} of {next.of}
        </span>
      </div>

      <h2 className="mt-2 text-[15px] font-semibold tracking-tight">{next.chapter.title}</h2>
      {/* The pain, not the title, is what makes someone want to read on. */}
      <p className="mt-1 line-clamp-3 text-[13px] leading-relaxed text-fg-muted">
        {next.chapter.pain}
      </p>

      {compact ? null : (
        <div className="mt-3">
          <Progress value={progress.done / progress.total} />
          <p className="nums mt-1 text-[12px] text-fg-subtle">
            {progress.done}/{progress.total} chapters · {next.chapter.minutes} min next
          </p>
        </div>
      )}

      <Link
        href={`/story/${story.slug}?chapter=${next.position}`}
        className="mt-3 inline-flex text-[13px] font-medium text-accent underline decoration-dotted underline-offset-2"
      >
        Read chapter {next.position} →
      </Link>
    </section>
  )
}
