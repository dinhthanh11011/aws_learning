'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import {
  CATEGORIES,
  certById,
  domainsFor,
  serviceBySlug,
  serviceLabel,
  servicesFor,
  TIER_META,
} from '@/content'
import { useProfile } from '@/hooks/useProfile'
import { useMasteryInput } from '@/hooks/useMastery'
import { domainMastery, readiness, serviceMastery } from '@/engines/progress/mastery'
import { ACHIEVEMENTS, levelFromXp, levelTitle } from '@/engines/gamify/rules'
import { resolveMistake } from '@/db/repo'
import { MasteryRing } from '@/components/ui/MasteryRing'
import { Progress } from '@/components/ui/Progress'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { serviceLinkProps } from '@/components/service/ServiceRef'

export function ProgressPanel() {
  const profile = useProfile()
  const masteryInput = useMasteryInput()
  const cert = certById.get(profile.targetCert)!
  const domains = domainsFor(profile.targetCert)
  const certServices = useMemo(() => servicesFor(profile.targetCert), [profile.targetCert])
  const [tab, setTab] = useState<'mastery' | 'mistakes' | 'history'>('mastery')

  const mistakes = useLiveQuery(() => db.mistakes.orderBy('at').reverse().toArray(), [], [])
  const exams = useLiveQuery(
    async () => (await db.exams.orderBy('startedAt').toArray()).filter((e) => e.scaled !== null),
    [],
    [],
  )
  const daily = useLiveQuery(() => db.dailyStats.orderBy('day').reverse().limit(120).toArray(), [], [])
  const unlocked = useLiveQuery(() => db.achievements.toArray(), [], [])

  const ready = masteryInput
    ? readiness(domains, certServices, masteryInput, profile.targetCert)
    : null

  const serviceRings = useMemo(() => {
    if (!masteryInput) return []
    return certServices
      .map((s) => ({ s, m: serviceMastery(s, masteryInput) }))
      // Weakest core services first: that ordering is the study plan.
      .sort((a, b) => (5 - a.m.rings) * (4 - a.s.tier) - (5 - b.m.rings) * (4 - b.s.tier))
      .reverse()
  }, [masteryInput, certServices])

  // Mistakes grouped by service. Three or more is a conceptual hole.
  const clusters = useMemo(() => {
    const counts = new Map<string, number>()
    for (const m of mistakes ?? []) {
      for (const slug of m.serviceSlugs) counts.set(slug, (counts.get(slug) ?? 0) + 1)
    }
    return [...counts.entries()]
      .map(([slug, count]) => ({ slug, count }))
      .sort((a, b) => b.count - a.count)
  }, [mistakes])

  const level = levelFromXp(profile.xp)
  const streakDays = useMemo(() => {
    const map = new Map((daily ?? []).map((d) => [d.day, d]))
    const out: { day: string; xp: number }[] = []
    for (let i = 83; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      out.push({ day: key, xp: map.get(key)?.xp ?? 0 })
    }
    return out
  }, [daily])
  const maxXp = Math.max(1, ...streakDays.map((d) => d.xp))

  const tabBtn = (active: boolean) =>
    cn(
      'rounded-lg border px-3 py-1.5 text-[13px] transition-colors',
      active
        ? 'border-accent/40 bg-accent-soft font-medium text-accent'
        : 'border-border text-fg-muted hover:border-border-strong hover:text-fg',
    )

  return (
    <div className="flex flex-col gap-5">
      {/* Headline */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface p-5 lg:col-span-2">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight">{cert.id} readiness</h2>
              <p className="mt-0.5 text-[12.5px] text-fg-subtle">
                Weighted by domain, capped until you have timed-exam evidence
              </p>
            </div>
            <p className="nums text-[34px] font-semibold leading-none">
              {ready?.percent ?? 0}
              <span className="text-[16px] font-normal text-fg-subtle">%</span>
            </p>
          </div>
          <Progress
            value={ready?.percent ?? 0}
            max={100}
            height={8}
            className="mt-3"
            tone={(ready?.percent ?? 0) >= 70 ? 'ok' : (ready?.percent ?? 0) >= 40 ? 'accent' : 'warn'}
          />
          <p className="mt-3 text-[13px] leading-relaxed text-fg-muted">{ready?.advice}</p>
        </div>

        <div className="surface p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
            Level {level.level}
          </p>
          <p className="mt-1 text-[15px] font-semibold text-accent">{levelTitle(level.level)}</p>
          <p className="nums mt-1 text-[12px] text-fg-subtle">
            {profile.xp.toLocaleString()} XP · {level.span - level.into} to next
          </p>
          <div className="mt-3 flex gap-4 border-t border-border pt-3 text-[12px]">
            <span>
              🔥 <span className="nums font-semibold">{profile.streak}</span> day streak
            </span>
            <span className="text-fg-subtle">
              best <span className="nums">{profile.bestStreak}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Activity heatmap */}
      <div className="surface p-4">
        <h2 className="mb-1 text-[14px] font-semibold tracking-tight">Last 12 weeks</h2>
        <p className="mb-3 text-[12px] text-fg-subtle">
          XP earned per day. Consistency beats intensity — this is the graph that predicts passing.
        </p>
        <div className="overflow-x-auto">
          <div className="grid min-w-[560px] grid-flow-col grid-rows-7 gap-[3px]">
            {streakDays.map((d) => (
              <span
                key={d.day}
                title={`${d.day}: ${d.xp} XP`}
                className="h-3 w-3 rounded-[3px]"
                style={{
                  background: d.xp
                    ? `color-mix(in oklab, var(--accent) ${Math.min(100, 25 + (d.xp / maxXp) * 75)}%, var(--bg-inset))`
                    : 'var(--bg-inset)',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button className={tabBtn(tab === 'mastery')} onClick={() => setTab('mastery')}>
          Mastery
        </button>
        <button className={tabBtn(tab === 'mistakes')} onClick={() => setTab('mistakes')} id="mistakes">
          Mistake log ({(mistakes ?? []).filter((m) => !m.resolved).length})
        </button>
        <button className={tabBtn(tab === 'history')} onClick={() => setTab('history')}>
          Exam history ({exams?.length ?? 0})
        </button>
      </div>

      {tab === 'mastery' ? (
        <>
          <div className="surface p-5">
            <h2 className="mb-3 text-[15px] font-semibold tracking-tight">By domain</h2>
            <div className="flex flex-col gap-4">
              {domains.map((d) => {
                const m = masteryInput ? domainMastery(d, certServices, masteryInput) : null
                return (
                  <div key={d.id}>
                    <div className="flex flex-wrap items-center gap-3">
                      <MasteryRing rings={m?.rings ?? 0} size={26} />
                      <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium">
                        {d.title}
                      </span>
                      <Badge tone="neutral">{d.weight}% of the paper</Badge>
                      <Link
                        href={`/quiz`}
                        className="text-[12px] text-accent hover:underline"
                      >
                        Drill it →
                      </Link>
                    </div>
                    {m ? (
                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 pl-[38px] text-[11.5px] text-fg-subtle">
                        <span>
                          Recall <span className="nums">{Math.round(m.recall * 100)}%</span>
                        </span>
                        <span>
                          Accuracy <span className="nums">{Math.round(m.accuracy * 100)}%</span>
                        </span>
                        <span>
                          Coverage <span className="nums">{Math.round(m.coverage * 100)}%</span>
                        </span>
                        <span className="text-accent">Next: {m.next}</span>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="surface p-5">
            <h2 className="text-[15px] font-semibold tracking-tight">Weakest services first</h2>
            <p className="mt-1 text-[12.5px] text-fg-subtle">
              Ordered by mastery weighted by tier: an unknown core service costs far more than an
              unknown one you only need to recognise.
            </p>
            <ul className="mt-3 flex flex-col divide-y divide-border">
              {serviceRings.slice(0, 20).map(({ s, m }) => (
                <li key={s.slug} className="flex items-center gap-3 py-2">
                  <MasteryRing rings={m.rings} size={22} confident={m.confident} />
                  <span
                    className="h-5 w-1 shrink-0 rounded-full"
                    style={{ background: CATEGORIES[s.category].token }}
                    aria-hidden
                  />
                  <a
                    {...serviceLinkProps(s.slug)}
                    className="min-w-0 flex-1 truncate text-[13px] hover:text-accent"
                  >
                    {s.name}
                  </a>
                  <Badge tone={s.tier === 1 ? 'accent' : s.tier === 2 ? 'info' : 'neutral'}>
                    {TIER_META[s.tier].label}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>

          <div className="surface p-5">
            <h2 className="mb-3 text-[15px] font-semibold tracking-tight">Achievements</h2>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {ACHIEVEMENTS.map((a) => {
                const got = (unlocked ?? []).some((u) => u.id === a.id)
                return (
                  <li
                    key={a.id}
                    className={cn(
                      'flex gap-3 rounded-xl border p-3',
                      got ? 'border-ok/40 bg-ok-soft' : 'border-dashed border-border bg-bg-inset',
                    )}
                  >
                    <span className="text-[18px]" aria-hidden>
                      {got ? a.icon : '🔒'}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[12.5px] font-semibold">{a.title}</span>
                      <span className="block text-[11.5px] leading-snug text-fg-subtle">
                        {got ? a.description : a.hint}
                      </span>
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </>
      ) : null}

      {tab === 'mistakes' ? (
        <>
          {clusters.length ? (
            <div className="surface border-warn/30 p-5">
              <h2 className="text-[15px] font-semibold tracking-tight">Conceptual holes</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">
                A service appearing three or more times is a conceptual hole, not a memory lapse.
                This list is a better study plan than any generic syllabus.
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {clusters.map((c) => {
                  const svc = serviceBySlug.get(c.slug)
                  if (!svc) return null
                  return (
                    <li key={c.slug}>
                      <a
                        {...serviceLinkProps(c.slug)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[12.5px] font-medium transition-colors',
                          c.count >= 3
                            ? 'border-bad/40 bg-bad-soft text-bad'
                            : 'border-border hover:border-border-strong',
                        )}
                      >
                        {serviceLabel(svc)}
                        <span className="nums">×{c.count}</span>
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : null}

          <div className="surface p-5">
            <h2 className="text-[15px] font-semibold tracking-tight">Your notes</h2>
            {(mistakes ?? []).length === 0 ? (
              <p className="mt-2 text-[13px] leading-relaxed text-fg-muted">
                Nothing logged yet. After an exam, write one line per wrong answer in your own words
                — including on the ones you got right but could not justify. The writing is what makes
                it stick, and after three papers the patterns are obvious.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col divide-y divide-border">
                {(mistakes ?? []).map((m) => (
                  <li key={m.id} className="flex items-start gap-3 py-3">
                    <span
                      className={cn(
                        'mt-1 h-2 w-2 shrink-0 rounded-full',
                        m.resolved ? 'bg-ok' : 'bg-warn',
                      )}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block text-[13.5px] leading-snug',
                          m.resolved && 'text-fg-subtle line-through decoration-1',
                        )}
                      >
                        {m.note}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-fg-subtle">
                          {new Date(m.at).toLocaleDateString()}
                        </span>
                        {m.serviceSlugs.map((slug) => {
                          const svc = serviceBySlug.get(slug)
                          if (!svc) return null
                          return (
                            <a
                              key={slug}
                              {...serviceLinkProps(slug)}
                              className="rounded border border-border bg-bg-inset px-1.5 text-[11px] hover:border-border-strong"
                            >
                              {serviceLabel(svc)}
                            </a>
                          )
                        })}
                      </span>
                    </span>
                    {!m.resolved && m.id !== undefined ? (
                      <Button size="sm" variant="ghost" onClick={() => void resolveMistake(m.id!)}>
                        Resolved
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}

      {tab === 'history' ? (
        <div className="surface p-5">
          <h2 className="text-[15px] font-semibold tracking-tight">Exam history</h2>
          {(exams ?? []).length === 0 ? (
            <p className="mt-2 text-[13px] leading-relaxed text-fg-muted">
              No completed papers yet. Content mastery tells you what you know; a timed paper tells
              you whether you can do it in {cert.minutes} minutes against four plausible options.
              They are not the same thing.
            </p>
          ) : (
            <>
              {/* Score trend — the line that matters. */}
              <div className="mt-4 flex items-end gap-2" style={{ height: 120 }}>
                {(exams ?? []).map((e) => {
                  const pct = ((e.scaled ?? 0) - 100) / 900
                  return (
                    <div key={e.id} className="flex flex-1 flex-col items-center gap-1">
                      <span
                        className="w-full rounded-t"
                        style={{
                          height: `${Math.max(3, pct * 100)}px`,
                          background: e.passed ? 'var(--ok)' : 'var(--warn)',
                        }}
                        title={`${e.scaled} on ${new Date(e.startedAt).toLocaleDateString()}`}
                      />
                      <span className="nums text-[9px] text-fg-subtle">{e.scaled}</span>
                    </div>
                  )
                })}
              </div>
              <p className="mt-2 border-t border-border pt-2 text-[11.5px] text-fg-subtle">
                The pass mark is {cert.passScore}. Book when you clear 80% on a paper you have never
                seen before.
              </p>
              <ul className="mt-3 flex flex-col divide-y divide-border">
                {[...(exams ?? [])].reverse().map((e) => (
                  <li key={e.id} className="flex flex-wrap items-center gap-3 py-2.5">
                    <Badge tone={e.passed ? 'ok' : 'bad'}>{e.scaled}</Badge>
                    <span className="text-[12.5px] text-fg-subtle">
                      {new Date(e.startedAt).toLocaleString()} · {e.questionIds.length} questions
                    </span>
                    <Link
                      href={`/exam/${e.id}`}
                      className="ml-auto text-[12.5px] text-accent hover:underline"
                    >
                      Review →
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
