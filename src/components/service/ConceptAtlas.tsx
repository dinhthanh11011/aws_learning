'use client'
import {
  CATEGORIES,
  CONCEPT_GROUP_META,
  conceptBySlug,
  conceptLabel,
  serviceBySlug,
  type Concept,
  type Service,
} from '@/content'
import { Badge } from '@/components/ui/Badge'
import { FamilyBadges } from '@/components/service/FamilyBadges'
import { cn } from '@/lib/cn'

/**
 * Everything the atlas knows about one concept, rendered once and used twice —
 * on `/concepts/[slug]` as a two-column page and in the quick-look panel as a
 * single column, exactly as `ServiceAtlas` is.
 *
 * A separate renderer rather than a widened `ServiceAtlas` because the sections
 * genuinely differ: a concept has no pricing, no idle cost and no category, and
 * it has a key idea and an "on the exam" list that a service entry does not.
 * The shared part is the visual recipe below, deliberately copied from
 * `ServiceAtlas` so the two cards read as one system.
 */
export function ConceptAtlas({
  concept: c,
  layout = 'page',
  onOpenConcept,
  onOpenService,
}: {
  concept: Concept
  layout?: 'page' | 'panel'
  onOpenConcept?: (slug: string) => void
  onOpenService?: (slug: string) => void
}) {
  const panel = layout === 'panel'
  const pad = panel ? 'p-4' : 'p-5'
  const h2 = 'mb-3 text-[13px] font-semibold uppercase tracking-wide'
  const h2Tight = h2.replace('mb-3', 'mb-1')

  const usedBy = c.serviceSlugs
    .map((s) => serviceBySlug.get(s))
    .filter((s): s is Service => Boolean(s))
  const relatedConcepts = c.related
    .map((r) => conceptBySlug.get(r))
    .filter((r): r is Concept => Boolean(r))

  const ConceptLink = ({
    slug,
    children,
    className,
  }: {
    slug: string
    children: React.ReactNode
    className?: string
  }) => (
    <a
      href={`/concepts/${slug}`}
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
        if (!onOpenService || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        e.preventDefault()
        onOpenService(slug)
      }}
      className={className}
    >
      {children}
    </a>
  )

  /**
   * The key idea leads, above even "what it is". A definition tells you what
   * the word means; this is the sentence that decides questions, and it is the
   * one the drill card asks for.
   */
  const keyIdea = (
    <section className={cn('surface border-accent/40 bg-accent-soft', pad)}>
      <h2 className={cn(h2, 'text-accent')}>The idea that decides questions</h2>
      <p className="text-[14.5px] font-medium leading-relaxed">{c.keyIdea}</p>
    </section>
  )

  /**
   * Sits below `keyIdea` rather than above it: the rule that decides questions
   * is still the thing worth the most marks, so it keeps the top slot. This one
   * answers the question a learner asks *before* they will accept the rule —
   * why does this idea need to exist at all.
   */
  const whyItExists = c.whyItExists ? (
    <section className={cn('surface border-accent/25', pad)}>
      <h2 className={cn(h2, 'text-accent')}>Why it exists</h2>
      <p className="text-[14.5px] leading-relaxed">{c.whyItExists}</p>
    </section>
  ) : null

  const whatItIs = (
    <section className={cn('surface', pad)}>
      <h2 className={cn(h2, 'text-fg-subtle')}>What it is</h2>
      <p className="text-[14.5px] leading-relaxed">{c.whatItIs}</p>
    </section>
  )

  const onTheExam = c.onTheExam.length ? (
    <section className={cn('surface border-info/30', pad)}>
      <h2 className={cn(h2Tight, 'text-info')}>How it shows up on the exam</h2>
      <p className="mb-3 text-[12px] text-fg-subtle">
        The phrasings that mean a question is really about this.
      </p>
      <ul className="flex flex-col gap-2">
        {c.onTheExam.map((e) => (
          <li key={e} className="flex gap-2 text-[13.5px] leading-snug text-fg-muted">
            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-info" aria-hidden />
            {e}
          </li>
        ))}
      </ul>
    </section>
  ) : null

  const traps = c.examTraps.length ? (
    <section className={cn('surface border-warn/30', pad)}>
      <h2 className={cn(h2Tight, 'flex items-center gap-1.5 text-warn')}>
        <span aria-hidden>⚠</span> Exam traps
      </h2>
      <p className="mb-3 text-[12px] text-fg-subtle">
        The specific ways this idea is used to make a wrong answer look right.
      </p>
      <ol className="flex flex-col gap-3">
        {c.examTraps.map((t, i) => (
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

  const confused = c.confusedWith.length ? (
    <section className={cn('surface', pad)}>
      <h2 className={cn(h2Tight, 'text-fg-subtle')}>Commonly confused with</h2>
      <p className="mb-3 text-[12px] text-fg-subtle">
        Two terms a stem can use interchangeably. Here is the line between them.
      </p>
      <ul className="flex flex-col divide-y divide-border">
        {c.confusedWith.map((other) => {
          const target = conceptBySlug.get(other.slug)
          return (
            <li key={other.slug} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
              <ConceptLink
                slug={other.slug}
                className="flex items-center gap-2 text-[13.5px] font-medium hover:text-accent"
              >
                {target ? (
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: CONCEPT_GROUP_META[target.group].token }}
                    aria-hidden
                  />
                ) : null}
                {target?.term ?? other.slug}
              </ConceptLink>
              <p className="text-[13.5px] leading-relaxed text-fg-muted">{other.difference}</p>
            </li>
          )
        })}
      </ul>
    </section>
  ) : null

  const numbers = c.keyNumbers.length ? (
    <section className={cn('surface', panel ? pad : 'p-4')}>
      <h2 className={cn(h2, 'text-fg-subtle')}>The numbers</h2>
      <dl className="flex flex-col gap-3">
        {c.keyNumbers.map((n) => (
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

  const where = usedBy.length ? (
    <section className={cn('surface', panel ? pad : 'p-4')}>
      <h2 className={cn(h2Tight, 'text-fg-subtle')}>Where you configure it</h2>
      <p className="mb-3 text-[12px] text-fg-subtle">
        The services whose atlas entries assume this.
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {usedBy.map((svc) => (
          <li key={svc.slug}>
            <ServiceLink
              slug={svc.slug}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg-inset px-2 py-1 text-[12px] font-medium hover:border-border-strong hover:bg-bg-overlay"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: CATEGORIES[svc.category].token }}
                aria-hidden
              />
              {svc.name}
            </ServiceLink>
          </li>
        ))}
      </ul>
    </section>
  ) : null

  const alongside = relatedConcepts.length ? (
    <section className={cn('surface', panel ? pad : 'p-4')}>
      <h2 className={cn(h2, 'text-fg-subtle')}>Read alongside</h2>
      <ul className="flex flex-wrap gap-1.5">
        {relatedConcepts.map((r) => (
          <li key={r.slug}>
            <ConceptLink
              slug={r.slug}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg-inset px-2 py-1 text-[12px] font-medium hover:border-border-strong hover:bg-bg-overlay"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: CONCEPT_GROUP_META[r.group].token }}
                aria-hidden
              />
              {conceptLabel(r)}
            </ConceptLink>
          </li>
        ))}
      </ul>
    </section>
  ) : null

  if (panel) {
    return (
      <div className="flex flex-col gap-4">
        {keyIdea}
        {whyItExists}
        {whatItIs}
        {numbers}
        {traps}
        {onTheExam}
        {confused}
        {where}
        {alongside}
      </div>
    )
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="flex min-w-0 flex-col gap-5">
        {keyIdea}
        {whyItExists}
        {whatItIs}
        {onTheExam}
        {traps}
        {confused}
      </div>
      <aside className="flex flex-col gap-4">
        {numbers}
        {where}
        {alongside}
      </aside>
    </div>
  )
}

/** The identity strip — group, certs, docs — shared by page and panel. */
export function ConceptMeta({ concept: c, className }: { concept: Concept; className?: string }) {
  const group = CONCEPT_GROUP_META[c.group]
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <Badge tone="neutral">
        <span
          className="mr-1 inline-block h-2 w-2 rounded-full align-middle"
          style={{ background: group.token }}
          aria-hidden
        />
        {group.label}
      </Badge>
      <Badge tone="info" title="A primitive the exam assumes rather than teaches.">
        Concept
      </Badge>
      <FamilyBadges item={c} />
      <a
        href={c.docsUrl}
        target="_blank"
        rel="noreferrer"
        className="ml-auto text-[12px] text-fg-subtle underline decoration-dotted hover:text-fg"
      >
        AWS docs ↗
      </a>
    </div>
  )
}
