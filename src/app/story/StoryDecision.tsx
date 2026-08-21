'use client'
import { useState } from 'react'
import type { StoryChapter } from '@/content'
import { conceptBySlug, domains as allDomains, serviceBySlug } from '@/content'
import { useProfile } from '@/hooks/useProfile'
import { awardXp, recordAttempt } from '@/db/repo'
import { XP } from '@/engines/gamify/rules'
import { ConceptRef } from '@/components/service/ConceptRef'
import { ServiceRef } from '@/components/service/ServiceRef'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'

/**
 * The pick that opens every chapter. It sits *above* the prose deliberately:
 * choosing before you read is retrieval, and reading before you choose is
 * recognition dressed up as learning.
 *
 * A wrong pick is not softened and not punished. The correct option is revealed,
 * the learner's own pick stays on screen with the reason it is wrong, and the
 * chapter is readable either way — the ordering is the teaching, not a gate.
 *
 * It records a real `Attempt` against the chapter's task statement, so the pick
 * feeds the same accuracy stream as a quiz answer and moves the domain ring.
 */
export function StoryDecision({ chapter }: { chapter: StoryChapter }) {
  const profile = useProfile()
  const [picked, setPicked] = useState<string | null>(null)

  const revealed = picked !== null
  const correct = chapter.decision.options.find((o) => o.correct)!

  const choose = async (slug: string) => {
    if (revealed || !profile) return
    setPicked(slug)
    const ok = slug === correct.slug

    const domainId = allDomains.find((d) => d.tasks.some((t) => t.id === chapter.taskId))?.id ?? ''
    await recordAttempt({
      // Prefixed so it can never collide with a real question id, which matters
      // because `seenQuestionIds()` reads every attempt row.
      questionId: `story:${chapter.id}:decide`,
      certId: profile.targetCert,
      taskId: chapter.taskId,
      domainId,
      serviceSlugs: chapter.serviceSlugs,
      chosen: [slug],
      correct: ok,
      ms: 0,
      source: 'story',
    })
    await awardXp(ok ? XP.storyDecideCorrect : XP.storyDecideWrongButReviewed)
  }

  return (
    <section className="surface border-accent/25 p-4">
      <div className="mb-2 flex items-center gap-2">
        <Badge tone="accent">You decide</Badge>
        <span className="text-[12px] text-fg-subtle">Choose before you read on</span>
      </div>

      <p className="text-[14.5px] leading-relaxed">{chapter.decision.situation}</p>
      <p className="mt-2 text-[14.5px] font-medium">{chapter.decision.prompt}</p>

      <ul className="mt-3 flex flex-col gap-2">
        {chapter.decision.options.map((o) => {
          const isPick = picked === o.slug
          const label = serviceBySlug.get(o.slug)?.name ?? conceptBySlug.get(o.slug)?.term ?? o.slug
          return (
            <li key={o.slug}>
              <button
                type="button"
                onClick={() => void choose(o.slug)}
                disabled={revealed}
                aria-pressed={isPick}
                className={cn(
                  'w-full rounded-lg border p-3 text-left transition-colors',
                  !revealed &&
                    'border-border bg-bg-inset hover:border-border-strong hover:bg-bg-overlay',
                  revealed && o.correct && 'border-ok/40 bg-ok-soft',
                  revealed && !o.correct && isPick && 'border-bad/40 bg-bad-soft',
                  revealed && !o.correct && !isPick && 'border-border bg-bg-inset',
                )}
              >
                <span className="flex flex-wrap items-baseline gap-2">
                  <span className="text-[14px] font-medium">{label}</span>
                  {revealed && o.correct ? <Badge tone="ok">the answer</Badge> : null}
                  {revealed && isPick && !o.correct ? <Badge tone="bad">your pick</Badge> : null}
                </span>
                {revealed ? (
                  <span className="mt-1.5 block text-[13.5px] leading-relaxed text-fg-muted">
                    {o.why}
                  </span>
                ) : null}
              </button>
            </li>
          )
        })}
      </ul>

      {revealed ? (
        <p className="mt-3 text-[13px] text-fg-subtle">
          Open the card for{' '}
          {serviceBySlug.has(correct.slug) ? (
            <ServiceRef slug={correct.slug} bare />
          ) : (
            <ConceptRef slug={correct.slug} bare />
          )}{' '}
          without leaving the chapter.
        </p>
      ) : null}
    </section>
  )
}
