'use client'
import Link from 'next/link'
import {
  CATEGORIES,
  CONCEPT_GROUP_META,
  conceptLabel,
  conceptsForService,
  domainById,
  idleCosts,
  serviceBySlug,
  tasksForService,
  TIER_META,
  triggers,
  type Service,
} from '@/content'
import { Badge } from '@/components/ui/Badge'
import { FamilyBadges } from '@/components/service/FamilyBadges'
import { ServiceTile } from '@/components/service/ServiceCard'
import { cn } from '@/lib/cn'

/**
 * Everything the atlas knows about one service, rendered once and used twice:
 * on `/services/[slug]` as a two-column page, and inside the quick-look panel
 * as a single column. Two renderers would drift, and the moment they drift the
 * panel becomes a summary — which is exactly the thing that sent you hunting
 * through the full page in the first place.
 *
 * `onOpenService` is how the panel keeps you in place: given it, links to other
 * services push onto the quick-look stack instead of navigating. They stay real
 * anchors either way, so ⌘-click still opens the page in a new tab.
 */
export function ServiceAtlas({
  service: s,
  layout = 'page',
  onOpenService,
  onOpenConcept,
}: {
  service: Service
  layout?: 'page' | 'panel'
  onOpenService?: (slug: string) => void
  onOpenConcept?: (slug: string) => void
}) {
  const panel = layout === 'panel'
  // One padding value per column, so every heading in a column starts on the
  // same left edge. Mixed p-4/p-5 reads as a wobble when the cards are stacked.
  const pad = panel ? 'p-4' : 'p-5'
  // One heading recipe for every section. Colour is the only thing that varies —
  // mixed case and tracking made the stack read as several different documents.
  const h2 = 'mb-3 text-[13px] font-semibold uppercase tracking-wide'
  // Sections that follow their heading with a caption own the gap themselves.
  const h2Tight = h2.replace('mb-3', 'mb-1')
  const relatedTasks = tasksForService(s.slug)
  const relatedTriggers = triggers.filter(
    (t) => t.slugs.includes(s.slug) || t.notThis.some((n) => n.slug === s.slug),
  )
  const idle = idleCosts.find((c) => c.slug === s.slug)
  const related = s.related.map((r) => serviceBySlug.get(r)).filter((r): r is Service => Boolean(r))
  const assumedConcepts = conceptsForService(s.slug)

  const ServiceLink = ({
    slug,
    children,
    className,
  }: {
    slug: string
    children: React.ReactNode
    className?: string
  }) => (
    <a
      href={`/services/${slug}`}
      onClick={(e) => {
        // Let the browser have modified clicks — new tab, new window, download.
        if (!onOpenService || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        e.preventDefault()
        onOpenService(slug)
      }}
      className={className}
    >
      {children}
    </a>
  )

  const ConceptLink = ({
    slug,
    children,
    className,
    title,
  }: {
    slug: string
    children: React.ReactNode
    className?: string
    title?: string
  }) => (
    <a
      href={`/concepts/${slug}`}
      title={title}
      onClick={(e) => {
        if (!onOpenConcept || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        e.preventDefault()
        onOpenConcept(slug)
      }}
      className={className}
    >
      {children}
    </a>
  )

  const whatItIs = (
    <section className={cn('surface', pad)}>
      <h2 className={cn(h2, 'text-fg-subtle')}>What it is</h2>
      <p className="text-[14.5px] leading-relaxed">{s.whatItIs}</p>
    </section>
  )

  /**
   * Motivation before mechanism. "What it is" answers a question the learner
   * has not asked yet — this one says what someone was doing before the service
   * existed and why it hurt, which is what makes the rest worth reading.
   * Optional, so it simply does not render on the entries that lack it.
   */
  const whyItExists = s.whyItExists ? (
    <section className={cn('surface border-accent/25', pad)}>
      <h2 className={cn(h2, 'text-accent')}>Why it exists</h2>
      <p className="text-[14.5px] leading-relaxed">{s.whyItExists}</p>
    </section>
  ) : null

  const whenTo = (
    <div className={cn('grid gap-4', panel ? '' : 'sm:grid-cols-2')}>
      <section className={cn('surface border-ok/25', pad)}>
        <h2 className={cn(h2, 'flex items-center gap-1.5 text-ok')}>
          <span aria-hidden>✓</span> Reach for it when
        </h2>
        <ul className="flex flex-col gap-2">
          {s.whenToUse.map((w) => (
            <li key={w} className="flex gap-2 text-[13.5px] leading-snug text-fg-muted">
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ok" aria-hidden />
              {w}
            </li>
          ))}
        </ul>
      </section>

      {/* The half most study material skips, and the half that wins scenario questions. */}
      <section className={cn('surface border-bad/25', pad)}>
        <h2 className={cn(h2, 'flex items-center gap-1.5 text-bad')}>
          <span aria-hidden>✗</span> Do <em className="not-italic underline">not</em> reach for it
          when
        </h2>
        <ul className="flex flex-col gap-2">
          {s.whenNotToUse.map((w) => (
            <li key={w} className="flex gap-2 text-[13.5px] leading-snug text-fg-muted">
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-bad" aria-hidden />
              {w}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )

  const traps = s.examTraps.length ? (
    <section className={cn('surface border-warn/30', pad)}>
      <h2 className={cn(h2Tight, 'flex items-center gap-1.5 text-warn')}>
        <span aria-hidden>⚠</span> Exam traps
      </h2>
      <p className="mb-3 text-[12px] text-fg-subtle">
        The specific ways this service is used to make a wrong answer look right.
      </p>
      <ol className="flex flex-col gap-3">
        {s.examTraps.map((t, i) => (
          <li key={t} className="flex gap-3">
            <span className="nums mt-px shrink-0 text-[12px] font-semibold text-warn">
              {String(i + 1).padStart(2, '0')}
            </span>
            <p className="text-[13.5px] leading-relaxed text-fg-muted">{t}</p>
          </li>
        ))}
      </ol>
    </section>
  ) : null

  const confused = s.confusedWith.length ? (
    <section className={cn('surface', pad)}>
      <h2 className={cn(h2Tight, 'text-fg-subtle')}>Commonly confused with</h2>
      <p className="mb-3 text-[12px] text-fg-subtle">
        Two plausible options in the same question. Here is the line between them.
      </p>
      <ul className="flex flex-col divide-y divide-border">
        {s.confusedWith.map((c) => {
          const other = serviceBySlug.get(c.slug)
          return (
            <li key={c.slug} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
              <ServiceLink
                slug={c.slug}
                className="flex items-center gap-2 text-[13.5px] font-medium hover:text-accent"
              >
                {other ? (
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: CATEGORIES[other.category].token }}
                    aria-hidden
                  />
                ) : null}
                {other?.name ?? c.slug}
              </ServiceLink>
              <p className="text-[13.5px] leading-relaxed text-fg-muted">{c.difference}</p>
            </li>
          )
        })}
      </ul>
    </section>
  ) : null

  const phrases = relatedTriggers.length ? (
    <section className={cn('surface', pad)}>
      <h2 className={cn(h2Tight, 'text-fg-subtle')}>Question phrases that point here</h2>
      <p className="mb-3 text-[12px] text-fg-subtle">
        Spot these in a stem and you have narrowed the options before finishing it.
      </p>
      <ul className="flex flex-col gap-3">
        {relatedTriggers.map((t) => {
          const isDistractor = t.notThis.some((n) => n.slug === s.slug)
          const note = t.notThis.find((n) => n.slug === s.slug)
          return (
            <li key={t.id} className="rounded-xl border border-border bg-bg-inset p-3">
              <p className="text-[13px] font-medium">{t.phrase}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">{t.means}</p>
              {isDistractor ? (
                <p className="mt-2 flex gap-2 text-[12.5px] leading-relaxed text-bad">
                  <span aria-hidden>✗</span>
                  <span>
                    Here {s.name} is the <strong className="font-semibold">distractor</strong>:{' '}
                    {note?.why}
                  </span>
                </p>
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  ) : null

  const numbers = s.keyNumbers.length ? (
    <section className={cn('surface', panel ? pad : 'p-4')}>
      <h2 className={cn(h2, 'text-fg-subtle')}>The numbers</h2>
      <dl className="flex flex-col gap-3">
        {s.keyNumbers.map((n) => (
          <div key={n.label}>
            <dt className="text-[11.5px] uppercase tracking-wide text-fg-subtle">
              {n.label}
              {n.volatile ? (
                <span
                  className="ml-1.5 text-warn"
                  title="AWS changes this — verify before relying on it"
                >
                  verify
                </span>
              ) : null}
            </dt>
            <dd className="nums text-[13.5px] font-medium leading-snug">{n.value}</dd>
            {n.note ? (
              <dd className="mt-0.5 text-[12px] leading-snug text-fg-subtle">{n.note}</dd>
            ) : null}
          </div>
        ))}
      </dl>
    </section>
  ) : null

  const pricing = s.pricing ? (
    <section className={cn('surface', panel ? pad : 'p-4')}>
      <h2 className={cn(h2, 'text-fg-subtle')}>How it is billed</h2>
      <p className="text-[13px] leading-relaxed text-fg-muted">{s.pricing}</p>
    </section>
  ) : null

  const idleCost = idle ? (
    <section className={cn('surface border-bad/30', panel ? pad : 'p-4')}>
      <h2 className={cn(h2Tight, 'flex items-center gap-1.5 text-bad')}>
        <span aria-hidden>💸</span> Costs money while idle
      </h2>
      <p className="nums mb-2 text-[20px] font-semibold text-bad">
        ~${idle.usdPerMonth}
        <span className="text-[13px] font-normal text-fg-subtle">/month</span>
      </p>
      <p className="text-[12.5px] leading-relaxed text-fg-muted">{idle.note}</p>
      <p className="mt-2 border-t border-border pt-2 text-[12.5px] leading-relaxed text-fg-muted">
        <strong className="font-semibold text-fg">Teardown:</strong> {idle.teardown}
      </p>
    </section>
  ) : null

  /**
   * The primitives this entry takes for granted. Before the concept corpus
   * existed, a card could say "route table" ten times and define it nowhere —
   * this is the link back to the definition.
   */
  const assumes = assumedConcepts.length ? (
    <section className={cn('surface', panel ? pad : 'p-4')}>
      <h2 className={cn(h2Tight, 'text-fg-subtle')}>Assumes you know</h2>
      <p className="mb-3 text-[12px] text-fg-subtle">
        Primitives this card uses without defining them.
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {assumedConcepts.map((c) => (
          <li key={c.slug}>
            <ConceptLink
              slug={c.slug}
              title={c.oneLiner}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg-inset px-2 py-1 text-[12px] font-medium hover:border-border-strong hover:bg-bg-overlay"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: CONCEPT_GROUP_META[c.group].token }}
                aria-hidden
              />
              {conceptLabel(c)}
            </ConceptLink>
          </li>
        ))}
      </ul>
    </section>
  ) : null

  const examined = relatedTasks.length ? (
    <section className={cn('surface', panel ? pad : 'p-4')}>
      <h2 className={cn(h2, 'text-fg-subtle')}>Examined under</h2>
      <ul className="flex flex-col gap-2">
        {relatedTasks.map((t) => {
          const d = domainById.get(t.domainId)
          return (
            <li key={t.id}>
              <Link href={`/map#${t.id}`} className="group block">
                <span className="text-[12.5px] font-medium group-hover:text-accent">
                  {t.code} {t.title}
                </span>
                <span className="block text-[11px] text-fg-subtle">
                  {d?.title} · {d?.weight}% of the paper
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  ) : null

  const alongside = related.length ? (
    <section className={panel ? cn('surface', pad) : 'mt-8'}>
      <h2 className={cn(h2, 'text-fg-subtle')}>Studied alongside</h2>
      {panel ? (
        <ul className="flex flex-wrap gap-1.5">
          {related.map((r) => (
            <li key={r.slug}>
              <ServiceLink
                slug={r.slug}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg-inset px-2 py-1 text-[12px] font-medium hover:border-border-strong hover:bg-bg-overlay"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: CATEGORIES[r.category].token }}
                  aria-hidden
                />
                {r.name}
              </ServiceLink>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {related.map((r) => (
            <li key={r.slug} className="contents">
              <ServiceTile service={r} />
            </li>
          ))}
        </ul>
      )}
    </section>
  ) : null

  if (panel) {
    // Ordered for a glance mid-question: one line of orientation first — the
    // numbers mean nothing if you cannot place the service — then the two
    // things you actually came for.
    return (
      <div className="flex flex-col gap-4">
        {whyItExists}
        {whatItIs}
        {numbers}
        {traps}
        {whenTo}
        {confused}
        {assumes}
        {pricing}
        {idleCost}
        {phrases}
        {examined}
        {alongside}
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-5">
          {whyItExists}
          {whatItIs}
          {whenTo}
          {traps}
          {confused}
          {phrases}
        </div>
        <aside className="flex flex-col gap-4">
          {numbers}
          {assumes}
          {pricing}
          {idleCost}
          {examined}
        </aside>
      </div>
      {alongside}
    </>
  )
}

/** The identity strip — category, tier, certs, docs — shared by page and panel. */
export function ServiceMeta({ service: s, className }: { service: Service; className?: string }) {
  const cat = CATEGORIES[s.category]
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <Badge tone="neutral">
        <span
          className="mr-1 inline-block h-2 w-2 rounded-full align-middle"
          style={{ background: cat.token }}
          aria-hidden
        />
        {cat.label}
      </Badge>
      <Badge
        tone={s.tier === 1 ? 'accent' : s.tier === 2 ? 'info' : 'neutral'}
        title={TIER_META[s.tier].blurb}
      >
        {TIER_META[s.tier].label}
      </Badge>
      <FamilyBadges item={s} />
      <a
        href={s.docsUrl}
        target="_blank"
        rel="noreferrer"
        className="ml-auto text-[12px] text-fg-subtle underline decoration-dotted hover:text-fg"
      >
        AWS docs ↗
      </a>
    </div>
  )
}
