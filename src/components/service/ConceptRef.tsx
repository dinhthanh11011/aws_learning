'use client'
import type { MouseEvent } from 'react'
import Link from 'next/link'
import { CONCEPT_GROUP_META, conceptBySlug, conceptLabel, type Concept } from '@/content'
import { openConcept } from '@/lib/peek'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'

/**
 * An inline reference to a concept, with exactly the behaviour `ServiceRef`
 * has: a real anchor so ⌘-click works, a plain click opens the quick look.
 *
 * The point is the same and slightly sharper here — a learner who does not know
 * what a route table is will not navigate away mid-question to find out, so the
 * definition has to arrive without costing them their place.
 */
export function ConceptRef({
  slug,
  label,
  className,
  bare,
}: {
  slug: string
  /** Override the displayed text; defaults to the abbreviation or the term. */
  label?: string
  className?: string
  /** Render as plain text rather than a chip — for use inside prose. */
  bare?: boolean
}) {
  const c = conceptBySlug.get(slug)
  if (!c) return label ? <>{label}</> : null

  return (
    <a
      href={`/concepts/${slug}`}
      title={c.oneLiner}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        e.preventDefault()
        openConcept(slug)
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
          style={{ background: CONCEPT_GROUP_META[c.group].token }}
          aria-hidden
        />
      )}
      {label ?? conceptLabel(c)}
    </a>
  )
}

/** The href + click handler, for callers that already have their own markup. */
export function conceptLinkProps(slug: string): {
  href: string
  onClick: (e: MouseEvent) => void
} {
  return {
    href: `/concepts/${slug}`,
    onClick: (e: MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      e.preventDefault()
      openConcept(slug)
    },
  }
}

/** Grid tile for the concept browser, matching `ServiceTile`. */
export function ConceptTile({ concept: c, className }: { concept: Concept; className?: string }) {
  const group = CONCEPT_GROUP_META[c.group]
  return (
    <Link
      href={`/concepts/${c.slug}`}
      className={cn(
        'group relative flex flex-col gap-2 overflow-hidden rounded-[14px] border border-border bg-bg-raised p-3.5',
        'transition-all duration-150 hover:border-border-strong hover:bg-bg-overlay',
        className,
      )}
    >
      <span
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: group.token }}
        aria-hidden
      />
      <div className="min-w-0 pl-1.5">
        <h3 className="truncate text-[14px] font-semibold leading-tight">{c.term}</h3>
        <p className="mt-0.5 text-[11px] text-fg-subtle">
          {c.abbr ? `${c.abbr} · ` : ''}
          {group.label}
        </p>
      </div>
      <p className="line-clamp-2 pl-1.5 text-[12.5px] leading-snug text-fg-muted">{c.oneLiner}</p>
      <div className="flex flex-wrap items-center gap-1.5 pl-1.5">
        {c.certs.map((cert) => (
          <Badge key={cert}>{cert === 'SAA-C03' ? 'SAA' : 'DVA'}</Badge>
        ))}
        {c.examTraps.length ? (
          <Badge tone="warn" title={`${c.examTraps.length} exam traps documented`}>
            ⚠ {c.examTraps.length}
          </Badge>
        ) : null}
      </div>
    </Link>
  )
}
