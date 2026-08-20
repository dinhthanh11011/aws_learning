'use client'
import { useMemo, useState } from 'react'
import {
  CATEGORIES,
  CATEGORY_IDS,
  CERT_IDS,
  services,
  TIER_META,
  type CategoryId,
  type CertId,
  type Tier,
} from '@/content'
import { ServiceTile } from '@/components/service/ServiceCard'
import { useMasteryInput } from '@/hooks/useMastery'
import { serviceMastery } from '@/engines/progress/mastery'
import { cn } from '@/lib/cn'

type Sort = 'tier' | 'name' | 'category' | 'weakest'

export function ServicesBrowser() {
  const [query, setQuery] = useState('')
  const [cert, setCert] = useState<CertId | 'all'>('all')
  const [tier, setTier] = useState<Tier | 'all'>('all')
  const [category, setCategory] = useState<CategoryId | 'all'>('all')
  const [sort, setSort] = useState<Sort>('tier')

  const masteryInput = useMasteryInput()

  const rings = useMemo(() => {
    if (!masteryInput) return new Map<string, number>()
    return new Map(services.map((s) => [s.slug, serviceMastery(s, masteryInput).rings]))
  }, [masteryInput])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const out = services.filter((s) => {
      if (cert !== 'all' && !s.certs.includes(cert)) return false
      if (tier !== 'all' && s.tier !== tier) return false
      if (category !== 'all' && s.category !== category) return false
      if (!q) return true
      return (
        s.name.toLowerCase().includes(q) ||
        s.slug.includes(q) ||
        (s.abbr?.toLowerCase().includes(q) ?? false) ||
        s.oneLiner.toLowerCase().includes(q)
      )
    })

    return [...out].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      if (sort === 'category') {
        return (
          CATEGORY_IDS.indexOf(a.category) - CATEGORY_IDS.indexOf(b.category) ||
          a.tier - b.tier ||
          a.name.localeCompare(b.name)
        )
      }
      if (sort === 'weakest') {
        // Weakest first, weighted by tier: an unknown core service is a bigger
        // problem than an unknown one you only need to recognise.
        const cost = (slug: string, t: Tier) => (5 - (rings.get(slug) ?? 0)) * (4 - t)
        return cost(b.slug, b.tier) - cost(a.slug, a.tier) || a.name.localeCompare(b.name)
      }
      return a.tier - b.tier || a.name.localeCompare(b.name)
    })
  }, [query, cert, tier, category, sort, rings])

  const chip = (active: boolean) =>
    cn(
      'rounded-lg border px-2.5 py-1 text-[12px] transition-colors',
      active
        ? 'border-accent/40 bg-accent-soft font-medium text-accent'
        : 'border-border text-fg-muted hover:border-border-strong hover:text-fg',
    )

  return (
    <div className="flex flex-col gap-4">
      <div className="surface flex flex-col gap-3 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Filter ${services.length} services…`}
            className="h-9 min-w-[200px] flex-1 rounded-lg border border-border bg-bg-inset px-3 text-[13px] outline-none placeholder:text-fg-subtle focus-visible:border-accent"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="h-9 rounded-lg border border-border bg-bg-inset px-2 text-[12px] outline-none"
            aria-label="Sort"
          >
            <option value="tier">By tier</option>
            <option value="weakest">Weakest first</option>
            <option value="category">By category</option>
            <option value="name">A–Z</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button className={chip(cert === 'all')} onClick={() => setCert('all')}>
            Both exams
          </button>
          {CERT_IDS.map((c) => (
            <button key={c} className={chip(cert === c)} onClick={() => setCert(c)}>
              {c}
            </button>
          ))}
          <span className="mx-1 w-px self-stretch bg-border" aria-hidden />
          <button className={chip(tier === 'all')} onClick={() => setTier('all')}>
            All tiers
          </button>
          {([1, 2, 3] as Tier[]).map((t) => (
            <button
              key={t}
              className={chip(tier === t)}
              onClick={() => setTier(t)}
              title={TIER_META[t].blurb}
            >
              {TIER_META[t].label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button className={chip(category === 'all')} onClick={() => setCategory('all')}>
            All categories
          </button>
          {CATEGORY_IDS.map((id) => (
            <button
              key={id}
              className={chip(category === id)}
              onClick={() => setCategory(id)}
              title={CATEGORIES[id].blurb}
            >
              <span
                className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
                style={{ background: CATEGORIES[id].token }}
                aria-hidden
              />
              {CATEGORIES[id].short}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[12px] text-fg-subtle" aria-live="polite">
        {filtered.length} service{filtered.length === 1 ? '' : 's'}
        {sort === 'weakest' ? ' — weakest first, weighted by exam importance' : ''}
      </p>

      {filtered.length ? (
        <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <li key={s.slug} className="contents">
              <ServiceTile service={s} rings={rings.get(s.slug)} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="surface p-10 text-center">
          <p className="text-[14px] text-fg-muted">Nothing matches those filters.</p>
        </div>
      )}
    </div>
  )
}
