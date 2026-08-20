'use client'
import type { MouseEvent } from 'react'
import { CATEGORIES, serviceBySlug, serviceLabel } from '@/content'
import { openService } from '@/lib/service-peek'
import { cn } from '@/lib/cn'

/**
 * An inline reference to a service, anywhere in the app: a real anchor, so
 * ⌘-click and "open in new tab" behave, but a plain click opens the quick-look
 * panel instead of navigating. Use this rather than a bare `<Link>` wherever a
 * service is mentioned in passing — the whole point is that looking it up costs
 * you nothing, including your place.
 */
export function ServiceRef({
  slug,
  label,
  className,
  bare,
}: {
  slug: string
  /** Override the displayed text; defaults to the service's short label. */
  label?: string
  className?: string
  /** Render as plain text rather than a chip — for use inside prose. */
  bare?: boolean
}) {
  const svc = serviceBySlug.get(slug)
  if (!svc) return label ? <>{label}</> : null

  return (
    <a
      href={`/services/${slug}`}
      title={svc.oneLiner}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        e.preventDefault()
        openService(slug)
      }}
      className={cn(
        bare
          ? 'underline decoration-dotted underline-offset-2 hover:text-accent'
          : 'inline-flex items-center gap-1.5 rounded-md border border-border bg-bg-inset px-1.5 py-0.5 text-[11.5px] font-medium transition-colors hover:border-border-strong hover:bg-bg-overlay',
        className,
      )}
    >
      {bare ? null : (
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ background: CATEGORIES[svc.category].token }}
          aria-hidden
        />
      )}
      {label ?? serviceLabel(svc)}
    </a>
  )
}

/**
 * The href + click handler that turns any existing service link into a
 * quick-look trigger, for the places that already have their own markup — a
 * matrix row, a canvas node, a mistake chip. Spread onto an `<a>`, not a
 * `<Link>`: the peek replaces the navigation, and the href is what keeps
 * ⌘-click, middle-click and "copy link address" working.
 */
export function serviceLinkProps(slug: string): {
  href: string
  onClick: (e: MouseEvent) => void
} {
  return {
    href: `/services/${slug}`,
    onClick: (e: MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      e.preventDefault()
      openService(slug)
    },
  }
}
