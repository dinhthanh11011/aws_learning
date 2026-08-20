'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { BP_NODES, FLOWS, LAYER_DEFS, LAYERS, type LayerId } from '@/content/big-picture'
import { CATEGORIES, serviceBySlug, serviceLabel } from '@/content'
import { useMasteryInput } from '@/hooks/useMastery'
import { serviceMastery } from '@/engines/progress/mastery'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { serviceLinkProps } from '@/components/service/ServiceRef'

/**
 * Every service in a real system, on one canvas, tinted by how well *you* know
 * it — so the gaps are visible rather than something you have to remember to
 * check. The flow overlays are the reason this beats a static architecture
 * diagram: you can watch what depends on what.
 */
export function BigPictureCanvas() {
  const [activeFlow, setActiveFlow] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [tinted, setTinted] = useState(true)
  const reduce = useReducedMotion()
  const timer = useRef<number | null>(null)

  const masteryInput = useMasteryInput()
  const rings = useMemo(() => {
    if (!masteryInput) return new Map<string, number>()
    return new Map(
      BP_NODES.map((n) => {
        const svc = serviceBySlug.get(n.slug)
        return [n.slug, svc ? serviceMastery(svc, masteryInput).rings : 0]
      }),
    )
  }, [masteryInput])

  const flow = FLOWS.find((f) => f.id === activeFlow) ?? null
  const highlighted = useMemo(() => new Set(flow?.path ?? []), [flow])
  const current = flow?.path[step] ?? null

  // Auto-advance through the flow. Anyone who asked for reduced motion gets the
  // steps without the travel animation, so the content is identical.
  useEffect(() => {
    if (!playing || !flow) return
    timer.current = window.setTimeout(() => {
      setStep((s) => {
        if (s + 1 >= flow.path.length) {
          setPlaying(false)
          return s
        }
        return s + 1
      })
    }, reduce ? 1400 : 2200)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [playing, step, flow, reduce])

  const selectFlow = (id: string | null) => {
    setActiveFlow(id)
    setStep(0)
    setPlaying(Boolean(id))
  }

  const byLayer = (layer: LayerId) =>
    BP_NODES.filter((n) => n.layer === layer).sort((a, b) => a.col - b.col)

  return (
    <div className="flex flex-col gap-4">
      {/* Flow selector — the interactive half of the page. */}
      <div className="surface flex flex-col gap-3 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
            Trace a flow
          </span>
          <div className="ml-auto flex items-center gap-2">
            <label className="flex cursor-pointer items-center gap-1.5 text-[12px] text-fg-muted">
              <input
                type="checkbox"
                checked={tinted}
                onChange={(e) => setTinted(e.target.checked)}
                className="accent-[var(--accent)]"
              />
              Tint by my mastery
            </label>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => selectFlow(null)}
            className={cn(
              'rounded-lg border px-2.5 py-1 text-[12px] transition-colors',
              !activeFlow
                ? 'border-accent/40 bg-accent-soft font-medium text-accent'
                : 'border-border text-fg-muted hover:border-border-strong hover:text-fg',
            )}
          >
            Just the map
          </button>
          {FLOWS.map((f) => (
            <button
              key={f.id}
              onClick={() => selectFlow(f.id)}
              title={f.question}
              className={cn(
                'rounded-lg border px-2.5 py-1 text-[12px] transition-colors',
                activeFlow === f.id
                  ? 'border-accent/40 bg-accent-soft font-medium text-accent'
                  : 'border-border text-fg-muted hover:border-border-strong hover:text-fg',
              )}
            >
              {f.title}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* The canvas */}
        <div className="relative min-w-0 overflow-x-auto">
          <div className="flex min-w-[680px] flex-col gap-2.5">
            {LAYERS.map((layerId) => {
              const def = LAYER_DEFS[layerId]
              const nodes = byLayer(layerId)
              const isSide = layerId === 'crosscut'
              return (
                <section
                  key={layerId}
                  className={cn(
                    'relative rounded-[16px] border p-3 transition-colors',
                    isSide ? 'border-dashed border-border bg-bg-inset/60' : 'border-border bg-bg-raised',
                  )}
                >
                  <div className="mb-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="text-[13px] font-semibold tracking-tight">{def.title}</h3>
                    <p className="text-[12px] italic text-fg-subtle">{def.question}</p>
                  </div>
                  <ul className="flex flex-wrap gap-2">
                    {nodes.map((n) => {
                      const svc = serviceBySlug.get(n.slug)
                      if (!svc) return null
                      const cat = CATEGORIES[n.category]
                      const ring = rings.get(n.slug) ?? 0
                      const dimmed = flow ? !highlighted.has(n.slug) : false
                      const isCurrent = current === n.slug
                      const idx = flow?.path.indexOf(n.slug) ?? -1

                      return (
                        <li key={n.slug}>
                          <a
                            {...serviceLinkProps(n.slug)}
                            title={`${svc.name} — ${n.role}`}
                            className={cn(
                              'group relative flex w-[132px] flex-col gap-1 overflow-hidden rounded-xl border p-2.5 transition-all duration-300',
                              dimmed
                                ? 'border-border opacity-25'
                                : 'border-border hover:border-border-strong hover:bg-bg-overlay',
                              isCurrent && 'scale-[1.04] border-accent shadow-float',
                            )}
                            style={{
                              background: isCurrent
                                ? 'var(--accent-soft)'
                                : tinted && ring > 0
                                  ? `color-mix(in oklab, var(--ok) ${ring * 7}%, var(--bg-inset))`
                                  : 'var(--bg-inset)',
                            }}
                          >
                            <span
                              className="absolute inset-x-0 top-0 h-[3px]"
                              style={{ background: cat.token }}
                              aria-hidden
                            />
                            {idx >= 0 && flow ? (
                              <span
                                className={cn(
                                  'nums absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold',
                                  isCurrent ? 'bg-accent text-accent-fg' : 'bg-bg-overlay text-fg-subtle',
                                )}
                              >
                                {idx + 1}
                              </span>
                            ) : null}
                            <span className="mt-1 truncate text-[12.5px] font-semibold leading-tight">
                              {serviceLabel(svc)}
                            </span>
                            <span className="line-clamp-2 text-[10.5px] leading-tight text-fg-subtle">
                              {n.role}
                            </span>
                            {/* Mastery pips: five is legible at this size, a bar is not. */}
                            <span className="mt-0.5 flex gap-[3px]" aria-label={`Mastery ${ring} of 5`}>
                              {[0, 1, 2, 3, 4].map((i) => (
                                <span
                                  key={i}
                                  className="h-[3px] flex-1 rounded-full"
                                  style={{
                                    background: i < ring ? 'var(--ok)' : 'var(--border)',
                                  }}
                                />
                              ))}
                            </span>
                          </a>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )
            })}
          </div>
        </div>

        {/* Narration panel */}
        <aside className="flex flex-col gap-4">
          {flow ? (
            <>
              <div className="surface p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-[14px] font-semibold">{flow.title}</h3>
                    <p className="mt-0.5 text-[12.5px] italic text-fg-subtle">{flow.question}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={playing ? 'secondary' : 'primary'}
                    onClick={() => {
                      if (step >= flow.path.length - 1) setStep(0)
                      setPlaying((p) => !p)
                    }}
                  >
                    {playing ? '❚❚' : step >= flow.path.length - 1 ? '↻' : '▶'}
                  </Button>
                </div>

                <ol className="flex flex-col gap-2">
                  {flow.path.map((slug, i) => {
                    const svc = serviceBySlug.get(slug)
                    const active = i === step
                    const past = i < step
                    return (
                      <li key={`${slug}-${i}`}>
                        <button
                          onClick={() => {
                            setStep(i)
                            setPlaying(false)
                          }}
                          className={cn(
                            'flex w-full gap-2.5 rounded-lg p-2 text-left transition-colors',
                            active ? 'bg-accent-soft' : past ? 'opacity-60' : 'opacity-90',
                            'hover:bg-bg-overlay',
                          )}
                        >
                          <span
                            className={cn(
                              'nums mt-px grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] font-bold',
                              active ? 'bg-accent text-accent-fg' : 'bg-bg-overlay text-fg-subtle',
                            )}
                          >
                            {i + 1}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[12px] font-semibold">
                              {svc ? serviceLabel(svc) : slug}
                            </span>
                            {active ? (
                              <motion.span
                                initial={reduce ? undefined : { opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-1 block text-[12.5px] leading-relaxed text-fg-muted"
                              >
                                {flow.steps[i]}
                              </motion.span>
                            ) : null}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ol>
              </div>

              <div className="surface border-bad/25 p-4">
                <h3 className="mb-1 flex items-center gap-1.5 text-[13px] font-semibold text-bad">
                  <span aria-hidden>⚠</span> When this breaks
                </h3>
                <p className="mb-3 text-[12px] text-fg-subtle">
                  Exam questions ask “this is broken, why?” far more often than “what is this?”.
                </p>
                <ul className="flex flex-col gap-3">
                  {flow.failures.map((f) => {
                    const svc = serviceBySlug.get(f.at)
                    return (
                      <li key={f.at + f.symptom}>
                        <a
                          {...serviceLinkProps(f.at)}
                          className="text-[12px] font-semibold hover:text-accent"
                        >
                          {svc ? serviceLabel(svc) : f.at}
                        </a>
                        <p className="mt-0.5 text-[12.5px] leading-relaxed text-fg-muted">
                          {f.symptom}
                        </p>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </>
          ) : (
            <>
              {LAYERS.map((id) => (
                <div key={id} className="surface p-4">
                  <h3 className="text-[13px] font-semibold">{LAYER_DEFS[id].title}</h3>
                  <p className="mt-0.5 text-[12px] italic text-fg-subtle">
                    {LAYER_DEFS[id].question}
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-fg-muted">
                    {LAYER_DEFS[id].blurb}
                  </p>
                </div>
              ))}
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
