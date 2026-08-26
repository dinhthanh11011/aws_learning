'use client'
import { useMemo, useState } from 'react'
import type { Check } from '@/content'
import { awardXp } from '@/db/repo'
import { XP } from '@/engines/gamify/rules'
import { seededShuffle } from '@/engines/exam/shuffle'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'

/**
 * The recall checks that close a lesson — the only part of the page that is
 * retrieval, and therefore the only part that awards anything. Reading the
 * lesson awards nothing, for the same reason ticking a study step and reading a
 * story chapter award nothing: reading is not evidence.
 *
 * They award XP but record no `Attempt`. An attempt is exam-shaped evidence tied
 * to a task statement, and feeding three-option comprehension checks into the
 * accuracy stream would make readiness read higher than the learner's actual
 * standing.
 */
export function LessonChecks({ lessonId, checks }: { lessonId: string; checks: Check[] }) {
  const [picked, setPicked] = useState<Record<string, number>>({})

  // Checks are authored correct-first, and three options with the answer always
  // at the top is a check of nothing. Seeded, so the order holds while the page
  // is open.
  const shuffled = useMemo(
    () =>
      checks.map((check) => ({
        ...check,
        options: seededShuffle(check.options, lessonId, check.id),
      })),
    [checks, lessonId],
  )

  const choose = async (checkId: string, i: number, correct: boolean) => {
    if (picked[checkId] !== undefined) return
    setPicked((p) => ({ ...p, [checkId]: i }))
    if (correct) await awardXp(XP.checkCorrect)
  }

  const answered = Object.keys(picked).length

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="ok">Before you move on</Badge>
        <span className="nums text-[12px] text-fg-subtle">
          {answered} of {checks.length} answered
        </span>
      </div>

      {shuffled.map((check) => {
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

      <p className="text-[12px] leading-relaxed text-fg-subtle">
        These award XP but are deliberately not recorded as exam attempts — they are three-option
        comprehension checks, and counting them would make your readiness score read higher than it
        is. The quiz and the exam simulator are what move it.
      </p>
    </section>
  )
}
