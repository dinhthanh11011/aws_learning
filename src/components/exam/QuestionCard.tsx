'use client'
import { useEffect } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { type Question } from '@/content'
import { Badge } from '@/components/ui/Badge'
import { ServiceRef } from '@/components/service/ServiceRef'
import { useServicePeekKey } from '@/hooks/useServicePeekKey'
import { cn } from '@/lib/cn'

/**
 * One exam-format question. Used by the simulator, the domain quizzes and the
 * review screen, so the interaction is identical everywhere — including the
 * keyboard path, which matters when you are drilling for an hour.
 */
export function QuestionCard({
  question,
  chosen,
  onChoose,
  revealed,
  index,
  total,
  flagged,
  onFlag,
}: {
  question: Question
  chosen: string[]
  onChoose: (ids: string[]) => void
  /** Show correctness and explanations. Off during a live exam. */
  revealed: boolean
  index?: number
  total?: number
  flagged?: boolean
  onFlag?: () => void
}) {
  const reduce = useReducedMotion()
  // Once the answer is revealed, "s" walks the services this question turns on.
  useServicePeekKey(question.serviceSlugs, revealed)
  const multi = question.type === 'multi'
  const correctCount = question.options.filter((o) => o.correct).length

  const toggle = (id: string) => {
    if (revealed) return
    if (multi) {
      onChoose(chosen.includes(id) ? chosen.filter((c) => c !== id) : [...chosen, id])
    } else {
      onChoose(chosen.includes(id) ? [] : [id])
    }
  }

  // Number keys pick options, F flags. Typing in a field must not trigger these.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // The quick-look panel and the palette sit over the question; picking an
      // option by number behind an open dialog is never what was meant.
      if (document.querySelector('[role="dialog"]')) return
      const el = document.activeElement
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el as HTMLElement | null)?.isContentEditable
      ) {
        return
      }
      const n = Number(e.key)
      if (n >= 1 && n <= question.options.length) {
        e.preventDefault()
        toggle(question.options[n - 1].id)
      }
      if (e.key.toLowerCase() === 'f' && onFlag) {
        e.preventDefault()
        onFlag()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {index !== undefined && total !== undefined ? (
          <span className="nums text-[12px] font-medium text-fg-subtle">
            Question {index + 1} of {total}
          </span>
        ) : null}
        <Badge tone={multi ? 'info' : 'neutral'}>
          {multi ? `Choose ${correctCount}` : 'Choose 1'}
        </Badge>
        <Badge tone={question.difficulty === 3 ? 'bad' : question.difficulty === 2 ? 'warn' : 'ok'}>
          {question.difficulty === 3 ? 'Hard' : question.difficulty === 2 ? 'Medium' : 'Easier'}
        </Badge>
        {onFlag ? (
          <button
            onClick={onFlag}
            aria-pressed={flagged}
            className={cn(
              'ml-auto rounded-lg border px-2.5 py-1 text-[12px] transition-colors',
              flagged
                ? 'border-warn/40 bg-warn-soft text-warn'
                : 'border-border text-fg-subtle hover:text-fg',
            )}
            title="Flag for review (F)"
          >
            ⚑ {flagged ? 'Flagged' : 'Flag'}
          </button>
        ) : null}
      </div>

      <p className="text-[15.5px] leading-relaxed">{question.stem}</p>

      <ul className="flex flex-col gap-2">
        {question.options.map((o, i) => {
          const picked = chosen.includes(o.id)
          const showRight = revealed && o.correct
          const showWrong = revealed && picked && !o.correct

          return (
            <li key={o.id}>
              <button
                onClick={() => toggle(o.id)}
                disabled={revealed}
                aria-pressed={picked}
                className={cn(
                  'flex w-full gap-3 rounded-xl border p-3 text-left transition-all duration-150',
                  revealed ? 'cursor-default' : 'hover:border-border-strong hover:bg-bg-overlay',
                  showRight
                    ? 'border-ok/50 bg-ok-soft'
                    : showWrong
                      ? 'border-bad/50 bg-bad-soft'
                      : picked
                        ? 'border-accent/50 bg-accent-soft'
                        : 'border-border bg-bg-raised',
                )}
              >
                <span
                  className={cn(
                    'nums mt-px grid h-5 w-5 shrink-0 place-items-center text-[11px] font-bold',
                    multi ? 'rounded-[5px]' : 'rounded-full',
                    showRight
                      ? 'bg-ok text-bg'
                      : showWrong
                        ? 'bg-bad text-bg'
                        : picked
                          ? 'bg-accent text-accent-fg'
                          : 'border border-border-strong text-fg-subtle',
                  )}
                  aria-hidden
                >
                  {showRight ? '✓' : showWrong ? '✗' : o.id}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] leading-snug">{o.text}</span>
                  {revealed ? (
                    <motion.span
                      initial={reduce ? undefined : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className={cn(
                        'mt-1.5 block text-[13px] leading-relaxed',
                        o.correct ? 'text-ok' : 'text-fg-muted',
                      )}
                    >
                      {o.why}
                    </motion.span>
                  ) : null}
                </span>
                {!revealed ? (
                  <kbd className="mt-px hidden shrink-0 rounded border border-border px-1 text-[10px] text-fg-subtle sm:block">
                    {i + 1}
                  </kbd>
                ) : null}
              </button>
            </li>
          )
        })}
      </ul>

      {revealed ? (
        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface border-accent/25 p-4"
        >
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-accent">
            The rule to remember
          </p>
          <p className="text-[14px] leading-relaxed">{question.explanation}</p>
          {question.serviceSlugs.length ? (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
              <span className="mr-1 text-[11px] text-fg-subtle">Revise:</span>
              {question.serviceSlugs.map((slug) => (
                <ServiceRef key={slug} slug={slug} />
              ))}
              <span className="ml-auto text-[11px] text-fg-subtle">
                or press <kbd className="rounded border border-border px-1">s</kbd> — the card
                opens over this one
              </span>
            </div>
          ) : null}
          {question.source ? (
            <a
              href={question.source}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-[11.5px] text-fg-subtle underline decoration-dotted hover:text-fg"
            >
              AWS documentation ↗
            </a>
          ) : null}
        </motion.div>
      ) : null}
    </div>
  )
}
