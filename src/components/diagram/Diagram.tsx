'use client'
import { Fragment } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { CATEGORIES, serviceBySlug, type DiagramSpec } from '@/content'
import type { AddState, VisibleAt } from '@/engines/story/cumulative'
import { serviceLinkProps } from '@/components/service/ServiceRef'
import {
  UNIT,
  clipToBox,
  layoutGroups,
  nodeBox,
  nodeCentre,
  serviceSlugForNode,
  viewBox,
} from './layout'

/**
 * An inline-SVG renderer for a `DiagramSpec`. Hand-rolled rather than a graph
 * library because the load-bearing feature here is *nested labelled regions* —
 * a subnet inside an AZ inside a VPC inside a Region — which is exactly what
 * node-and-edge libraries are worst at, and because an SVG drops straight into
 * lesson prose where a canvas does not.
 *
 * `show` is optional. Given it, the diagram renders only what is visible at a
 * point in a story and distinguishes this chapter's additions from earlier
 * ones; without it, everything renders as `new`.
 *
 * Note what does *not* de-emphasise a settled node: `opacity`. Dropping opacity
 * takes label text below the contrast threshold, which is the accessibility bug
 * this codebase has already fixed once. Fill, stroke weight and dashes carry the
 * distinction instead, and every text colour is identical in both states.
 */

const GROUP_STYLE: Record<string, { label: string; hue: string }> = {
  region: { label: 'Region', hue: 'var(--cat-network)' },
  vpc: { label: 'VPC', hue: 'var(--cat-network)' },
  az: { label: 'AZ', hue: 'var(--info)' },
  'subnet-public': { label: 'Public subnet', hue: 'var(--ok)' },
  'subnet-private': { label: 'Private subnet', hue: 'var(--cat-compute)' },
  account: { label: 'Account', hue: 'var(--cat-security)' },
  edge: { label: 'Edge', hue: 'var(--cat-database)' },
  plain: { label: '', hue: 'var(--border-strong)' },
}

const TONE: Record<string, string> = {
  default: 'var(--fg-subtle)',
  ok: 'var(--ok)',
  bad: 'var(--bad)',
  warn: 'var(--warn)',
  info: 'var(--info)',
}

/** Nodes that are not services get a neutral hue rather than a category one. */
const KIND_HUE: Record<string, string> = {
  user: 'var(--info)',
  internet: 'var(--fg-subtle)',
  onprem: 'var(--fg-subtle)',
  data: 'var(--cat-storage)',
  note: 'var(--border-strong)',
}

