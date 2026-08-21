'use client'
import Link from 'next/link'
import { CATEGORIES, serviceLabel, TIER_META, type Service } from '@/content'
import { MasteryRing } from '@/components/ui/MasteryRing'
import { Badge } from '@/components/ui/Badge'
import { FamilyBadges } from '@/components/service/FamilyBadges'
import { cn } from '@/lib/cn'
import { serviceLinkProps } from '@/components/service/ServiceRef'

export function ServiceTile({
  service,
  rings,
  className,
}: {
  service: Service
  rings?: number
  className?: string
}) {
  const cat = CATEGORIES[service.category]
  return (
    <Link
      href={`/services/${service.slug}`}
      className={cn(
        'group relative flex flex-col gap-2 overflow-hidden rounded-[14px] border border-border bg-bg-raised p-3.5',
        'transition-all duration-150 hover:border-border-strong hover:bg-bg-overlay',
        className,
      )}
    >
      {/* Category stripe — the one visual cue that survives being scanned fast. */}
      <span
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: cat.token }}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-2 pl-1.5">
        <div className="min-w-0">
          <h3 className="truncate text-[14px] font-semibold leading-tight">{service.name}</h3>
          <p className="mt-0.5 text-[11px] text-fg-subtle">{cat.short}</p>
        </div>
        {rings === undefined ? null : (
          <MasteryRing rings={rings} size={22} showEmpty={false} />
        )}
      </div>
      <p className="line-clamp-2 pl-1.5 text-[12.5px] leading-snug text-fg-muted">
        {service.oneLiner}
      </p>
      <div className="flex flex-wrap items-center gap-1.5 pl-1.5">
        <Badge tone={service.tier === 1 ? 'accent' : service.tier === 2 ? 'info' : 'neutral'}>
          {TIER_META[service.tier].label}
        </Badge>
        <FamilyBadges item={service} />
        {service.examTraps.length ? (
          <Badge tone="warn" title={`${service.examTraps.length} exam traps documented`}>
            ⚠ {service.examTraps.length}
          </Badge>
        ) : null}
      </div>
    </Link>
  )
}

/** Compact chip for inline service references inside prose. Opens the quick look. */
export function ServiceChip({ slug, name, category }: { slug: string; name: string; category: keyof typeof CATEGORIES }) {
  return (
    <a
      {...serviceLinkProps(slug)}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg-inset px-1.5 py-0.5 text-[12px] font-medium transition-colors hover:border-border-strong hover:bg-bg-overlay"
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ background: CATEGORIES[category].token }}
        aria-hidden
      />
      {name}
    </a>
  )
}

export { serviceLabel }
