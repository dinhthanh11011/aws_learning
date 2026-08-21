import type { Card, CertId } from './schema'
import { services } from './service-registry'
import { concepts } from './concept-registry'
import { triggers } from './triggers'
import { idleCosts } from './idle-costs'

/**
 * Cards are *derived* from the service and concept content rather than written
 * separately. That matters for a reason beyond effort: a hand-written card set drifts out of
 * step with the cards' source material, and then you are drilling something the
 * atlas contradicts. Here there is one source of truth.
 *
 * Six kinds, each testing a different retrieval path:
 *   number       — a limit or quota you must state exactly
 *   trap         — the plausible-but-wrong answer, and why
 *   contrast     — two things that get confused, separated
 *   whichService — a requirement; name the service
 *   define       — a description; name the concept
 *   fact         — when *not* to reach for something, and the ideas that decide
 *                  questions (the half most material skips)
 */
export function buildCards(): Card[] {
  const out: Card[] = []

  for (const s of services) {
    const certs = s.certs as CertId[]
    const base = { certs, serviceSlugs: [s.slug] }

    // Numbers only for tier 1 and 2 — memorising a tier-3 quota is wasted effort.
    if (s.tier <= 2) {
      s.keyNumbers.forEach((n, i) => {
        if (n.volatile) return // Don't drill a figure AWS keeps changing.
        out.push({
          ...base,
          id: `num:${s.slug}:${i}`,
          kind: 'number',
          front: `${s.name} — ${n.label}?`,
          back: n.value,
          extra: n.note,
        })
      })
    }

    s.examTraps.forEach((t, i) => {
      out.push({
        ...base,
        id: `trap:${s.slug}:${i}`,
        kind: 'trap',
        front: `${s.name}: what is the trap here?`,
        back: t,
      })
    })

    s.confusedWith.forEach((c) => {
      out.push({
        ...base,
        id: `vs:${s.slug}:${c.slug}`,
        kind: 'contrast',
        serviceSlugs: [s.slug, c.slug],
        certs,
        front: `${s.name} versus ${c.slug.replace(/-/g, ' ')} — what is the dividing line?`,
        back: c.difference,
      })
    })

    // "Which service?" from the one-liner, for tier 1 and 2 only: the point is
    // recall of the right tool, and tier-3 services are for elimination.
    if (s.tier <= 2) {
      out.push({
        ...base,
        id: `which:${s.slug}`,
        kind: 'whichService',
        front: `Which AWS service: ${s.oneLiner.charAt(0).toLowerCase()}${s.oneLiner.slice(1)}`,
        back: s.name,
        extra: s.whatItIs.split('. ')[0] + '.',
      })
    }

    // When NOT to use it. This is the half that decides scenario questions.
    if (s.tier === 1 && s.whenNotToUse.length) {
      out.push({
        ...base,
        id: `not:${s.slug}`,
        kind: 'fact',
        front: `Name a case where ${s.name} is the wrong choice.`,
        back: s.whenNotToUse.map((w) => `• ${w}`).join('\n'),
      })
    }
  }

  /**
   * Concept cards. The `fact` card built from `keyIdea` is the important one:
   * it asks for the sentence that decides questions rather than a definition,
   * because a learner who can recite "a subnet is public only because its route
   * table sends 0.0.0.0/0 to an internet gateway" can answer the question, and
   * one who can recite "a subnet is a range of addresses" cannot.
   */
  for (const c of concepts) {
    const certs = c.certs as CertId[]
    const base = { certs, serviceSlugs: c.serviceSlugs }

    out.push({
      ...base,
      id: `idea:${c.slug}`,
      kind: 'fact',
      front: `${c.term} — state the idea that decides questions.`,
      back: c.keyIdea,
      extra: c.oneLiner,
    })

    out.push({
      ...base,
      id: `define:${c.slug}`,
      kind: 'define',
      front: `Which term: ${c.oneLiner.charAt(0).toLowerCase()}${c.oneLiner.slice(1)}`,
      back: c.term,
      extra: c.whatItIs.split('. ')[0] + '.',
    })

    c.keyNumbers.forEach((n, i) => {
      if (n.volatile) return // Don't drill a figure AWS keeps changing.
      out.push({
        ...base,
        id: `num:concept:${c.slug}:${i}`,
        kind: 'number',
        front: `${c.abbr ?? c.term} — ${n.label}?`,
        back: n.value,
        extra: n.note,
      })
    })

    c.examTraps.forEach((t, i) => {
      out.push({
        ...base,
        id: `trap:concept:${c.slug}:${i}`,
        kind: 'trap',
        front: `${c.term}: what is the trap here?`,
        back: t,
      })
    })

    c.confusedWith.forEach((other) => {
      out.push({
        ...base,
        id: `vs:concept:${c.slug}:${other.slug}`,
        kind: 'contrast',
        front: `${c.term} versus ${other.slug.replace(/-/g, ' ')} — what is the dividing line?`,
        back: other.difference,
      })
    })
  }

  for (const t of triggers) {
    out.push({
      id: `trigger:${t.id}`,
      kind: 'whichService',
      certs: t.certs as CertId[],
      serviceSlugs: t.slugs,
      front: `A question says: ${t.phrase}\n\nWhat is it asking for?`,
      back: t.means,
      extra: t.notThis.length
        ? `Trap: ${t.notThis.map((n) => `${n.slug} — ${n.why}`).join(' · ')}`
        : undefined,
    })
  }

  for (const c of idleCosts) {
    if (c.usdPerMonth === 0) continue
    out.push({
      id: `cost:${c.slug}`,
      kind: 'number',
      certs: ['SAA-C03'],
      serviceSlugs: [c.slug],
      front: `Roughly what does an idle ${c.label} cost per month?`,
      back: `~$${c.usdPerMonth}/month`,
      extra: c.note,
    })
  }

  return out
}

export const cards = buildCards()
export const cardById = new Map(cards.map((c) => [c.id, c]))
export const cardsFor = (certId: CertId) => cards.filter((c) => c.certs.includes(certId))
