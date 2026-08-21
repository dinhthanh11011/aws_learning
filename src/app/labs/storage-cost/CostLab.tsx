'use client'
import { useMemo, useState } from 'react'
import { idleCosts, serviceBySlug } from '@/content'
import { recordLab } from '@/db/repo'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { openService } from '@/lib/peek'

/**
 * Two models. The lifecycle side builds intuition for S3 class economics, which
 * is 20% of SAA. The teardown side is more practical: it is the reason a
 * learning account costs $3 a month instead of $80.
 */

interface ClassDef {
  id: string
  label: string
  /** USD per GB-month. */
  storage: number
  /** USD per GB retrieved. */
  retrieval: number
  minDays: number
  access: string
}

// Indicative us-east-1 rates — the point is orders of magnitude, not billing accuracy.
const CLASSES: ClassDef[] = [
  { id: 'standard', label: 'S3 Standard', storage: 0.023, retrieval: 0, minDays: 0, access: 'ms' },
  { id: 'ia', label: 'Standard-IA', storage: 0.0125, retrieval: 0.01, minDays: 30, access: 'ms' },
  { id: 'onezone', label: 'One Zone-IA', storage: 0.01, retrieval: 0.01, minDays: 30, access: 'ms · single AZ' },
  { id: 'gir', label: 'Glacier Instant', storage: 0.004, retrieval: 0.03, minDays: 90, access: 'ms' },
  { id: 'gfr', label: 'Glacier Flexible', storage: 0.0036, retrieval: 0.01, minDays: 90, access: '1 min – 12 h' },
  { id: 'deep', label: 'Glacier Deep Archive', storage: 0.00099, retrieval: 0.02, minDays: 180, access: '12 – 48 h' },
]

