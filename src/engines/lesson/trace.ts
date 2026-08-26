import type { DiagramSpec } from '@/content/schema'
import type { AddState, VisibleAt } from '@/engines/story/cumulative'

/**
 * A `DiagramSpec` with `steps` is a *walkthrough*: the architecture stands still
 * and the packet moves. That is the opposite fold from a story, where the
 * architecture grows and nothing moves — so this is its own function rather than
 * a flag on `visibleAt`.
 *
 * It exists for one sentence the atlas cannot say convincingly: a security group
 * is stateful. You can assert that in prose and the learner nods; they only
 * believe it when they watch the response come back across an edge they never
 * wrote a rule for. Two arrows, in order, does that. Static ASCII cannot.
 *
 * `VisibleAt` is reused rather than re-invented so `Diagram` needs no change:
 * every node and group is `settled` (the architecture is context, not news) and
 * only the current step's edges are `new`, which is exactly the distinction the
 * renderer already draws without touching opacity.
 *
 * Pure, and no clock — the step index comes in as an argument.
 */

/** Clamped rather than throwing, so a bad index shows the last step. */
export function clampStep(spec: DiagramSpec, step: number): number {
  if (!spec.steps.length) return 0
  if (!Number.isFinite(step)) return 0
  return Math.max(0, Math.min(Math.trunc(step), spec.steps.length - 1))
}

export function traceAt(spec: DiagramSpec, step: number): VisibleAt {
  const at = clampStep(spec, step)

  // An edge is lit if this step names it, and settled if an earlier one did.
  // First-mention wins: an edge reused by a later step stays visible without
  // lighting up twice, which is what makes a return path readable.
  const state = new Map<string, AddState>()
  spec.steps.slice(0, at + 1).forEach((s, i) => {
    for (const id of s.edgeIds) {
      if (state.has(id)) continue
      state.set(id, i === at ? 'new' : 'settled')
    }
  })
  // A step may re-light an edge an earlier step introduced. Being the *current*
  // step's subject outranks having been seen before, or the payoff step would
  // draw its own arrow in grey.
  if (spec.steps.length) {
    for (const id of spec.steps[at].edgeIds) state.set(id, 'new')
  }

  return {
    nodes: spec.nodes.map((node) => ({ node, state: 'settled' as AddState })),
    groups: spec.groups.map((group) => ({ group, state: 'settled' as AddState })),
    edges: spec.edges.flatMap((edge) => {
      const s = state.get(edge.id)
      return s ? [{ edge, state: s }] : []
    }),
  }
}