export function Diagram({
  spec,
  show,
  caption,
  className,
}: {
  spec: DiagramSpec
  /** From `visibleAt()`. Omit to render the whole thing. */
  show?: VisibleAt
  caption?: string
  className?: string
}) {
  const reduce = useReducedMotion()
  const vb = viewBox(spec)

  const nodeStates = new Map<string, AddState>(
    show ? show.nodes.map((n) => [n.node.id, n.state]) : spec.nodes.map((n) => [n.id, 'new']),
  )
  const edgeStates = new Map<string, AddState>(
    show ? show.edges.map((e) => [e.edge.id, e.state]) : spec.edges.map((e) => [e.id, 'new']),
  )
  const groupStates = new Map<string, AddState>(
    show ? show.groups.map((g) => [g.group.id, g.state]) : spec.groups.map((g) => [g.id, 'new']),
  )

  const nodeById = new Map(spec.nodes.map((n) => [n.id, n]))
  const groups = layoutGroups(spec).filter((g) => groupStates.has(g.group.id))
  const nodes = spec.nodes.filter((n) => nodeStates.has(n.id))
  const edges = spec.edges.filter(
    (e) => edgeStates.has(e.id) && nodeStates.has(e.from) && nodeStates.has(e.to),
  )

  return (
    <figure className={className}>
      <svg
        viewBox={`${vb.minX} ${vb.minY} ${vb.w} ${vb.h}`}
        className="h-auto w-full"
        role="img"
        aria-label={spec.title ?? 'Architecture diagram'}
      >
        <defs>
          {Object.entries(TONE).map(([tone, colour]) => (
            <marker
              key={tone}
              id={`${spec.id}-arrow-${tone}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill={colour} />
            </marker>
          ))}
          <marker
            id={`${spec.id}-arrow-settled`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--border-strong)" />
          </marker>
        </defs>

        {/* Groups first, shallowest to deepest, so nesting reads as containment. */}
        {groups.map(({ group, box }) => {
          const isNew = groupStates.get(group.id) === 'new'
          const style = GROUP_STYLE[group.kind] ?? GROUP_STYLE.plain
          return (
            <g key={group.id}>
              <rect
                x={box.x}
                y={box.y}
                width={box.w}
                height={box.h}
                rx={7}
                fill="none"
                stroke={isNew ? style.hue : 'var(--border)'}
                strokeWidth={isNew ? 1.6 : 1}
                strokeDasharray={isNew ? undefined : '5 4'}
              />
              <text
                x={box.x + 8}
                y={box.y + 11}
                fontSize={9}
                fontWeight={600}
                fill="var(--fg-muted)"
              >
                {group.label}
              </text>
            </g>
          )
        })}

        {/* Edges under the nodes, so a line never crosses a label. */}
        {edges.map((e) => {
          const from = nodeById.get(e.from)
          const to = nodeById.get(e.to)
          if (!from || !to) return null
          // Both ends stop on the node boundary rather than the centre. The end
          // has to, or the arrowhead is painted over by the node itself and the
          // line loses its direction. The start does too, because the label sits
          // at the midpoint of the segment — measured centre-to-centre it lands
          // on top of one of the nodes, which is where every label collision in
          // these diagrams came from.
          const a = nodeCentre(from)
          const centre = nodeCentre(to)
          const corner = e.elbow ? { x: a.x, y: centre.y } : a
          const b = clipToBox(corner, centre, nodeBox(to))
          const isNew = edgeStates.get(e.id) === 'new'
          const colour = isNew ? (TONE[e.tone] ?? TONE.default) : 'var(--border-strong)'
          const marker = isNew ? `${spec.id}-arrow-${e.tone}` : `${spec.id}-arrow-settled`
          // For an elbow the first leg is vertical, so the exit point is found
          // along that leg, not along the straight line to the target.
          // Aimed *at* the source: for an elbow that is back down the vertical
          // leg from the corner, for a straight line it is back from the target.
          // Using `corner` for both would be a zero-length segment on a straight
          // edge, since there the corner is the source centre itself.
          const start = clipToBox(e.elbow ? corner : centre, a, nodeBox(from))
          const d = e.elbow
            ? `M ${start.x} ${start.y} L ${start.x} ${b.y} L ${b.x} ${b.y}`
            : `M ${start.x} ${start.y} L ${b.x} ${b.y}`
          // An elbow's straight-line midpoint is nowhere near the elbow, so the
          // label has to follow the path: the middle of the horizontal leg,
          // which is the leg that has room for text.
          const label = e.elbow
            ? { x: (start.x + b.x) / 2, y: b.y - 5 }
            : { x: (start.x + b.x) / 2, y: (start.y + b.y) / 2 - 4 }
          return (
            <Fragment key={e.id}>
              <path
                d={d}
                fill="none"
                stroke={colour}
                strokeWidth={isNew ? 1.8 : 1.1}
                strokeDasharray={e.dashed ? '5 4' : undefined}
                markerEnd={`url(#${marker})`}
                markerStart={e.bidirectional ? `url(#${marker})` : undefined}
              />
              {e.label ? (
                <text
                  x={label.x}
                  y={label.y}
                  fontSize={9}
                  textAnchor="middle"
                  fill="var(--fg-muted)"
                >
                  {e.label}
                </text>
              ) : null}
            </Fragment>
          )
        })}

        {nodes.map((n) => {
          const box = nodeBox(n)
          const isNew = nodeStates.get(n.id) === 'new'
          const hue = n.category
            ? CATEGORIES[n.category].token
            : (KIND_HUE[n.kind] ?? 'var(--border-strong)')
          const slug =
            n.kind === 'service' ? serviceSlugForNode(n.id, (x) => serviceBySlug.has(x)) : null

          const body = (
            <>
              <rect
                x={box.x}
                y={box.y}
                width={box.w}
                height={box.h}
                rx={6}
                // A settled node loses the hue but keeps a real surface — never
                // a faded copy of the new one.
                fill={isNew ? hue : 'var(--bg-inset)'}
                fillOpacity={isNew ? 0.18 : 1}
                stroke={isNew ? hue : 'var(--border)'}
                strokeWidth={isNew ? 2 : 1}
              />
              <text
                x={box.x + box.w / 2}
                y={box.y + (n.sub ? box.h / 2 - 1 : box.h / 2 + 3)}
                fontSize={11}
                fontWeight={600}
                textAnchor="middle"
                fill="var(--fg)"
              >
                {n.label}
              </text>
              {n.sub ? (
                <text
                  x={box.x + box.w / 2}
                  y={box.y + box.h / 2 + 11}
                  fontSize={8.5}
                  textAnchor="middle"
                  fill="var(--fg-muted)"
                >
                  {n.sub}
                </text>
              ) : null}
            </>
          )

          // Entry animation only for what this chapter added, so the eye lands
          // on the change rather than re-reading the whole architecture.
          const wrapper = (
            <motion.g
              initial={reduce || !isNew ? undefined : { opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              style={{ transformOrigin: `${box.x + box.w / 2}px ${box.y + box.h / 2}px` }}
            >
              {body}
            </motion.g>
          )

          // A real anchor, so ⌘-click opens the page and a plain click opens the
          // quick look — navigating away mid-chapter loses your place.
          return slug ? (
            <a key={n.id} {...serviceLinkProps(slug)} className="cursor-pointer">
              {wrapper}
            </a>
          ) : (
            <Fragment key={n.id}>{wrapper}</Fragment>
          )
        })}
      </svg>
      {(caption ?? spec.caption) ? (
        <figcaption className="mt-2 text-[12px] text-fg-subtle">
          {caption ?? spec.caption}
        </figcaption>
      ) : null}
    </figure>
  )
}

export { UNIT }
