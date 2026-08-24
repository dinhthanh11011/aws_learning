import { describe, expect, it } from 'vitest'
import { services, serviceBySlug } from './service-registry'
import { conceptBySlug } from './concept-registry'
import { OPTION_SET_OWED } from './option-coverage'

const withSets = services.flatMap((s) => (s.optionSets ?? []).map((set) => ({ s, set })))

describe('option sets', () => {
  it('name each option once within a set', () => {
    for (const { s, set } of withSets) {
      const names = set.options.map((o) => o.name.toLowerCase())
      expect(new Set(names).size, `${s.slug}/${set.id}`).toBe(names.length)
    }
  })

  it('give each set a distinct id on its service', () => {
    for (const s of services) {
      const ids = (s.optionSets ?? []).map((set) => set.id)
      expect(new Set(ids).size, s.slug).toBe(ids.length)
    }
  })

  it('state a requirement in `pick`, not a restatement of the name', () => {
    for (const { s, set } of withSets) {
      for (const o of set.options) {
        expect(o.pick.toLowerCase(), `${s.slug}/${set.id}/${o.name}`).not.toBe(
          o.name.toLowerCase(),
        )
      }
    }
  })

  it('cross-link only to slugs that resolve', () => {
    for (const { s, set } of withSets) {
      for (const o of set.options.filter((x) => x.slug)) {
        const found = serviceBySlug.get(o.slug!) ?? conceptBySlug.get(o.slug!)
        expect(found, `${s.slug}/${set.id} → ${o.slug}`).toBeDefined()
      }
    }
  })

  /**
   * The anti-duplication invariant, asserted here as well as in the gate.
   *
   * Two sources for one fact is precisely the drift invariant 2 exists to
   * prevent — and it still counts when both sides are *derived*, because the
   * learner then drills the same fact twice under two labels and the atlas
   * prints the row twice. A keyNumbers row whose label names an option must
   * have moved into the option set, not been copied into it.
   */
  it('never restate an option as a keyNumbers row on the same service', () => {
    for (const s of services) {
      const labels = new Set(s.keyNumbers.map((n) => n.label.toLowerCase()))
      for (const set of s.optionSets ?? []) {
        for (const o of set.options) {
          for (const name of [o.name, o.abbr].filter(Boolean) as string[]) {
            expect(labels.has(name.toLowerCase()), `${s.slug}: "${name}"`).toBe(false)
          }
        }
      }
    }
  })

  it('sit only on services the cards actually drill', () => {
    // Tier 3 derives no option cards, so a matrix there is content nobody sees
    // in a drill — it belongs in the atlas prose or on a tier-1 neighbour.
    expect(withSets.filter(({ s }) => s.tier === 3).map(({ s }) => s.slug)).toEqual([])
  })
})

describe('the option coverage list', () => {
  it('names only services that exist, so it cannot rot', () => {
    expect(OPTION_SET_OWED.filter((slug) => !serviceBySlug.get(slug))).toEqual([])
  })
})
