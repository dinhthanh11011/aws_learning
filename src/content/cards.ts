import type { Card, CertFamily, CertId } from './schema'
import { inScope } from './cert-registry'
import { services } from './service-registry'
import { concepts } from './concept-registry'
import { triggers } from './triggers'
import { idleCosts } from './idle-costs'

/**
 * A stable, order-independent key for a card id.
 *
 * Card ids must never encode a *position*. The SRS schedule is keyed by card id,
 * so `num:s3:3` meaning "Glacier Deep Archive" today and "Max object size"
 * tomorrow silently rebinds a learner's review history to a different fact —
 * the failure is invisible, and it is exactly what happens when a keyNumbers
 * row is deleted or reordered. Keying by the label instead means a removed row
 * *orphans* its card, which the drill screen already reports honestly.
 */
function kebab(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'x'
  )
}

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
 *   whichOption  — a requirement; name the option *within* one service
 *   define       — a description; name the concept
 *   fact         — when *not* to reach for something, and the ideas that decide
 *                  questions (the half most material skips)
 */
export function buildCards(): Card[] {
  const out: Card[] = []

  for (const s of services) {
    const base = { families: s.families, serviceSlugs: [s.slug] }

    // Numbers only for tier 1 and 2 — memorising a tier-3 quota is wasted effort.
    if (s.tier <= 2) {
      s.keyNumbers.forEach((n) => {
        if (n.volatile) return // Don't drill a figure AWS keeps changing.
        out.push({
          ...base,
          id: `num:${s.slug}:${kebab(n.label)}`,
          kind: 'number',
          front: `${s.name} — ${n.label}?`,
          back: n.value,
          extra: n.note,
        })
      })
    }

    s.examTraps.forEach((t) => {
      out.push({
        ...base,
        id: `trap:${s.slug}:${kebab(t.slice(0, 60))}`,
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
        front: `${s.name} versus ${c.slug.replace(/-/g, ' ')} — what is the dividing line?`,
        back: c.difference,
      })
    })

    /**
     * Option cards — the "which one" recall path, which nothing drilled before.
     *
     * The exam does not ask what Standard-IA costs; it describes an access
     * pattern and makes you name the class. `pick` carries that requirement, so
     * it becomes the front and the option name becomes the back.
     *
     * `signal` deliberately derives no `number` card. That is the duplication
     * guard at the card layer: numbers come from `keyNumbers`, options come from
     * `optionSets`, and a fact must never be reachable from both.
     */
    for (const set of s.optionSets ?? []) {
      for (const o of set.options) {
        const optBase = {
          families: s.families,
          serviceSlugs: o.slug && o.slug !== s.slug ? [s.slug, o.slug] : [s.slug],
        }
        const key = `${s.slug}:${set.id}:${kebab(o.name)}`

        if (s.tier <= 2) {
          out.push({
            ...optBase,
            id: `opt:${key}`,
            kind: 'whichOption',
            front: `${s.name} — ${set.prompt}: ${o.pick}?`,
            back: o.name,
            extra: o.signal,
          })
        }

        if (o.gotcha) {
          out.push({
            ...optBase,
            id: `trap:opt:${key}`,
            kind: 'trap',
            front: `${s.name} ${o.name}: what is the trap here?`,
            back: o.gotcha,
          })
        }
      }

      // The roster card: name the whole set from memory. Tier 1 only, matching
      // the `not:` card — reciting eight storage classes is core-service work.
      if (s.tier === 1) {
        out.push({
          ...base,
          id: `optset:${s.slug}:${set.id}`,
          kind: 'fact',
          front: `${s.name} — name the ${set.options.length} ${set.label.toLowerCase()} and when each wins.`,
          back: set.options.map((o) => `• ${o.name} — ${o.pick}`).join('\n'),
          extra: set.note,
        })
      }
    }

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
    const base = { families: c.families, serviceSlugs: c.serviceSlugs }

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

    c.keyNumbers.forEach((n) => {
      if (n.volatile) return // Don't drill a figure AWS keeps changing.
      out.push({
        ...base,
        id: `num:concept:${c.slug}:${kebab(n.label)}`,
        kind: 'number',
        front: `${c.abbr ?? c.term} — ${n.label}?`,
        back: n.value,
        extra: n.note,
      })
    })

    c.examTraps.forEach((t) => {
      out.push({
        ...base,
        id: `trap:concept:${c.slug}:${kebab(t.slice(0, 60))}`,
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
      families: t.families,
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
      // Idle cost is an SAA cost-optimisation concern; the corpus has no
      // per-family tagging for idle costs yet — see docs/BACKLOG.md.
      families: ['saa'] as CertFamily[],
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
export const cardsFor = (certId: CertId) => cards.filter((c) => inScope(c, certId))
