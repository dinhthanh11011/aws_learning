'use client'
import { useEffect, useState } from 'react'
import type { DiagramSpec } from '@/content'
import { clampStep, traceAt } from '@/engines/lesson/trace'
import { Diagram } from '@/components/diagram/Diagram'
import { Button } from '@/components/ui/Button'
import { formatMd } from '@/lib/md'
import { cn } from '@/lib/cn'

/**
 * A `DiagramSpec` that declares `steps` becomes this: the architecture stands
 * still and you push a packet through it one hop at a time.
 *
 * It earns its place on exactly one lesson idea — statefulness. Prose can only
 * assert that the response is allowed back; a step you advance yourself, onto an
 * edge you were never asked to write a rule for, is the version people believe.
 *
 * The step list is rendered as well as the current step, because "three hops,
 * I am on the second" is what stops a walkthrough feeling like a slideshow you
 * have lost your place in.
 */

const TONE_TEXT: Record<string, string> = {
  default: 'text-fg-muted',
  ok: 'text-ok',
  bad: 'text-bad',
  warn: 'text-warn',
  info: 'text-info',
}

export function Walkthrough({ spec, className }: { spec: DiagramSpec; className?: string }) {
  const [i, setI] = useState(0)
  const at = clampStep(spec, i)
  const step = spec.steps[at]
  const last = spec.steps.length - 1

  // Arrow keys, because a walkthrough is several presses and reaching for the
  // mouse between hops breaks the one thing it is trying to show.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // A quick-look panel is open over the lesson: stepping the diagram behind
      // it would move something the reader cannot see.
      if (document.querySelector('[role="dialog"]')) return
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        setI((v) => Math.min(v + 1, last))
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setI((v) => Math.max(v - 1, 0))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [last])

  if (!step) return <Diagram spec={spec} className={className} />

  return (
    <section className={cn('surface p-4', className)}>
      {spec.title ? <p className="mb-2 text-[14px] font-semibold">{spec.title}</p> : null}

      <Diagram spec={spec} show={traceAt(spec, at)} caption="" />

      <div className="mt-3 border-t border-border pt-3">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="nums text-[12px] font-semibold text-fg-subtle">
            Step {at + 1} of {spec.steps.length}
          </span>
          <p className={cn('text-[14.5px] font-medium', TONE_TEXT[step.tone] ?? TONE_TEXT.default)}>
            {formatMd(step.title)}
          </p>
        </div>
        {step.detail ? (
          <p className="mt-1 text-[13.5px] leading-relaxed text-fg-muted">
            {formatMd(step.detail)}
          </p>
        ) : null}

        <div className="mt-3 flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setI(at - 1)} disabled={at === 0}>
            Back
          </Button>
          <Button
            size="sm"
            variant={at === last ? 'ghost' : 'primary'}
            onClick={() => setI(at + 1)}
            disabled={at === last}
          >
            Next hop
          </Button>
          {/* Dots rather than a bar: the count is small and clickable is useful.
              The button is 24 px because that is the minimum touch target; the
              dot inside it is small because that is what reads as a dot. */}
          <div className="flex">
            {spec.steps.map((s, n) => (
              <button
                key={n}
                type="button"
                onClick={() => setI(n)}
                aria-label={`Step ${n + 1}: ${s.title}`}
                aria-current={n === at}
                className="grid h-6 w-6 place-items-center"
              >
                <span
                  className={cn(
                    'h-2.5 w-2.5 rounded-full border transition-colors',
                    n === at ? 'border-accent bg-accent' : 'border-border-strong bg-bg-inset',
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {spec.caption ? <p className="mt-3 text-[12px] text-fg-subtle">{spec.caption}</p> : null}
    </section>
  )
}
