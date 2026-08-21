import type { Cert, CertId, Question } from '@/content/schema'

/**
 * Builds an exam paper that matches the real domain weighting, because a
 * practice exam that over-samples the domain you happen to like is worse than
 * no practice exam at all — it tells you you are ready when you are not.
 */

export interface SampleOptions {
  cert: Cert
  pool: Question[]
  count?: number
  /** Question ids to avoid, e.g. everything seen in the last week. */
  exclude?: Set<string>
  /** Bias toward domains you are weak in. Practice mode only — never the full sim. */
  weakDomains?: Record<string, number>
  /** Deterministic ordering for tests. */
  rng?: () => number
  /**
   * Overrides the in-scope test. The default is a family match, which is right
   * for every question in the corpus today; pass this to honour a
   * `versionScope` override, which only the cert registry can evaluate. The
   * engine stays pure by taking the predicate rather than importing it.
   */
  inScope?: (q: Question) => boolean
  /**
   * Maps a question's `taskId` onto this cert's task ids, so a question written
   * for an earlier version of the same exam still lands in the right domain.
   * Defaults to identity.
   */
  alias?: (taskId: string) => string
}

/** Number of questions per domain, matching the published weighting. */
export function allocate(cert: Cert, count: number): Record<string, number> {
  const alloc: Record<string, number> = {}
  const exact = cert.domains.map((d) => ({ id: d.id, want: (d.weight / 100) * count }))

  // Floor first, then hand out the remainder to the largest fractional parts.
  // This keeps the split faithful instead of letting rounding favour domain 1.
  let assigned = 0
  for (const e of exact) {
    alloc[e.id] = Math.floor(e.want)
    assigned += alloc[e.id]
  }
  const remainders = exact
    .map((e) => ({ id: e.id, frac: e.want - Math.floor(e.want) }))
    .sort((a, b) => b.frac - a.frac)
  let i = 0
  while (assigned < count && remainders.length) {
    alloc[remainders[i % remainders.length].id] += 1
    assigned += 1
    i += 1
  }
  return alloc
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export interface SampleResult {
  questions: Question[]
  /** Domains that could not be filled from the pool — surfaced, never hidden. */
  shortfall: { domainId: string; wanted: number; got: number }[]
}

export function sample(opts: SampleOptions): SampleResult {
  const { cert, pool, exclude } = opts
  const count = opts.count ?? cert.questionCount
  const rng = opts.rng ?? Math.random
  const inScope = opts.inScope ?? ((q: Question) => q.families.includes(cert.family))
  const alias = opts.alias ?? ((taskId: string) => taskId)
  const alloc = allocate(cert, count)
  const shortfall: SampleResult['shortfall'] = []
  const picked: Question[] = []

  const domainOf = new Map<string, string>()
  for (const d of cert.domains) for (const t of d.tasks) domainOf.set(t.id, d.id)

  for (const domain of cert.domains) {
    const want = alloc[domain.id] ?? 0
    if (!want) continue

    let candidates = pool.filter(
      (q) => domainOf.get(alias(q.taskId)) === domain.id && inScope(q),
    )
    const unseen = candidates.filter((q) => !exclude?.has(q.id))
    // Prefer unseen questions, but fall back rather than short-change a domain.
    if (unseen.length >= want) candidates = unseen

    // Spread difficulty rather than clustering: roughly 30/50/20 easy/mid/hard.
    const byDifficulty = [1, 2, 3].map((d) => shuffle(candidates.filter((q) => q.difficulty === d), rng))
    const targets = [Math.round(want * 0.3), Math.round(want * 0.5), want]
    const take: Question[] = []
    byDifficulty.forEach((bucket, i) => {
      const room = (i === 2 ? want : targets[i]) - take.length
      take.push(...bucket.slice(0, Math.max(0, room)))
    })
    // Top up from whatever is left if the difficulty buckets were uneven.
    if (take.length < want) {
      const rest = shuffle(
        candidates.filter((q) => !take.includes(q)),
        rng,
      )
      take.push(...rest.slice(0, want - take.length))
    }

    if (take.length < want) shortfall.push({ domainId: domain.id, wanted: want, got: take.length })
    picked.push(...take)
  }

  return { questions: shuffle(picked, rng), shortfall }
}

/**
 * Practice mode: same machinery, but weighted toward domains you keep getting
 * wrong. Never used for the full simulator, which must stay representative or
 * its score means nothing.
 */
export function samplePractice(opts: SampleOptions & { weakDomains: Record<string, number> }): SampleResult {
  const { cert, weakDomains } = opts
  const count = opts.count ?? 20
  const rng = opts.rng ?? Math.random

  // Blend the real weighting with weakness so a weak domain gets more airtime
  // without the paper losing its shape entirely.
  const blended = cert.domains.map((d) => {
    const weakness = weakDomains[d.id] ?? 0.5
    return { id: d.id, weight: d.weight * (0.5 + weakness) }
  })
  const total = blended.reduce((n, b) => n + b.weight, 0)
  const synthetic: Cert = {
    ...cert,
    domains: cert.domains.map((d) => ({
      ...d,
      weight: Math.max(1, Math.round(((blended.find((b) => b.id === d.id)!.weight / total) * 100))),
    })),
  }
  return sample({ ...opts, cert: synthetic, count, rng })
}

export function certScoredCount(cert: Cert): number {
  return cert.scoredCount
}

export type { CertId }
