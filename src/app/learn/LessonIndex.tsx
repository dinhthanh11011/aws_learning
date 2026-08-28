'use client'
import { useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CardLink } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { FamilyBadges } from '@/components/service/FamilyBadges'
import { LESSON_CLUSTERS, certById, lessons, lessonsFor, taskById } from '@/content'
import { useProfile } from '@/hooks/useProfile'

/**
 * The lesson list, grouped by cluster and scoped to the cert being studied.
 *
 * Both of those are the point. The registry order is a teaching order — a
 * cluster at a time, each cluster in descending exam weight — and rendering it
 * as 27 flat cards threw that away: the grouping existed in the array and
 * nowhere on screen. And an unfiltered list put thirteen consecutive SAA-only
 * lessons in front of a DVA learner before the first one on their paper, which
 * is the version of "the order is wrong" somebody would actually feel.
 *
 * Client-side because the target cert lives in IndexedDB. `useProfile` returns
 * the default for one frame before Dexie resolves, exactly as `RoadmapView`
 * does; the visible count line makes that self-correcting rather than
 * confusing.
 *
 * The scope lives in `?scope=all` rather than component state for the same
 * reason the roadmap keeps its open phase in the URL: this is a page people
 * leave to open a lesson and come back to.
 */
export function LessonIndex() {
  const profile = useProfile()
  const router = useRouter()
  const searchParams = useSearchParams()
  const showAll = searchParams.get('scope') === 'all'

  const cert = certById.get(profile.targetCert)
  const inScope = useMemo(() => lessonsFor(profile.targetCert), [profile.targetCert])
  const visible = showAll ? lessons : inScope

  const groups = LESSON_CLUSTERS.map((c) => ({
    cluster: c,
    items: visible.filter((l) => l.cluster === c.id),
  })).filter((g) => g.items.length > 0)

  const setScope = (next: 'all' | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (next) params.set('scope', next)
    else params.delete('scope')
    const q = params.toString()
    router.replace(q ? `/learn?${q}` : '/learn', { scroll: false })
  }

  const hidden = lessons.length - inScope.length

  return (
    <div className="flex flex-col gap-8">
      {/* Honesty rule: the page says what it is not showing, and how to see it.
          A quietly filtered list is indistinguishable from a short corpus. */}
      <p className="nums text-[13px] text-fg-subtle">
        {showAll ? (
          <>
            Showing all {lessons.length} lessons.{' '}
            {hidden > 0 ? (
              <button
                type="button"
                onClick={() => setScope(null)}
                className="text-accent underline-offset-2 hover:underline"
              >
                Show only the {inScope.length} on {cert?.id ?? profile.targetCert}
              </button>
            ) : null}
          </>
        ) : (
          <>
            Showing the {inScope.length} {inScope.length === 1 ? 'lesson' : 'lessons'} on{' '}
            {cert?.id ?? profile.targetCert}.{' '}
            {hidden > 0 ? (
              <button
                type="button"
                onClick={() => setScope('all')}
                className="text-accent underline-offset-2 hover:underline"
              >
                Show all {lessons.length}
              </button>
            ) : null}
          </>
        )}
      </p>

      {groups.map(({ cluster, items }) => (
        <section key={cluster.id} className="flex flex-col gap-3">
          <div>
            <h2 className="text-[19px] font-semibold tracking-tight">{cluster.title}</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">{cluster.blurb}</p>
          </div>
          <div className="flex flex-col gap-4">
            {items.map((l) => {
              const task = taskById.get(l.taskId)
              return (
                <CardLink key={l.id} href={`/learn/${l.id}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-[17px] font-semibold">{l.title}</h3>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {task ? <Badge tone="neutral">{task.code}</Badge> : null}
                      <FamilyBadges item={l} />
                    </div>
                  </div>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-fg-muted">{l.subtitle}</p>
                  <p className="nums mt-2 text-[12.5px] text-fg-subtle">
                    {l.minutes} min · {l.checks.length} recall{' '}
                    {l.checks.length === 1 ? 'check' : 'checks'}
                  </p>
                </CardLink>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
