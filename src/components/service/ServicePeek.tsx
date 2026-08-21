'use client'
import { useEffect, useRef, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import { conceptBySlug, serviceBySlug } from '@/content'
import { ServiceAtlas, ServiceMeta } from '@/components/service/ServiceAtlas'
import { ConceptAtlas, ConceptMeta } from '@/components/service/ConceptAtlas'
import { ConfidenceMark } from '@/components/service/ConfidenceMark'
import {
  backPeek,
  closePeek,
  getPeek,
  getServerPeek,
  openConcept,
  openService,
  subscribePeek,
} from '@/lib/peek'

/**
 * The quick look: the whole atlas card for one service, over whatever you were
 * doing, without leaving it.
 *
 * The reason it is a panel rather than a link is the exam loop. Hitting a
 * service you do not know mid-question and navigating away costs you the
 * question — so in practice you do not look it up, and the gap survives to the
 * real exam. A panel makes looking it up free, which is the only way it
 * actually happens.
 */
export function ServicePeek() {
  const stack = useSyncExternalStore(subscribePeek, getPeek, getServerPeek)
  const target = stack[stack.length - 1]
  const service = target?.kind === 'service' ? serviceBySlug.get(target.slug) : undefined
  const concept = target?.kind === 'concept' ? conceptBySlug.get(target.slug) : undefined
  const reduce = useReducedMotion()

  const panelRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const restoreTo = useRef<HTMLElement | null>(null)

  const open = Boolean(service ?? concept)

  // Remember what had focus so Escape can hand it back — you were mid-question.
  useEffect(() => {
    if (!open) return
    restoreTo.current = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
      restoreTo.current?.focus?.()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => panelRef.current?.focus())
  }, [open])

  // A new card in the stack starts at the top rather than where the last one was.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [target?.kind, target?.slug])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      // The command palette can sit on top of the panel; it owns Escape then.
      if (document.querySelector('[data-dialog="command-palette"]')) return
      if (e.key === 'Escape') {
        e.preventDefault()
        closePeek()
      }
      if (e.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
        )
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        const active = document.activeElement
        if (e.shiftKey && (active === first || active === panelRef.current)) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && active === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open])

  if (!service && !concept) return null

  // One frame, two kinds of card. The header, the back stack and the keyboard
  // handling are identical because to the learner it is the same gesture — the
  // only thing that changes is which atlas renders inside.
  const title = service ? service.name : (concept?.term ?? '')
  const oneLiner = service ? service.oneLiner : (concept?.oneLiner ?? '')
  const fullHref = service ? `/services/${service.slug}` : `/concepts/${concept?.slug}`

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-black/50 backdrop-blur-sm"
      onClick={closePeek}
    >
      <motion.div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`${title} — quick look`}
        initial={reduce ? undefined : { x: 24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full flex-col border-l border-border-strong bg-bg shadow-float outline-none sm:w-[560px]"
      >
        <header className="flex flex-col gap-3 border-b border-border bg-bg-raised px-5 py-4">
          <div className="flex items-start gap-3">
            {stack.length > 1 ? (
              <button
                onClick={backPeek}
                aria-label="Back to the previous card"
                className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-border text-fg-subtle hover:text-fg"
              >
                ←
              </button>
            ) : null}
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[19px] font-semibold tracking-tight">{title}</h2>
              <p className="mt-0.5 text-[13px] leading-snug text-fg-muted">{oneLiner}</p>
            </div>
            <button
              onClick={closePeek}
              aria-label="Close quick look"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-border text-fg-subtle hover:text-fg"
            >
              ✕
            </button>
          </div>
          {service ? <ServiceMeta service={service} /> : null}
          {concept ? <ConceptMeta concept={concept} /> : null}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
            {/* Confidence is tracked per service. A concept has no ring of its
                own — it is drilled through the cards derived from it. */}
            {service ? <ConfidenceMark slug={service.slug} /> : <span />}
            <Link
              href={fullHref}
              onClick={closePeek}
              className="text-[12px] text-fg-subtle underline decoration-dotted hover:text-fg"
            >
              Open the full page →
            </Link>
          </div>
        </header>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {service ? (
            <ServiceAtlas
              service={service}
              layout="panel"
              onOpenService={openService}
              onOpenConcept={openConcept}
            />
          ) : null}
          {concept ? (
            <ConceptAtlas
              concept={concept}
              layout="panel"
              onOpenConcept={openConcept}
              onOpenService={openService}
            />
          ) : null}
        </div>

        <footer className="flex items-center gap-3 border-t border-border bg-bg-raised px-5 py-2 text-[11px] text-fg-subtle">
          <span>
            <kbd className="rounded border border-border px-1 py-px">esc</kbd> close
          </span>
          <span>
            <kbd className="rounded border border-border px-1 py-px">s</kbd> next service in view
          </span>
          <span className="ml-auto">Nothing you were doing was lost.</span>
        </footer>
      </motion.div>
    </div>
  )
}
