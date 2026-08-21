import { describe, expect, it } from 'vitest'
import type { DiagramSpec } from '@/content/schema'
import { UNIT, layoutGroups, nodeBox, nodeCentre, serviceSlugForNode, viewBox } from './layout'

const spec: DiagramSpec = {
  id: 'd',
  cols: 12,
  rows: 6,
  nodes: [
    { id: 'a', label: 'A', kind: 'service', x: 2, y: 2, w: 2, h: 1 },
    { id: 'b', label: 'B', kind: 'service', x: 6, y: 2, w: 2, h: 1 },
  ],
  edges: [],
  groups: [
    { id: 'vpc', label: 'VPC', kind: 'vpc', nodeIds: [] },
    { id: 'az1', label: 'AZ 1', kind: 'az', nodeIds: ['a'], parent: 'vpc' },
    { id: 'az2', label: 'AZ 2', kind: 'az', nodeIds: ['b'], parent: 'vpc' },
  ],
  steps: [],
}

describe('nodeBox', () => {
  it('scales grid units to viewBox pixels', () => {
    expect(nodeBox(spec.nodes[0])).toEqual({ x: 2 * UNIT, y: 2 * UNIT, w: 2 * UNIT, h: UNIT })
  })
  it('centres where edges attach', () => {
    expect(nodeCentre(spec.nodes[0])).toEqual({ x: 3 * UNIT, y: 2.5 * UNIT })
  })
})

describe('layoutGroups', () => {
  const laid = layoutGroups(spec)
  const box = (id: string) => laid.find((g) => g.group.id === id)!.box

  it('derives a childless group’s box from its own nodes', () => {
    const az = box('az1')
    const n = nodeBox(spec.nodes[0])
    expect(az.x).toBeLessThan(n.x)
    expect(az.y).toBeLessThan(n.y)
    expect(az.x + az.w).toBeGreaterThan(n.x + n.w)
  })

  it('encloses its children entirely — a subnet sits inside its AZ', () => {
    const vpc = box('vpc')
    for (const id of ['az1', 'az2']) {
      const c = box(id)
      expect(vpc.x).toBeLessThan(c.x)
      expect(vpc.y).toBeLessThan(c.y)
      expect(vpc.x + vpc.w).toBeGreaterThan(c.x + c.w)
      expect(vpc.y + vpc.h).toBeGreaterThan(c.y + c.h)
    }
  })

  it('records nesting depth and paints parents first', () => {
    expect(laid[0].group.id).toBe('vpc')
    expect(laid[0].depth).toBe(0)
    expect(
      laid
        .filter((g) => g.depth === 1)
        .map((g) => g.group.id)
        .sort(),
    ).toEqual(['az1', 'az2'])
  })

  it('survives a parent cycle instead of hanging', () => {
    const cyclic: DiagramSpec = {
      ...spec,
      groups: [
        { id: 'x', label: 'X', kind: 'plain', nodeIds: ['a'], parent: 'y' },
        { id: 'y', label: 'Y', kind: 'plain', nodeIds: ['b'], parent: 'x' },
      ],
    }
    expect(() => layoutGroups(cyclic)).not.toThrow()
  })

  it('gives a group naming no real node a box rather than NaN', () => {
    const orphan: DiagramSpec = {
      ...spec,
      groups: [{ id: 'g', label: 'G', kind: 'plain', nodeIds: ['nope'] }],
    }
    const b = layoutGroups(orphan)[0].box
    expect(Number.isFinite(b.x) && Number.isFinite(b.w)).toBe(true)
  })
})

describe('viewBox', () => {
  it('widens past the origin so a top-left group label is not clipped', () => {
    const vb = viewBox(spec)
    expect(vb.minX).toBeLessThan(0)
    expect(vb.minY).toBeLessThan(0)
  })

  it('is at least the declared grid', () => {
    const vb = viewBox(spec)
    expect(vb.w).toBeGreaterThanOrEqual(spec.cols * UNIT)
    expect(vb.h).toBeGreaterThanOrEqual(spec.rows * UNIT)
  })
})

describe('serviceSlugForNode', () => {
  const exists = (s: string) => ['ec2', 'nat-gateway', 'rds'].includes(s)

  it('resolves an unsuffixed id', () => {
    expect(serviceSlugForNode('ec2', exists)).toBe('ec2')
  })

  it('strips a suffix so one service can appear in two AZs', () => {
    expect(serviceSlugForNode('ec2-a', exists)).toBe('ec2')
    expect(serviceSlugForNode('rds-standby', exists)).toBe('rds')
  })

  it('prefers the longest real slug over a shorter prefix', () => {
    // 'nat' is not a service; stripping the last segment blindly would break this.
    expect(serviceSlugForNode('nat-gateway', exists)).toBe('nat-gateway')
    expect(serviceSlugForNode('nat-gateway-a', exists)).toBe('nat-gateway')
  })

  it('returns null when nothing resolves', () => {
    expect(serviceSlugForNode('not-real', exists)).toBeNull()
  })
})
