'use client'
import Link from 'next/link'
import { phasesFor, type StepKind } from '@/content'
import { useProfile } from '@/hooks/useProfile'
import { useDoneSteps } from '@/hooks/useSteps'
import { guidedProgress, nextStep } from '@/engines/plan/steps'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'

/**
 * The single most useful thing on the screen: the one step to do next, named,
 * with its reading list one click away. Everything else on the roadmap is
 * context; this is the instruction.
 *
 * It follows the plain rule — first unticked step in phase order — rather than
 * anything cleverer, because a "next step" a learner cannot predict is one they
 * stop trusting.
 */

const KIND_TONE: Record<StepKind, 'info' | 'accent' | 'warn' | 'ok'> = {
  read: 'info',
  build: 'accent',
  break: 'warn',
  drill: 'accent',
  quiz: 'ok',
  recall: 'ok',
}

export function NextStepCard({ compact = false }: { compact?: boolean }) {
  const profile = useProfile()
  const done = useDoneSteps()
  const phases = phasesFor(profile.targetCert)
  const next = nextStep(phases, done)
  const progress = guidedProgress(phases, done)

  if (!next) {
    return (
      <section className="surface p-5">
        <h2 className="text-[15px] font-semibold tracking-tight">Every step is ticked</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">
          The guided path is finished, which is not the same as being ready. From here the honest
          measure is a full paper you have never seen — take one, and let the mistake log decide
          what to revisit.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Link
            href="/exam"
            className="rounded-lg border border-border bg-bg-raised px-2.5 py-1 text-[12.5px] font-medium hover:border-accent"
          >
            Exam simulator →
          </Link>
          <Link
            href="/progress"
            className="rounded-lg border border-border bg-bg-raised px-2.5 py-1 text-[12.5px] font-medium hover:border-accent"
          >
            Progress →
          </Link>
        </div>
      </section>
    )
  }

  const href = `/map?phase=${next.phaseId}&step=${next.step.id}`

  return (
    <section className="surface p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
          What to do next
        </p>
        <p className="nums text-[11.5px] text-fg-subtle">
          {next.overallDone} of {next.overallTotal} steps · phase {next.phaseTitle.toLowerCase()},
          step {next.position} of {next.ofPhase}
        </p>
      </div>

      <h2 className="mt-1.5 text-[17px] font-semibold tracking-tight">{next.step.title}</h2>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <Badge tone={KIND_TONE[next.step.kind]}>{next.step.kind}</Badge>
        <Badge tone="neutral">{next.step.minutes} min</Badge>
        {next.step.reading.length ? (
          <Badge tone="neutral">
            {next.step.reading.length} {next.step.reading.length === 1 ? 'page' : 'pages'} to read
          </Badge>
        ) : null}
      </div>

      <p className="mt-2.5 text-[13px] leading-relaxed text-fg-muted">{next.step.why}</p>

      {!compact ? (
        <p className="mt-2 text-[12.5px] leading-relaxed text-fg-subtle">
          <span className="font-medium text-fg-muted">Done when: </span>
          {next.step.doneWhen}
        </p>
      ) : null}

      <Progress value={progress} className="mt-3.5" height={5} tone="accent" />

      <Link
        href={href}
        className="mt-3.5 inline-flex h-9 items-center rounded-lg bg-accent px-3.5 text-[13px] font-medium text-accent-fg transition-all hover:brightness-110"
      >
        Open this step →
      </Link>
    </section>
  )
}
