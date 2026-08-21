'use client'
import { useState } from 'react'
import type { StoryChapter } from '@/content'
import { awardXp } from '@/db/repo'
import { XP } from '@/engines/gamify/rules'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'

/**
 * The recall checks that close a chapter. Low-stakes and not exam-format — the
 * point is to force the chapter's one idea out of memory before moving on, which
 * is the only part of reading that leaves a trace.
 *
 * These award XP but do not record an `Attempt`: an attempt row is exam-shaped
 * evidence tied to a task statement, and inflating the accuracy stream with
 * three-option comprehension checks would make readiness read higher than the
 * learner's actual standing. The chapter's "you decide" pick is the piece that
 * earns its place in mastery.
 */
export function ChapterChecks({ chapter }: { chapter: StoryChapter }) {
  const [picked, setPicked] = useState<Record<string, number>>({})

  const choose = async (checkId: string, i: number, correct: boolean) => {
    if (picked[checkId] !== undefined) return
    setPicked((p) => ({ ...p, [checkId]: i }))
    if (correct) await awardXp(XP.checkCorrect)
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Badge tone="ok">Before you move on</Badge>
        <span className="text-[12px] text-fg-subtle">
          {chapter.checks.length} quick {chapter.checks.length === 1 ? 'check' : 'checks'}
        </span>
      </div>

      {chapter.checks.map((check) => {
        const pick = picked[check.id]
        const revealed = pick !== undefined
        return (
          <div key={check.id} className="surface p-4">
            <p className="text-[14.5px] font-medium leading-relaxed">{check.prompt}</p>
            <ul className="mt-3 flex flex-col gap-2">
              {check.options.map((o, i) => {
                const isPick = pick === i
                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => void choose(check.id, i, o.correct)}
                      disabled={revealed}
                      className={cn(
                        'w-full rounded-lg border p-2.5 text-left transition-colors',
                        !revealed &&
                          'border-border bg-bg-inset hover:border-border-strong hover:bg-bg-overlay',
                        revealed && o.correct && 'border-ok/40 bg-ok-soft',
                        revealed && !o.correct && isPick && 'border-bad/40 bg-bad-soft',
                        revealed && !o.correct && !isPick && 'border-border bg-bg-inset',
                      )}
                    >
                      <span className="text-[13.5px]">{o.text}</span>
                      {revealed ? (
                        <span className="mt-1 block text-[13px] leading-relaxed text-fg-muted">
                          {o.why}
                        </span>
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </section>
  )
}
