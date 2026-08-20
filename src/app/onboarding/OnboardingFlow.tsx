'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { certById, CERT_IDS, contentStats } from '@/content'
import { generate } from '@/engines/plan/generate'
import { updateProfile } from '@/db/repo'
import { useProfile } from '@/hooks/useProfile'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'
import type { CertId } from '@/content'

/**
 * Three questions, then a real plan. Deliberately shows the plan's verdict
 * immediately — including when the chosen date is not achievable, because
 * finding that out now is worth more than a comfortable answer.
 */
export function OnboardingFlow() {
  const profile = useProfile()
  const router = useRouter()
  const [cert, setCert] = useState<CertId>(profile.targetCert)
  const [hours, setHours] = useState(profile.weeklyHours)
  const [date, setDate] = useState(profile.examDate ?? '')

  const plan = useMemo(
    () => generate({ certId: cert, weeklyHours: hours, examDate: date || null }),
    [cert, hours, date],
  )

  const save = async () => {
    await updateProfile({
      targetCert: cert,
      weeklyHours: hours,
      examDate: date || null,
      onboarded: true,
    })
    router.push('/map')
  }

  const tone =
    plan.compression === 'none'
      ? 'ok'
      : plan.compression === 'mild'
        ? 'accent'
        : plan.compression === 'heavy'
          ? 'warn'
          : 'bad'

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <section className="surface p-5">
        <h2 className="text-[15px] font-semibold tracking-tight">1 · Which exam first?</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">
          Take SAA first even if you are a developer. It teaches the architectural vocabulary —
          Multi-AZ, decoupling, DR patterns, the shared responsibility line — that DVA assumes you
          already have. Doing it the other way round means learning Lambda cold starts before you
          understand why anything is in a private subnet.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          {CERT_IDS.map((id) => {
            const c = certById.get(id)!
            const stats = contentStats(id)
            const active = cert === id
            return (
              <button
                key={id}
                onClick={() => setCert(id)}
                aria-pressed={active}
                className={cn(
                  'flex-1 rounded-xl border p-3.5 text-left transition-colors',
                  active
                    ? 'border-accent bg-accent-soft'
                    : 'border-border hover:border-border-strong hover:bg-bg-overlay',
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold">{c.id}</span>
                  {id === 'SAA-C03' ? <Badge tone="accent">Start here</Badge> : null}
                </span>
                <span className="mt-0.5 block text-[12.5px] text-fg-muted">{c.shortTitle}</span>
                <span className="mt-2 block text-[12px] leading-snug text-fg-subtle">{c.role}</span>
                <span className="nums mt-2 block text-[11px] text-fg-subtle">
                  {stats.services} services · {stats.questions} questions
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="surface p-5">
        <h2 className="text-[15px] font-semibold tracking-tight">2 · Hours per week, honestly</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">
          The number you will actually manage in a bad week, not a good one. An over-optimistic plan
          is the one people abandon.
        </p>
        <div className="mt-4 flex items-center gap-4">
          <input
            type="range"
            min={2}
            max={20}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="flex-1 accent-[var(--accent)]"
            aria-label="Hours per week"
          />
          <span className="nums w-20 text-right text-[22px] font-semibold">
            {hours}
            <span className="text-[12px] font-normal text-fg-subtle"> h/wk</span>
          </span>
        </div>
      </section>

      <section className="surface p-5">
        <h2 className="text-[15px] font-semibold tracking-tight">3 · Exam date, if you have one</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">
          A date converts open-ended study into focused study. Leave it blank and the plan tells you
          when to book instead — but most people who wait to feel ready never book at all.
        </p>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-3 h-11 w-full rounded-lg border border-border bg-bg-inset px-3 text-[14px] outline-none focus-visible:border-accent sm:w-auto"
        />
      </section>

      <section className={cn('surface p-5', `border-${tone}/40`)}>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-[15px] font-semibold tracking-tight">Your plan</h2>
          <Badge tone={tone as 'ok' | 'accent' | 'warn' | 'bad'}>
            {plan.weeks.length} weeks · {plan.totalHours} hours
          </Badge>
        </div>
        <p className="mt-2 text-[13.5px] leading-relaxed">{plan.verdict}</p>

        <ul className="mt-4 flex flex-col gap-1.5">
          {[...new Set(plan.weeks.map((w) => w.phaseId))].map((id) => {
            const ws = plan.weeks.filter((w) => w.phaseId === id)
            return (
              <li key={id} className="flex items-center gap-3 text-[13px]">
                <span className="nums w-20 shrink-0 text-fg-subtle">
                  wk {ws[0].week}–{ws.at(-1)!.week}
                </span>
                <span className="flex-1 truncate font-medium">{ws[0].phaseTitle}</span>
                <span className="nums text-[11.5px] text-fg-subtle">{ws.length} wks</span>
              </li>
            )
          })}
        </ul>

        <Button variant="primary" size="lg" className="mt-5 w-full" onClick={() => void save()}>
          Save the plan and open the roadmap
        </Button>
      </section>
    </div>
  )
}
