'use client'
import type { LessonSection } from '@/content'
import { CATEGORIES, serviceBySlug } from '@/content'
import { Diagram } from '@/components/diagram/Diagram'
import { ServiceRef } from '@/components/service/ServiceRef'
import { formatMd } from '@/lib/md'
import { cn } from '@/lib/cn'

/**
 * One renderer for every `LessonSection` kind. Built against the whole union
 * rather than only the kinds the first storyline happens to use, because this is
 * also the renderer the lesson player needs — that feature has been blocked on
 * exactly this component existing.
 */

const CALLOUT: Record<string, { border: string; text: string; label: string }> = {
  info: { border: 'border-info/30', text: 'text-info', label: 'Note' },
  warn: { border: 'border-warn/30', text: 'text-warn', label: 'Careful' },
  trap: { border: 'border-bad/30', text: 'text-bad', label: 'Exam trap' },
  ok: { border: 'border-ok/30', text: 'text-ok', label: 'Good' },
  money: { border: 'border-accent/30', text: 'text-accent', label: 'Cost' },
}

export function Sections({ sections }: { sections: LessonSection[] }) {
  return (
    <div className="flex flex-col gap-5">
      {sections.map((s, i) => (
        <Section key={i} section={s} />
      ))}
    </div>
  )
}

function Section({ section: s }: { section: LessonSection }) {
  switch (s.kind) {
    case 'heading':
      return <h3 className="mt-2 text-[17px] font-semibold">{s.text}</h3>

    case 'prose':
      return <p className="text-[14.5px] leading-relaxed">{formatMd(s.md)}</p>

    case 'callout': {
      const c = CALLOUT[s.tone] ?? CALLOUT.info
      return (
        <aside className={cn('surface p-4', c.border)}>
          <p className={cn('mb-1.5 text-[11.5px] font-semibold uppercase tracking-wide', c.text)}>
            {s.title}
          </p>
          <p className="text-[14px] leading-relaxed">{formatMd(s.md)}</p>
        </aside>
      )
    }

    case 'diagram':
      return <Diagram spec={s.spec} className="surface p-4" />

    case 'compare':
      return (
        <section className="surface p-4">
          <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-fg-subtle">
            {s.title}
          </p>
          {/* Its own scroll container: a wide table must never make the page
              scroll sideways. */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13.5px]">
              <thead>
                <tr>
                  <th className="border-b border-border px-2 py-1.5 text-left font-medium text-fg-subtle" />
                  {s.columns.map((c) => (
                    <th
                      key={c}
                      className="border-b border-border px-2 py-1.5 text-left font-semibold"
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {s.rows.map((r) => (
                  <tr key={r.label}>
                    <th className="border-b border-border px-2 py-1.5 text-left align-top font-medium text-fg-muted">
                      {r.label}
                    </th>
                    {r.cells.map((cell, i) => (
                      <td key={i} className="border-b border-border px-2 py-1.5 align-top">
                        {formatMd(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )

    case 'numbers':
      return (
        <section className="surface p-4">
          <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-fg-subtle">
            {s.title}
          </p>
          <dl className="flex flex-col gap-2.5">
            {s.items.map((n) => (
              <div key={n.label} className="flex flex-wrap items-baseline gap-x-2">
                <dt className="text-[13px] text-fg-muted">{n.label}</dt>
                <dd className="nums text-[14px] font-semibold">{n.value}</dd>
                {/* A figure AWS moves is flagged rather than stated as fact. */}
                {n.volatile ? <span className="text-[11px] text-warn">verify</span> : null}
                {n.note ? (
                  <span className="basis-full text-[12.5px] text-fg-subtle">{n.note}</span>
                ) : null}
              </div>
            ))}
          </dl>
        </section>
      )

    case 'steps':
      return (
        <section className="surface p-4">
          <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-fg-subtle">
            {s.title}
          </p>
          <ol className="flex flex-col gap-3">
            {s.items.map((it, i) => (
              <li key={it.title} className="flex gap-3">
                <span className="nums mt-0.5 shrink-0 text-[12px] font-semibold text-fg-subtle">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] font-medium">{it.title}</p>
                  <p className="text-[13.5px] leading-relaxed text-fg-muted">{formatMd(it.md)}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )

    case 'code':
      return (
        <figure className="surface overflow-hidden">
          {s.caption ? (
            <figcaption className="border-b border-border px-4 py-2 text-[12px] text-fg-subtle">
              {s.caption}
            </figcaption>
          ) : null}
          <pre className="overflow-x-auto px-4 py-3 text-[12.5px] leading-relaxed">
            <code>{s.code}</code>
          </pre>
        </figure>
      )

    case 'services':
      return (
        <section className="surface p-4">
          <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-fg-subtle">
            {s.title}
          </p>
          <ul className="flex flex-col gap-2">
            {s.slugs.map((slug) => {
              const svc = serviceBySlug.get(slug)
              if (!svc) return null
              return (
                <li key={slug} className="flex flex-wrap items-baseline gap-x-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: CATEGORIES[svc.category].token }}
                    aria-hidden
                  />
                  <ServiceRef slug={slug} bare />
                  <span className="text-[13px] text-fg-muted">— {svc.oneLiner}</span>
                </li>
              )
            })}
          </ul>
        </section>
      )
  }
}
