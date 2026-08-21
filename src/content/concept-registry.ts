import type { CertId, Concept, ConceptGroup } from './schema'
import { CONCEPT_GROUPS } from './schema'
import { networkingConcepts } from './concepts/networking'
import { resilienceConcepts } from './concepts/resilience'
import { dataConcepts } from './concepts/data'
import { identityConcepts } from './concepts/identity'
import { deliveryConcepts } from './concepts/delivery'
import { operationsConcepts } from './concepts/operations'

/**
 * The concept corpus, aggregated here for the same reason the services are:
 * `cards.ts` derives from it and must not import the top-level barrel.
 *
 * And named `concept-registry.ts` rather than `concepts/index.ts` for the same
 * reason again — a directory index the barrel also re-exports breaks
 * Turbopack's module graph, and the error it produces points nowhere useful.
 *
 * Deliberately *not* sorted alphabetically. Concepts are read in dependency
 * order — you cannot understand a subnet before a CIDR block — so each group
 * file states its own order and the groups are concatenated in reading order.
 */
export const concepts: Concept[] = [
  ...networkingConcepts,
  ...resilienceConcepts,
  ...dataConcepts,
  ...identityConcepts,
  ...deliveryConcepts,
  ...operationsConcepts,
]

export const conceptBySlug = new Map(concepts.map((c) => [c.slug, c]))

export function concept(slug: string): Concept | undefined {
  return conceptBySlug.get(slug)
}

/** Short label for chips and dense prose — the abbreviation when there is one. */
export function conceptLabel(c: Concept): string {
  return c.abbr ?? c.term
}

export function conceptsFor(certId: CertId): Concept[] {
  return concepts.filter((c) => c.certs.includes(certId))
}

export function conceptsByGroup(certId?: CertId): Map<ConceptGroup, Concept[]> {
  const pool = certId ? conceptsFor(certId) : concepts
  const out = new Map<ConceptGroup, Concept[]>()
  for (const id of CONCEPT_GROUPS) {
    const inGroup = pool.filter((c) => c.group === id)
    if (inGroup.length) out.set(id, inGroup)
  }
  return out
}

/** Concepts that name a service — the reverse index, for the service atlas. */
export function conceptsForService(slug: string): Concept[] {
  return concepts.filter((c) => c.serviceSlugs.includes(slug))
}
