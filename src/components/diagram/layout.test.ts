import { describe, expect, it } from 'vitest'
import type { DiagramSpec } from '@/content/schema'
import {
  UNIT,
  clipToBox,
  edgeGeometry,
  layoutGroups,
  nodeBox,
  nodeCentre,
  serviceSlugForNode,
  viewBox,
} from './layout'

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

describe('clipToBox', () => {
  // 40 wide, 40 tall, top-left at (100, 100). Default gap is 5.
  const box = { x: 100, y: 100, w: 40, h: 40 }

  it('stops on the near edge coming in horizontally', () => {
    const p = clipToBox({ x: 0, y: 120 }, { x: 120, y: 120 }, box)
    expect(p).toEqual({ x: 95, y: 120 })
  })

  it('stops on the near edge coming in vertically', () => {
    const p = clipToBox({ x: 120, y: 0 }, { x: 120, y: 120 }, box)
    expect(p).toEqual({ x: 120, y: 95 })
  })

  it('stops on the near edge on a diagonal', () => {
    // Straight down-right at 45°: the vertical edge at x=95 is met first.
    const p = clipToBox({ x: 0, y: 0 }, { x: 120, y: 120 }, box)
    expect(p.x).toBeCloseTo(95)
    expect(p.y).toBeCloseTo(95)
  })

  it('respects the gap, so the head never touches the border', () => {
    const tight = clipToBox({ x: 0, y: 120 }, { x: 120, y: 120 }, box, 0)
    expect(tight.x).toBe(100)
  })

  it('returns the target unchanged when the segment never reaches the box', () => {
    // Aimed well below the box: no perimeter crossing on this segment.
    const p = clipToBox({ x: 0, y: 400 }, { x: 300, y: 400 }, box)
    expect(p).toEqual({ x: 300, y: 400 })
  })

  it('returns the target for a zero-length segment rather than NaN', () => {
    const p = clipToBox({ x: 120, y: 120 }, { x: 120, y: 120 }, box)
    expect(p).toEqual({ x: 120, y: 120 })
  })

  it('does not overshoot backwards when the start is already inside', () => {
    const p = clipToBox({ x: 120, y: 120 }, { x: 130, y: 120 }, box)
    // Both perimeter crossings are behind or beyond, so it keeps the target.
    expect(p.x).toBeGreaterThan(120)
  })
})

describe('edgeGeometry', () => {
  // The two shapes the lesson diagrams rely on. Pinned because this logic moved
  // out of the component so `diagram:audit` could share it, and the audit cannot
  // catch its own drift — it would simply agree with itself.
  const a = { id: 'a', label: 'A', kind: 'service' as const, x: 0, y: 0, w: 2, h: 1 }
  const b = { id: 'b', label: 'B', kind: 'service' as const, x: 6, y: 3, w: 2, h: 1 }

  it('clips a straight edge to both boundaries and centres the label between them', () => {
    const g = edgeGeometry(a, b)
    // a spans 0..80 x, 0..40 y (centre 40,20); b spans 240..320, 120..160 (280,140).
    expect(g.start.x).toBeGreaterThan(40)
    expect(g.end.x).toBeLessThan(280)
    expect(g.label.x).toBeCloseTo((g.start.x + g.end.x) / 2)
    expect(g.d).toBe(`M ${g.start.x} ${g.start.y} L ${g.end.x} ${g.end.y}`)
  })

  it('routes an elbow vertical-then-horizontal and puts the label on the horizontal leg', () => {
    const g = edgeGeometry(a, b, { elbow: true })
    // Leaves the source downwards, so it exits through a's bottom edge at x=40.
    expect(g.start.x).toBe(40)
    expect(g.start.y).toBe(45)
    // Arrives horizontally at b's y centre, stopping 5px short of its left edge.
    expect(g.end.y).toBe(140)
    expect(g.end.x).toBe(235)
    expect(g.label.y).toBe(g.end.y - 5)
    expect(g.d).toBe('M 40 45 L 40 140 L 235 140')
  })

  it('never ends at the target centre, or the arrowhead would be hidden', () => {
    for (const elbow of [true, false]) {
      const g = edgeGeometry(a, b, { elbow })
      expect(g.end).not.toEqual({ x: 280, y: 140 })
    }
  })
})
