'use client'
import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion, useReducedMotion } from 'motion/react'
import type { Story } from '@/content'
import { conceptBySlug, serviceBySlug } from '@/content'
import { allStoryChapters, setChapterRead } from '@/db/repo'
import { clampIndex, storyProgress, visibleAt } from '@/engines/story/cumulative'
import { Diagram } from '@/components/diagram/Diagram'
import { ConceptRef } from '@/components/service/ConceptRef'
import { ServiceRef } from '@/components/service/ServiceRef'
import { Sections } from '@/components/lesson/Sections'
import { StoryDecision } from './StoryDecision'
import { ChapterChecks } from './ChapterChecks'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { IconCheck } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'

/**
 * The story reader: prose on the left, the growing architecture on the right.
 *
 * The diagram is sticky and the prose scrolls, because the whole point of the
 * cumulative shape is that you can see what you have built while reading about
 * the next thing. On a narrow screen it moves above the prose in a bounded box
 * instead — a full-height diagram on a phone would push the reading off screen.
 *
 * Which chapter is open lives in `?chapter=`, not in state, so a deep link works
 * and so does leaving for a service page and coming back.
 */
export function StoryReader({ story }: { story: Story }) {
  const router = useRouter()
  const params = useSearchParams()
  const reduce = useReducedMotion()
  const [showAll, setShowAll] = useState(false)

  const raw = Number(params.get('chapter') ?? '1') - 1
  const index = clampIndex(story, raw)
  const chapter = story.chapters[index]

  const rows = useLiveQuery(() => allStoryChapters(), [], undefined)
  const read = useMemo(() => new Set((rows ?? []).map((r) => r.chapterId)), [rows])
  const progress = storyProgress(story, read)

  const show = useMemo(() => visibleAt(story, index), [story, index])

  const go = (i: number) => {
    const next = clampIndex(story, i)
    router.replace(`/story/${story.slug}?chapter=${next + 1}`, { scroll: true })
  }

  const isRead = read.has(chapter.id)

  return (
    <div className="flex flex-col gap-5">
      {/* Chapter rail. Numbered, so the shape of the arc is visible at a glance. */}
      <nav aria-label="Chapters" className="flex flex-wrap gap-1.5">
        {story.chapters.map((c, i) => {
          const active = i === index
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => go(i)}
              title={c.title}
              aria-current={active ? 'step' : undefined}
              className={cn(
                'nums flex h-7 min-w-7 items-center justify-center gap-1 rounded-md border px-1.5 text-[12px] font-semibold transition-colors',
                active
                  ? 'border-accent bg-accent-soft text-accent'
                  : read.has(c.id)
                    ? 'border-ok/30 bg-ok-soft text-ok'
                    : 'border-border bg-bg-inset text-fg-muted hover:border-border-strong',
              )}
            >
              {i + 1}
              {read.has(c.id) && !active ? <IconCheck className="h-3 w-3" /> : null}
            </button>
          )
        })}
        <span className="ml-1 self-center text-[12px] text-fg-subtle">
          {progress.done}/{progress.total} read
        </span>
      </nav>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
        {/* ── The chapter ─────────────────────────────────────────────── */}
        <article className="flex min-w-0 flex-col gap-5">
          <header className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Badge tone="accent">Chapter {index + 1}</Badge>
              <span className="text-[12px] text-fg-subtle">{chapter.minutes} min</span>
            </div>
            <h2 className="text-[22px] font-semibold leading-tight">{chapter.title}</h2>
            {/* The pain is the hook, and it is always caused by the last chapter. */}
            <p className="surface border-bad/25 p-4 text-[14.5px] leading-relaxed">
              {chapter.pain}
            </p>
          </header>

          <StoryDecision key={chapter.id} chapter={chapter} />

          <Sections sections={chapter.sections} />

          {chapter.checks.length ? (
            <ChapterChecks key={`${chapter.id}-checks`} chapter={chapter} />
          ) : null}

          {/* Referenced cards, so the atlas is one tap away without leaving. */}
          {chapter.serviceSlugs.length || chapter.conceptSlugs.length ? (
            <section className="surface p-4">
              <p className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-fg-subtle">
                The cards behind this chapter
              </p>
              <div className="flex flex-wrap gap-1.5">
                {chapter.serviceSlugs
                  .filter((s) => serviceBySlug.has(s))
                  .map((s) => (
                    <ServiceRef key={s} slug={s} />
                  ))}
                {chapter.conceptSlugs
                  .filter((s) => conceptBySlug.has(s))
                  .map((s) => (
                    <ConceptRef key={s} slug={s} />
                  ))}
              </div>
            </section>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <Button variant="ghost" onClick={() => go(index - 1)} disabled={index === 0}>
              Previous
            </Button>
            <Button
              variant={isRead ? 'ghost' : 'primary'}
              onClick={() => void setChapterRead(chapter.id, !isRead)}
            >
              {isRead ? 'Mark unread' : 'Mark read'}
            </Button>
            <Button
              onClick={() => go(index + 1)}
              disabled={index === story.chapters.length - 1}
              variant="ghost"
            >
              Next chapter
            </Button>
            {/* Honesty: a tick is a self-report and buys nothing. */}
            <span className="basis-full text-[12px] text-fg-subtle">
              Marking a chapter read awards nothing. The decision above and the checks are what
              count — they are the only part that is retrieval.
            </span>
          </div>
        </article>

        {/* ── The architecture so far ─────────────────────────────────── */}
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <div className="surface p-4">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-[13px] font-semibold uppercase tracking-wide text-fg-subtle">
                What you have built
              </p>
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="text-[12px] text-accent underline decoration-dotted underline-offset-2"
              >
                {showAll ? 'Show progress' : 'Show the finished system'}
              </button>
            </div>
            <motion.div
              key={showAll ? 'all' : index}
              initial={reduce ? undefined : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="max-h-[52vh] overflow-auto lg:max-h-none"
            >
              <Diagram spec={story.architecture} show={showAll ? undefined : show} />
            </motion.div>
            <p className="mt-3 text-[12px] leading-relaxed text-fg-subtle">
              {showAll
                ? 'Every chapter’s work at once. Switch back to see where you are.'
                : 'Solid and coloured is what this chapter added. Outlined is earlier work. Click any service to open its card.'}
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
