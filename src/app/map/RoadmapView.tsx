'use client'
import { useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, useReducedMotion } from 'motion/react'
import {
  CATEGORIES,
  domainById,
  labById,
  phasesFor,
  questionsForDomain,
  serviceLabel,
  servicesForTask,
  servicesFor,
  taskById,
  TIER_META,
} from '@/content'
import { useProfile } from '@/hooks/useProfile'
import { useMasteryInput } from '@/hooks/useMastery'
import { taskMastery } from '@/engines/progress/mastery'
import { generate } from '@/engines/plan/generate'
import { MasteryRing } from '@/components/ui/MasteryRing'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { cn } from '@/lib/cn'
import { serviceLinkProps } from '@/components/service/ServiceRef'

/** Sentinel for "the learner closed every phase", so it survives a reload too. */
const COLLAPSED = 'none'

/**
 * The roadmap. Phases are the learning order; task statements are the gated
 * nodes inside them. A phase unlocks when the one before it reaches three rings
 * on average — enough to have actually learned it, not enough to be perfect,
 * because waiting for perfect is how people stall.
 *
 * Which phase is expanded lives in `?phase=` rather than component state: the
 * roadmap is the page people leave to open a lab or a question and then come
 * back to, and losing the phase they had open every time makes them re-find it.
 */
