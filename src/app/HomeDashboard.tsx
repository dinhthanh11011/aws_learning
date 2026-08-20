'use client'
import Link from 'next/link'
import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { db, today } from '@/db'
import { useProfile } from '@/hooks/useProfile'
import { useMasteryInput } from '@/hooks/useMastery'
import { certById, domainsFor, phases, servicesFor, triggersFor } from '@/content'
import { readiness } from '@/engines/progress/mastery'
import { dailyMission, generate, weeksUntil } from '@/engines/plan/generate'
import { buildQueue } from '@/engines/srs/scheduler'
import { levelFromXp } from '@/engines/gamify/rules'
import { ButtonLink } from '@/components/ui/Button'
import { Progress, StackedBar } from '@/components/ui/Progress'
import { Badge } from '@/components/ui/Badge'
import { CATEGORIES } from '@/content'
import { cn } from '@/lib/cn'

/**
 * `nowMs` is passed in from the server component rather than read during render:
 * Date.now() in render is impure and can produce values that shift on an
 * unrelated re-render. Day-granular figures like "days until the exam" do not
 * need to be live to the millisecond.
 */
export function HomeDashboard({ nowMs }: { nowMs: number }) {
  const profile = useProfile()
  const masteryInput = useMasteryInput()
  const cert = certById.get(profile.targetCert)!
  const domains = domainsFor(profile.targetCert)
  const certServices = useMemo(() => servicesFor(profile.targetCert), [profile.targetCert])

  const cards = useLiveQuery(() => db.srsCards.toArray(), [], [])
  const todayStat = useLiveQuery(() => db.dailyStats.get(today()), [])
  const openMistakes = useLiveQuery(() => db.mistakes.filter((m) => !m.resolved).count(), [], 0)
  const examCount = useLiveQuery(() => db.exams.filter((e) => e.endedAt !== null).count(), [], 0)
  const lastExam = useLiveQuery(
    async () => (await db.exams.orderBy('startedAt').reverse().limit(10).toArray()).find((e) => e.scaled !== null),
    [],
  )

  const queue = useMemo(
    () => buildQueue(cards ?? [], { certId: profile.targetCert }),
    [cards, profile.targetCert],
  )

  const ready = useMemo(
    () =>
      masteryInput
        ? readiness(domains, certServices, masteryInput, profile.targetCert)
        : null,
    [masteryInput, domains, certServices, profile.targetCert],
  )

  const plan = useMemo(
    () =>
      generate({
        certId: profile.targetCert,
        weeklyHours: profile.weeklyHours,
        examDate: profile.examDate,
      }),
    [profile.targetCert, profile.weeklyHours, profile.examDate],
  )

  const weakest = ready?.perDomain.slice().sort((a, b) => b.marksAtStake - a.marksAtStake)[0]

  const missions = useMemo(
    () =>
      dailyMission({
        dueReviews: queue.dueCount,
        newCards: queue.newCount,
        openMistakes: openMistakes ?? 0,
        weakestDomainTitle: weakest?.title ?? null,
        currentPhase: phases.find((p) => p.certs.includes(profile.targetCert)),
        certId: profile.targetCert,
        answeredToday: todayStat?.answered ?? 0,
        reviewedToday: todayStat?.reviews ?? 0,
      }),
    [queue, openMistakes, weakest, profile.targetCert, todayStat],
  )

  const level = levelFromXp(profile.xp)
  const daysToExam = profile.examDate
    ? Math.max(0, Math.ceil((new Date(`${profile.examDate}T00:00:00`).getTime() - nowMs) / 86_400_000))
    : null

  const doneCount = missions.filter((m) => m.done).length

  return (
    <div className="flex flex-col gap-5">
      {/* Today — the only thing that matters on opening the app. */}
      <section className="surface overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight">Today’s mission</h2>
            <p className="mt-0.5 text-[12.5px] text-fg-subtle">
              {doneCount === missions.length
                ? 'All done. Anything more today is a bonus.'
                : `${missions.length - doneCount} of ${missions.length} left — about ${missions.filter((m) => !m.done).reduce((n, m) => n + m.minutes, 0)} minutes.`}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {missions.map((m) => (
              <span
                key={m.id}
                title={m.title}
                className={cn(
                  'h-2 w-8 rounded-full transition-colors',
                  m.done ? 'bg-ok' : 'bg-bg-inset',
                )}
              />
            ))}
          </div>
        </div>
        <ul className="divide-y divide-border">
          {missions.map((m) => (
            <li key={m.id}>
              <Link
                href={m.href}
                className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-bg-overlay"
              >
                <span
                  className={cn(
                    'grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[12px]',
                    m.done ? 'border-ok bg-ok text-bg' : 'border-border-strong text-fg-subtle',
                  )}
                  aria-hidden
                >
                  {m.done ? '✓' : m.kind === 'drill' ? '⟳' : m.kind === 'quiz' ? '?' : m.kind === 'lab' ? '⚙' : m.kind === 'review' ? '✎' : '⚿'}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'block text-[14px] font-medium',
                      m.done && 'text-fg-subtle line-through decoration-1',
                    )}
                  >
                    {m.title}
                  </span>
                  <span className="mt-0.5 block text-[12.5px] leading-snug text-fg-muted">
                    {m.detail}
                  </span>
                </span>
                <span className="nums shrink-0 text-[11px] text-fg-subtle">{m.minutes} min</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Readiness */}
        <section className="surface p-4 lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight">
                {cert.id} readiness
              </h2>
              <p className="mt-0.5 text-[12.5px] text-fg-subtle">
                Weighted by domain, capped until you have real timed-exam evidence.
              </p>
            </div>
            <div className="text-right">
              <p className="nums text-[32px] font-semibold leading-none tabular-nums">
                {ready?.percent ?? 0}
                <span className="text-[16px] font-normal text-fg-subtle">%</span>
              </p>
            </div>
          </div>

          <Progress
            value={ready?.percent ?? 0}
            max={100}
            tone={(ready?.percent ?? 0) >= 70 ? 'ok' : (ready?.percent ?? 0) >= 40 ? 'accent' : 'warn'}
            height={8}
            label="Exam readiness"
          />

          <p className="mt-3 text-[13px] leading-relaxed text-fg-muted">{ready?.advice}</p>

          <div className="mt-4 flex flex-col gap-2.5">
            {ready?.perDomain.map((d) => (
              <div key={d.domainId} className="flex items-center gap-3">
                <span className="w-[46%] shrink-0 truncate text-[12.5px] text-fg-muted" title={d.title}>
                  {d.title}
                </span>
                <Badge tone="neutral" className="shrink-0">
                  {d.weight}%
                </Badge>
                <Progress
                  value={d.score}
                  tone={d.score >= 0.7 ? 'ok' : d.score >= 0.4 ? 'accent' : 'warn'}
                  height={5}
                />
                <span className="nums w-8 shrink-0 text-right text-[11px] text-fg-subtle">
                  {Math.round(d.score * 100)}%
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Where you are in the plan */}
        <section className="surface flex flex-col gap-3 p-4">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight">The plan</h2>
            <p className="mt-0.5 text-[12.5px] text-fg-subtle">
              {profile.weeklyHours} h/week · {plan.weeks.length} weeks
            </p>
          </div>

          {daysToExam !== null ? (
            <div className="rounded-xl border border-border bg-bg-inset p-3">
              <p className="nums text-[26px] font-semibold leading-none">{daysToExam}</p>
              <p className="mt-1 text-[12px] text-fg-subtle">
                days until {profile.examDate}
                {weeksUntil(profile.examDate!) < 3 ? ' — taper now, no new material' : ''}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-warn/30 bg-warn-soft p-3">
              <p className="text-[13px] font-medium text-warn">No exam booked</p>
              <p className="mt-1 text-[12.5px] leading-snug text-fg-muted">
                A date converts open-ended study into focused study. Most people who wait to feel
                ready never book.
              </p>
            </div>
          )}

          <p className="text-[12.5px] leading-relaxed text-fg-muted">{plan.verdict}</p>

          <ButtonLink href="/onboarding" size="sm" variant="secondary" className="mt-auto">
            Adjust the plan
          </ButtonLink>
        </section>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Due reviews"
          value={queue.dueCount}
          hint={queue.laterToday ? `${queue.laterToday} more later today` : 'Retrieval beats re-reading'}
          href="/drill"
          tone={queue.dueCount > 30 ? 'warn' : 'accent'}
        />
        <Stat
          label="Full papers sat"
          value={examCount ?? 0}
          hint={
            lastExam?.scaled
              ? `Last: ${lastExam.scaled}/1000 ${lastExam.passed ? '— pass' : '— below 720'}`
              : 'The only honest readiness signal'
          }
          href="/exam"
          tone={(examCount ?? 0) > 0 ? 'ok' : 'neutral'}
        />
        <Stat
          label="Open mistakes"
          value={openMistakes ?? 0}
          hint={
            (openMistakes ?? 0) >= 3
              ? 'Better than any generic syllabus'
              : 'Log one line per wrong answer'
          }
          href="/progress"
          tone={(openMistakes ?? 0) > 8 ? 'bad' : 'neutral'}
        />
        <Stat
          label="Level"
          value={level.level}
          hint={`${level.span - level.into} XP to level ${level.level + 1}`}
          href="/progress"
          tone="accent"
        />
      </div>

      {/* Orientation shortcuts, for a first-time visitor. */}
      {profile.xp === 0 ? (
        <section className="surface border-accent/30 p-5">
          <h2 className="text-[15px] font-semibold tracking-tight">Start here</h2>
          <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-fg-muted">
            The order matters. Spend 20 minutes on the big picture first — it is what stops the next
            three months feeling like a list of unrelated acronyms. Then set your dates, then start
            recalling.
          </p>
          <ol className="mt-4 flex flex-col gap-2">
            {[
              { href: '/big-picture', title: 'See the whole system', detail: 'Five layers, seven traceable flows, 20 minutes.' },
              { href: '/onboarding', title: 'Set your target and hours', detail: 'Generates a week-by-week plan you can actually follow.' },
              { href: '/decoder', title: `Drill the ${triggersFor(profile.targetCert).length} trigger phrases`, detail: 'The fastest single gain available: recognise the phrase, eliminate two options.' },
            ].map((s, i) => (
              <li key={s.href}>
                <Link
                  href={s.href}
                  className="flex items-center gap-3 rounded-xl border border-border bg-bg-inset p-3 transition-colors hover:border-border-strong hover:bg-bg-overlay"
                >
                  <span className="nums grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-[11px] font-bold text-accent-fg">
                    {i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-medium">{s.title}</span>
                    <span className="block text-[12.5px] text-fg-subtle">{s.detail}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {/* What the app contains — quiet reassurance that the corpus is real. */}
      <section className="surface p-4">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-[14px] font-semibold tracking-tight">Coverage</h2>
          <span className="text-[11.5px] text-fg-subtle">
            {cert.id} · {domains.length} domains · {cert.questionCount} questions in {cert.minutes} min
          </span>
        </div>
        <StackedBar
          height={10}
          segments={domains.map((d, i) => ({
            id: d.id,
            value: d.weight,
            label: `${d.title} — ${d.weight}%`,
            color: [
              CATEGORIES.security.token,
              CATEGORIES.network.token,
              CATEGORIES.compute.token,
              CATEGORIES.cost.token,
            ][i % 4],
          }))}
        />
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
          {domains.map((d, i) => (
            <li key={d.id} className="flex items-center gap-1.5 text-[11.5px] text-fg-muted">
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  background: [
                    CATEGORIES.security.token,
                    CATEGORIES.network.token,
                    CATEGORIES.compute.token,
                    CATEGORIES.cost.token,
                  ][i % 4],
                }}
              />
              {d.title} <span className="nums text-fg-subtle">{d.weight}%</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function Stat({
  label,
  value,
  hint,
  href,
  tone,
}: {
  label: string
  value: number
  hint: string
  href: string
  tone: 'accent' | 'ok' | 'warn' | 'bad' | 'neutral'
}) {
  const color =
    tone === 'neutral' ? 'var(--fg)' : `var(--${tone})`
  return (
    <Link
      href={href}
      className="surface flex flex-col gap-1 p-4 transition-colors hover:border-border-strong hover:bg-bg-overlay"
    >
      <span className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
        {label}
      </span>
      <span className="nums text-[26px] font-semibold leading-none" style={{ color }}>
        {value.toLocaleString()}
      </span>
      <span className="text-[12px] leading-snug text-fg-subtle">{hint}</span>
    </Link>
  )
}
