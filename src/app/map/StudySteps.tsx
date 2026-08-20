'use client'
import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import type { Phase, StepKind, StudyStep } from '@/content'
import { setStepDone } from '@/db/repo'
import { ServiceRef } from '@/components/service/ServiceRef'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { IconCheck, IconExternal } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'

/**
 * The ordered work inside a phase — the answer to "I opened the roadmap and I
 * still do not know what to do first".
 *
 * One step is expanded at a time, and it defaults to the first unticked one, so
 * opening a phase puts the next thing to do on screen without a click. Which one
 * is expanded is owned by `?step=` on the roadmap, not by state here, so leaving
 * for the lab a step points at and coming back reopens the same step. Ticking a
 * step is a plain checkbox and awards nothing: the lab, quiz or drill it points
 * at awards its own XP when the work actually happens, and a checkbox that paid
 * out would be paying for a claim rather than for evidence.
 */

const KIND: Record<StepKind, { label: string; tone: 'info' | 'accent' | 'warn' | 'ok' }> = {
  read: { label: 'read', tone: 'info' },
  build: { label: 'build', tone: 'accent' },
  break: { label: 'break it', tone: 'warn' },
  drill: { label: 'drill', tone: 'accent' },
  quiz: { label: 'check', tone: 'ok' },
  recall: { label: 'recall', tone: 'ok' },
}

/** Matches the roadmap's sentinel: `none` is "closed", not "unset". */
const COLLAPSED = 'none'

const hours = (minutes: number) =>
  minutes >= 60 ? `${Math.round((minutes / 60) * 10) / 10} h` : `${minutes} min`

export function StudySteps({
  phase,
  done,
  openStep,
  onOpenStep,
}: {
  phase: Phase
  done: Set<string>
  /**
   * The expanded step, from `?step=` — which is also how the "what to do next"
   * card links straight at one. It comes in as a prop rather than being read
   * from the hash inside an effect, because the list renders after the browser
   * has already given up on scrolling to a fragment. `none` means the learner
   * closed the step they had open, which is why it is not the same as absent.
   */
  openStep?: string | null
  onOpenStep: (id: string | null) => void
}) {
  const firstOpen = phase.steps.find((s) => !done.has(s.id))?.id ?? null
  const named = openStep && phase.steps.some((s) => s.id === openStep) ? openStep : null
  // An id from the other phase, or a step this phase no longer has, falls back
  // to the default rather than opening nothing.
  const expanded = openStep === COLLAPSED ? null : (named ?? firstOpen)

  // Only the step we arrived with is scrolled to; toggling one open afterwards
  // must not yank the page, and the param now changes on every toggle.
  const arrivedAt = useRef(named)

  // Deliberately delayed: the phase panel above this list animates its height
  // from 0 to auto, so an immediate scroll aims at a target that then moves several
  // hundred pixels down. One scroll after the expand settles beats several during it.
  useEffect(() => {
    const id = arrivedAt.current
    if (!id) return
    const t = setTimeout(
      () => document.getElementById(id)?.scrollIntoView({ block: 'center' }),
      400,
    )
    return () => clearTimeout(t)
  }, [])
  const guided = phase.steps.reduce((n, s) => n + s.minutes, 0)
  const doneCount = phase.steps.filter((s) => done.has(s.id)).length

  if (!phase.steps.length) return null

  return (
    <div className="mb-4">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
          Do these in order
        </p>
        {/* Guided hours are honestly less than the phase budget — the rest is
            your own building and drilling, and padding the list to match would
            be a fake plan. */}
        <p className="nums text-[11.5px] text-fg-subtle">
          {doneCount} of {phase.steps.length} done · {hours(guided)} guided of {phase.hours} h
        </p>
      </div>
      <ol className="flex flex-col gap-1.5">
        {phase.steps.map((step, i) => (
          <StepRow
            key={step.id}
            step={step}
            index={i + 1}
            done={done.has(step.id)}
            isNext={step.id === firstOpen}
            open={expanded === step.id}
            onToggleOpen={() => onOpenStep(expanded === step.id ? null : step.id)}
          />
        ))}
      </ol>
    </div>
  )
}