export function RoadmapView() {
  const profile = useProfile()
  const masteryInput = useMasteryInput()
  const reduce = useReducedMotion()
  const phases = useMemo(() => phasesFor(profile.targetCert), [profile.targetCert])
  const certServices = useMemo(() => servicesFor(profile.targetCert), [profile.targetCert])
  const router = useRouter()
  const searchParams = useSearchParams()

  // No param means the first phase, `none` means the learner collapsed
  // everything, and an id left over from the other cert falls back to the
  // default rather than showing a roadmap with nothing open.
  const phaseParam = searchParams.get('phase')
  const open =
    phaseParam === COLLAPSED
      ? null
      : phaseParam && phases.some((p) => p.id === phaseParam)
        ? phaseParam
        : (phases[0]?.id ?? null)

  const setOpen = useCallback(
    (id: string | null) => {
      const params = new URLSearchParams(searchParams)
      params.set('phase', id ?? COLLAPSED)
      // `replace`, not `push`: expanding a phase is not a step to go back
      // through, but it does need to be on the entry we return to.
      router.replace(`/map?${params}`, { scroll: false })
    },
    [router, searchParams],
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

  const phaseScores = useMemo(() => {
    const out = new Map<string, { score: number; rings: number }>()
    for (const p of phases) {
      const tasks = p.taskIds.map((id) => taskById.get(id)).filter(Boolean)
      if (!tasks.length || !masteryInput) {
        out.set(p.id, { score: 0, rings: 0 })
        continue
      }
      const scores = tasks.map(
        (t) => taskMastery(t!, certServices, masteryInput).score,
      )
      const score = scores.reduce((n, s) => n + s, 0) / scores.length
      out.set(p.id, { score, rings: Math.round(score * 5) })
    }
    return out
  }, [phases, masteryInput, certServices])

  // A phase is available once the previous one averages three rings.
  const unlocked = useMemo(() => {
    const set = new Set<string>()
    let allow = true
    for (const p of phases) {
      if (allow) set.add(p.id)
      allow = (phaseScores.get(p.id)?.rings ?? 0) >= 3
    }
    return set
  }, [phases, phaseScores])

  return (
    <div className="flex flex-col gap-5">
      <div className="surface p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight">
              {plan.weeks.length} weeks at {profile.weeklyHours} hours
            </h2>
            <p className="mt-0.5 text-[12.5px] text-fg-subtle">
              {plan.totalHours} hours of material across {phases.length} phases
            </p>
          </div>
          <Badge
            tone={
              plan.compression === 'none'
                ? 'ok'
                : plan.compression === 'mild'
                  ? 'accent'
                  : plan.compression === 'heavy'
                    ? 'warn'
                    : 'bad'
            }
          >
            {plan.compression === 'none' ? 'Comfortable' : plan.compression}
          </Badge>
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-fg-muted">{plan.verdict}</p>
      </div>

      <ol className="flex flex-col gap-3">
        {phases.map((phase, idx) => {
          const score = phaseScores.get(phase.id)!
          const isOpen = open === phase.id
          const available = unlocked.has(phase.id)
          const weeks = plan.weeks.filter((w) => w.phaseId === phase.id)

          return (
            <li key={phase.id}>
              {/* Locked phases get a muted surface rather than reduced opacity:
                  dimming a whole card drops its text below the contrast
                  threshold, which fails an accessibility audit for real. */}
              <div
                className={cn(
                  'surface overflow-hidden p-0',
                  !available && 'border-dashed bg-bg-inset',
                )}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : phase.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-start gap-4 p-4 text-left transition-colors hover:bg-bg-overlay"
                >
                  <span className="relative flex flex-col items-center">
                    <MasteryRing rings={score.rings} size={40} />
                    <span className="nums absolute inset-0 grid place-items-center text-[11px] font-bold">
                      {idx}
                    </span>
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-[15px] font-semibold tracking-tight">{phase.title}</span>
                      {!available ? <Badge tone="neutral">🔒 locked</Badge> : null}
                      <Badge tone="neutral">
                        weeks {weeks[0]?.week ?? phase.weekFrom}–
                        {weeks.at(-1)?.week ?? phase.weekTo}
                      </Badge>
                      <Badge tone="neutral">{phase.hours} h</Badge>
                    </span>
                    <span className="mt-1 block text-[13px] leading-relaxed text-fg-muted">
                      {phase.purpose}
                    </span>
                    <Progress
                      value={score.score}
                      className="mt-2.5"
                      height={5}
                      tone={score.rings >= 3 ? 'ok' : 'accent'}
                    />
                  </span>
                  <span className="shrink-0 text-[12px] text-fg-subtle" aria-hidden>
                    {isOpen ? '▾' : '▸'}
                  </span>
                </button>

                {isOpen ? (
                  <motion.div
                    initial={reduce ? undefined : { height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="border-t border-border bg-bg-inset px-4 py-4"
                  >
                    {!available ? (
                      <p className="mb-4 rounded-lg border border-warn/30 bg-warn-soft p-3 text-[12.5px] leading-relaxed text-fg-muted">
                        This phase unlocks when the previous one averages three rings. You can still
                        read ahead — the lock is a suggestion about ordering, not a wall.
                      </p>
                    ) : null}

                    <div className="mb-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                        You leave this phase when
                      </p>
                      <ul className="mt-1.5 flex flex-col gap-1.5">
                        {phase.exitCriteria.map((c) => (
                          <li key={c} className="flex gap-2 text-[13px] leading-snug text-fg-muted">
                            <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-ok" aria-hidden />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {phase.labIds.length ? (
                      <div className="mb-4">
                        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                          Build it
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {[...new Set(phase.labIds)].map((id) => {
                            const lab = labById.get(id)
                            if (!lab) return null
                            return (
                              <Link
                                key={id}
                                href={`/labs/${id}`}
                                className="rounded-lg border border-border bg-bg-raised px-2.5 py-1 text-[12.5px] font-medium hover:border-accent"
                              >
                                {lab.title} →
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    ) : null}

                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                      Task statements covered
                    </p>
                    <ul className="flex flex-col gap-2">
                      {[...new Set(phase.taskIds)].map((tid) => {
                        const task = taskById.get(tid)
                        if (!task) return null
                        const domain = domainById.get(task.domainId)
                        const m = masteryInput ? taskMastery(task, certServices, masteryInput) : null
                        const svcs = servicesForTask(tid).slice(0, 6)
                        const qCount = domain ? questionsForDomain(domain.id).length : 0
                        return (
                          <li
                            key={tid}
                            id={tid}
                            className="rounded-xl border border-border bg-bg-raised p-3"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <MasteryRing rings={m?.rings ?? 0} size={22} />
                              <span className="text-[13px] font-medium">
                                {task.code} {task.title}
                              </span>
                              <Badge tone="neutral">{domain?.weight}% domain</Badge>
                              <Link
                                href="/quiz"
                                className="ml-auto text-[12px] text-accent hover:underline"
                              >
                                {qCount} questions →
                              </Link>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {svcs.map((s) => (
                                <a
                                  key={s.slug}
                                  {...serviceLinkProps(s.slug)}
                                  title={`${s.name} — ${TIER_META[s.tier].label}`}
                                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg-inset px-1.5 py-0.5 text-[11.5px] hover:border-border-strong"
                                >
                                  <span
                                    className="h-2 w-2 rounded-full"
                                    style={{ background: CATEGORIES[s.category].token }}
                                    aria-hidden
                                  />
                                  {serviceLabel(s)}
                                </a>
                              ))}
                              {servicesForTask(tid).length > 6 ? (
                                <span className="text-[11px] text-fg-subtle">
                                  +{servicesForTask(tid).length - 6} more
                                </span>
                              ) : null}
                            </div>
                          </li>
                        )
                      })}
                    </ul>

                    {weeks.length ? (
                      <div className="mt-4 border-t border-border pt-3">
                        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                          Week by week
                        </p>
                        <ul className="flex flex-col gap-1">
                          {weeks.map((w) => (
                            <li key={w.week} className="flex gap-2.5 text-[12.5px]">
                              <span className="nums w-14 shrink-0 text-fg-subtle">
                                wk {w.week}
                              </span>
                              <span className="text-fg-muted">{w.focus}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </motion.div>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>

      <div className="surface p-5">
        <h2 className="text-[15px] font-semibold tracking-tight">The weekly loop</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">
          Whatever phase you are in, the week has the same shape. The fourth step is the one most
          people skip and the one that pays best, because exam questions ask “this is broken, why?”
          far more often than “what is this?”.
        </p>
        <ol className="mt-4 grid gap-2 sm:grid-cols-5">
          {[
            ['Read', 'Docs or a lesson on this week’s topic'],
            ['Build', 'Build it — the lab, or a real account'],
            ['Rebuild', 'Do it again from the CLI or a template'],
            ['Break it', 'Remove a route, strip a permission, watch it fail'],
            ['Recall', 'Close everything, write the comparison table from memory'],
          ].map(([title, detail], i) => (
            <li key={title} className="rounded-xl border border-border bg-bg-inset p-3">
              <span className="nums text-[11px] font-bold text-accent">{i + 1}</span>
              <span className="mt-0.5 block text-[13px] font-semibold">{title}</span>
              <span className="mt-0.5 block text-[12px] leading-snug text-fg-subtle">{detail}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
