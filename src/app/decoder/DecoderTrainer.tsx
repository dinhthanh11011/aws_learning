'use client'
import { useMemo, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { CATEGORIES, serviceBySlug, serviceLabel, triggersFor, type Trigger } from '@/content'
import { useProfile } from '@/hooks/useProfile'
import { awardXp } from '@/db/repo'
import { XP } from '@/engines/gamify/rules'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'
import { serviceLinkProps } from '@/components/service/ServiceRef'

type Mode = 'browse' | 'drill'

/**
 * Trigger phrases are the cheapest marks available. A question is a requirement
 * in costume; recognising the costume eliminates two or three options before
 * you have finished reading the stem.
 *
 * Drill mode shows the phrase and hides the answer, because reading a table of
 * these produces recognition, and the exam needs recall.
 */
export function DecoderTrainer() {
  const profile = useProfile()
  const all = useMemo(() => triggersFor(profile.targetCert), [profile.targetCert])
  const [mode, setMode] = useState<Mode>('browse')
  const [order, setOrder] = useState<number[]>([])
  const [i, setI] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [got, setGot] = useState<{ right: number; wrong: number }>({ right: 0, wrong: 0 })
  const reduce = useReducedMotion()

  const startDrill = () => {
    const idx = all.map((_, n) => n)
    for (let n = idx.length - 1; n > 0; n--) {
      const j = Math.floor(Math.random() * (n + 1))
      ;[idx[n], idx[j]] = [idx[j], idx[n]]
    }
    setOrder(idx)
    setI(0)
    setRevealed(false)
    setGot({ right: 0, wrong: 0 })
    setMode('drill')
  }

  const current = mode === 'drill' ? all[order[i]] : null

  const answer = async (knew: boolean) => {
    setGot((g) => ({ right: g.right + (knew ? 1 : 0), wrong: g.wrong + (knew ? 0 : 1) }))
    if (knew) await awardXp(XP.triggerDrilled)
    if (i + 1 >= order.length) {
      setMode('browse')
      return
    }
    setI(i + 1)
    setRevealed(false)
  }

  if (mode === 'drill' && current) {
    const done = i
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <span className="nums text-[12px] text-fg-subtle">
            {done + 1} / {order.length}
          </span>
          <div className="mx-3 h-1 flex-1 overflow-hidden rounded-full bg-bg-inset">
            <div
              className="h-full rounded-full transition-[width] duration-300"
              style={{ width: `${(done / order.length) * 100}%`, background: 'var(--accent)' }}
            />
          </div>
          <span className="nums text-[12px] text-fg-subtle">
            <span className="text-ok">{got.right}</span> · <span className="text-bad">{got.wrong}</span>
          </span>
          <Button size="sm" variant="ghost" onClick={() => setMode('browse')}>
            Stop
          </Button>
        </div>

        <div className="surface flex min-h-[320px] flex-col p-6">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
            A question says…
          </p>
          <p className="mt-2 text-[19px] font-medium leading-snug">{current.phrase}</p>

          <AnimatePresence mode="wait">
            {revealed ? (
              <motion.div
                key="answer"
                initial={reduce ? undefined : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 flex flex-col gap-4 border-t border-border pt-5"
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                    It is really asking for
                  </p>
                  <p className="mt-1 text-[14.5px] leading-relaxed">{current.means}</p>
                </div>

                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ok">
                    Reach for
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {current.slugs.map((s) => (
                      <ServicePill key={s} slug={s} />
                    ))}
                  </div>
                </div>

                {current.notThis.length ? (
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-bad">
                      The trap
                    </p>
                    <ul className="flex flex-col gap-2">
                      {current.notThis.map((n) => (
                        <li key={n.slug} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <ServicePill slug={n.slug} tone="bad" />
                          <span className="text-[13px] leading-relaxed text-fg-muted">{n.why}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </motion.div>
            ) : (
              <motion.p
                key="prompt"
                initial={reduce ? undefined : { opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-auto text-[13px] text-fg-subtle"
              >
                Say the answer out loud before revealing it. Thinking it is not the same thing.
              </motion.p>
            )}
          </AnimatePresence>

          <div className="mt-6 flex gap-2">
            {revealed ? (
              <>
                <Button variant="danger" size="lg" className="flex-1" onClick={() => void answer(false)}>
                  Missed it
                </Button>
                <Button variant="primary" size="lg" className="flex-1" onClick={() => void answer(true)}>
                  Knew it
                </Button>
              </>
            ) : (
              <Button variant="primary" size="lg" className="flex-1" onClick={() => setRevealed(true)}>
                Reveal
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="surface flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-[13.5px] font-medium">{all.length} phrases for {profile.targetCert}</p>
          <p className="mt-0.5 text-[12.5px] text-fg-subtle">
            {got.right + got.wrong > 0
              ? `Last run: ${got.right} known, ${got.wrong} missed.`
              : 'Reading these gives recognition. Drilling them gives recall.'}
          </p>
        </div>
        <Button variant="primary" onClick={startDrill}>
          Drill all {all.length}
        </Button>
      </div>

      <ul className="flex flex-col gap-2.5">
        {all.map((t) => (
          <TriggerRow key={t.id} trigger={t} />
        ))}
      </ul>
    </div>
  )
}

function TriggerRow({ trigger }: { trigger: Trigger }) {
  const [open, setOpen] = useState(false)
  return (
    <li className="surface overflow-hidden p-0">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-bg-overlay"
      >
        <span className="mt-1 shrink-0 text-[11px] text-fg-subtle" aria-hidden>
          {open ? '▾' : '▸'}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13.5px] font-medium leading-snug">{trigger.phrase}</span>
          <span className="mt-1 flex flex-wrap items-center gap-1.5">
            {trigger.slugs.slice(0, 4).map((s) => (
              <ServicePill key={s} slug={s} small />
            ))}
            {trigger.slugs.length > 4 ? (
              <span className="text-[11px] text-fg-subtle">+{trigger.slugs.length - 4}</span>
            ) : null}
            {trigger.notThis.length ? (
              <Badge tone="bad" className="ml-1">
                {trigger.notThis.length} trap{trigger.notThis.length > 1 ? 's' : ''}
              </Badge>
            ) : null}
          </span>
        </span>
      </button>
      {open ? (
        <div className="border-t border-border bg-bg-inset px-4 py-3.5">
          <p className="text-[13.5px] leading-relaxed">{trigger.means}</p>
          {trigger.notThis.length ? (
            <ul className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
              {trigger.notThis.map((n) => (
                <li key={n.slug} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <ServicePill slug={n.slug} tone="bad" small />
                  <span className="text-[13px] leading-relaxed text-fg-muted">{n.why}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </li>
  )
}

function ServicePill({
  slug,
  tone = 'ok',
  small,
}: {
  slug: string
  tone?: 'ok' | 'bad'
  small?: boolean
}) {
  const svc = serviceBySlug.get(slug)
  if (!svc) return null
  return (
    <a
      {...serviceLinkProps(slug)}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border font-medium transition-colors',
        small ? 'px-1.5 py-0.5 text-[11.5px]' : 'px-2 py-1 text-[12.5px]',
        tone === 'ok'
          ? 'border-border bg-bg-raised hover:border-ok/50'
          : 'border-bad/30 bg-bad-soft text-bad hover:border-bad/60',
      )}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ background: CATEGORIES[svc.category].token }}
        aria-hidden
      />
      {serviceLabel(svc)}
    </a>
  )
}
