'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type SrsCard } from '@/db'
import { cardById, cardsFor, CARD_KIND_META, CATEGORIES, serviceBySlug, serviceLabel } from '@/content'
import { buildQueue, describeInterval, forecast, GRADE_META, GRADES, newCard, review, type Grade } from '@/engines/srs/scheduler'
import { ensureCards, recordReview } from '@/db/repo'
import { useProfile } from '@/hooks/useProfile'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { cn } from '@/lib/cn'

/**
 * FSRS-backed review. The interval is chosen by the algorithm; what this screen
 * is responsible for is making retrieval happen *before* the answer appears —
 * which is the entire mechanism. Hence the deliberate two-step reveal.
 */
export function DrillSession() {
  const profile = useProfile()
  const reduce = useReducedMotion()
  const [seeded, setSeeded] = useState(false)
  const [queue, setQueue] = useState<SrsCard[] | null>(null)
  const [i, setI] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState<{ grade: Grade; nextIn: string }[]>([])
  // A ref, not state: this only measures elapsed time and must never itself
  // trigger a render, and reading the clock during render is impure.
  const startedAt = useRef(0)

  const stored = useLiveQuery(() => db.srsCards.toArray(), [], [])

  // Seed the card table on first visit. Cards are derived content, so this is
  // idempotent and cheap to re-run when the corpus grows.
  useEffect(() => {
    if (seeded) return
    const defs = cardsFor(profile.targetCert)
    void ensureCards(
      defs.map((d) => newCard(d.id, d.certs, d.serviceSlugs, d.taskId)),
    ).then(() => setSeeded(true))
  }, [seeded, profile.targetCert])

  const summary = useMemo(
    () => buildQueue(stored ?? [], { certId: profile.targetCert }),
    [stored, profile.targetCert],
  )

  const upcoming = useMemo(() => forecast(stored ?? [], 14), [stored])

  const start = () => {
    const q = buildQueue(stored ?? [], { certId: profile.targetCert })
    setQueue(q.cards)
    setI(0)
    setFlipped(false)
    setDone([])
    startedAt.current = Date.now()
  }

  const grade = useCallback(
    async (g: Grade) => {
      if (!queue) return
      const card = queue[i]
      const outcome = review(card, g)
      const seconds = startedAt.current ? Math.round((Date.now() - startedAt.current) / 1000) : 0
      await recordReview(outcome.card, seconds, g === 'hard' || g === 'again')
      setDone((d) => [...d, { grade: g, nextIn: outcome.nextIn }])
      if (i + 1 >= queue.length) {
        setQueue(null)
        return
      }
      setI(i + 1)
      setFlipped(false)
      startedAt.current = Date.now()
    },
    [queue, i],
  )

  // Space flips, 1–4 grade. Keyboard-first because a session is many repetitions.
  useEffect(() => {
    if (!queue) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault()
        setFlipped(true)
        return
      }
      if (!flipped) return
      const n = Number(e.key)
      if (n >= 1 && n <= 4) {
        e.preventDefault()
        void grade(GRADES[n - 1])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [queue, flipped, grade])

  /* ── Idle ──────────────────────────────────────────────────────────────── */
  if (!queue) {
    const total = (stored ?? []).length
    const totalDefs = cardsFor(profile.targetCert).length
    const graded = (stored ?? []).filter((c) => c.reps > 0).length
    const maxForecast = Math.max(1, ...upcoming.map((u) => u.count))

    return (
      <div className="flex flex-col gap-4">
        {done.length ? (
          <div className="surface border-ok/30 p-5">
            <p className="text-[15px] font-semibold">
              {done.length} card{done.length === 1 ? '' : 's'} reviewed
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {GRADES.map((g) => {
                const n = done.filter((d) => d.grade === g).length
                if (!n) return null
                return (
                  <Badge key={g} tone={GRADE_META[g].tone as 'ok' | 'bad' | 'warn' | 'info'}>
                    {GRADE_META[g].label} × {n}
                  </Badge>
                )
              })}
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="surface p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
              Due now
            </p>
            <p className="nums mt-1 text-[30px] font-semibold leading-none text-accent">
              {summary.dueCount}
            </p>
            <p className="mt-1 text-[12px] text-fg-subtle">
              {summary.laterToday ? `${summary.laterToday} more later today` : 'Nothing else today'}
            </p>
          </div>
          <div className="surface p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
              New in this session
            </p>
            <p className="nums mt-1 text-[30px] font-semibold leading-none">{summary.newCount}</p>
            <p className="mt-1 text-[12px] text-fg-subtle">
              Capped at 15 so a session cannot balloon
            </p>
          </div>
          <div className="surface p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
              Seen at least once
            </p>
            <p className="nums mt-1 text-[30px] font-semibold leading-none">
              {graded}
              <span className="text-[15px] font-normal text-fg-subtle">/{total || totalDefs}</span>
            </p>
            <Progress value={graded} max={total || totalDefs} className="mt-2" height={4} />
          </div>
        </div>

        <div className="surface p-5">
          <h2 className="text-[15px] font-semibold tracking-tight">
            {summary.cards.length ? 'Ready when you are' : 'Nothing due'}
          </h2>
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-fg-muted">
            {summary.cards.length
              ? `${summary.cards.length} cards in this session — overdue reviews first, with new material interleaved so the session does not become a wall of unfamiliar content.`
              : 'The queue is empty. Coming back tomorrow is genuinely better than forcing extra reviews now — the spacing is the mechanism.'}
          </p>
          {summary.cards.length ? (
            <Button variant="primary" size="lg" className="mt-4" onClick={start}>
              Start — {summary.cards.length} cards
            </Button>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/quiz" className="text-[13px] text-accent hover:underline">
                Try a quiz instead →
              </Link>
              <Link href="/decoder" className="text-[13px] text-accent hover:underline">
                Drill the keyword decoder →
              </Link>
            </div>
          )}
        </div>

        {/* Forecast: a wall of reviews the week of your exam is worth seeing early. */}
        <div className="surface p-4">
          <h3 className="mb-1 text-[14px] font-semibold tracking-tight">Next 14 days</h3>
          <p className="mb-3 text-[12px] text-fg-subtle">
            Reviews land on these days. A spike the week of your exam is worth flattening now.
          </p>
          <ul className="flex items-end gap-1" style={{ height: 72 }}>
            {upcoming.map((u) => (
              <li
                key={u.day}
                className="flex flex-1 flex-col items-center gap-1"
                title={`${u.day}: ${u.count} review${u.count === 1 ? '' : 's'}`}
              >
                <span
                  className="w-full rounded-t-sm"
                  style={{
                    height: `${Math.max(2, (u.count / maxForecast) * 56)}px`,
                    background: u.count > 40 ? 'var(--warn)' : 'var(--accent)',
                    opacity: u.count ? 1 : 0.25,
                  }}
                />
                <span className="nums text-[9px] text-fg-subtle">{u.day.slice(8)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  /* ── Reviewing ─────────────────────────────────────────────────────────── */
  const card = queue[i]
  const def = cardById.get(card.cardId)
  if (!def) {
    // A stored card whose definition has gone (content renamed). Skip it rather
    // than crash, and let it fall out of the queue naturally.
    return (
      <div className="surface p-8 text-center">
        <p className="text-[14px] text-fg-muted">This card is no longer in the content set.</p>
        <Button className="mt-3" onClick={() => setI(i + 1 < queue.length ? i + 1 : 0)}>
          Skip
        </Button>
      </div>
    )
  }
  const meta = CARD_KIND_META[def.kind]

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="nums text-[12px] text-fg-subtle">
          {i + 1} / {queue.length}
        </span>
        <Progress value={i} max={queue.length} height={5} className="flex-1" />
        <Button size="sm" variant="ghost" onClick={() => setQueue(null)}>
          Stop
        </Button>
      </div>

      <div className="surface flex min-h-[340px] flex-col p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge tone="info" title={meta.hint}>
            {meta.label}
          </Badge>
          {card.reps === 0 ? <Badge tone="accent">New</Badge> : null}
          {def.serviceSlugs.slice(0, 3).map((slug) => {
            const svc = serviceBySlug.get(slug)
            if (!svc) return null
            return (
              <span
                key={slug}
                className="inline-flex items-center gap-1.5 text-[11px] text-fg-subtle"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: CATEGORIES[svc.category].token }}
                  aria-hidden
                />
                {serviceLabel(svc)}
              </span>
            )
          })}
        </div>

        <p className="whitespace-pre-line text-[17px] font-medium leading-snug">{def.front}</p>

        <AnimatePresence mode="wait">
          {flipped ? (
            <motion.div
              key="back"
              initial={reduce ? undefined : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 border-t border-border pt-5"
            >
              <p className="whitespace-pre-line text-[15px] leading-relaxed">{def.back}</p>
              {def.extra ? (
                <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-fg-subtle">
                  {def.extra}
                </p>
              ) : null}
              {def.serviceSlugs.length ? (
                <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border pt-3">
                  {def.serviceSlugs.map((slug) => {
                    const svc = serviceBySlug.get(slug)
                    if (!svc) return null
                    return (
                      <Link
                        key={slug}
                        href={`/services/${slug}`}
                        className="rounded-md border border-border bg-bg-inset px-1.5 py-0.5 text-[11.5px] font-medium hover:border-border-strong"
                      >
                        {serviceLabel(svc)} →
                      </Link>
                    )
                  })}
                </div>
              ) : null}
            </motion.div>
          ) : (
            <p className="mt-auto text-[12.5px] text-fg-subtle">
              Answer out loud before flipping. Recognising the answer when you see it is not the same
              as recalling it.{' '}
              <kbd className="rounded border border-border px-1 text-[10px]">space</kbd> to flip.
            </p>
          )}
        </AnimatePresence>

        <div className="mt-6">
          {flipped ? (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {GRADES.map((g, n) => (
                  <button
                    key={g}
                    onClick={() => void grade(g)}
                    title={GRADE_META[g].hint}
                    className={cn(
                      'flex flex-col items-center gap-0.5 rounded-xl border px-3 py-2.5 transition-colors',
                      'border-border hover:border-border-strong hover:bg-bg-overlay',
                    )}
                    style={{ color: `var(--${GRADE_META[g].tone})` }}
                  >
                    <span className="text-[13.5px] font-semibold">{GRADE_META[g].label}</span>
                    <span className="text-[10px] text-fg-subtle">
                      {describeInterval(review(card, g).intervalDays * 86_400_000)}
                    </span>
                    <kbd className="rounded border border-border px-1 text-[9px] text-fg-subtle">
                      {n + 1}
                    </kbd>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-center text-[11.5px] text-fg-subtle">
                Be honest. Grading “Good” on something you barely recalled is the fastest way to make
                this stop working.
              </p>
            </>
          ) : (
            <Button variant="primary" size="lg" className="w-full" onClick={() => setFlipped(true)}>
              Show the answer
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
