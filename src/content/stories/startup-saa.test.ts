import { describe, expect, it } from 'vitest'
import { startupSaa } from './startup-saa'
import { layoutGroups, type Box } from '@/components/diagram/layout'
import { visibleAt } from '@/engines/story/cumulative'

/**
 * Geometry regression for the real storyline. `content:check` already proves the
 * ids line up; this proves the *picture* is right — nesting reads as containment
 * and two unrelated regions do not sit on top of each other.
 *
 * Worth pinning because the failure mode is silent: the ids stay valid, the page
 * renders, and the diagram just quietly stops making sense.
 */
const laid = layoutGroups(startupSaa.architecture)
const box = (id: string): Box => laid.find((g) => g.group.id === id)!.box

const contains = (outer: string, inner: string): boolean => {
  const o = box(outer)
  const i = box(inner)
  return o.x < i.x && o.y < i.y && o.x + o.w > i.x + i.w && o.y + o.h > i.y + i.h
}
const overlaps = (a: string, b: string): boolean => {
  const p = box(a)
  const q = box(b)
  return !(p.x + p.w < q.x || q.x + q.w < p.x || p.y + p.h < q.y || q.y + q.h < p.y)
}

describe('startup-saa architecture', () => {
  it('nests Region → VPC → AZ → subnet as real containment', () => {
    expect(contains('g-region', 'g-vpc')).toBe(true)
    expect(contains('g-vpc', 'g-az-a')).toBe(true)
    expect(contains('g-vpc', 'g-az-b')).toBe(true)
    expect(contains('g-vpc', 'g-public')).toBe(true)
    expect(contains('g-az-a', 'g-priv-a')).toBe(true)
    expect(contains('g-az-b', 'g-priv-b')).toBe(true)
  })

  it('keeps unrelated top-level regions from overlapping', () => {
    // Two Regions drawn on top of each other would read as one.
    expect(overlaps('g-region', 'g-region-2')).toBe(false)
    expect(overlaps('g-region', 'g-account')).toBe(false)
    expect(overlaps('g-region', 'g-edge')).toBe(false)
    expect(overlaps('g-region-2', 'g-account')).toBe(false)
  })

  it('reveals every node exactly once, and all of them by the end', () => {
    const arch = startupSaa.architecture
    const last = visibleAt(startupSaa, startupSaa.chapters.length - 1)
    expect(last.nodes).toHaveLength(arch.nodes.length)
    expect(last.edges).toHaveLength(arch.edges.length)
    expect(last.groups).toHaveLength(arch.groups.length)

    const counted = new Map<string, number>()
    for (const c of startupSaa.chapters) {
      for (const id of c.adds.nodeIds) counted.set(id, (counted.get(id) ?? 0) + 1)
    }
    expect([...counted.values()].every((n) => n === 1)).toBe(true)
  })

  it('starts small — chapter 1 is one node, not an architecture', () => {
    const first = visibleAt(startupSaa, 0)
    expect(first.nodes).toHaveLength(1)
    expect(first.nodes[0].node.id).toBe('iam')
  })
})