function StepRow({
  step,
  index,
  done,
  isNext,
  open,
  onToggleOpen,
}: {
  step: StudyStep
  index: number
  done: boolean
  isNext: boolean
  open: boolean
  onToggleOpen: () => void
}) {
  const reduce = useReducedMotion()
  const kind = KIND[step.kind]

  return (
    <li
      id={step.id}
      // A done step gets a muted surface, never reduced opacity: dimming drops
      // the text below the contrast threshold.
      className={cn(
        'rounded-xl border bg-bg-raised',
        done ? 'border-border bg-bg-inset' : 'border-border',
        isNext && !done && 'border-accent/40',
      )}
    >
      <div className="flex items-start gap-2.5 p-3">
        <button
          onClick={() => void setStepDone(step.id, !done)}
          aria-pressed={done}
          aria-label={done ? `Mark "${step.title}" as not done` : `Mark "${step.title}" as done`}
          className={cn(
            'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors',
            done
              ? 'border-ok bg-ok-soft text-ok'
              : 'border-border-strong text-transparent hover:border-accent hover:text-accent/40',
          )}
        >
          <IconCheck width={12} height={12} />
        </button>

        <button onClick={onToggleOpen} aria-expanded={open} className="min-w-0 flex-1 text-left">
          <span className="flex flex-wrap items-center gap-2">
            <span className="nums text-[11.5px] font-bold text-fg-subtle">{index}</span>
            <span
              className={cn(
                'text-[13.5px] font-medium',
                done && 'text-fg-muted line-through decoration-fg-subtle/50',
              )}
            >
              {step.title}
            </span>
            <Badge tone={kind.tone}>{kind.label}</Badge>
            <Badge tone="neutral">{hours(step.minutes)}</Badge>
            {isNext && !done ? <Badge tone="accent">start here</Badge> : null}
          </span>
          {!open ? (
            <span className="mt-0.5 line-clamp-1 text-[12px] text-fg-subtle">{step.why}</span>
          ) : null}
        </button>
        <span className="mt-0.5 shrink-0 text-[12px] text-fg-subtle" aria-hidden>
          {open ? '▾' : '▸'}
        </span>
      </div>

      {open ? (
        <motion.div
          initial={reduce ? undefined : { height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="overflow-hidden border-t border-border px-3 py-3"
        >
          <p className="text-[12.5px] leading-relaxed text-fg-muted">{step.why}</p>

          {step.reading.length ? (
            <div className="mt-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                Read in this order
              </p>
              <ol className="mt-1.5 flex flex-col gap-1">
                {step.reading.map((r, i) => (
                  <li key={r.url} className="flex items-baseline gap-2 text-[12.5px]">
                    <span className="nums w-4 shrink-0 text-fg-subtle">{i + 1}</span>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-baseline gap-1 text-accent hover:underline"
                    >
                      {r.label}
                      <IconExternal width={11} height={11} className="translate-y-px" />
                    </a>
                    <span className="nums shrink-0 text-[11.5px] text-fg-subtle">{r.minutes}m</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {step.serviceSlugs.length ? (
            <div className="mt-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                Atlas entries for this step
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {step.serviceSlugs.map((slug) => (
                  <ServiceRef key={slug} slug={slug} />
                ))}
              </div>
            </div>
          ) : null}

          {step.actions.length ? (
            <div className="mt-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                Then do it here
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {step.actions.map((a) => (
                  <Link
                    key={a.href}
                    href={a.href}
                    className="rounded-lg border border-border bg-bg-raised px-2.5 py-1 text-[12.5px] font-medium hover:border-accent"
                  >
                    {a.label} →
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-3 rounded-lg border border-ok/30 bg-ok-soft p-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
              Done when
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-fg-muted">{step.doneWhen}</p>
          </div>

          <Button
            size="sm"
            variant={done ? 'secondary' : 'primary'}
            className="mt-3"
            onClick={() => void setStepDone(step.id, !done)}
          >
            {done ? 'Mark as not done' : 'I can do this — mark it done'}
          </Button>
        </motion.div>
      ) : null}
    </li>
  )
}
