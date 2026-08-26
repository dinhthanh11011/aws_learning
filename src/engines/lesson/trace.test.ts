import { describe, expect, it } from 'vitest'
import type { DiagramSpec } from '@/content/schema'
import { clampStep, traceAt } from './trace'

/**
 * A fixture rather than the real lesson diagram: the fold is what is under test,
 * and asserting against authored content would break every time a step is
 * reworded.
 */
const spec: DiagramSpec = {
  id: 'fix',
  cols: 12,
  rows: 4,
  nodes: [
    { id: 'internet', label: 'Internet', kind: 'internet', x: 0, y: 1, w: 2, h: 1 },
    { id: 'elb', label: 'ALB', kind: 'service', x: 4, y: 1, w: 2, h: 1 },
    { id: 'ec2', label: 'EC2', kind: 'service', x: 8, y: 1, w: 2, h: 1 },
  ],
  edges: [
    { id: 'in', from: 'internet', to: 'elb', tone: 'ok' },
    { id: 'fwd', from: 'elb', to: 'ec2', tone: 'ok' },
    { id: 'back', from: 'ec2', to: 'internet', tone: 'info' },
  ],
  groups: [{ id: 'vpc', label: 'VPC', kind: 'vpc', nodeIds: ['elb', 'ec2'] }],
  steps: [
    { edgeIds: ['in'], title: 'Request arrives', tone: 'ok' },
    { edgeIds: ['fwd'], title: 'Forwarded', tone: 'ok' },
    { edgeIds: ['back', 'fwd'], title: 'Response returns', tone: 'info' },
  ],
}

const ids = (v: ReturnType<typeof traceAt>, state: 'new' | 'settled') =>
  v.edges.filter((e) => e.state === state).map((e) => e.edge.id)

describe('clampStep', () => {
  it('clamps at both ends and survives a non-number', () => {
    expect(clampStep(spec, -3)).toBe(0)
    expect(clampStep(spec, 99)).toBe(2)
    expect(clampStep(spec, Number.NaN)).toBe(0)
    expect(clampStep(spec, 1.7)).toBe(1)
  })

  it('is 0 for a spec with no steps, rather than -1', () => {
    expect(clampStep({ ...spec, steps: [] }, 4)).toBe(0)
  })
})

describe('traceAt', () => {
  it('shows the architecture whole and settled at every step', () => {
    for (const i of [0, 1, 2]) {
      const v = traceAt(spec, i)
      expect(v.nodes).toHaveLength(3)
      expect(v.groups).toHaveLength(1)
      expect(v.nodes.every((n) => n.state === 'settled')).toBe(true)
      expect(v.groups.every((g) => g.state === 'settled')).toBe(true)
    }
  })

  it('lights only the current step and settles the ones before it', () => {
    expect(ids(traceAt(spec, 0), 'new')).toEqual(['in'])
    expect(ids(traceAt(spec, 0), 'settled')).toEqual([])

    const second = traceAt(spec, 1)
    expect(ids(second, 'new')).toEqual(['fwd'])
    expect(ids(second, 'settled')).toEqual(['in'])
  })

  it('hides an edge no step has reached yet', () => {
    expect(traceAt(spec, 0).edges.map((e) => e.edge.id)).toEqual(['in'])
  })

  it('re-lights an edge the current step names again', () => {
    // `fwd` was introduced at step 1 and is named again at step 2. Being the
    // current step's subject has to win, or the payoff draws itself in grey.
    const third = traceAt(spec, 2)
    expect(ids(third, 'new').sort()).toEqual(['back', 'fwd'])
    expect(ids(third, 'settled')).toEqual(['in'])
  })

  it('renders nothing lit for a spec with no steps', () => {
    const v = traceAt({ ...spec, steps: [] }, 0)
    expect(v.edges).toEqual([])
    expect(v.nodes).toHaveLength(3)
  })
})
