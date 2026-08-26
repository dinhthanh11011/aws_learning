import type { DiagramGroup, DiagramNode, DiagramSpec } from '@/content/schema'

/**
 * Turning grid units into a viewBox, and working out where the group rectangles
 * go. Kept separate from the component and free of React so the geometry can be
 * unit-tested — the nesting maths is the part that is easy to get subtly wrong
 * and hard to see wrong in a screenshot.
 */

/** Pixels per grid unit inside the viewBox. The svg itself scales to its box. */
export const UNIT = 40
/** Space between a group's edge and the content it wraps, in viewBox pixels. */
const PAD = 9
/** Room above the content for the group's own label. */
const LABEL = 15

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

export const nodeBox = (n: DiagramNode): Box => ({
  x: n.x * UNIT,
  y: n.y * UNIT,
  w: n.w * UNIT,
  h: n.h * UNIT,
})

/** Centre of a node, which is where edges start and end. */
export const nodeCentre = (n: DiagramNode): { x: number; y: number } => {
  const b = nodeBox(n)
  return { x: b.x + b.w / 2, y: b.y + b.h / 2 }
}

export interface Point {
  x: number
  y: number
}

/**
 * Where a line heading into a node should actually stop: on the node's
 * boundary, not at its centre.
 *
 * This is what makes arrowheads visible. An SVG `marker-end` sits at the end of
 * the path, so a path drawn centre-to-centre puts every arrowhead underneath the
 * target node's own rectangle — which is painted afterwards. The result is
 * direction-less lines, and on a diagram whose whole subject is which way the
 * packet went, that is not cosmetic.
 *
 * Returns the first crossing of the target's box (grown by `gap`, so the head
 * does not touch the border) along the segment, or `b` if the segment never
 * enters it.
 */
export function clipToBox(a: Point, b: Point, box: Box, gap = 5): Point {
  const x1 = box.x - gap
  const x2 = box.x + box.w + gap
  const y1 = box.y - gap
  const y2 = box.y + box.h + gap
  const dx = b.x - a.x
  const dy = b.y - a.y

  let best = 1
  const consider = (t: number): void => {
    if (!(t > 0 && t < best)) return
    // The crossing has to be on the box's actual perimeter, not on the infinite
    // line the edge extends to. A hair of tolerance, because these are floats.
    const px = a.x + dx * t
    const py = a.y + dy * t
    if (px >= x1 - 0.01 && px <= x2 + 0.01 && py >= y1 - 0.01 && py <= y2 + 0.01) best = t
  }
  if (dx !== 0) {
    consider((x1 - a.x) / dx)
    consider((x2 - a.x) / dx)
  }
  if (dy !== 0) {
    consider((y1 - a.y) / dy)
    consider((y2 - a.y) / dy)
  }
  return { x: a.x + dx * best, y: a.y + dy * best }
}

const union = (boxes: Box[]): Box => {
  const x = Math.min(...boxes.map((b) => b.x))
  const y = Math.min(...boxes.map((b) => b.y))
  const r = Math.max(...boxes.map((b) => b.x + b.w))
  const bt = Math.max(...boxes.map((b) => b.y + b.h))
  return { x, y, w: r - x, h: bt - y }
}

export interface GroupLayout {
  group: DiagramGroup
  box: Box
  /** How many groups enclose this one. Drives padding and label placement. */
  depth: number
}

/**
 * A group's rectangle is the union of its own nodes and its child groups'
 * rectangles, grown by a padding that increases with depth — that growth is
 * what makes a subnet visibly sit *inside* its AZ rather than share an edge
 * with it. Computed bottom-up, so a child is always laid out before its parent.
 */
export function layoutGroups(spec: DiagramSpec): GroupLayout[] {
  const nodeById = new Map(spec.nodes.map((n) => [n.id, n]))
  const childrenOf = new Map<string, DiagramGroup[]>()
  for (const g of spec.groups) {
    if (!g.parent) continue
    const list = childrenOf.get(g.parent) ?? []
    list.push(g)
    childrenOf.set(g.parent, list)
  }

  const depthOf = (g: DiagramGroup): number => {
    let d = 0
    let cur = g.parent
    const seen = new Set<string>([g.id])
    // The cap is a guard, not a feature: content:check fails a parent cycle, so
    // reaching it means the checker was bypassed rather than the data being odd.
    while (cur && !seen.has(cur) && d < 8) {
      seen.add(cur)
      d += 1
      cur = spec.groups.find((x) => x.id === cur)?.parent
    }
    return d
  }

  const boxes = new Map<string, Box>()
  const resolve = (g: DiagramGroup, guard: Set<string>): Box => {
    const cached = boxes.get(g.id)
    if (cached) return cached
    if (guard.has(g.id)) return { x: 0, y: 0, w: UNIT, h: UNIT }
    guard.add(g.id)

    const own = g.nodeIds.map((id) => nodeById.get(id)).filter((n): n is DiagramNode => Boolean(n))
    const parts: Box[] = own.map(nodeBox)
    for (const child of childrenOf.get(g.id) ?? []) parts.push(resolve(child, guard))

    // A group naming nothing that exists still needs a box rather than NaN.
    const inner = parts.length ? union(parts) : { x: 0, y: 0, w: UNIT, h: UNIT }
    const box: Box = {
      x: inner.x - PAD,
      y: inner.y - PAD - LABEL,
      w: inner.w + PAD * 2,
      h: inner.h + PAD * 2 + LABEL,
    }
    boxes.set(g.id, box)
    return box
  }

  const laid = spec.groups.map((g) => ({
    group: g,
    box: resolve(g, new Set<string>()),
    depth: depthOf(g),
  }))

  // Shallowest first, so a nested group paints on top of its parent and its
  // label is never buried under the enclosing rectangle.
  return laid.sort((a, b) => a.depth - b.depth)
}

/**
 * The viewBox. Taken from the declared `cols`/`rows` but widened to whatever
 * the content actually needs, including group padding that can push above and
 * left of the origin — otherwise a region label at y=0 is clipped.
 */
export function viewBox(spec: DiagramSpec): { minX: number; minY: number; w: number; h: number } {
  const boxes: Box[] = [
    { x: 0, y: 0, w: spec.cols * UNIT, h: spec.rows * UNIT },
    ...spec.nodes.map(nodeBox),
    ...layoutGroups(spec).map((g) => g.box),
  ]
  const u = union(boxes)
  const m = 4
  return { minX: u.x - m, minY: u.y - m, w: u.w + m * 2, h: u.h + m * 2 }
}

/**
 * The service a `kind: 'service'` node refers to.
 *
 * Node ids must be unique, but a real architecture shows the same service more
 * than once — an EC2 instance in each of two AZs, a NAT gateway per public
 * subnet. So a node id may be a service slug with a suffix (`ec2-a`), and the
 * slug is the longest prefix that actually resolves. Longest-prefix rather than
 * "strip the last segment", because `nat-gateway` is itself a slug and stripping
 * blindly would turn it into `nat`.
 */
export function serviceSlugForNode(id: string, exists: (slug: string) => boolean): string | null {
  const parts = id.split('-')
  for (let take = parts.length; take > 0; take -= 1) {
    const candidate = parts.slice(0, take).join('-')
    if (exists(candidate)) return candidate
  }
  return null
}