export function CostLab() {
  const [gb, setGb] = useState(5000)
  const [readPct, setReadPct] = useState(2)
  const [months, setMonths] = useState(12)
  const [selected, setSelected] = useState<string[]>([])

  const rows = useMemo(() => {
    return CLASSES.map((c) => {
      const storage = gb * c.storage * months
      const retrieved = gb * (readPct / 100) * months
      const retrieval = retrieved * c.retrieval
      // Early deletion is charged as if the object had lived the minimum duration.
      const penalty =
        months * 30 < c.minDays ? gb * c.storage * ((c.minDays - months * 30) / 30) : 0
      return { c, storage, retrieval, penalty, total: storage + retrieval + penalty }
    }).sort((a, b) => a.total - b.total)
  }, [gb, readPct, months])

  const cheapest = rows[0]
  const standard = rows.find((r) => r.c.id === 'standard')!
  const max = Math.max(...rows.map((r) => r.total))

  const idleTotal = idleCosts
    .filter((c) => selected.includes(c.slug))
    .reduce((n, c) => n + c.usdPerMonth, 0)

  return (
    <div className="flex flex-col gap-5">
      <section className="surface p-5">
        <h2 className="text-[15px] font-semibold tracking-tight">S3 class economics</h2>
        <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-fg-muted">
          Move the sliders and watch which class wins. The lesson is that the cheapest *storage* is
          rarely the cheapest *total* — retrieval fees and minimum durations decide it.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Slider label="Data stored" value={gb} min={100} max={100000} step={100} onChange={setGb} format={(v) => `${(v / 1000).toFixed(1)} TB`} />
          <Slider label="Read each month" value={readPct} min={0} max={100} step={1} onChange={setReadPct} format={(v) => `${v}%`} />
          <Slider label="Retained for" value={months} min={1} max={84} step={1} onChange={setMonths} format={(v) => `${v} mo`} />
        </div>

        <ul className="mt-5 flex flex-col gap-2">
          {rows.map((r) => (
            <li key={r.c.id} className="flex flex-wrap items-center gap-3">
              <span className="w-[150px] shrink-0 text-[13px] font-medium">{r.c.label}</span>
              <span className="w-[92px] shrink-0 text-[11px] text-fg-subtle">{r.c.access}</span>
              <span className="relative h-6 min-w-[80px] flex-1 overflow-hidden rounded-md bg-bg-inset">
                <span
                  className="absolute inset-y-0 left-0 rounded-md transition-[width] duration-300"
                  style={{
                    width: `${(r.total / max) * 100}%`,
                    background: r.c.id === cheapest.c.id ? 'var(--ok)' : 'var(--accent)',
                    opacity: r.c.id === cheapest.c.id ? 1 : 0.5,
                  }}
                />
              </span>
              <span className="nums w-[92px] shrink-0 text-right text-[13px] font-semibold">
                ${r.total.toFixed(0)}
              </span>
              {r.penalty > 0 ? (
                <Badge tone="bad" title={`Early-deletion charge for the ${r.c.minDays}-day minimum`}>
                  +${r.penalty.toFixed(0)} early
                </Badge>
              ) : null}
              {r.c.id === cheapest.c.id ? <Badge tone="ok">cheapest</Badge> : null}
            </li>
          ))}
        </ul>

        <div className="mt-4 rounded-xl border border-accent/25 bg-accent-soft p-3">
          <p className="text-[13.5px] leading-relaxed">
            <strong className="font-semibold">{cheapest.c.label}</strong> wins here at $
            {cheapest.total.toFixed(0)} over {months} month{months === 1 ? '' : 's'} —{' '}
            {standard.total > cheapest.total
              ? `saving $${(standard.total - cheapest.total).toFixed(0)} versus Standard.`
              : 'Standard is already the cheapest at this access rate.'}{' '}
            {readPct >= 20
              ? 'At this read rate, retrieval fees dominate and the colder classes lose.'
              : months * 30 < 180
                ? 'Note the early-deletion penalties on classes whose minimum duration you have not met.'
                : 'With reads this rare, storage price is the whole decision.'}
          </p>
        </div>
      </section>

      <section className="surface p-5">
        <h2 className="text-[15px] font-semibold tracking-tight">
          What a forgotten lab actually costs
        </h2>
        <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-fg-muted">
          Tick what you left running. These are hourly-billed resources that cost money doing
          absolutely nothing, and they are also the answer to a good number of cost-optimisation
          questions.
        </p>

        <ul className="mt-4 flex flex-col gap-2">
          {idleCosts.map((c) => {
            const on = selected.includes(c.slug)
            const svc = serviceBySlug.get(c.slug)
            return (
              <li key={c.slug}>
                <button
                  onClick={() =>
                    setSelected((s) => (on ? s.filter((x) => x !== c.slug) : [...s, c.slug]))
                  }
                  aria-pressed={on}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors',
                    on
                      ? 'border-bad/40 bg-bad-soft'
                      : 'border-border hover:border-border-strong hover:bg-bg-overlay',
                  )}
                >
                  <span
                    className={cn(
                      'mt-px grid h-4 w-4 shrink-0 place-items-center rounded text-[10px] font-bold',
                      on ? 'bg-bad text-bg' : 'border border-border-strong',
                    )}
                    aria-hidden
                  >
                    {on ? '✓' : ''}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-2">
                      <span className="text-[13.5px] font-medium">{c.label}</span>
                      <span className="nums text-[13px] font-semibold text-bad">
                        {c.usdPerMonth === 0 ? 'free at lab scale' : `~$${c.usdPerMonth}/mo`}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-[12.5px] leading-snug text-fg-muted">
                      {c.note}
                    </span>
                    {on ? (
                      <span className="mt-1.5 block text-[12.5px] leading-snug text-ok">
                        <strong className="font-semibold">Teardown:</strong> {c.teardown}
                      </span>
                    ) : null}
                  </span>
                  {svc ? (
                    <a
                      href={`/services/${c.slug}`}
                      onClick={(e) => {
                        // The row itself is a toggle; the card link must not flip it.
                        e.stopPropagation()
                        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
                        e.preventDefault()
                        openService(c.slug)
                      }}
                      className="shrink-0 text-[11.5px] text-accent hover:underline"
                    >
                      card →
                    </a>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>

        <div
          className={cn(
            'mt-4 rounded-xl border p-4',
            idleTotal > 50 ? 'border-bad/40 bg-bad-soft' : 'border-border bg-bg-inset',
          )}
        >
          <p className="nums text-[28px] font-semibold leading-none">
            ${idleTotal}
            <span className="text-[14px] font-normal text-fg-subtle">/month</span>
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-fg-muted">
            {idleTotal === 0
              ? 'Nothing selected. This is what a properly torn-down account costs.'
              : idleTotal > 50
                ? `That is $${(idleTotal * 12).toFixed(0)} a year for resources doing nothing — more than both exam fees and every course combined.`
                : `About $${(idleTotal / 30).toFixed(2)} a day. Set a $10 budget alarm with a notification at 50% before you build anything real.`}
          </p>
          {idleTotal > 0 ? (
            <Button
              size="sm"
              variant="secondary"
              className="mt-3"
              onClick={() => void recordLab('storage-cost', Math.min(5, selected.length))}
            >
              I have torn all of this down
            </Button>
          ) : null}
        </div>
      </section>
    </div>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  format: (v: number) => string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
          {label}
        </span>
        <span className="nums text-[13px] font-semibold">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-[var(--accent)]"
      />
    </label>
  )
}
